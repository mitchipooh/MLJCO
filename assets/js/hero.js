(() => {
  const hero=document.querySelector('.cinema-hero');if(!hero)return;
  document.body.classList.add('has-cinema');
  const slides=[...hero.querySelectorAll('[data-hero-slide]')],stage=hero.querySelector('.hero-stage');
  const pause=hero.querySelector('[data-hero-pause]'),count=hero.querySelector('[data-hero-count]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let index=0,paused=reduced.matches,timer,visible=true;
  const active=()=>!paused&&visible&&!document.hidden;
  function schedule(){clearTimeout(timer);if(active()&&slides.length>1)timer=setTimeout(()=>show(index+1),15000);}
  function show(next){
    if(!slides.length){count.textContent='';pause.hidden=true;return;}
    index=(next+slides.length)%slides.length;
    const template=slides[index],film=template.content.cloneNode(true);stage.replaceChildren(film);
    const frame=stage.querySelector('iframe');if(frame){if(active())frame.src=frame.dataset.src;else frame.remove();}
    hero.querySelector('[data-hero-caption]').textContent=template.dataset.title;
    hero.querySelector('[data-hero-original]').href=template.dataset.source;
    count.textContent=`${index+1} / ${slides.length}`;
    pause.textContent=paused?'Play':'Pause';pause.setAttribute('aria-label',paused?'Play videos and rotation':'Pause videos and rotation');pause.setAttribute('aria-pressed',String(paused));
    schedule();
  }
  hero.querySelector('[data-hero-next]').onclick=()=>show(index+1);
  hero.querySelector('[data-hero-prev]').onclick=()=>show(index-1);
  pause.onclick=()=>{paused=!paused;show(index);};
  document.addEventListener('visibilitychange',()=>show(index));
  reduced.addEventListener('change',()=>{paused=reduced.matches;show(index);});
  new IntersectionObserver(entries=>{const next=entries[0].isIntersecting;if(next!==visible){visible=next;show(index);}},{threshold:.1}).observe(hero);
  const header=document.querySelector('.site-header');
  const updateHeader=()=>header?.classList.toggle('cinema-scrolled',scrollY>40);
  addEventListener('scroll',updateHeader,{passive:true});updateHeader();show(0);
})();
