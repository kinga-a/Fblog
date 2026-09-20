export function esc(s){
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function json(data, status=200, headers={}){
  return new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json; charset=utf-8', ...headers}});
}
export async function readBody(req){
  try { return await req.json(); } catch { return {}; }
}
export function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
