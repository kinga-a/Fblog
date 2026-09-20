// 初始化管理员账号
// 运行: node scripts/init.js

// 注意：此脚本需要在有 Web Crypto API 的环境中运行（如 Node.js 18+）

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function init() {
  const readline = await import('readline');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => {
    rl.question(prompt, resolve);
  });

  console.log('=== 博客管理员账号初始化 ===\\n');
  
  const username = await question('请输入管理员用户名: ');
  const password = await question('请输入管理员密码: ');
  
  if (!username || !password) {
    console.log('用户名和密码不能为空！');
    rl.close();
    return;
  }
  
  if (password.length < 6) {
    console.log('密码长度至少 6 位！');
    rl.close();
    return;
  }
  
  const passwordHash = await hashPassword(password);
  
  console.log('\\n=== 初始化完成 ===\\n');
  console.log('请在 EdgeOne 控制台的 KV 存储中添加以下记录：\\n');
  console.log('Key:');
  console.log(`  user:${username}`);
  console.log('\\nValue (JSON):');
  console.log(JSON.stringify({
    username: username,
    passwordHash: passwordHash,
    role: 'admin',
    createdAt: Date.now()
  }, null, 2));
  console.log('\\n=== 操作步骤 ===');
  console.log('1. 登录 EdgeOne 控制台');
  console.log('2. 进入「存储」→「KV 命名空间」');
  console.log('3. 选择你的 BLOG_KV 命名空间');
  console.log('4. 点击「添加记录」');
  console.log('5. 输入上述 Key 和 Value');
  console.log('6. 保存即可');
  
  rl.close();
}

init().catch(console.error);
