(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const designs = window.PORTFOLIO_DESIGNS || [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let motion = !reduced.matches;
  let paused = false, visible = true, tabVisible = !document.hidden, focused = false;
  let cursor = 4, target = 4, raf = 0, last = 0, dragging = false, moved = false;
  let startX = 0, startCursor = 0, spiralWidth = 600;
  const spiral = $('#design'), cardRoot = $('#spiral-cards'), viewer = $('#art-viewer');
  const order = [44,19,33,13,7,26,22,9,27,2,8,40,46,34,11,24,12,3,45,23,32,28,35,36,20,41,0,29,30,31,16,4,5,42,43,17,37,38,39,18,1,14,21,25,10,6,15,47];
  const cards = order.map(id => {
    const art = designs[id];
    const button = document.createElement('button');
    button.className = 'orbit-card';
    button.type = 'button';
    button.dataset.design = id;
    button.setAttribute('aria-label', 'Open ' + art.title);
    const img = document.createElement('img');
    img.alt = art.title;
    img.width = art.width; img.height = art.height;
    img.decoding = 'async'; img.draggable = false;
    const label = document.createElement('span'); label.textContent = art.title;
    button.append(img, label); cardRoot.append(button);
    button.addEventListener('click', () => { if (!moved) openViewer(id, designs.map(d => d.id)); });
    return {button, img, art, shown:false};
  });
  const wrap = (n, length) => ((n % length) + length) % length;
  function paint() {
    const mobile = spiralWidth < 550;
    const radius = spiralWidth * (mobile ? .32 : .31);
    const pitch = mobile ? 37 : 49;
    cards.forEach((card, i) => {
      const t = wrap(i - cursor + 24, 48) - 24;
      const show = Math.abs(t) < (mobile ? 5.5 : 6.4);
      if (!show) {
        if (card.shown) {card.button.style.display = 'none'; card.shown = false;}
        return;
      }
      if (!card.shown) {
        card.button.style.display = 'block'; card.shown = true;
        if (!card.img.getAttribute('src')) card.img.src = card.art.src;
      }
      const angle = t * .72;
      const depth = (Math.cos(angle) + 1) / 2;
      const scale = .59 + depth * .43;
      const x = Math.sin(angle) * radius;
      const y = t * pitch;
      card.button.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${(Math.sin(angle)*-8).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      card.button.style.zIndex = Math.round(depth * 100);
      card.button.style.opacity = Math.min(1, ((mobile ? 5.5 : 6.4) - Math.abs(t)) * 1.6) * (.57 + depth * .43);
    });
  }
  function shouldRun() {return motion && !paused && visible && tabVisible && !viewer.open && !focused && !dragging;}
  function frame(now) {
    raf = 0;
    const dt = Math.min((now - (last || now)) / 1000, .05); last = now;
    if (shouldRun()) target += dt * .30;
    if (Math.abs(target - cursor) > .0005) {
      cursor += (target - cursor) * (motion && !dragging ? .13 : 1);
      paint();
    }
    if (shouldRun() || (Math.abs(target-cursor) > .001 && visible && tabVisible)) raf = requestAnimationFrame(frame);
  }
  function wake() { if (!raf && visible && tabVisible) {last=0; raf=requestAnimationFrame(frame);} }
  function stop() {cancelAnimationFrame(raf);raf=0;last=0;}
  function step(n) { target = Math.round(target) + n; if (!motion) {cursor=target;paint();} else wake(); }
  $('#previous-art').addEventListener('click', () => step(-1));
  $('#next-art').addEventListener('click', () => step(1));
  $('#pause-orbit').addEventListener('click', () => {
    paused = !paused;
    $('#pause-orbit').textContent = paused ? 'Play spiral' : 'Pause spiral';
    $('#pause-orbit').setAttribute('aria-pressed', String(paused));
    wake();
  });
  spiral.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    dragging=true;moved=false;startX=e.clientX;startCursor=target;
  });
  spiral.addEventListener('pointermove', e => {
    if (!dragging) return;
    const delta=e.clientX-startX;
    if (Math.abs(delta)>7) {
      moved=true;
      if (!spiral.hasPointerCapture(e.pointerId)) spiral.setPointerCapture(e.pointerId);
      target=startCursor-delta/75;cursor=target;paint();
    }
  });
  const endDrag=()=>{dragging=false;wake();setTimeout(()=>{moved=false;},80);};
  spiral.addEventListener('pointerup',endDrag);
  spiral.addEventListener('pointercancel',endDrag);
  spiral.addEventListener('lostpointercapture',endDrag);
  spiral.addEventListener('focusin',()=>{focused=true;});
  spiral.addEventListener('focusout',e=>{if(!spiral.contains(e.relatedTarget)){focused=false;wake();}});
  spiral.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();step(e.key==='ArrowRight'?1:-1);}
  });
  new ResizeObserver(entries=>{spiralWidth=entries[0].contentRect.width;paint();}).observe(spiral);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else stop();},{threshold:0}).observe(spiral);
  document.addEventListener('visibilitychange',()=>{tabVisible=!document.hidden;if(tabVisible)wake();else stop();});

  // The static archive remains fully usable when JavaScript is unavailable.
  const archiveItems=$$('.archive-art');
  const selectedIds=new Set(order.slice(0,8));
  archiveItems.forEach(a=>{a.style.order=order.indexOf(Number(a.dataset.design));});
  let filter='All',expanded=false;
  const expand=$('#archive-expand');
  function updateArchive(){
    let shown=0;
    archiveItems.forEach(a=>{
      const match=filter==='All'||a.dataset.category===filter;
      a.hidden=!match||(!expanded&&!selectedIds.has(Number(a.dataset.design)));
      if(match)shown++;
    });
    $('#archive-count').textContent=shown+' works';
    expand.hidden=filter!=='All';
    expand.textContent=expanded?'Show selected works / collapse archive':'Open the complete archive / 48 works';
  }
  updateArchive();
  expand.addEventListener('click',()=>{expanded=!expanded;updateArchive();if(!expanded)$('#design-archive').scrollIntoView({behavior:motion?'smooth':'auto'});});
  $('#archive-link').addEventListener('click',()=>{expanded=true;filter='All';$$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter==='All')));updateArchive();});
  $$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    filter=button.dataset.filter;expanded=true;
    $$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    updateArchive();
  }));
  let viewerList=[],viewerIndex=0,returnFocus=null;
  function showViewerArt(){
    const id=viewerList[viewerIndex],art=designs[id];
    $('#viewer-image').src=art.src;$('#viewer-image').alt=art.title;
    $('#viewer-title').textContent=art.title;
    $('#viewer-category').textContent=art.category.toUpperCase()+' / ORIGINAL DESIGN';
    $('#viewer-count').textContent=String(viewerIndex+1).padStart(2,'0')+' / '+viewerList.length;
  }
  function openViewer(id,list){
    viewerList=list;viewerIndex=list.indexOf(id);returnFocus=document.activeElement;
    showViewerArt();viewer.showModal();document.body.classList.add('viewer-open');stop();
  }
  archiveItems.forEach(a=>a.addEventListener('click',e=>{
    e.preventDefault();
    openViewer(Number(a.dataset.design),designs.filter(d=>filter==='All'||d.category===filter).map(d=>d.id));
  }));
  function nextViewer(n){viewerIndex=wrap(viewerIndex+n,viewerList.length);showViewerArt();}
  $('#close-viewer').addEventListener('click',()=>viewer.close());
  $('#viewer-prev').addEventListener('click',()=>nextViewer(-1));
  $('#viewer-next').addEventListener('click',()=>nextViewer(1));
  viewer.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();nextViewer(e.key==='ArrowRight'?1:-1);}});
  viewer.addEventListener('close',()=>{document.body.classList.remove('viewer-open');returnFocus?.focus({preventScroll:true});wake();});

  const projectData=[
    {type:'DELAY-TOLERANT NETWORK',stack:'REACT / TYPESCRIPT / DTN CONCEPT',title:'Connection, against the odds.',description:'Exploring disaster routing through a delay-tolerant network: messages are stored, carried, and forwarded when continuous internet is unavailable.',slug:'safepathfinder',url:'https://safepathfinder.vercel.app/',link:'Live demo ↗',action:'Reroute signal',note:'Illustrative DTN concept. Academic project, not an emergency navigation service.'},
    {type:'EMOTION → RECOMMENDATION',stack:'PYTHON / FLASK / SPOTIFY API / GEMINI',title:'A soundtrack for your state of mind.',description:'Mood-led music discovery with manual selection, text analysis, and camera-based emotion recognition. Built around a Flask backend and Spotify recommendations.',slug:'moodmusic',url:'https://moodmusic-bblm.onrender.com/',link:'Live demo ↗',action:'Change mood',note:'Visual mood concept; no audio plays here. The hosted app may take a moment to wake up.'},
    {type:'SENSOR SIGNAL → ROAD ANOMALY',stack:'PYTHON / SIGNAL PROCESSING / SCIKIT-LEARN',title:'Reading the road through data.',description:'An experiment using simulated accelerometer, gyroscope, and GPS data to identify road anomalies through filtering, feature extraction, and machine learning.',slug:'pothole-detection',url:'https://github.com/karthik0757m/pothole_detection',link:'Source code ↗',action:'Replay signal',note:'Illustrative sensor trace. The project uses synthetic data, not a validated live road feed.'},
    {type:'AGENTS → EMERGENT BEHAVIOUR',stack:'AI / SIMULATION / BEHAVIOURAL MODELLING',title:'Small interactions. Complex possibilities.',description:'A project exploring near-real-world actions and scenarios through simulation informed by previously captured data.',slug:'synthetic-cognitive-society',url:'https://github.com/karthik0757m/Synthetic-Cognitive-Society',link:'Repository ↗',action:'Change scenario',note:'Conceptual agent visualization. Repository availability may vary; no model results are represented here.'},
    {type:'AUDIO FEATURES → PATTERNS',stack:'R / DATA ANALYSIS / SPOTIFY DATA',title:'What does a listening habit reveal?',description:'Exploring Spotify tracks through energy, valence, danceability, genres, and changes over time. An analytical look at the patterns behind music.',slug:'spotify-analysis',url:'https://github.com/karthik0757m/spotify-analysis',link:'Source code ↗',action:'Change sample',note:'Illustrative feature values for this interaction, not results from the project dataset.'},
    {type:'UPLOAD → COLLECT → REVISIT',stack:'REACT / FULL STACK / SHARED PHOTO GALLERY',title:'A place for the moments that stay.',description:'A shared photo board for friends and family to upload memories and scroll back through them together.',slug:'group-board',url:'https://github.com/karthik0757m/group-board',link:'Source code ↗',action:'View gallery concept',note:'Illustrative gallery preview. This project has not been hosted.'}
  ];
  const initialNetwork=$('#demo-visual').innerHTML;
  let project=0,demoStep=0;
  function renderDemo(){
    const visual=$('#demo-visual');
    if(project===0){
      visual.innerHTML=initialNetwork;
      if(demoStep%2) visual.querySelector('.signal-route').setAttribute('d','M60 270L185 185 140 65 420 105 570 160');
    }
    if(project===1){
      const moods=['ENERGETIC','CALM','FOCUSED'];
      visual.innerHTML='<div class="wave-bars" aria-hidden="true">'+Array.from({length:29},(_,i)=>`<i style="--bar:${22+((i*17+demoStep*23)%78)}%;--delay:${-i*.08}s;animation-duration:${demoStep%3===1?2.4:1.2}s"></i>`).join('')+'</div><span class="mood-label">'+moods[demoStep%3]+'</span>';
    }
    if(project===2) visual.innerHTML='<svg viewBox="0 0 640 320" role="img" aria-label="Illustrative acceleration trace with a sharp road anomaly"><path class="sensor-base" d="M30 90H610M30 160H610M30 230H610M30 50V265M180 50V265M330 50V265M480 50V265M610 50V265"/><path class="sensor-line" d="M30 184L60 179 80 188 110 181 140 184 170 177 190 184 215 180 245 186 270 179 294 182 313 205 330 62 345 250 360 157 380 191 405 180 430 185 460 178 490 183 520 176 550 184 580 180 610 183"/><g class="diagram-labels"><text x="358" y="67">ANOMALY DETECTED</text><text x="30" y="294">ACCELERATION / TIME</text></g></svg>';
    if(project===3){
      const nodes=Array.from({length:18},(_,i)=>({x:65+((i*139+demoStep*47)%510),y:45+((i*89+demoStep*61)%240)}));
      visual.innerHTML='<svg viewBox="0 0 640 330" role="img" aria-label="Concept illustration of interacting agents"><g stroke="#476050" stroke-width="1">'+nodes.map((n,i)=>`<path d="M${n.x} ${n.y}L${nodes[(i+1)%18].x} ${nodes[(i+1)%18].y}"/>`).join('')+'</g>'+nodes.map((n,i)=>`<circle class="sim-node" cx="${n.x}" cy="${n.y}" r="${5+i%4}" style="--delay:${-i*.16}s"/>`).join('')+'</svg>';
    }
    if(project===4) visual.innerHTML='<div class="analysis-bars" role="img" aria-label="Illustrative Spotify audio-feature comparison">'+['ENERGY','VALENCE','DANCEABILITY','ACOUSTICNESS','SPEECHINESS'].map((n,i)=>`<div style="--value:${28+((i*19+demoStep*13)%69)}%"><span>${n}</span></div>`).join('')+'</div>';
    if(project===5) visual.innerHTML='<img class="group-preview" src="group-board.webp" alt="Group Board illustrative shared photo gallery" width="1200" height="900">';
  }
  $$('[data-project]').forEach(b=>b.addEventListener('click',()=>{
    project=Number(b.dataset.project);demoStep=0;
    $$('[data-project]').forEach(button=>button.setAttribute('aria-pressed',String(button===b)));
    const p=projectData[project];
    $('#display-type').textContent=p.type;$('#display-number').textContent='0'+(project+1)+' / 06';
    $('#project-stack').textContent=p.stack;$('#project-title').textContent=p.title;
    $('#project-description').textContent=p.description;
    $('#project-case').href='projects/'+p.slug+'.html';
    $('#project-external').href=p.url;$('#project-external').textContent=p.link;
    $('#demo-action').textContent=p.action;$('#demo-note').textContent=p.note;
    renderDemo();
    $('#project-display').classList.remove('panel-enter');
    requestAnimationFrame(()=>$('#project-display').classList.add('panel-enter'));
  }));
  $('#demo-action').addEventListener('click',()=>{
    demoStep++;
    if(project===5)openViewer(18,[18]);else renderDemo();
  });
  const engineer=$('#work');
  new IntersectionObserver(entries=>{for(const e of entries){engineer.classList.toggle('is-visible',e.isIntersecting);if(e.isIntersecting&&motion){$('.glitch').classList.add('is-glitching');setTimeout(()=>$('.glitch').classList.remove('is-glitching'),600);}}},{threshold:.08}).observe(engineer);

  let scrollPending=false;
  function scrollFrame(){
    scrollPending=false;
    const max=document.documentElement.scrollHeight-innerHeight;
    $('.reading-progress').style.transform='scaleX('+(max>0?scrollY/max:0)+')';
    if(motion){
      const cut=$('.chapter-cut').getBoundingClientRect();
      if(cut.bottom>0&&cut.top<innerHeight) $('.cut-track').style.setProperty('--cut-x',(-5+(cut.top/innerHeight)*-10)+'%');
      const about=$('.about').getBoundingClientRect();
      if(about.bottom>0&&about.top<innerHeight) $('.about-portrait').style.setProperty('--portrait-y',Math.max(-16,Math.min(16,about.top*.035))+'px');
    }
  }
  addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(scrollFrame);}},{passive:true});
  new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){$$('.site-header nav a').forEach(a=>{if(a.hash==='#'+e.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}});},{rootMargin:'-15% 0px -55% 0px'}).observe($('#work'));
  const navObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)$$('.site-header nav a').forEach(a=>{if(a.hash==='#'+(e.target.id==='design-archive'?'design':e.target.id))a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});});},{rootMargin:'-15% 0px -55% 0px'});
  ['design','design-archive','about','contact'].forEach(id=>navObserver.observe($('#'+id)));
  function updateMotion(){
    document.body.classList.toggle('motion-off',!motion);
    $('#motion-toggle').textContent=motion?'Motion on':'Motion off';
    $('#motion-toggle').setAttribute('aria-pressed',String(motion));
    if(!motion){stop();$('#loader').hidden=true;cursor=target;paint();}else wake();
  }
  $('#motion-toggle').addEventListener('click',()=>{motion=!motion;updateMotion();});
  reduced.addEventListener('change',e=>{motion=!e.matches;updateMotion();});
  $('#copy-email').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText('karthik0757m@gmail.com');$('#copy-email').textContent='Email copied';}
    catch{$('#copy-email').textContent='Use the email link';}
  });
  const loader=$('#loader');
  if(motion){
    loader.hidden=false;
    const introTimers=[setTimeout(()=>$('#load-count').textContent='02 / 03',450),setTimeout(()=>$('#load-count').textContent='03 / 03',900),setTimeout(()=>loader.hidden=true,2100)];
    $('#skip-intro').addEventListener('click',()=>{loader.hidden=true;introTimers.forEach(clearTimeout);});
  }
  updateMotion();paint();wake();scrollFrame();
})();
