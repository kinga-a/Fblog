// KV 操作封装

const POSTS_INDEX_KEY = 'posts:index';
const DRAFTS_INDEX_KEY = 'posts:drafts';

// 生成唯一 ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// 获取文章列表（分页）
async function getPosts(env, page = 1, pageSize = 10, includeDrafts = false) {
  const indexKey = includeDrafts ? DRAFTS_INDEX_KEY : POSTS_INDEX_KEY;
  const index = await env.BLOG_KV.get(indexKey, 'json') || [];
  
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageIds = index.slice(start, end);
  
  const posts = await Promise.all(
    pageIds.map(id => env.BLOG_KV.get(`post:${id}`, 'json'))
  );
  
  return {
    posts: posts.filter(Boolean),
    total: index.length,
    page,
    pageSize,
    totalPages: Math.ceil(index.length / pageSize)
  };
}

// 获取单篇文章
async function getPost(env, id) {
  return await env.BLOG_KV.get(`post:${id}`, 'json');
}

// 创建文章
async function createPost(env, data, author) {
  const id = generateId();
  const now = Date.now();
  
  const post = {
    id,
    title: data.title,
    content: data.content,
    html: data.html || '',
    excerpt: data.excerpt || '',
    cover: data.cover || '',
    tags: data.tags || [],
    categories: data.categories || [],
    status: data.status || 'draft',
    createdAt: now,
    updatedAt: now,
    publishedAt: data.status === 'published' ? now : null,
    views: 0,
    author
  };
  
  // 保存文章
  await env.BLOG_KV.put(`post:${id}`, JSON.stringify(post));
  
  // 更新索引
  await updateIndex(env, id, 'add', post.status);
  
  // 更新标签索引
  await updateTags(env, post.tags, id, 'add');
  
  return post;
}

// 更新文章
async function updatePost(env, id, data) {
  const existing = await getPost(env, id);
  if (!existing) return null;
  
  const oldStatus = existing.status;
  const now = Date.now();
  
  const post = {
    ...existing,
    ...data,
    id,  // ID 不可修改
    updatedAt: now,
    publishedAt: data.status === 'published' && !existing.publishedAt 
      ? now 
      : existing.publishedAt
  };
  
  await env.BLOG_KV.put(`post:${id}`, JSON.stringify(post));
  
  // 如果状态改变，更新索引
  if (oldStatus !== post.status) {
    await updateIndex(env, id, 'remove', oldStatus);
    await updateIndex(env, id, 'add', post.status);
  }
  
  // 更新标签索引
  const removedTags = existing.tags.filter(t => !post.tags.includes(t));
  const addedTags = post.tags.filter(t => !existing.tags.includes(t));
  await updateTags(env, removedTags, id, 'remove');
  await updateTags(env, addedTags, id, 'add');
  
  return post;
}

// 删除文章
async function deletePost(env, id) {
  const post = await getPost(env, id);
  if (!post) return false;
  
  await env.BLOG_KV.delete(`post:${id}`);
  await updateIndex(env, id, 'remove', post.status);
  await updateTags(env, post.tags, id, 'remove');
  
  return true;
}

// 更新索引
async function updateIndex(env, id, action, status) {
  const indexKey = status === 'draft' ? DRAFTS_INDEX_KEY : POSTS_INDEX_KEY;
  let index = await env.BLOG_KV.get(indexKey, 'json') || [];
  
  if (action === 'add') {
    if (!index.includes(id)) {
      index.unshift(id);  // 新文章排在最前面
    }
  } else if (action === 'remove') {
    index = index.filter(pid => pid !== id);
  }
  
  await env.BLOG_KV.put(indexKey, JSON.stringify(index));
}

// 更新标签索引
async function updateTags(env, tags, postId, action) {
  for (const tag of tags) {
    const key = `tag:${tag}`;
    let tagPosts = await env.BLOG_KV.get(key, 'json') || [];
    
    if (action === 'add') {
      if (!tagPosts.includes(postId)) tagPosts.unshift(postId);
    } else {
      tagPosts = tagPosts.filter(id => id !== postId);
    }
    
    if (tagPosts.length > 0) {
      await env.BLOG_KV.put(key, JSON.stringify(tagPosts));
    } else {
      await env.BLOG_KV.delete(key);
    }
  }
}

// 增加浏览量
async function incrementViews(env, id) {
  const post = await getPost(env, id);
  if (post) {
    post.views = (post.views || 0) + 1;
    await env.BLOG_KV.put(`post:${id}`, JSON.stringify(post));
  }
}

export {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  incrementViews,
  generateId
};
