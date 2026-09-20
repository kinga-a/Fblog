import { esc } from './util.js';

function inline(t){
  t = esc(t);
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1">');
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return t;
}

export function md(src){
  const lines = String(src || '').split('\n');
  let html = '', list = null, inCode = false, code = [];
  const close = () => { if (list){ html += list.type === 'ol' ? '</ol>' : '</ul>'; list = null; } };
  for (const line of lines){
    if (/^\s*```/.test(line)){
      if (inCode){ html += '<pre><code>' + esc(code.join('\n')) + '</code></pre>'; code = []; inCode = false; }
      else { close(); inCode = true; }
      continue;
    }
    if (inCode){ code.push(line); continue; }
    let m;
    if (m = line.match(/^(#{1,4})\s+(.*)/)){ close(); const lv = m[1].length; html += '<h' + lv + '>' + inline(m[2]) + '</h' + lv + '>'; continue; }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)){ close(); html += '<hr>'; continue; }
    if (m = line.match(/^\s*[-*]\s+(.*)/)){ if (!list || list.type !== 'ul'){ close(); html += '<ul>'; list = {type:'ul'}; } html += '<li>' + inline(m[1]) + '</li>'; continue; }
    if (m = line.match(/^\s*\d+\.\s+(.*)/)){ if (!list || list.type !== 'ol'){ close(); html += '<ol>'; list = {type:'ol'}; } html += '<li>' + inline(m[1]) + '</li>'; continue; }
    if (m = line.match(/^>\s?(.*)/)){ close(); html += '<blockquote>' + inline(m[1]) + '</blockquote>'; continue; }
    if (!line.trim()){ close(); continue; }
    close(); html += '<p>' + inline(line) + '</p>';
  }
  close();
  if (inCode) html += '<pre><code>' + esc(code.join('\n')) + '</code></pre>';
  return html;
}

export function textOf(src){
  return String(src || '').replace(/[#>*`\-\[\]()!\\|]/g, ' ').replace(/\s+/g, ' ').trim();
}
