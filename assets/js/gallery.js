document.querySelectorAll('.project-slideshow').forEach(gallery=>{
  const slides=[...gallery.querySelectorAll('.project-slide')],dots=[...gallery.querySelectorAll('[data-gallery-index]')];
  if(slides.length<2)return;
  const pause=gallery.querySelector('[data-gallery-pause]');
  let current=0,timer,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,hover=false;
  function show(index){current=(index+slides.length)%slides.length;slides.forEach((slide,i)=>{slide.classList.toggle('is-current',i===current);slide.setAttribute('aria-hidden',String(i!==current));if(i===current||i===(current+1)%slides.length)slide.loading='eager';});dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===current)));}
  function schedule(){clearInterval(timer);if(!paused&&!hover&&!document.hidden&&!gallery.contains(document.activeElement))timer=setInterval(()=>show(current+1),5000);}
  function updatePause(){pause.textContent=paused?'▶':'❚❚';pause.setAttribute('aria-label',paused?'Play slideshow':'Pause slideshow');schedule();}
  gallery.querySelector('[data-gallery-prev]').onclick=()=>{show(current-1);schedule();};
  gallery.querySelector('[data-gallery-next]').onclick=()=>{show(current+1);schedule();};
  dots.forEach((dot,i)=>dot.onclick=()=>{show(i);schedule();});
  pause.onclick=()=>{paused=!paused;updatePause();};
  gallery.onmouseenter=()=>{hover=true;schedule();};gallery.onmouseleave=()=>{hover=false;schedule();};
  gallery.addEventListener('focusin',schedule);gallery.addEventListener('focusout',()=>setTimeout(schedule,0));
  gallery.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show(current+(e.key==='ArrowRight'?1:-1));schedule();}});
  let start;gallery.addEventListener('touchstart',e=>{start=e.changedTouches[0].clientX;},{passive:true});gallery.addEventListener('touchend',e=>{const delta=e.changedTouches[0].clientX-start;if(Math.abs(delta)>50){show(current+(delta<0?1:-1));schedule();}},{passive:true});
  document.addEventListener('visibilitychange',schedule);show(0);updatePause();
});
