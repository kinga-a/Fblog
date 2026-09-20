import { getPosts, createPost } from '../../../lib/kv.js';
import { requireAuth } from '../../../lib/auth.js';
import { renderMarkdown } from '../../../lib/markdown.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page')) || 1;
  const pageSize = parseInt(url.searchParams.get('pageSize')) || 10;
  const tag = url.searchParams.get('tag');
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search');
  
  // 检查是否请求管理端（包含草稿）
  const isAdmin = url.searchParams.get('admin') === 'true';
  
  // 如果需要管理端数据，验证权限
  if (isAdmin) {
    const session = await requireAuth(env, request);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  
  let result = await getPosts(env, page, pageSize, isAdmin);
  
  // 标签筛选
  if (tag) {
    const tagPosts = await env.BLOG_KV.get(`tag:${tag}`, 'json') || [];
    result.posts = result.posts.filter(p => tagPosts.includes(p.id));
    result.total = result.posts.length;
  }
  
  // 分类筛选
  if (category) {
    result.posts = result.posts.filter(p => p.categories.includes(category));
    result.total = result.posts.length;
  }
  
  // 搜索
  if (search) {
    const query = search.toLowerCase();
    result.posts = result.posts.filter(p => 
      p.title.toLowerCase().includes(query) ||
      p.content.toLowerCase().includes(query)
    );
    result.total = result.posts.length;
  }
  
  return Response.json(result);
}

export async function onRequestPost(context) {
  const { env, request } = context;
  
  // 验证权限
  const session = await requireAuth(env, request);
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    
    // 渲染 Markdown
    const html = await renderMarkdown(data.content);
    
    // 生成摘要
    const excerpt = data.excerpt || 
      data.content.replace(/[#*\[\]`]/g, '').slice(0, 200) + '...';
    
    const post = await createPost(env, {
      ...data,
      html,
      excerpt
    }, session.username);
    
    return Response.json({ success: true, post });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
