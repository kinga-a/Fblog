import { requireAuth } from '../../lib/auth.js';
 
export async function onRequestGet(context) {
  const { env, request } = context;
  
  // 验证权限
  const session = await requireAuth(env, request);
  if (!session) {
    return Response.json({ error: '未授权' }, { status: 401 });
  }
  
  try {
    // 获取所有文章索引
    const publishedIndex = await env.BLOG_KV.get('posts:index', 'json') || [];
    const draftsIndex = await env.BLOG_KV.get('posts:drafts', 'json') || [];
    
    // 获取所有文章计算总浏览量
    const allPosts = await Promise.all([
      ...publishedIndex.map(id => env.BLOG_KV.get(`post:${id}`, 'json')),
      ...draftsIndex.map(id => env.BLOG_KV.get(`post:${id}`, 'json'))
    ]);
    
    const validPosts = allPosts.filter(Boolean);
    const totalViews = validPosts.reduce((sum, p) => sum + (p.views || 0), 0);
    
    // 获取所有标签
    const tagList = await env.BLOG_KV.get('tags:list', 'json') || [];
    
    return Response.json({
      totalPosts: publishedIndex.length + draftsIndex.length,
      publishedPosts: publishedIndex.length,
      draftPosts: draftsIndex.length,
      totalViews,
      totalTags: tagList.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
