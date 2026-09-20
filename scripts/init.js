// 初始化管理员账号
// 运行: node scripts/init.js

import { hashPassword } from '../lib/auth';

async function init() {
  // 这里需要通过 EdgeOne CLI 或直接调用 KV API
  const username = 'admin';
  const password = 'your-secure-password';
  
  const passwordHash = await hashPassword(password);
  
  console.log('请手动在 KV 中添加以下记录:');
  console.log('Key: user:admin');
  console.log('Value:', JSON.stringify({
    username: 'admin',
    passwordHash,
    role: 'admin',
    createdAt: Date.now()
  }, null, 2));
}

init();
