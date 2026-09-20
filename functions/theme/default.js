// 默认主题：仿 Typecho 默认主题风格
// 主题接口：layout($, body) / home($) / archive($) / post($) / page($)
// $ = {options, archive:{title}, data:{...}, theme}
import { esc } from '../lib/util.js';
import { md, textOf } from '../lib/markdown.js';
import { Hooks } from '../lib/hooks.js';

const fmt = t => new Date(t).toLocaleDateString('zh-CN');
const metaLine = p => fmt(p.created)
  + ' · <a href="/category/' + encodeURIComponent(p.category || 'uncategorized') + '">' + esc(p.category || '未分类') + '</a>'
  + ((p.tags && p.tags.length) ? ' · ' + p.tags.map(t => '<a class="tag" href="/tag/' + encodeURIComponent(t) + '">' + esc(t) + '</a>').join(' ') : '')
  + ' · 阅读 ' + (p.views || 0);

function postItem(p){
  const txt = textOf(p.content);
  return '<article class="post">'
    + '<h2 class="post-title"><a href="/post/' + encodeURIComponent(p.slug) + '">' + esc(p.title) + '</a></h2>'
    + '<div class="post-meta">' + metaLine(p) + '</div>'
    + '<div class="post-content"><p>' + esc(txt).slice(0, 200) + (txt.length > 200 ? '…' : '') + '</p></div>'
    + '</article>';
}

function commentList(list){
  if (!list || !list.length) return '<p class="muted">还没有评论</p>';
  return '<ol class="comment-list">' + list.map(c =>
    '<li id="comment-' + c.id + '"><div class="c-meta">'
    + (c.url ? '<a href="' + esc(c.url) + '" rel="nofollow">' + esc(c.author) + '</a>' : esc(c.author))
    + ' · ' + new Date(c.created).toLocaleString('zh-CN')
    + '</div><div class="c-body">' + esc(c.content).replace(/\n/g, '<br>') + '</div></li>'
  ).join('') + '</ol>';
}

export default {
  name: 'default',

  async layout($, body){
    let head = '', foot = '';
    await Hooks.do('header', $, s => { head += s; });
    await Hooks.do('footer', $, s => { foot += s; });
    const title = $.archive.title ? esc($.archive.title) + ' - ' + esc($.options.title) : esc($.options.title);
    return `<!doctype html>
<html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<link rel="alternate" type="application/rss+xml" title="RSS" href="/feed">
<style>
:root{--accent:#3a6ea5;--text:#333;--muted:#999;--line:#e5e5e5}
*{box-sizing:border-box}
body{margin:0;color:var(--text);background:#fff;font:15px/1.8 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
header.site{max-width:760px;margin:0 auto;padding:48px 20px 16px;border-bottom:1px solid var(--line)}
header.site h1{margin:0;font-size:26px}header.site h1 a{color:var(--text)}
header.site p{margin:6px 0 0;color:var(--muted);font-size:14px}
nav.main{max-width:760px;margin:0 auto;padding:10px 20px}
nav.main a{margin-right:18px;font-size:14px}
main{max-width:760px;margin:0 auto;padding:20px}
article.post{margin-bottom:36px}
.post-title{margin:0 0 4px}
h1.post-title{font-size:24px}h2.post-title{font-size:20px}
.post-title a{color:var(--text)}
.post-meta{color:var(--muted);font-size:13px;margin-bottom:10px}
.post-meta a{color:var(--muted)}
.post-content p{margin:0}
.entry img{max-width:100%}
.entry h1,.entry h2,.entry h3{line-height:1.4}
.entry pre{background:#f6f8fa;padding:12px;overflow:auto;font-size:13px}
.entry blockquote{margin:0;padding:2px 14px;border-left:3px solid var(--line);color:#666}
hr{border:none;border-top:1px solid var(--line);margin:28px 0}
.muted{color:var(--muted)}
.post-nav{display:flex;justify-content:space-between;gap:12px;font-size:14px;margin:24px 0}
.comment-list{padding-left:0;list-style:none}
.comment-list li{border-bottom:1px dashed var(--line);padding:10px 0}
.c-meta{font-size:13px;color:var(--muted);margin-bottom:4px}
.c-body{font-size:14px}
#comment-form input,#comment-form textarea{width:100%;padding:8px;margin-bottom:8px;border:1px solid var(--line);border-radius:4px;font:inherit}
#comment-form button{background:var(--accent);color:#fff;border:none;padding:8px 20px;border-radius:4px;cursor:pointer}
.pagination{margin:24px 0;font-size:14px}
footer.site{max-width:760px;margin:24px auto 48px;padding:16px 20px 0;border-top:1px solid var(--line);color:var(--muted);font-size:13px;text-align:center}
</style>${head}</head><body>
<header class="site"><h1><a href="/">${esc($.options.title)}</a></h1>${$.options.description ? '<p>' + esc($.options.description) + '</p>' : ''}</header>
<nav class="main"><a href="/">首页</a><a href="/archive">归档</a><a href="/admin">管理</a></nav>
<main>${body}</main>
<footer class="site">${foot}<p>Powered by EdgeBlog</p></footer>
</body></html>`;
  },

  async home($){
    const {posts, total, page, size} = $.data;
    if (!posts.length) return '<p class="muted">暂无文章</p>';
    const pages = Math.max(1, Math.ceil(total / size));
    let nav = '';
    if (pages > 1){
      nav = '<div class="pagination">'
        + (page > 1 ? '<a href="/?page=' + (page - 1) + '">← 上一页</a> ' : '')
        + '<span class="muted">' + page + ' / ' + pages + '</span> '
        + (page < pages ? '<a href="/?page=' + (page + 1) + '">下一页 →</a>' : '')
        + '</div>';
    }
    return posts.map(postItem).join('') + nav;
  },

  async archive($){
    return $.data.posts.length ? $.data.posts.map(postItem).join('') : '<p class="muted">暂无文章</p>';
  },

  async post($){
    const p = $.data.post;
    const content = await Hooks.filter('content', md(p.content), p);
    const form = '<form id="comment-form" onsubmit="return submitComment(event)">'
      + '<input name="author" placeholder="昵称（必填）" required>'
      + '<input name="url" placeholder="网址（可选）">'
      + '<textarea name="content" rows="4" placeholder="评论内容（必填）" required></textarea>'
      + '<button type="submit">提交评论</button> <span id="c-msg" class="muted"></span></form>'
      + '<scr' + 'ipt>async function submitComment(e){e.preventDefault();const f=e.target;'
      + 'const d=Object.fromEntries(new FormData(f).entries());d.postId="' + p.id + '";'
      + 'const r=await fetch("/api/comments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)});'
      + 'const j=await r.json();document.getElementById("c-msg").textContent=r.ok?"提交成功，刷新后可见":(j.error||"提交失败");'
      + 'if(r.ok)f.reset();return false;}</scr' + 'ipt>';
    return '<article class="post">'
      + '<h1 class="post-title">' + esc(p.title) + '</h1>'
      + '<div class="post-meta">' + metaLine(p) + '</div>'
      + '<div class="entry">' + content + '</div></article>'
      + '<div class="post-nav">'
      + ($.data.prev ? '<a href="/post/' + encodeURIComponent($.data.prev.slug) + '">← ' + esc($.data.prev.title) + '</a>' : '<span></span>')
      + ($.data.next ? '<a href="/post/' + encodeURIComponent($.data.next.slug) + '">' + esc($.data.next.title) + ' →</a>' : '')
      + '</div><hr><h3 id="comments">评论</h3>'
      + commentList($.data.comments) + form;
  },

  async page($){
    const p = $.data.page;
    const content = await Hooks.filter('content', md(p.content), p);
    return '<article class="post"><h1 class="post-title">' + esc(p.title) + '</h1>'
      + '<div class="entry">' + content + '</div></article>';
  }
};
