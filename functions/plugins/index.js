import { Hooks } from '../lib/hooks.js';
import seo from './seo.js';
import copyright from './copyright.js';

const ALL = {seo, copyright};
export const pluginList = Object.keys(ALL);

export async function loadPlugins(env){
  const enabled = JSON.parse((await env.BLOG_KV.get('setting:plugins')) || '["seo","copyright"]');
  for (const n of enabled){
    if (ALL[n]) ALL[n](Hooks);
  }
}
