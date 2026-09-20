import { getPost, updatePost, deletePost, incrementViews } from '../../../lib/kv';
import { requireAuth } from '../../../lib/auth';
import { renderMarkdown } from '../../../lib/markdown';

export async function onRequestGet(context) {
  const { env, params } = context;
  const { id } = params;
  
  const post = await getPost(env, id);
  
  if (!post) {
    return Response.json({ error: 'Post not found' }, { status: 404 });
  }
  
  // 草稿需要认证才能查看
  if (post.status === 'draft') {
    const session = await requireAuth(env, context.request);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  
  // 增加浏览量
  await incrementViews(env, id);
  
  return Response.json({ post });
}

export async function onRequestPut(context) {
  const { env, request, params } = context;
  const { id } = params;
  
  // 验证权限
  const session = await requireAuth(env, request);
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    
    // 如果内容更新，重新渲染
    if (data.content) {
      data.html = await renderMarkdown(data.content);
    }
    
    const post = await updatePost(env, id, data);
    
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }
    
    return Response.json({ success: true, post });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { env, request, params } = context;
  const { id } = params;
  
  // 验证权限
  const session = await requireAuth(env, request);
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const success = await deletePost(env, id);
  
  if (!success) {
    return Response.json({ error: 'Post not found' }, { status: 404 });
  }
  
  return Response.json({ success: true });
}
