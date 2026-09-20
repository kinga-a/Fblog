// 示例插件：在页脚输出版权信息（挂载 footer 钩子）
export default function(Hooks){
  Hooks.add('footer', async ($, emit) => {
    if ($.options.copyright) emit('<p>' + $.options.copyright + '</p>');
  });
}
