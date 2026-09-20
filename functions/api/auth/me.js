import { requireAuth } from '../../../lib/auth.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  
  const session = await requireAuth(env, request);
  if (!session) {
    return Response.json({ error: '未登录' }, { status: 401 });
  }
  
  const user = await env.BLOG_KV.get(`user:${session.username}`, 'json');
  
  return Response.json({
    success: true,
    user: {
      username: user.username,
      role: user.role
    }
  });
}
