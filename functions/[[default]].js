import { getPosts, getPost } from '../lib/kv';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  // API 请求不处理
  if (path.startsWith('/api/')) {
    return context.next();
  }
  
  // 管理后台路径
  if (path.startsWith('/admin')) {
    return context.next();
  }
  
  // Blob 文件服务
  if (path.startsWith('/blob/')) {
    return serveBlob(env, path.replace('/blob/', ''));
  }
  
  // 首页 - 文章列表
  if (path === '/' || path === '/page/1') {
    return renderHomePage(env, 1);
  }
  
  // 分页
  const pageMatch = path.match(/^\\/page\\/(\\d+)$/);
  if (pageMatch) {
    return renderHomePage(env, parseInt(pageMatch[1]));
  }
  
  // 文章详情页
  const postMatch = path.match(/^\\/post\\/([a-zA-Z0-9-]+)$/);
  if (postMatch) {
    return renderPostPage(env, postMatch[1]);
  }
  
  // 标签页
  const tagMatch = path.match(/^\\/tag\\/(.+)$/);
  if (tagMatch) {
    return renderTagPage(env, decodeURIComponent(tagMatch[1]));
  }
  
  // 分类页
  const categoryMatch = path.match(/^\\/category\\/(.+)$/);
  if (categoryMatch) {
    return renderCategoryPage(env, decodeURIComponent(categoryMatch[1]));
  }
  
  // 关于页面
  if (path === '/about') {
    return renderAboutPage();
  }
  
  // 404
  return render404();
}

// 提供 Blob 文件服务
async function serveBlob(env, key) {
  try {
    const object = await env.BLOG_BUCKET.get(key);
    
    if (!object) {
      return new Response('Not Found', { status: 404 });
    }
    
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000'); // 1年缓存
    
    return new Response(object.body, { headers });
  } catch (error) {
    return new Response('Error', { status: 500 });
  }
}

// 渲染首页
async function renderHomePage(env, page) {
  const { posts, totalPages } = await getPosts(env, page, 10);
  
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>我的博客</title>
  <meta name="description" content="记录生活，分享技术">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; background: #f5f5f5; color: #333; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    header { text-align: center; padding: 80px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin-bottom: 40px; }
    header h1 { font-size: 36px; margin-bottom: 10px; }
    header p { opacity: 0.9; font-size: 16px; }
    nav { margin-top: 20px; }
    nav a { color: white; text-decoration: none; margin: 0 15px; opacity: 0.8; transition: opacity 0.3s; }
    nav a:hover { opacity: 1; }
    .post-card { background: white; border-radius: 12px; padding: 30px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.2s, box-shadow 0.2s; }
    .post-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    .post-card h2 { margin-bottom: 12px; font-size: 24px; }
    .post-card h2 a { color: #333; text-decoration: none; transition: color 0.3s; }
    .post-card h2 a:hover { color: #667eea; }
    .post-meta { color: #999; font-size: 14px; margin-bottom: 15px; display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
    .post-excerpt { color: #666; line-height: 1.8; }
    .post-tags { margin-top: 15px; display: flex; flex-wrap: wrap; gap: 8px; }
    .post-tags a { color: #667eea; text-decoration: none; font-size: 13px; background: #f0f4ff; padding: 4px 12px; border-radius: 20px; transition: background 0.3s; }
    .post-tags a:hover { background: #e0e8ff; }
    .post-cover { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 15px; }
    .pagination { text-align: center; margin: 40px 0; }
    .pagination a, .pagination span { display: inline-block; padding: 12px 24px; background: white; border-radius: 8px; margin: 0 5px; text-decoration: none; color: #333; box-shadow: 0 2px 4px rgba(0,0,0,0.08); transition: all 0.3s; }
    .pagination a:hover { background: #667eea; color: white; }
    .pagination .current { background: #667eea; color: white; }
    footer { text-align: center; padding: 40px; color: #999; font-size: 14px; }
    .empty { text-align: center; padding: 80px 20px; color: #999; }
    .empty-icon { font-size: 48px; margin-bottom: 20px; }
    @media (max-width: 600px) {
      header { padding: 60px 15px; }
      header h1 { font-size: 28px; }
      .post-card { padding: 20px; }
      .container { padding: 15px; }
    }
  </style>
</head>
<body>
  <header>
    <h1>📝 我的博客</h1>
    <p>记录生活，分享技术</p>
    <nav>
      <a href="/">首页</a>
      <a href="/about">关于</a>
      <a href="/admin">管理</a>
    </nav>
  </header>
  
  <div class="container">
    ${posts.length === 0 ? `
      <div class="empty">
        <div class="empty-icon">📝</div>
        <p>还没有文章，快去写一篇吧！</p>
        <p style="margin-top:10px;"><a href="/admin" style="color:#667eea;">进入管理后台</a></p>
      </div>
    ` : posts.map(post => `
      <article class="post-card">
        ${post.cover ? `<img src="${post.cover}" alt="${escapeHtml(post.title)}" class="post-cover">` : ''}
        <h2><a href="/post/${post.id}">${escapeHtml(post.title)}</a></h2>
        <div class="post-meta">
          <span>📅 ${formatDate(post.publishedAt || post.createdAt)}</span>
          <span>👁️ ${post.views || 0} 次阅读</span>
          <span>✍️ ${post.author}</span>
        </div>
        <div class="post-excerpt">${post.excerpt}</div>
        ${post.tags.length > 0 ? `
          <div class="post-tags">
            ${post.tags.map(tag => `<a href="/tag/${encodeURIComponent(tag)}">#${escapeHtml(tag)}</a>`).join('')}
          </div>
        ` : ''}
      </article>
    `).join('')}
    
    ${totalPages > 1 ? `
      <div class="pagination">
        ${page > 1 ? `<a href="/page/${page - 1}">← 上一页</a>` : ''}
        <span class="current">${page} / ${totalPages}</span>
        ${page < totalPages ? `<a href="/page/${page + 1}">下一页 →</a>` : ''}
      </div>
    ` : ''}
  </div>
  
  <footer>
    <p>Powered by EdgeOne Pages + KV + Blob</p>
  </footer>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// 渲染文章详情页
async function renderPostPage(env, id) {
  const post = await getPost(env, id);
  
  if (!post || post.status !== 'published') {
    return render404();
  }
  
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} - 我的博客</title>
  <meta name="description" content="${escapeHtml(post.excerpt)}">
  ${post.cover ? `<meta property="og:image" content="${post.cover}">` : ''}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; background: #f5f5f5; color: #333; line-height: 1.8; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    article { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    h1 { font-size: 32px; margin-bottom: 20px; line-height: 1.3; }
    .meta { color: #999; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; display: flex; gap: 20px; flex-wrap: wrap; font-size: 14px; }
    .cover { width: 100%; border-radius: 8px; margin-bottom: 30px; }
    .content { font-size: 16px; }
    .content img { max-width: 100%; border-radius: 8px; margin: 20px 0; }
    .content pre { background: #f8f8f8; padding: 20px; border-radius: 8px; overflow-x: auto; margin: 20px 0; }
    .content code { background: #f0f0f0; padding: 2px 8px; border-radius: 4px; font-family: 'Monaco', 'Menlo', monospace; font-size: 14px; }
    .content pre code { background: none; padding: 0; }
    .content blockquote { border-left: 4px solid #667eea; padding-left: 20px; margin: 20px 0; color: #666; }
    .content h1, .content h2, .content h3, .content h4 { margin: 30px 0 15px; }
    .content ul, .content ol { margin: 15px 0; padding-left: 25px; }
    .content li { margin: 8px 0; }
    .content a { color: #667eea; text-decoration: none; }
    .content a:hover { text-decoration: underline; }
    .tags { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; display: flex; flex-wrap: wrap; gap: 10px; }
    .tags a { color: #667eea; text-decoration: none; background: #f0f4ff; padding: 6px 16px; border-radius: 20px; font-size: 14px; transition: background 0.3s; }
    .tags a:hover { background: #e0e8ff; }
    .back { display: inline-flex; align-items: center; margin-bottom: 20px; color: #667eea; text-decoration: none; font-size: 14px; }
    .back:hover { text-decoration: underline; }
    .nav-posts { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
    .nav-posts a { color: #667eea; text-decoration: none; max-width: 45%; }
    .nav-posts a:hover { text-decoration: underline; }
    .nav-posts .prev::before { content: '← '; }
    .nav-posts .next::after { content: ' →'; }
    footer { text-align: center; padding: 40px; color: #999; font-size: 14px; }
    @media (max-width: 600px) {
      article { padding: 25px; }
      h1 { font-size: 26px; }
      .container { padding: 15px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back">← 返回首页</a>
    <article>
      <h1>${escapeHtml(post.title)}</h1>
      <div class="meta">
        <span>📅 ${formatDate(post.publishedAt || post.createdAt)}</span>
        <span>👁️ ${post.views || 0} 次阅读</span>
        <span>✍️ ${escapeHtml(post.author)}</span>
      </div>
      ${post.cover ? `<img src="${post.cover}" alt="${escapeHtml(post.title)}" class="cover">` : ''}
      <div class="content">${post.html}</div>
      ${post.tags.length > 0 ? `
        <div class="tags">
          ${post.tags.map(tag => `<a href="/tag/${encodeURIComponent(tag)}">#${escapeHtml(tag)}</a>`).join('')}
        </div>
      ` : ''}
    </article>
  </div>
  <footer>
    <p>Powered by EdgeOne Pages + KV + Blob</p>
  </footer>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// 渲染标签页
async function renderTagPage(env, tag) {
  const tagPosts = await env.BLOG_KV.get(`tag:${tag}`, 'json') || [];
  const posts = await Promise.all(
    tagPosts.map(id => env.BLOG_KV.get(`post:${id}`, 'json'))
  );
  
  const validPosts = posts.filter(p => p && p.status === 'published');
  
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>标签: ${escapeHtml(tag)} - 我的博客</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif; background: #f5f5f5; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    header { background: white; padding: 40px; border-radius: 12px; margin-bottom: 25px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    header h1 { color: #667eea; }
    header p { color: #999; margin-top: 10px; }
    .post-card { background: white; border-radius: 12px; padding: 25px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.06); transition: transform 0.2s; }
    .post-card:hover { transform: translateY(-2px); }
    .post-card a { color: #333; text-decoration: none; font-size: 18px; font-weight: 500; }
    .post-card a:hover { color: #667eea; }
    .post-card .meta { color: #999; font-size: 14px; margin-top: 8px; }
    .back { display: inline-flex; align-items: center; margin-bottom: 20px; color: #667eea; text-decoration: none; }
    .back:hover { text-decoration: underline; }
    .empty { text-align: center; padding: 60px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back">← 返回首页</a>
    <header>
      <h1>🏷️ ${escapeHtml(tag)}</h1>
      <p>共 ${validPosts.length} 篇文章</p>
    </header>
    ${validPosts.length === 0 ? '<div class="empty">该标签下暂无文章</div>' : validPosts.map(post => `
      <div class="post-card">
        <a href="/post/${post.id}">${escapeHtml(post.title)}</a>
        <div class="meta">${formatDate(post.publishedAt || post.createdAt)} · ${post.views || 0} 次阅读</div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// 渲染分类页
async function renderCategoryPage(env, category) {
  const publishedIndex = await env.BLOG_KV.get('posts:index', 'json') || [];
  const posts = await Promise.all(
    publishedIndex.map(id => env.BLOG_KV.get(`post:${id}`, 'json'))
  );
  
  const validPosts = posts.filter(p => p && p.categories.includes(category));
  
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>分类: ${escapeHtml(category)} - 我的博客</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif; background: #f5f5f5; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    header { background: white; padding: 40px; border-radius: 12px; margin-bottom: 25px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    header h1 { color: #667eea; }
    header p { color: #999; margin-top: 10px; }
    .post-card { background: white; border-radius: 12px; padding: 25px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.06); }
    .post-card a { color: #333; text-decoration: none; font-size: 18px; font-weight: 500; }
    .post-card a:hover { color: #667eea; }
    .post-card .meta { color: #999; font-size: 14px; margin-top: 8px; }
    .back { display: inline-flex; align-items: center; margin-bottom: 20px; color: #667eea; text-decoration: none; }
    .empty { text-align: center; padding: 60px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back">← 返回首页</a>
    <header>
      <h1>📁 ${escapeHtml(category)}</h1>
      <p>共 ${validPosts.length} 篇文章</p>
    </header>
    ${validPosts.length === 0 ? '<div class="empty">该分类下暂无文章</div>' : validPosts.map(post => `
      <div class="post-card">
        <a href="/post/${post.id}">${escapeHtml(post.title)}</a>
        <div class="meta">${formatDate(post.publishedAt || post.createdAt)} · ${post.views || 0} 次阅读</div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// 渲染关于页面
function renderAboutPage() {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>关于 - 我的博客</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif; background: #f5f5f5; color: #333; line-height: 1.8; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .about-card { background: white; border-radius: 12px; padding: 50px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    h1 { color: #667eea; margin-bottom: 30px; }
    p { margin-bottom: 15px; color: #666; }
    .back { display: inline-flex; align-items: center; margin-bottom: 20px; color: #667eea; text-decoration: none; }
    .back:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back">← 返回首页</a>
    <div class="about-card">
      <h1>关于我</h1>
      <p>欢迎来到我的博客！这里记录了我的学习心得、技术分享和生活感悟。</p>
      <p>如果你喜欢我的文章，欢迎收藏和分享。</p>
      <p>联系方式：请通过博客管理后台与我联系。</p>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// 渲染 404 页面
function render404() {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - 页面不存在</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .error-container { text-align: center; }
    .error-code { font-size: 120px; font-weight: bold; color: #667eea; }
    .error-message { font-size: 24px; color: #666; margin: 20px 0; }
    .back-home { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; }
    .back-home:hover { background: #5a7fd9; }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="error-code">404</div>
    <div class="error-message">页面不存在</div>
    <a href="/" class="back-home">返回首页</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// 工具函数
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
