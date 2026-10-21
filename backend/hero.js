const media=require('./media');
const esc=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
module.exports=posts=>posts.filter(p=>p.status==='published'&&p.placement==='featured'&&media(p.video)).map(p=>{
  const player=media(p.video);const url=new URL(player.src);
  if(player.provider==='Facebook'){url.searchParams.set('autoplay','true');url.searchParams.set('auto_play','true');url.searchParams.set('mute','1');url.searchParams.set('muted','true');url.searchParams.set('show_text','false');url.searchParams.set('width','1920');}
  if(player.provider==='YouTube'){url.searchParams.set('autoplay','1');url.searchParams.set('mute','1');url.searchParams.set('controls','0');}
  if(player.provider==='Vimeo'){url.searchParams.set('background','1');url.searchParams.set('muted','1');}
  const cover=p.cover && (/^\/assets\/images\/[\w./-]+$/.test(p.cover)||/^\/uploads\/[\w.-]+$/.test(p.cover))?`<img src="${esc(p.cover)}" alt="" class="hero-poster">`:'';
  return `<template data-hero-slide data-title="${esc(p.title)}" data-source="${esc(player.url)}"><div class="hero-film">${cover}<iframe data-src="${esc(url.href)}" title="${esc(p.title)}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" tabindex="-1" aria-hidden="true" referrerpolicy="strict-origin-when-cross-origin"></iframe></div></template>`;
}).join('');
