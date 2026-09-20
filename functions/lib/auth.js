import { uid } from './util.js';
const COOKIE = 'blog_token';

export async function login(env, password){
  if (!password || password !== env.ADMIN_PASSWORD) return null;
  const token = uid() + uid();
  await env.BLOG_KV.put('session:' + token, String(Date.now() + 7 * 864e5), {expirationTtl: 7 * 86400});
  return token;
}
export async function logout(env, token){
  if (token) await env.BLOG_KV.delete('session:' + token);
}
export function getToken(request){
  const c = request.headers.get('Cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]+)'));
  return m ? m[1] : null;
}
export async function isAdmin(request, env){
  const t = getToken(request);
  if (!t) return false;
  const exp = await env.BLOG_KV.get('session:' + t);
  return !!exp && Number(exp) > Date.now();
}
export function sessionCookie(token){
  return COOKIE + '=' + token + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + (7 * 86400);
}
