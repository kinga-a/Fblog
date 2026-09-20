// 后台管理页（纯前端单页，/admin 下由函数直接输出）
export const ADMIN_HTML = String.raw`<!doctype html>
<html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>博客管理</title>
<style>
*{box-sizing:border-box}
body{margin:0;font:14px/1.7 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;color:#333;background:#f5f6f7}
#login{max-width:340px;margin:12vh auto;background:#fff;padding:32px;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
#login h2{margin:0 0 16px}
input,textarea,select{width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font:inherit;margin-bottom:10px}
button{background:#3a6ea5;color:#fff;border:none;padding:8px 18px;border-radius:4px;cursor:pointer}
button.gray{background:#888}
#app{display:none;max-width:1000px;margin:0 auto;padding:20px}
.tabs{display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap}
.tabs button{background:#fff;color:#333;border:1px solid #ddd}
.tabs button.on{background:#3a6ea5;color:#fff;border-color:#3a6ea5}
.card{background:#fff;border-radius:8px;padding:20px}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:8px;border-bottom:1px solid #eee;font-size:13px;vertical-align:top}
.msg{color:#c00;font-size:13px}
.row{display:flex;gap:10px}.row>div{flex:1}
.badge{font-size:12px;background:#eee;border-radius:3px;padding:1px 6px}
.badge.pub{background:#e6f4e6}.badge.draft{background:#fdf3e0}
a{color:#3a6ea5;cursor:pointer}
</style></head><body>
<div id="login"><h2>博客管理登录</h2>
<input id="pw" type="password" placeholder="管理密码">
<button onclick="doLogin()">登录</button><div id="login-msg" class="msg"></div>
</div>
<div id="app">
<div class="tabs">
<button onclick="tab('posts',this)" class="on">文章</button>
<button onclick="tab('pages',this)">页面</button>
<button onclick="tab('comments',this)">评论</button>
<button onclick="tab('settings',this)">设置</button>
<button onclick="tab('plugins',this)">插件</button>
<button onclick="logout()" style="margin-left:auto" class="gray">退出</button>
</div>
<div id="body" class="card"></div>
</div>
<script>
const B = document.getElementById('body');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(p, opt){
  opt = opt || {};
  opt.headers = {'Content-Type':'application/json'};
  const r = await fetch(p, opt);
  if (r.status === 401){ show(false); throw new Error('unauth'); }
  const j = await r.json();
  if (!r.ok) alert(j.error || '操作失败');
  return j;
}
const get = p => api(p);
const put = (p, data) => api(p, {method:'PUT', body: JSON.stringify(data)});
const del = p => api(p, {method:'DELETE'});
function show(ok){
  document.getElementById('login').style.display = ok ? 'none' : 'block';
  document.getElementById('app').style.display = ok ? 'block' : 'none';
}
async function doLogin(){
  const r = await fetch('/api/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({password: document.getElementById('pw').value})});
  if (r.ok){ show(true); loadPosts(); } else document.getElementById('login-msg').textContent = '密码错误';
}
async function logout(){ await api('/api/logout', {method:'POST'}); show(false); }
function tab(name, btn){
  document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  ({posts: loadPosts, pages: loadPages, comments: loadComments, settings: loadSettings, plugins: loadPlugins}[name])();
}

// ---------- 文章 ----------
let cats = [];
async function loadPosts(){
  const [{posts}, c] = await Promise.all([get('/api/posts'), get('/api/categories')]);
  cats = c.categories;
  B.innerHTML = '<p><button onclick="editPost()">+ 写文章</button></p>'
    + '<table><tr><th>标题</th><th>分类</th><th>状态</th><th>时间</th><th></th></tr>'
    + posts.map(p => '<tr><td><a href="/post/' + encodeURIComponent(p.slug) + '" target="_blank">' + esc(p.title) + '</a></td>'
      + '<td>' + esc(p.category || '-') + '</td>'
      + '<td><span class="badge ' + (p.status === 'published' ? 'pub">已发布' : 'draft">草稿') + '</span></td>'
      + '<td>' + new Date(p.created).toLocaleString('zh-CN') + '</td>'
      + '<td><a onclick=\'editPost(' + JSON.stringify(p.id) + ')\'>编辑</a> · <a onclick="delPost(\'' + p.id + '\')">删除</a></td></tr>').join('')
    + '</table>';
  window._posts = posts;
}
const slugify = s => s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '');
function editPost(id){
  const p = id ? window._posts.find(x => x.id === id) : {title:'', slug:'', category: cats[0] || '', tags:[], content:'', status:'draft'};
  B.innerHTML = '<p><a onclick="loadPosts()">← 返回列表</a></p>'
    + '<input id="f-title" placeholder="标题" value="' + esc(p.title) + '" oninput="if(!document.getElementById(\'f-slug\').dataset.t)document.getElementById(\'f-slug\').value=slugify(this.value)">'
    + '<div class="row"><div><input id="f-slug" placeholder="缩略名（留空自动生成）" value="' + esc(p.slug) + '" data-t="1"></div>'
    + '<div><input id="f-cat" list="catlist" placeholder="分类" value="' + esc(p.category || '') + '"><datalist id="catlist">'
    + cats.map(c => '<option value="' + esc(c) + '">').join('') + '</datalist></div>'
    + '<div><input id="f-tags" placeholder="标签，逗号分隔" value="' + esc((p.tags || []).join(',')) + '"></div>'
    + '<div><select id="f-status"><option value="published"' + (p.status === 'published' ? ' selected' : '') + '>发布</option><option value="draft"' + (p.status !== 'published' ? ' selected' : '') + '>草稿</option></select></div></div>'
    + '<textarea id="f-content" rows="16" placeholder="支持 Markdown">' + esc(p.content) + '</textarea>'
    + '<button onclick="savePost(\'' + (p.id || '') + '\')">保存</button>';
}
async function savePost(id){
  const post = {
    id: id || undefined,
    title: document.getElementById('f-title').value,
    slug: slugify(document.getElementById('f-slug').value),
    category: document.getElementById('f-cat').value.trim() || '未分类',
    tags: document.getElementById('f-tags').value.split(/[,，]/).map(s => s.trim()).filter(Boolean),
    content: document.getElementById('f-content').value,
    status: document.getElementById('f-status').value
  };
  await put('/api/posts', {post});
  loadPosts();
}
async function delPost(id){ if (confirm('确定删除？')){ await del('/api/posts?id=' + id); loadPosts(); } }

// ---------- 页面 ----------
let _pages = [];
async function loadPages(){
  const {pages} = await get('/api/pages');
  _pages = pages;
  B.innerHTML = '<p><button onclick="editPage()">+ 新建页面</button></p>'
    + '<table><tr><th>标题</th><th>缩略名</th><th></th></tr>'
    + pages.map(p => '<tr><td>' + esc(p.title) + '</td><td>' + esc(p.slug) + '</td>'
      + '<td><a onclick=\'editPage(' + JSON.stringify(p.id) + ')\'>编辑</a> · <a onclick="delPage(\'' + p.id + '\')">删除</a></td></tr>').join('')
    + '</table><p class="msg" style="color:#999">提示：页面可通过 /page/缩略名 或 /缩略名 访问</p>';
}
function editPage(id){
  const p = id ? _pages.find(x => x.id === id) : {title:'', slug:'', content:''};
  B.innerHTML = '<p><a onclick="loadPages()">← 返回列表</a></p>'
    + '<input id="p-title" placeholder="标题" value="' + esc(p.title) + '" oninput="if(!document.getElementById(\'p-slug\').dataset.t)document.getElementById(\'p-slug\').value=slugify(this.value)">'
    + '<input id="p-slug" placeholder="缩略名" value="' + esc(p.slug) + '" data-t="1">'
    + '<textarea id="p-content" rows="14" placeholder="支持 Markdown">' + esc(p.content) + '</textarea>'
    + '<button onclick="savePage(\'' + (p.id || '') + '\')">保存</button>';
}
async function savePage(id){
  const page = {id: id || undefined, title: document.getElementById('p-title').value,
    slug: slugify(document.getElementById('p-slug').value), content: document.getElementById('p-content').value};
  await put('/api/pages', {page});
  loadPages();
}
async function delPage(id){ if (confirm('确定删除？')){ await del('/api/pages?id=' + id); loadPages(); } }

// ---------- 评论 ----------
async function loadComments(){
  const {comments} = await get('/api/comments');
  B.innerHTML = comments.length
    ? '<table><tr><th>作者</th><th>内容</th><th>时间</th><th></th></tr>'
      + comments.map(c => '<tr><td>' + esc(c.author) + '</td><td>' + esc(c.content) + '</td>'
        + '<td>' + new Date(c.created).toLocaleString('zh-CN') + '</td>'
        + '<td><a onclick="delComment(\'' + c.postId + '\',\'' + c.id + '\')">删除</a></td></tr>').join('') + '</table>'
    : '<p class="msg" style="color:#999">暂无评论</p>';
}
async function delComment(postId, id){ if (confirm('确定删除？')){ await del('/api/comments?postId=' + postId + '&id=' + id); loadComments(); } }

// ---------- 设置 ----------
async function loadSettings(){
  const {settings} = await get('/api/settings');
  B.innerHTML = '<label>站点标题</label><input id="s-title" value="' + esc(settings.title) + '">'
    + '<label>站点描述</label><input id="s-desc" value="' + esc(settings.description) + '">'
    + '<label>关键词（逗号分隔）</label><input id="s-kw" value="' + esc(settings.keywords) + '">'
    + '<label>版权信息（页脚显示）</label><input id="s-copy" value="' + esc(settings.copyright) + '">'
    + '<button onclick="saveSettings()">保存</button>';
}
async function saveSettings(){
  await put('/api/settings', {settings: {
    title: document.getElementById('s-title').value,
    description: document.getElementById('s-desc').value,
    keywords: document.getElementById('s-kw').value,
    copyright: document.getElementById('s-copy').value
  }});
  alert('已保存');
}

// ---------- 插件 ----------
async function loadPlugins(){
  const {plugins} = await get('/api/plugins');
  B.innerHTML = plugins.map(p => '<p><label><input type="checkbox" style="width:auto" data-name="' + p.name + '"' + (p.enabled ? ' checked' : '') + '> ' + p.name + '</label></p>').join('')
    + '<button onclick="savePlugins()">保存</button><p class="msg" style="color:#999">新插件：在 functions/plugins/ 下新建文件并注册到 index.js</p>';
}
async function savePlugins(){
  const enabled = [...document.querySelectorAll('#body input[type=checkbox]:checked')].map(i => i.dataset.name);
  await put('/api/plugins', {enabled});
  alert('已保存');
}

// 启动
get('/api/me').then(() => { show(true); loadPosts(); }).catch(() => {});
document.getElementById('pw').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
</script></body></html>`;
