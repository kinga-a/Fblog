import { json, readBody } from './lib/util.js';
import * as store from './lib/store.js';
import { login, logout, isAdmin, sessionCookie, getToken } from './lib/auth.js';
import { Hooks } from './lib/hooks.js';
import { pluginList } from './plugins/index.js';

export async function handleApi(request, env, url){
  const path = url.pathname, method = request.method;

  // 公开：登录
  if (path === '/api/login' && method === 'POST'){
    const {password} = await readBody(request);
    const token = await login(env, password);
    if (!token) return json({error: '密码错误'}, 401);
    return json({ok: true}, 200, {'Set-Cookie': sessionCookie(token)});
  }

  // 公开：提交评论（对应 Typecho 的评论提交，带插件钩子）
  if (path === '/api/comments' && method === 'POST'){
    const d = await readBody(request);
    if (!d.author || !d.content) return json({error: '昵称和内容不能为空'}, 400);
    const post = await store.getPost(env, String(d.postId));
    if (!post || post.status !== 'published') return json({error: '文章不存在'}, 404);
    let c = {
      id: String(Date.now()),
      author: String(d.author).slice(0, 50),
      url: d.url ? String(d.url).slice(0, 200) : '',
      content: String(d.content).slice(0, 2000),
      created: Date.now()
    };
    c = await Hooks.filter('comment_data', c, post);   // 插件可拦截垃圾评论（返回 null 即拒绝）
    if (!c) return json({error: '评论被拦截'}, 403);
    await store.addComment(env, post.id, c);
    await Hooks.do('comment_after', c, post);
    return json({ok: true});
  }

  // 以下全部需要登录
  if (!(await isAdmin(request, env))) return json({error: '未登录'}, 401);

  if (path === '/api/logout' && method === 'POST'){
    await logout(env, getToken(request));
    return json({ok: true}, 200, {'Set-Cookie': 'blog_token=; Path=/; Max-Age=0'});
  }
  if (path === '/api/me') return json({ok: true});

  if (path === '/api/posts'){
    if (method === 'GET'){
      const {posts} = await store.listPosts(env, {page: 1, size: 99999, status: 'all'});
      return json({ok: true, posts});
    }
    if (method === 'PUT'){
      const {post} = await readBody(request);
      if (!post || !post.title) return json({error: '标题必填'}, 400);
      await store.addCategory(env, post.category);
      return json({ok: true, post: await store.savePost(env, post)});
    }
    if (method === 'DELETE'){
      await store.deletePost(env, url.searchParams.get('id'));
      return json({ok: true});
    }
  }

  if (path === '/api/pages'){
    if (method === 'GET') return json({ok: true, pages: await store.listPages(env)});
    if (method === 'PUT'){
      const {page} = await readBody(request);
      if (!page || !page.title) return json({error: '标题必填'}, 400);
      return json({ok: true, page: await store.savePage(env, page)});
    }
    if (method === 'DELETE'){
      await store.deletePage(env, url.searchParams.get('id'));
      return json({ok: true});
    }
  }

  if (path === '/api/comments' && method === 'GET'){
    return json({ok: true, comments: await store.listAllComments(env)});
  }
  if (path === '/api/comments' && method === 'DELETE'){
    const postId = url.searchParams.get('postId'), id = url.searchParams.get('id');
    const list = await store.listComments(env, postId);
    await store.saveComments(env, postId, list.filter(c => c.id !== id));
    return json({ok: true});
  }

  if (path === '/api/settings'){
    if (method === 'GET') return json({ok: true, settings: await store.getSettings(env)});
    if (method === 'PUT'){
      const {settings} = await readBody(request);
      await store.saveSettings(env, settings);
      return json({ok: true});
    }
  }

  if (path === '/api/categories'){
    return json({ok: true, categories: await store.listCategories(env)});
  }

  if (path === '/api/plugins'){
    if (method === 'GET'){
      const enabled = JSON.parse((await env.BLOG_KV.get('setting:plugins')) || '[]');
      return json({ok: true, plugins: pluginList.map(n => ({name: n, enabled: enabled.includes(n)}))});
    }
    if (method === 'PUT'){
      const {enabled} = await readBody(request);
      await env.BLOG_KV.put('setting:plugins', JSON.stringify(enabled || []));
      return json({ok: true});
    }
  }

  return json({error: 'Not Found'}, 404);
}
