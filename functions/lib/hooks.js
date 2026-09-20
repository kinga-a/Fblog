// Typecho 风格插件钩子：header / footer / content(filter) / comment_data(filter) / comment_after
const handlers = {};
export const Hooks = {
  add(name, fn){ (handlers[name] = handlers[name] || []).push(fn); },
  async do(name, ctx, arg){
    for (const fn of handlers[name] || []) await fn(ctx, arg);
  },
  async filter(name, value, ctx){
    for (const fn of handlers[name] || []) value = await fn(value, ctx);
    return value;
  }
};
