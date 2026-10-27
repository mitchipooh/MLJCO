const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const media = require('./media');
const safeCover = value => {
  if (!value) return '';
  if (typeof value !== 'string' || value.length > 2000) return null;
  if (/^\/(?:assets\/images|uploads)\/[a-zA-Z0-9_./-]+\.(?:jpg|jpeg|png|webp|gif)$/i.test(value) && !value.includes('..')) return value;
  try { const url=new URL(value); if(url.protocol==='https:' && !url.username && !url.password)return url.href; } catch {}
  return null;
};
const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaults = { seo: {}, theme: { accent:'#cc5a1b', background:'#f4efe7', surface:'#fffaf4', text:'#1d1b18', radius:16, font:'sans' }, posts:[] };
module.exports = (app, { rootDir, getBaseShell }) => {
  const dataDir = process.env.CMS_DATA_DIR || path.join(__dirname, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const file = path.join(dataDir, 'management.json');
  const trafficFile = path.join(dataDir, 'traffic.json');
  const read = () => { const data=fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : structuredClone(defaults); data.gallery ??= structuredClone(require('./data/gallery-defaults.json')); return data; };
  const write = data => { fs.writeFileSync(file + '.tmp', JSON.stringify(data, null, 2)); fs.renameSync(file + '.tmp', file); };
  const traffic = fs.existsSync(trafficFile) ? JSON.parse(fs.readFileSync(trafficFile, 'utf8')) : {};
  let dirty = false;
  const flush = () => { if (dirty) { fs.writeFileSync(trafficFile + '.tmp', JSON.stringify(traffic)); fs.renameSync(trafficFile + '.tmp', trafficFile); dirty = false; } };
  setInterval(flush, 5000).unref();
  process.on('exit', flush);
  require('./admin-auth').register(app,dataDir);
  app.get(['/admin','/admin/'], (req,res) => res.redirect('/admin/dashboard.html'));
  app.get('/api/manage', (req,res) => res.json(read()));
  app.put('/api/manage/seo/:key', (req,res) => {
    const key = req.params.key;
    const pages = JSON.parse(fs.readFileSync(path.join(__dirname,'data','pages.json')));
    if (!Object.hasOwn(pages,key) && key !== 'journal') return res.status(404).json({error:'Page not found'});
    const seo = {};
    for (const field of ['title','description','canonical','image']) seo[field] = String(req.body[field] || '').slice(0,2000);
    if (seo.canonical && !/^https?:\/\//i.test(seo.canonical)) return res.status(400).json({error:'Canonical URL must start with https:// or http://'});
    if (safeCover(seo.image) === null) return res.status(400).json({error:'Sharing image must be a local image path or an https:// URL.'});
    const data = read(); data.seo[key] = seo; write(data); res.json({ok:true});
  });
  app.put('/api/manage/gallery', (req,res) => {
    const photos=req.body.photos;
    if(!Array.isArray(photos)||photos.length>100||photos.some(p=>!p||typeof p.src!=='string'||!p.src||!safeCover(p.src)||typeof p.alt!=='string'||p.alt.length>300))return res.status(400).json({error:'Use up to 100 valid image URLs with descriptions under 300 characters.'});
    const data=read();data.gallery=photos.map(p=>({src:safeCover(p.src),alt:p.alt.trim()}));write(data);res.json({ok:true});
  });
  app.put('/api/manage/theme', (req,res) => {
    const theme = req.body;
    for (const key of ['accent','background','surface','text']) if (!/^#[a-f0-9]{6}$/i.test(theme[key])) return res.status(400).json({error:'Use six-digit hex colors.'});
    if (!Number.isFinite(Number(theme.radius)) || Number(theme.radius)<0 || Number(theme.radius)>32 || !['sans','serif'].includes(theme.font)) return res.status(400).json({error:'Invalid appearance settings.'});
    const data=read(); data.theme={accent:theme.accent,background:theme.background,surface:theme.surface,text:theme.text,radius:Number(theme.radius),font:theme.font}; write(data); res.json({ok:true});
  });
  app.post('/api/manage/posts', (req,res) => {
    const b=req.body;
    if (typeof b.title !== 'string' || !b.title.trim() || !['draft','published'].includes(b.status) || !['blog','vlog'].includes(b.type)) return res.status(400).json({error:'Title, type and status are required.'});
    if (b.video && !media(b.video)) return res.status(400).json({error:'Use a Facebook post, reel or video URL, a YouTube watch URL, or a Vimeo video URL.'});
    if (b.source && !media(b.source)) return res.status(400).json({error:'Source must be a supported Facebook, YouTube or Vimeo URL.'});
    if (b.placement && !['journal','projects','featured'].includes(b.placement)) return res.status(400).json({error:'Invalid display location.'});
    if (safeCover(b.cover) === null) return res.status(400).json({error:'Cover photo must be a local image path or an https:// URL.'});
    const data=read(); const existing=data.posts.find(p=>p.id===b.id);
    if (b.id && !existing) return res.status(404).json({error:'Post not found'});
    const post={id:existing?.id || crypto.randomUUID(), title:b.title.trim().slice(0,200),body:String(b.body||'').slice(0,100000),type:b.type,status:b.status,video:String(b.video||''),source:String(b.source||''),placement:b.placement || existing?.placement || 'journal',sourceDate:existing?.sourceDate||'',sourceNotes:existing?.sourceNotes||'',created:existing?.created || new Date().toISOString(),updated:new Date().toISOString()};
    post.cover=Object.hasOwn(b,'cover')?safeCover(b.cover):(existing?.cover||'');
    post.coverAlt=String(b.coverAlt ?? existing?.coverAlt ?? '').slice(0,300);
    if(existing) data.posts[data.posts.indexOf(existing)]=post; else data.posts.unshift(post);
    write(data); res.json(post);
  });
  app.delete('/api/manage/posts/:id', (req,res) => {const data=read();const index=data.posts.findIndex(p=>p.id===req.params.id);if(index<0)return res.status(404).json({error:'Post not found'});data.posts.splice(index,1);write(data);res.json({ok:true});});
  app.get('/api/manage/traffic', (req,res) => {
    const days=Object.keys(traffic).sort().slice(-30);
    res.json({days:days.map(day=>({day,views:traffic[day].views,pages:traffic[day].pages,referrers:traffic[day].referrers})),note:'Server page requests over the last 30 days; includes bots and repeat visits. No visitor identifiers stored.'});
  });
  const enhance = (html,key,title,req) => {
    const data=read(), seo=data.seo[key]||{},t=data.theme;
    html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${esc(seo.title || title+' | M.J.CO Limited')}</title>`);
    const image=safeCover(seo.image);
    const sharingImage=image?new URL(image,seo.canonical || `${req.protocol}://${req.get('host')}`).href:'';
    const meta=`<meta name="description" content="${esc(seo.description)}"><meta property="og:type" content="website"><meta property="og:site_name" content="M.J.CO Limited"><meta property="og:locale" content="en_TT"><meta property="og:title" content="${esc(seo.title || title)}"><meta property="og:description" content="${esc(seo.description)}"><meta name="twitter:card" content="${sharingImage?'summary_large_image':'summary'}"><meta name="twitter:title" content="${esc(seo.title || title)}"><meta name="twitter:description" content="${esc(seo.description)}">${seo.canonical?`<link rel="canonical" href="${esc(seo.canonical)}"><meta property="og:url" content="${esc(seo.canonical)}">`:''}${sharingImage?`<meta property="og:image" content="${esc(sharingImage)}"><meta property="og:image:alt" content="M.J.CO Limited construction project"><meta name="twitter:image" content="${esc(sharingImage)}">`:''}`;
    return html.replace('</head>',`${meta}<style>:root{--accent:${t.accent};--accent-dark:${t.accent};--bg:${t.background};--surface:${t.surface};--ink:${t.text};--radius:${t.radius}px}body{background:var(--bg);font-family:${t.font==='serif'?'Georgia,serif':'"Source Sans 3","Segoe UI",sans-serif'}}.site-header{background:var(--surface)}.card,.hero-card,.cta-band{border-radius:var(--radius)}.journal-body{white-space:pre-wrap}.journal-video{width:100%;aspect-ratio:16/9;border:0}</style></head>`);
  };
  const count=(req,key) => {
    const day=new Date().toISOString().slice(0,10);const row=traffic[day] ||= {views:0,pages:{},referrers:{}};
    row.views++;row.pages[key]=(row.pages[key]||0)+1;
    let ref='Direct';try{ref=new URL(req.get('referer')).hostname;}catch{}
    if(Object.keys(row.referrers).length<100 || row.referrers[ref]) row.referrers[ref]=(row.referrers[ref]||0)+1;
    for(const old of Object.keys(traffic).sort().slice(0,-90))delete traffic[old];dirty=true;
  };
  const article = (p, compact=false) => {
    const video=media(p.video), source=media(p.source || p.video);
    const cover=safeCover(p.cover);
    const photo=cover?`<a class="post-cover-link" href="/journal#post-${esc(p.id)}"><img class="post-cover" src="${esc(cover)}" alt="${esc(p.coverAlt || p.title)}" width="526" height="350" loading="lazy"></a>`:'';
    const player=video && !compact ? `<div class="media-placeholder"><span>${esc(video.provider)} ${video.kind==='post'?'post':'video'}</span><button class="btn btn-primary" data-media-src="${esc(video.src)}" data-media-title="${esc(p.title)}" type="button">Load ${esc(video.provider)} ${video.kind==='post'?'post':'video'}</button><p>Loads content from ${esc(video.provider)}. If playback is unavailable, use the original link below.</p></div>` : '';
    return `<article id="post-${esc(p.id)}" class="card project-story">${photo}<small>${esc(p.type==='vlog'?'Project video':'Company update')}${p.sourceDate?' · '+esc(p.sourceDate):''}</small><h2>${esc(p.title)}</h2>${player}<p class="journal-body">${esc(compact?p.body.slice(0,200)+(p.body.length>200?'…':''):p.body)}</p><div class="story-actions">${compact?`<a class="btn btn-primary" href="/journal#post-${esc(p.id)}">View project update</a>`:''}${source?`<a class="btn btn-outline" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">View original on ${esc(source.provider)} ↗</a>`:''}</div></article>`;
  };
  const highlights = key => {
    let posts=read().posts.filter(p=>p.status==='published' && (key==='index'?p.placement==='featured':['projects','featured'].includes(p.placement)));
    if(key==='index')posts=posts.slice(0,3);
    return posts.length?`<section id="our-work" class="section project-updates"><div class="container"><span class="kicker">FROM OUR PROJECTS</span><h2>${key==='index'?'See our work in action':'Project stories & videos'}</h2><p>Explore updates shared by M.J.CO Limited, from groundwork to finished spaces.</p><div class="grid-3">${posts.map(p=>article(p,true)).join('')}</div></div></section>`:'';
  };
  app.get('/journal', (req,res) => {
    const posts=read().posts.filter(p=>p.status==='published');
    const articles=posts.map(p=>article(p)).join('');
    count(req,'journal');res.send(enhance(getBaseShell({title:'Blog / Vlog',activePage:'journal',bodyHtml:`<section class="section"><div class="container"><h1>News from M.J.CO</h1><p>Project updates, stories and videos.</p><div class="grid-3">${articles || '<p>Updates coming soon.</p>'}</div></div></section>`}),'journal','Blog / Vlog',req));
  });
  app.get(['/', /^\/[a-z0-9-]+\.html$/i], (req,res,next) => {
    const key=req.path==='/'?'index':req.path.slice(1,-5);
    const pages=JSON.parse(fs.readFileSync(path.join(__dirname,'data','pages.json')));
    if(!Object.hasOwn(pages,key))return next();
    let html=fs.readFileSync(path.join(rootDir,key+'.html'),'utf8');
    if(key==='index')html=html.replace('<!-- HERO_SLIDES -->',require('./hero')(read().posts));
    if(key==='index') {
      const updates=highlights(key);let inserted=false;
      html=html.replace(/<section\b[^>]*>[\s\S]*?<\/section>/gi, section=>{
        if(!inserted && /<h[1-6][^>]*>\s*Why Choose M\.J\.CO Limited/i.test(section)){inserted=true;return updates+section;}
        return section;
      });
      if(!inserted)html=html.replace('</main>',updates+'</main>');
    } else if(key==='projects'){
      html=html.replace(/<main\b[^>]*>/, opening=>opening+require('./gallery')(read().gallery));
      html=html.replace('</main>',highlights(key)+'</main>');
    }
    count(req,key);res.send(enhance(html,key,pages[key].title,req));
  });
};
