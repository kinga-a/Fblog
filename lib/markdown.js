// Markdown 渲染（简化版，生产环境建议使用 marked 库）
 
async function renderMarkdown(markdown) {
  if (!markdown) return '';
  
  let html = markdown;
  
  // 代码块（优先处理，避免内部内容被转换）
  html = html.replace(/```(\\w+)?\\n([\\s\\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang || ''}">${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 标题
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // 粗体和斜体
  html = html.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
  html = html.replace(/\\*([^*]+)\\*/g, '<em>$1</em>');
  
  // 图片
  html = html.replace(/!\\[([^\\]]*)\\]\\(([^)]+)\\)/g, '<img alt="$1" src="$2" loading="lazy">');
  
  // 链接
  html = html.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  
  // 引用
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
  html = html.replace(/<\\/blockquote>\\n<blockquote>/g, '\\n');
  
  // 无序列表
  html = html.replace(/^\\s*[-*+] (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\\/li>)/s, '<ul>$1</ul>');
  
  // 有序列表
  html = html.replace(/^\\s*\\d+\\. (.*$)/gim, '<li>$1</li>');
  
  // 分割线
  html = html.replace(/^---+$/gim, '<hr>');
  
  // 段落和换行
  html = html.replace(/\\n\\n/g, '</p><p>');
  html = html.replace(/\\n/g, '<br>');
  
  // 包裹段落
  html = '<p>' + html + '</p>';
  html = html.replace(/<p>(<h[1-6]>)/g, '$1');
  html = html.replace(/(<\\/(?:h[1-6]|ul|ol|blockquote|pre)>)<\\/p>/g, '$1');
  html = html.replace(/<p><\\/p>/g, '');
  
  return html;
}
 
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
 
export { renderMarkdown };
