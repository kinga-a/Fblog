// Blob 存储操作封装

// 上传图片
async function uploadImage(env, file, filename) {
  // 生成存储路径：images/2026/09/xxx.jpg
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  const ext = filename.split('.').pop();
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
  const key = `images/${year}/${month}/${uniqueName}`;
  
  // 上传到 Blob 存储
  await env.BLOG_BUCKET.put(key, file, {
    httpMetadata: {
      contentType: getContentType(ext)
    }
  });
  
  // 返回可访问的 URL
  // 注意：EdgeOne Blob 需要通过自定义域名或绑定路径访问
  return `/blob/${key}`;
}

// 获取 Content-Type
function getContentType(ext) {
  const types = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml'
  };
  return types[ext.toLowerCase()] || 'application/octet-stream';
}

// 删除文件
async function deleteFile(env, key) {
  await env.BLOG_BUCKET.delete(key);
}

export { uploadImage, deleteFile };
