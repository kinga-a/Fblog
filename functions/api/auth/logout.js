import { deleteSession, requireAuth } from '../../../lib/auth.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  
  const session = await requireAuth(env, request);
  if (session) {
    await deleteSession(env, session.token);
  }
  
  return Response.json({ success: true }, {
    headers: {
      'Set-Cookie': 'auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
    }
  });
}
