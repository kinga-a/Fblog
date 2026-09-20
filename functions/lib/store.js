async function getList(env, key){
  return JSON.parse((await env.BLOG_KV.get(key)) || '[]');
}

export async function getSettings(env){
  const raw = await env.BLOG_KV.get('settings');
  const def = {title: '我的博客', description: '', keywords: '', copyright: ''};
  return raw ? {...def, ...JSON.parse(raw)} : def;
}
export async function saveSettings(env, s){
  await env.BLOG_KV.put('settings', JSON.stringify(s));
}

export async function listPosts(env, opts = {}){
  const {page = 1, size = 10, category = null, tag = null, status = undefined} = opts;
  let posts = [];
  for (const id of await getList(env, 'index:posts')){
    const p = await env.BLOG_KV.get('post:' + id, 'json');
    if (p) posts.push(p);
  }
  posts.sort((a, b) => b.created - a.created);
  if (status === 'all') {}
  else if (status) posts = posts.filter(p => p.status === status);
  else posts = posts.filter(p => p.status === 'published');
  if (category) posts = posts.filter(p => p.category === category);
  if (tag) posts = posts.filter(p => (p.tags || []).includes(tag));
  const total = posts.length;
  return {total, posts: posts.slice((page - 1) * size, page * size)};
}

export async function getPost(env, id){
  return env.BLOG_KV.get('post:' + id, 'json');
}
export async function getPostBySlug(env, slug){
  const id = await env.BLOG_KV.get('slug:' + slug);
  return id ? getPost(env, id) : null;
}
export async function savePost(env, p){
  if (!p.id){
    p.id = String(Date.now());
    p.created = Date.now();
    const ids = await getList(env, 'index:posts');
    ids.unshift(p.id);
    await env.BLOG_KV.put('index:posts', JSON.stringify(ids));
  }
  p.modified = Date.now();
  if (!p.slug) p.slug = p.id;
  if (!p.status) p.status = 'published';
  await env.BLOG_KV.put('post:' + p.id, JSON.stringify(p));
  await env.BLOG_KV.put('slug:' + p.slug, p.id);
  return p;
}
export async function deletePost(env, id){
  const p = await getPost(env, id);
  if (!p) return;
  await env.BLOG_KV.delete('post:' + id);
  if (p.slug) await env.BLOG_KV.delete('slug:' + p.slug);
  await env.BLOG_KV.put('index:posts', JSON.stringify((await getList(env, 'index:posts')).filter(x => x !== id)));
}
export async function prevNext(env, post){
  const ids = await getList(env, 'index:posts');
  const i = ids.indexOf(post.id);
  const g = async id => id ? getPost(env, id) : null;
  return {prev: await g(ids[i + 1] || null), next: await g(ids[i - 1] || null)};
}

export async function listPages(env){
  const out = [];
  for (const id of await getList(env, 'index:pages')){
    const p = await env.BLOG_KV.get('page:' + id, 'json');
    if (p) out.push(p);
  }
  out.sort((a, b) => b.created - a.created);
  return out;
}
export async function getPageBySlug(env, slug){
  const id = await env.BLOG_KV.get('pageSlug:' + slug);
  return id ? env.BLOG_KV.get('page:' + id, 'json') : null;
}
export async function savePage(env, p){
  if (!p.id){
    p.id = String(Date.now());
    p.created = Date.now();
    const ids = await getList(env, 'index:pages');
    ids.unshift(p.id);
    await env.BLOG_KV.put('index:pages', JSON.stringify(ids));
  }
  p.modified = Date.now();
  if (!p.slug) p.slug = p.id;
  await env.BLOG_KV.put('page:' + p.id, JSON.stringify(p));
  await env.BLOG_KV.put('pageSlug:' + p.slug, p.id);
  return p;
}
export async function deletePage(env, id){
  const p = await env.BLOG_KV.get('page:' + id, 'json');
  if (!p) return;
  await env.BLOG_KV.delete('page:' + id);
  if (p.slug) await env.BLOG_KV.delete('pageSlug:' + p.slug);
  await env.BLOG_KV.put('index:pages', JSON.stringify((await getList(env, 'index:pages')).filter(x => x !== id)));
}

export async function listCategories(env){
  return getList(env, 'index:categories');
}
export async function addCategory(env, name){
  name = (name || '').trim();
  if (!name) return;
  const cs = await listCategories(env);
  if (!cs.includes(name)){
    cs.push(name);
    await env.BLOG_KV.put('index:categories', JSON.stringify(cs));
  }
}

export async function listComments(env, postId){
  return getList(env, 'comments:' + postId);
}
export async function saveComments(env, postId, list){
  await env.BLOG_KV.put('comments:' + postId, JSON.stringify(list));
}
export async function addComment(env, postId, c){
  const list = await listComments(env, postId);
  c.id = c.id || String(Date.now());
  c.created = c.created || Date.now();
  list.push(c);
  await saveComments(env, postId, list);
  return c;
}
export async function listAllComments(env){
  const out = [];
  for (const id of await getList(env, 'index:posts')){
    for (const c of await listComments(env, id)) out.push({...c, postId: id});
  }
  out.sort((a, b) => b.created - a.created);
  return out;
}
