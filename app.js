const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.intro > p, .section-head, .about-main > p, .contact h2').forEach(el => el.setAttribute('data-reveal', ''));
if (!reduced.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('seen'); observer.unobserve(entry.target); }
  }), {threshold: 0.12});
  document.querySelectorAll('[data-reveal]').forEach(el => {el.classList.add('reveal-ready'); observer.observe(el);});
}
const copyButton = document.querySelector('.copy-email');
copyButton?.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText('karthik0757m@gmail.com'); copyButton.textContent = 'Copied'; }
  catch { copyButton.textContent = 'Use email link'; }
  setTimeout(() => copyButton.textContent = 'Copy email', 2400);
});
const box = document.querySelector('.lightbox');
const artButtons = [...document.querySelectorAll('[data-art]')];
let visibleArt = artButtons;
let activeArt = 0;
function showArt(i) {
  activeArt = (i + visibleArt.length) % visibleArt.length;
  const button = visibleArt[activeArt];
  box.querySelector('img').src = button.dataset.art;
  box.querySelector('img').alt = button.dataset.title;
  box.querySelector('[data-art-title]').textContent = button.dataset.title;
  box.querySelector('[data-art-count]').textContent = `${activeArt + 1} / ${visibleArt.length}`;
  if (!reduced.matches) box.querySelector('img').animate([{opacity:.35,transform:'translateX(12px)'},{opacity:1,transform:'translateX(0)'}],{duration:260,easing:'ease-out'});
}
artButtons.forEach(button => button.addEventListener('click', () => {
  visibleArt = artButtons.filter(b => !b.closest('.art').hidden);
  showArt(visibleArt.indexOf(button)); box.showModal(); document.body.classList.add('locked');
}));
box?.querySelector('[data-close]').addEventListener('click', () => box.close());
box?.querySelector('[data-prev]').addEventListener('click', () => showArt(activeArt - 1));
box?.querySelector('[data-next]').addEventListener('click', () => showArt(activeArt + 1));
box?.addEventListener('close', () => document.body.classList.remove('locked'));
box?.addEventListener('click', event => {if(event.target === box) {const rect=box.getBoundingClientRect(); if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom) box.close();}});
box?.addEventListener('keydown', event => {if(event.key==='ArrowRight'){event.preventDefault();showArt(activeArt+1);} if(event.key==='ArrowLeft'){event.preventDefault();showArt(activeArt-1);}});

// A single scheduled frame responds to scrolling; nothing runs while the page is idle.
const hero = document.querySelector('.hero');
const portrait = document.querySelector('.hero-photo img');
const heroTitle = document.querySelector('.hero h1');
const design = document.querySelector('.design');
const designTitle = document.querySelector('.design-title');
const progress = document.createElement('div');
progress.className = 'reading-progress'; progress.setAttribute('aria-hidden','true'); document.body.prepend(progress);
const navigation = [...document.querySelectorAll('.header nav a')];
const chapters = navigation.map(a => ({link:a,section:document.getElementById(a.hash.slice(1))})).filter(x=>x.section);
let framePending = false;
const clamp = n => Math.max(0, Math.min(1,n));
function updateScroll() {
  framePending = false;
  const y = window.scrollY;
  const total = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${total > 0 ? clamp(y / total) : 0})`;
  document.body.classList.toggle('has-scrolled',y > 40);
  const animated = !reduced.matches && innerWidth > 700;
  if (hero && portrait && heroTitle) {
    const amount = clamp(y / hero.offsetHeight);
    portrait.style.transform = animated ? `translateY(${amount * 26}px) scale(1.065)` : '';
    heroTitle.style.translate = animated ? `0 ${amount * -18}px` : '';
  }
  if (designTitle) {
    const r=design.getBoundingClientRect();
    const p=clamp((innerHeight-r.top)/(innerHeight*.85));
    designTitle.style.translate=animated?`${(1-p)*-45}px 0`:'';
    designTitle.style.opacity=animated?String(.45+p*.55):'';
  }
  let active=null;
  for (const chapter of chapters) if(chapter.section.getBoundingClientRect().top < innerHeight*.4) active=chapter;
  navigation.forEach(a => {if(a===active?.link)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
}
function scheduleScroll(){if(!framePending){framePending=true;requestAnimationFrame(updateScroll);}}
addEventListener('scroll',scheduleScroll,{passive:true});
addEventListener('resize',scheduleScroll,{passive:true});
reduced.addEventListener('change',scheduleScroll);
updateScroll();

const filters=[...document.querySelectorAll('[data-filter]')];
const artworks=[...document.querySelectorAll('.art')];
filters.forEach(filter => filter.addEventListener('click',()=>{
  const selection=filter.dataset.filter;
  design.classList.toggle('is-filtered',selection!=='all');
  filters.forEach(button=>button.setAttribute('aria-pressed',String(button===filter)));
  artworks.forEach(art=>{
    art.hidden=selection!=='all' && art.dataset.category!==selection;
    if(!art.hidden){art.classList.add('seen');if(!reduced.matches)art.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:360,easing:'ease-out'});}
  });
  const more=document.querySelector('.gallery-more');
  if(more){more.open=selection!=='all';more.hidden=selection!=='all' && ![...more.querySelectorAll('.art')].some(art=>!art.hidden);}
  const count=artworks.filter(art=>!art.hidden).length;
  document.querySelector('[data-filter-count]').textContent=`${String(count).padStart(2,'0')} pieces`;
  scheduleScroll();
}));
