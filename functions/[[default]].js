import { getPosts, getPost } from '../lib/kv';

export async function onRequestGet(context) {
  const { env, request, params } = context;
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
  
  // 首页 - 文章列表
  if (path === '/' || path === '/page/1') {
    return renderHomePage(env, 1);
  }
  
  // 分页
  const pageMatch = path.match(/^\/page\/(\d+)$/);
  if (pageMatch) {
    return renderHomePage(env, parseInt(pageMatch[1]));
  }
  
  // 文章详情页
  const postMatch = path.match(/^\/post\/([a-zA-Z0-9-]+)$/);
  if (postMatch) {
    return renderPostPage(env, postMatch[1]);
  }
  
  // 标签页
  const tagMatch = path.match(/^\/tag\/(.+)$/);
  if (tagMatch) {
    return renderTagPage(env, decodeURIComponent(tagMatch[1]));
  }
  
  // 404
  return new Response('Not Found', { status: 404 });
}

// 渲染首页
async function renderHomePage(env, page) {
  const { posts, totalPages } = await getPosts(env, page, 10);
  
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>我的博客</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    header { text-align: center; padding: 60px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    header h1 { font-size: 36px; margin-bottom: 10px; }
    header p { opacity: 0.9; }
    .post-card { background: white; border-radius: 8px; padding: 30px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .post-card h2 { margin-bottom: 10px; }
    .post-card h2 a { color: #333; text-decoration: none; }
    .post-card h2 a:hover { color: #667eea; }
    .post-meta { color: #999; font-size: 14px; margin-bottom: 15px; }
    .post-excerpt { color: #666; line-height: 1.8; }
    .post-tags { margin-top: 15px; }
    .post-tags a { color: #667eea; text-decoration: none; margin-right: 10px; font-size: 14px; }
    .pagination { text-align: center; margin: 40px 0; }
    .pagination a { display: inline-block; padding: 10px 20px; background: white; border-radius: 6px; margin: 0 5px; text-decoration: none; color: #333; }
    .pagination a:hover { background: #667eea; color: white; }
    footer { text-align: center; padding: 40px; color: #999; }
  </style>
</head>
<body>
  <header>
    <h1>📝 我的博客</h1>
    <p>记录生活，分享技术</p>
  </header>
  
  <div class="container">
    ${posts.map(post => `
      <article class="post-card">
        <h2><a href="/post/${post.id}">${escapeHtml(post.title)}</a></h2>
        <div class="post-meta">
          📅 ${formatDate(post.publishedAt || post.createdAt)} · 
          👁️ ${post.views || 0} 次阅读
        </div>
        <div class="post-excerpt">${post.excerpt}</div>
        <div class="post-tags">
          ${post.tags.map(tag => `<a href="/tag/${encodeURIComponent(tag)}">#${tag}</a>`).join('')}
        </div>
      </article>
    `).join('')}
    
    <div class="pagination">
      ${page > 1 ? `<a href="/page/${page - 1}">← 上一页</a>` : ''}
      ${page < totalPages ? `<a href="/page/${page + 1}">下一页 →</a>` : ''}
    </div>
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
    return new Response('Post not found', { status: 404 });
  }
  
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} - 我的博客</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; line-height: 1.8; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    article { background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { font-size: 32px; margin-bottom: 20px; }
    .meta { color: #999; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
    .content { font-size: 16px; }
    .content img { max-width: 100%; border-radius: 8px; }
    .content pre { background: #f4f4f4; padding: 15px; border-radius: 6px; overflow-x: auto; }
    .content code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-family: Monaco, monospace; }
    .tags { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    .tags a { color: #667eea; text-decoration: none; margin-right: 10px; }
    .back { display: inline-block; margin-bottom: 20px; color: #667eea; text-decoration: none; }
    footer { text-align: center; padding: 40px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back">← 返回首页</a>
    <article>
      <h1>${escapeHtml(post.title)}</h1>
      <div class="meta">
        📅 ${formatDate(post.publishedAt || post.createdAt)} · 
        👁️ ${post.views || 0} 次阅读 · 
        ✍️ ${post.author}
      </div>
      <div class="content">${post.html}</div>
      <div class="tags">
        ${post.tags.map(tag => `<a href="/tag/${encodeURIComponent(tag)}">#${tag}</a>`).join('')}
      </div>
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
  
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>标签: ${escapeHtml(tag)} - 我的博客</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    header { background: white; padding: 40px; border-radius: 8px; margin-bottom: 20px; }
    .post-card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 15px; }
    .post-card a { color: #333; text-decoration: none; font-size: 18px; }
    .post-card a:hover { color: #667eea; }
    .back { display: inline-block; margin-bottom: 20px; color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back">← 返回首页</a>
    <header>
      <h1>🏷️ ${escapeHtml(tag)}</h1>
      <p>共 ${validPosts.length} 篇文章</p>
    </header>
    ${validPosts.map(post => `
      <div class="post-card">
        <a href="/post/${post.id}">${escapeHtml(post.title)}</a>
        <p style="color:#999;font-size:14px;margin-top:5px;">${formatDate(post.publishedAt || post.createdAt)}</p>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// 工具函数
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('zh-CN');
}
