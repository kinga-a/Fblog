import theme from './theme/default.js';
import { getSettings, listPosts, getPostBySlug, getPageBySlug, listComments, savePost, prevNext } from './lib/store.js';
import { loadPlugins } from './plugins/index.js';
import { handleApi } from './api.js';
import { ADMIN_HTML } from './admin-page.js';
import { esc } from './lib/util.js';
import { md } from './lib/markdown.js';

function pageResponse(html, status = 200){
  return new Response(html, {status, headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'}});
}

function rssXml(settings, posts){
  const items = posts.map(p => '<item><title>' + esc(p.title) + '</title>'
    + '<link>/post/' + encodeURIComponent(p.slug) + '</link>'
    + '<guid>/post/' + encodeURIComponent(p.slug) + '</guid>'
    + '<pubDate>' + new Date(p.created).toUTCString() + '</pubDate>'
    + '<description><![CDATA[' + md(p.content) + ']]></description></item>').join('');
  return '<?xml version="1.0" encoding="UTF-8"?>'
    + '<rss version="2.0"><channel><title>' + esc(settings.title) + '</title><link>/</link>'
    + '<description>' + esc(settings.description || '') + '</description>' + items + '</channel></rss>';
}

export async function onRequest(context){
  const {request, env} = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  await loadPlugins(env);

  if (path.startsWith('/api/')) return handleApi(request, env, url);

  const settings = await getSettings(env);

  if (path === '/admin') return pageResponse(ADMIN_HTML);

  if (path === '/feed' || path === '/rss'){
    const {posts} = await listPosts(env, {page: 1, size: 20});
    return new Response(rssXml(settings, posts), {headers: {'Content-Type': 'application/rss+xml; charset=utf-8'}});
  }

  const $ = {options: settings, archive: {title: ''}, data: {}, theme};
  let m;

  if (path === '/'){
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    $.data = await listPosts(env, {page, size: 10});
    return pageResponse(await theme.layout($, await theme.home($)));
  }

  if (path === '/archive'){
    $.archive.title = '归档';
    $.data = {posts: (await listPosts(env, {page: 1, size: 9999})).posts};
    return pageResponse(await theme.layout($, await theme.archive($)));
  }

  if (m = path.match(/^\/post\/([^/]+)$/)){
    const p = await getPostBySlug(env, decodeURIComponent(m[1]));
    if (!p || p.status !== 'published') return pageResponse('404 Not Found', 404);
    p.views = (p.views || 0) + 1;
    await savePost(env, p);
    $.archive.title = p.title;
    $.data = {post: p, comments: await listComments(env, p.id), ...(await prevNext(env, p))};
    return pageResponse(await theme.layout($, await theme.post($)));
  }

  if (m = path.match(/^\/page\/([^/]+)$/)){
    const p = await getPageBySlug(env, decodeURIComponent(m[1]));
    if (!p) return pageResponse('404 Not Found', 404);
    $.archive.title = p.title;
    $.data = {page: p};
    return pageResponse(await theme.layout($, await theme.page($)));
  }

  if (m = path.match(/^\/category\/([^/]+)$/)){
    const c = decodeURIComponent(m[1]);
    $.archive.title = '分类：' + c;
    $.data = await listPosts(env, {category: c, size: 9999});
    return pageResponse(await theme.layout($, await theme.archive($)));
  }

  if (m = path.match(/^\/tag\/([^/]+)$/)){
    const t = decodeURIComponent(m[1]);
    $.archive.title = '标签：' + t;
    $.data = await listPosts(env, {tag: t, size: 9999});
    return pageResponse(await theme.layout($, await theme.archive($)));
  }

  // 短路径回退：匹配独立页面 slug，例如 /about
  const pg = await getPageBySlug(env, path.slice(1));
  if (pg){
    $.archive.title = pg.title;
    $.data = {page: pg};
    return pageResponse(await theme.layout($, await theme.page($)));
  }

  return pageResponse('404 Not Found', 404);
}
