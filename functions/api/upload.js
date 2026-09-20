import { uploadImage } from '../../lib/blob';
import { requireAuth } from '../../lib/auth';

export async function onRequestPost(context) {
  const { env, request } = context;
  
  // 验证权限
  const session = await requireAuth(env, request);
  if (!session) {
    return Response.json({ error: '未授权' }, { status: 401 });
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return Response.json({ error: '未提供文件' }, { status: 400 });
    }
    
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: '不支持的文件类型' }, { status: 400 });
    }
    
    // 检查文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: '文件过大，最大 5MB' }, { status: 400 });
    }
    
    const url = await uploadImage(env, file, file.name);
    
    return Response.json({ success: true, url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
