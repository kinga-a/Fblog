// 认证相关

// 密码哈希（使用 Web Crypto API）
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// 验证密码
async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// 生成 Token
function generateToken() {
  return crypto.randomUUID();
}

// 创建会话
async function createSession(env, username) {
  const token = generateToken();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7天
  
  await env.BLOG_KV.put(`session:${token}`, JSON.stringify({
    token,
    username,
    expiresAt
  }), { expirationTtl: 7 * 24 * 60 * 60 });
  
  return token;
}

// 验证会话
async function verifySession(env, token) {
  if (!token) return null;
  
  const session = await env.BLOG_KV.get(`session:${token}`, 'json');
  if (!session || session.expiresAt < Date.now()) {
    return null;
  }
  
  return session;
}

// 删除会话
async function deleteSession(env, token) {
  await env.BLOG_KV.delete(`session:${token}`);
}

// 认证中间件
async function requireAuth(env, request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || 
                getCookie(request, 'auth_token');
  
  const session = await verifySession(env, token);
  if (!session) {
    return null;
  }
  
  return session;
}

// 获取 Cookie
function getCookie(request, name) {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export {
  hashPassword,
  verifyPassword,
  createSession,
  verifySession,
  deleteSession,
  requireAuth
};
