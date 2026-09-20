import { hashPassword, verifyPassword, createSession } from '../../../lib/auth.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    const { username, password } = await request.json();
    
    // 获取用户
    const user = await env.BLOG_KV.get(`user:${username}`, 'json');
    
    if (!user) {
      return Response.json({ error: '用户名或密码错误' }, { status: 401 });
    }
    
    // 验证密码
    const valid = await verifyPassword(password, user.passwordHash);
    
    if (!valid) {
      return Response.json({ error: '用户名或密码错误' }, { status: 401 });
    }
    
    // 创建会话
    const token = await createSession(env, username);
    
    return Response.json({
      success: true,
      token,
      user: {
        username: user.username,
        role: user.role
      }
    }, {
      headers: {
        'Set-Cookie': `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
