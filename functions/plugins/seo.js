// 示例插件：输出 SEO meta 标签（挂载 header 钩子，对应 Typecho 的 header 钩子）
export default function(Hooks){
  Hooks.add('header', async ($, emit) => {
    emit('<meta name="keywords" content="' + ($.options.keywords || '') + '">');
    emit('<meta name="description" content="' + ($.options.description || '') + '">');
  });
}
