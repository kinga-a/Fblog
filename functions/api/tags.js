export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    // 获取所有标签列表
    const tagList = await env.BLOG_KV.get('tags:list', 'json') || [];
    
    // 获取每个标签的文章数量
    const tagsWithCount = await Promise.all(
      tagList.map(async (tag) => {
        const posts = await env.BLOG_KV.get(`tag:${tag}`, 'json') || [];
        return {
          name: tag,
          count: posts.length
        };
      })
    );
    
    return Response.json({ tags: tagsWithCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
