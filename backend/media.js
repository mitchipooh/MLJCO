// Only known public media URL shapes are accepted; never embed arbitrary HTML.
function media(url) {
  if (!url) return null;
  let u; try { u = new URL(url); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
  const host = u.hostname.replace(/^www\./, '');
  let id;
  if (host === 'youtu.be' && /^\/[\w-]+\/?$/.test(u.pathname)) id = u.pathname.split('/')[1];
  if (host === 'youtube.com' && u.pathname === '/watch' && /^[\w-]+$/.test(u.searchParams.get('v') || '')) id = u.searchParams.get('v');
  if (id) return { provider:'YouTube', src:`https://www.youtube-nocookie.com/embed/${id}`, url:u.href };
  if (host === 'vimeo.com' && /^\/\d+\/?$/.test(u.pathname)) return { provider:'Vimeo', src:`https://player.vimeo.com/video/${u.pathname.split('/')[1]}`, url:u.href };
  if (host !== 'facebook.com') return null;
  let kind='video';
  if (/^\/share\/[vrp]\/[a-zA-Z0-9]+\/?$/.test(u.pathname)) {
    kind=u.pathname.includes('/p/')?'post':'video';
  } else if (u.pathname === '/story.php' && /^\d+$/.test(u.searchParams.get('story_fbid')||'') && /^\d+$/.test(u.searchParams.get('id')||'')) {
    kind='post';
  } else if (!(/^\/reel\/\d+\/?$/.test(u.pathname) || /^\/\d+\/videos\/\d+\/?$/.test(u.pathname) || (/^\/watch\/?$/.test(u.pathname) && /^\d+$/.test(u.searchParams.get('v')||'')))) return null;
  const clean = new URL(u.origin+u.pathname);
  for(const key of ['v','id','story_fbid']) if(u.searchParams.has(key)) clean.searchParams.set(key,u.searchParams.get(key));
  return {provider:'Facebook',url:clean.href,src:`https://www.facebook.com/plugins/${kind}.php?href=${encodeURIComponent(clean.href)}&show_text=false&width=500`,kind};
}
module.exports = media;
