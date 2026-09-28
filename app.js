
// nav shadow + mobile menu
const nav=document.getElementById('nav');
addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>10),{passive:true});
const burger=document.getElementById('burger');
burger.addEventListener('click',()=>{
  const open=nav.classList.toggle('open');
  burger.setAttribute('aria-expanded',open);
});
document.querySelectorAll('.mobile-menu a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

// accordions (one open per group)
document.querySelectorAll('.acc').forEach(group=>{
  group.querySelectorAll('.acc-item').forEach(item=>{
    const head=item.querySelector('.acc-head');
    const body=item.querySelector('.acc-body');
    if(item.classList.contains('open')) body.style.maxHeight=body.scrollHeight+'px';
    head.addEventListener('click',()=>{
      const isOpen=item.classList.contains('open');
      group.querySelectorAll('.acc-item.open').forEach(o=>{
        o.classList.remove('open');
        o.querySelector('.acc-body').style.maxHeight=null;
        o.querySelector('.acc-head').setAttribute('aria-expanded','false');
      });
      if(!isOpen){
        item.classList.add('open');
        body.style.maxHeight=body.scrollHeight+'px';
        head.setAttribute('aria-expanded','true');
      }
    });
  });
});

// scroll reveal + triggers
const revealEls=document.querySelectorAll('.reveal, .viscard');
function activate(el){
  el.classList.add('in-view');
  el.querySelectorAll('.bar i').forEach(b=>b.style.width=b.dataset.w);
  if(el.querySelector('#gaugeVal')) runGauge();
  el.querySelectorAll('[data-count]').forEach(runCounter);
}
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      activate(e.target);
      io.unobserve(e.target);
    });
  },{threshold:0,rootMargin:'0px 0px -8% 0px'}); // fires reliably, even for tall elements
  revealEls.forEach(el=>io.observe(el));
  // safety net: anything still hidden after load gets revealed if it's in/above the viewport
  addEventListener('load',()=>setTimeout(()=>{
    revealEls.forEach(el=>{
      if(!el.classList.contains('in-view') && el.getBoundingClientRect().top < innerHeight) activate(el);
    });
  },400));
}else{
  revealEls.forEach(activate); // no IO support → show everything
}

function runCounter(el){
  const end=+el.dataset.count, pre=el.dataset.prefix||'', suf=el.dataset.suffix||'';
  const t0=performance.now(), dur=1300;
  (function tick(t){
    const p=Math.min((t-t0)/dur,1), v=Math.round(end*(1-Math.pow(1-p,3)));
    el.textContent=pre+v+suf;
    if(p<1) requestAnimationFrame(tick);
  })(t0);
}

let gaugeDone=false;
function runGauge(){
  if(gaugeDone) return; gaugeDone=true;
  const c=document.getElementById('gaugeVal'), n=document.getElementById('gaugeNum');
  const target=96, circ=2*Math.PI*80;
  c.style.strokeDashoffset=circ*(1-target/100);
  const t0=performance.now(), dur=1600, start=54;
  (function tick(t){
    const p=Math.min((t-t0)/dur,1);
    n.textContent=Math.round(start+(target-start)*(1-Math.pow(1-p,3)));
    if(p<1) requestAnimationFrame(tick);
  })(t0);
}

// marquee: duplicate content for seamless loop
const mq=document.getElementById('marquee'); if(mq) mq.innerHTML+=mq.innerHTML;

/* ===================================================================
   CRAZY ANIMATION ENGINE
   =================================================================== */
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

if(!reduceMotion){
  // ---- scroll progress bar ----
  const sb=document.getElementById('scrollbar');
  const onProgress=()=>{
    const h=document.documentElement;
    const max=h.scrollHeight-h.clientHeight;
    sb.style.width=(max>0?(h.scrollTop/max)*100:0)+'%';
  };
  addEventListener('scroll',onProgress,{passive:true});
  onProgress();

  // ---- split-text headings (preserves nested spans like .hl/.dim) ----
  let wordIdx=0;
  const wrapUnit=(html)=>{
    const d=wordIdx*45;
    wordIdx++;
    return '<span class="w"><i style="transition-delay:'+d+'ms">'+html+'</i></span>';
  };
  document.querySelectorAll('.split-me').forEach(head=>{
    wordIdx=0;
    const out=document.createElement('span');
    out.className='split';
    head.childNodes.forEach(node=>{
      if(node.nodeType===3){ // text
        const parts=node.textContent.split(/(\s+)/);
        parts.forEach(p=>{
          if(p.trim()==='') out.insertAdjacentHTML('beforeend',p===''?'':' ');
          else out.insertAdjacentHTML('beforeend',wrapUnit(p));
        });
      }else if(node.nodeType===1){ // element (span.hl, span.dim…)
        out.insertAdjacentHTML('beforeend',wrapUnit(node.outerHTML)+' ');
      }
    });
    head.innerHTML='';
    head.appendChild(out);
  });

  // ---- directional reveal variety (auto-assigned) ----
  document.querySelectorAll('.frow').forEach(row=>{
    const rev=row.classList.contains('rev');
    const copy=row.querySelector('.fcopy'), vis=row.querySelector('.fvis');
    if(copy) copy.classList.add(rev?'from-right':'from-left');
    if(vis) vis.classList.add('flip');
  });
  document.querySelectorAll('.wcard').forEach((c,i)=>c.classList.add(i%2?'from-right':'from-left'));
  document.querySelectorAll('.stat').forEach(s=>s.classList.add('zoom'));
  document.querySelectorAll('.step').forEach(s=>s.classList.add('rot'));

  // ---- parallax on scroll ----
  const plx=[...document.querySelectorAll('[data-parallax]')];
  let ticking=false;
  const runParallax=()=>{
    const vh=innerHeight;
    plx.forEach(el=>{
      const r=el.getBoundingClientRect();
      const speed=parseFloat(el.dataset.parallax)||0;
      const prog=(r.top+r.height/2-vh/2)/vh; // -1..1 around center
      el.style.transform='translate3d(0,'+(prog*speed)+'px,0)';
    });
    ticking=false;
  };
  addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(runParallax);ticking=true;}},{passive:true});
  runParallax();

  // ---- magnetic buttons ----
  const isFinePointer=matchMedia('(pointer:fine)').matches;
  if(isFinePointer){
    document.querySelectorAll('.mag').forEach(el=>{
      el.addEventListener('mousemove',e=>{
        const r=el.getBoundingClientRect();
        const mx=e.clientX-(r.left+r.width/2);
        const my=e.clientY-(r.top+r.height/2);
        el.style.transform='translate('+mx*0.3+'px,'+my*0.4+'px)';
      });
      el.addEventListener('mouseleave',()=>{el.style.transform='';});
    });

    // ---- 3D tilt (hero mockup + any [data-tilt]) ----
    document.querySelectorAll('[data-tilt]').forEach(el=>{
      el.classList.add('tilt');
      el.addEventListener('mousemove',e=>{
        const r=el.getBoundingClientRect();
        const px=(e.clientX-r.left)/r.width-0.5;
        const py=(e.clientY-r.top)/r.height-0.5;
        el.style.transform='perspective(1000px) rotateY('+px*10+'deg) rotateX('+(-py*10)+'deg) translateZ(0)';
      });
      el.addEventListener('mouseleave',()=>{el.style.transform='';});
    });

    // ---- cursor glow on "why" + service cards ----
    document.querySelectorAll('.why,.svc').forEach(card=>{
      card.addEventListener('mousemove',e=>{
        const r=card.getBoundingClientRect();
        card.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');
        card.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');
      });
    });

    // ---- gentle 3D tilt on service + work cards ----
    document.querySelectorAll('.svc,.wcard').forEach(card=>{
      let raf=null;
      card.addEventListener('mousemove',e=>{
        if(raf) return;
        raf=requestAnimationFrame(()=>{
          raf=null;
          const r=card.getBoundingClientRect();
          const px=(e.clientX-r.left)/r.width-0.5;
          const py=(e.clientY-r.top)/r.height-0.5;
          card.style.transform='perspective(900px) rotateY('+px*6+'deg) rotateX('+(-py*6)+'deg) translateY(-6px)';
        });
      });
      card.addEventListener('mouseleave',()=>{card.style.transform='';});
    });
  }

  // ---- live "shopping now" counter (reads as a working storefront) ----
  const liveNow=document.getElementById('liveNow');
  if(liveNow){
    let n=128;
    setInterval(()=>{
      n=Math.max(96,Math.min(180,n+Math.round((Math.random()-0.45)*7)));
      liveNow.textContent=n;
    },2200);
  }

  // ---- live conversion-rate flicker on the CRO winner card ----
  const winCV=document.querySelector('.variant.win .cv');
  if(winCV){
    const base=3.4;
    setInterval(()=>{
      const v=(base+(Math.random()-0.5)*0.2).toFixed(1);
      winCV.childNodes[0].nodeValue=v+'%';
    },1800);
  }
}

// ---- service cards: expand / collapse (independent, multi-open) ----
document.querySelectorAll('.svc').forEach(card=>{
  const btn=card.querySelector('.svc-toggle');
  const body=card.querySelector('.svc-body');
  if(!btn||!body) return;
  const label=btn.childNodes[0];
  btn.addEventListener('click',()=>{
    const open=card.classList.toggle('open');
    btn.setAttribute('aria-expanded',open);
    body.style.maxHeight=open?body.scrollHeight+'px':null;
    if(label) label.textContent=open?'Show less ':'Learn more ';
  });
});

/* ===== distinct per-section entrance signatures ===== */
if(!reduceMotion){
  const sigs=['clipup','wiper'];
  document.querySelectorAll('.sec-head').forEach((h,i)=>h.classList.add(sigs[i%sigs.length]));
}

/* ===== AI chat: live looping conversation ===== */
(function(){
  const chat=document.querySelector('.chatcard'); if(!chat || reduceMotion) return;
  chat.classList.add('live');
  const user=chat.querySelector('.msg.user'), typing=chat.querySelector('.typing'), ai=chat.querySelector('.msg.ai');
  const prods=[...chat.querySelectorAll('.aip')];
  const on=(el,s)=>el&&el.classList.toggle('show',s);
  let timers=[], running=false;
  const at=(ms,fn)=>timers.push(setTimeout(fn,ms));
  function play(){
    timers.forEach(clearTimeout); timers=[];
    on(user,false);on(typing,false);on(ai,false);prods.forEach(p=>on(p,false));
    at(500,()=>on(user,true));
    at(1600,()=>on(typing,true));
    at(3200,()=>{on(typing,false);on(ai,true);});
    prods.forEach((p,i)=>at(3800+i*300,()=>on(p,true)));
    at(8400,play);
  }
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>es.forEach(e=>{
      if(e.isIntersecting && !running){running=true;play();}
      else if(!e.isIntersecting && running){running=false;timers.forEach(clearTimeout);}
    }),{threshold:.3});
    io.observe(chat);
  }else{ play(); }
})();

/* ===== process timeline draw-line ===== */
(function(){
  const fill=document.getElementById('tlFill'); if(!fill || reduceMotion) return;
  const tl=document.querySelector('.timeline');
  let t=false;
  const run=()=>{
    const r=tl.getBoundingClientRect();
    const p=Math.min(Math.max((innerHeight*0.6 - r.top)/r.height,0),1);
    fill.style.height=(p*100)+'%';
    t=false;
  };
  addEventListener('scroll',()=>{if(!t){requestAnimationFrame(run);t=true;}},{passive:true});
  run();
})();

// testimonials
const slides=[...document.querySelectorAll('.tslide')];
const dots=document.getElementById('tdots');
let ti=0, timer;
slides.forEach((_,i)=>{
  const b=document.createElement('button');
  if(i===0) b.classList.add('active');
  b.setAttribute('aria-label','Testimonial '+(i+1));
  b.addEventListener('click',()=>{go(i);reset();});
  dots.appendChild(b);
});
function go(i){
  slides[ti].classList.remove('active');
  dots.children[ti].classList.remove('active');
  ti=i;
  slides[ti].classList.add('active');
  dots.children[ti].classList.add('active');
}
function reset(){clearInterval(timer);timer=setInterval(()=>go((ti+1)%slides.length),6000);}
if(slides.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) reset();


/* PORTFOLIO FILTER */
(function(){
  var chips=document.querySelectorAll('.pfilter button'); if(!chips.length) return;
  var cards=[].slice.call(document.querySelectorAll('.pcard'));
  chips.forEach(function(c){c.addEventListener('click',function(){
    chips.forEach(function(x){x.classList.remove('active');}); c.classList.add('active');
    var f=c.getAttribute('data-filter');
    cards.forEach(function(card){
      var show = f==='all' || card.getAttribute('data-cat')===f;
      card.classList.toggle('hide',!show);
    });
  });});
})();


/* STORES SLIDER */
(function(){
  document.querySelectorAll('.stores-slider').forEach(function(sl){
    var track=sl.querySelector('.ss-track');
    var prev=sl.querySelector('.ss-prev'), next=sl.querySelector('.ss-next');
    var amt=function(){return Math.max(330, track.clientWidth*0.8);};
    if(prev) prev.addEventListener('click',function(){track.scrollBy({left:-amt(),behavior:'smooth'});});
    if(next) next.addEventListener('click',function(){track.scrollBy({left:amt(),behavior:'smooth'});});
  });
})();

/* TESTIMONIALS — split featured/mini layout (homepage) */
(function(){
  var quoteEl=document.getElementById('tfQuote');
  if(!quoteEl) return;
  var avatarEl=document.querySelector('#tfAvatar span');
  var whoEl=document.getElementById('tfWho');
  var miniList=document.getElementById('tMiniList');
  var prevBtn=document.getElementById('tPrev');
  var nextBtn=document.getElementById('tNext');

  var items=[
    {quote:'The new product pages just feel easier to buy from. We saw the difference in checkout within the first month.', initials:'DC', role:'Store owner', meta:'Dental care brand, Canada'},
    {quote:"He rebuilt our theme from scratch and it's the first time the site actually matches our brand. Communication was fast and honest.", initials:'BE', role:'Founder', meta:'Baby essentials brand, UK'},
    {quote:"Hundreds of products imported, cleaned, and live — work we'd been putting off for a year done in days.", initials:'AB', role:'Owner', meta:'Accessories boutique, UK'},
  ];
  var idx=0, timer;

  function render(){
    var featured=items[idx];
    quoteEl.textContent='"'+featured.quote+'"';
    avatarEl.textContent=featured.initials;
    whoEl.innerHTML='<b>'+featured.role+'</b><small>'+featured.meta+'</small>';

    miniList.innerHTML='';
    items.forEach(function(it,i){
      if(i===idx) return;
      var card=document.createElement('div');
      card.className='tmini';
      card.innerHTML=
        '<div class="tmini-body">'+
          '<blockquote>&ldquo;'+it.quote+'&rdquo;</blockquote>'+
          '<cite><span class="tavatar"><span>'+it.initials+'</span></span><span class="twho"><b>'+it.role+'</b><small>'+it.meta+'</small></span></cite>'+
        '</div>';
      card.addEventListener('click',function(){idx=i;render();restart();});
      miniList.appendChild(card);
    });
  }
  function step(dir){idx=(idx+dir+items.length)%items.length;render();}
  function restart(){clearInterval(timer);timer=setInterval(function(){step(1);},6000);}

  if(prevBtn) prevBtn.addEventListener('click',function(){step(-1);restart();});
  if(nextBtn) nextBtn.addEventListener('click',function(){step(1);restart();});

  render();
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches) restart();
})();

/* PORTFOLIO FILTER v2 (homepage slider) */
(function(){
  var chips=document.querySelectorAll('.p2filter button'); if(!chips.length) return;
  var cards=[].slice.call(document.querySelectorAll('.pcard2'));
  var slider=document.querySelector('.stores-slider');
  var prevBtn=slider&&slider.querySelector('.ss-prev'), nextBtn=slider&&slider.querySelector('.ss-next');
  var MIN_FOR_ARROWS=5;

  function updateArrows(){
    if(!prevBtn||!nextBtn) return;
    var visible=cards.filter(function(c){return !c.classList.contains('hide');}).length;
    var show=visible>=MIN_FOR_ARROWS;
    prevBtn.style.display=show?'':'none';
    nextBtn.style.display=show?'':'none';
  }

  chips.forEach(function(c){c.addEventListener('click',function(){
    chips.forEach(function(x){x.classList.remove('active');}); c.classList.add('active');
    var f=c.getAttribute('data-filter');
    cards.forEach(function(card){
      var show = f==='all' || card.getAttribute('data-cat')===f;
      card.classList.toggle('hide',!show);
    });
    slider&&(slider.scrollLeft=0);
    updateArrows();
  });});

  updateArrows();
})();

/* HERO MOCKUP — WORK SCREENSHOT CAROUSEL */
(function(){
  var img=document.getElementById('mockShotImg');
  if(!img) return;
  var urlEl=document.getElementById('mockUrl');
  var dotsEl=document.getElementById('mockDots');
  var prevBtn=document.getElementById('mockPrev');
  var nextBtn=document.getElementById('mockNext');

  var shots=[
    {file:'huel.png', url:'huel.com'},
    {file:'snow.png', url:'trysnow.com'},
    {file:'thursday.png', url:'thursdayboots.com'},
    {file:'sodastream.png', url:'sodastream.com'},
    {file:'thegrace.png', url:'thegracepk.com'},
    {file:'spirithero.png', url:'spirithero.com'},
    {file:'amora.png', url:'amorabeachwear.com'},
    {file:'havoc.png', url:'havocracingco.com'},
    {file:'norani.png', url:'norani.com'},
    {file:'eleanox.png', url:'eleanox.com'},
    {file:'ilanis.png', url:'ilanisdiamonds.com'},
    {file:'stepprs.png', url:'stepprs.com'},
    {file:'tofino.png', url:'tofinosoapcompany.com'},
    {file:'umplife.png', url:'ump-life.com'},
    {file:'kerwellness.png', url:'kerwellness.com'},
    {file:'happyhimalayan.png', url:'happyhimalayan.com'},
    {file:'simplysweet.png', url:'simplysweetfavors.com'},
    {file:'beverlyhills.png', url:'beverlyhillsflorist.com'},
    {file:'snorescape.png', url:'snorescape.myshopify.com'},
  ];

  shots.forEach(function(s){dotsEl.appendChild(document.createElement('span'));});
  var dots=dotsEl.querySelectorAll('span');
  var idx=0, timer, transitioning=false;

  // preload every shot up front so switching never shows a blank/loading image
  shots.forEach(function(s){ var pre=new Image(); pre.src='assets/work/'+s.file; });

  function show(i){
    if(transitioning) return;
    idx=(i+shots.length)%shots.length;
    transitioning=true;
    img.classList.add('fading');
    setTimeout(function(){
      img.src='assets/work/'+shots[idx].file;
      urlEl.textContent=shots[idx].url;
      img.classList.remove('fading');
      transitioning=false;
    },220);
    dots.forEach(function(d,n){d.classList.toggle('active',n===idx);});
  }
  function restart(){
    clearInterval(timer);
    timer=setInterval(function(){show(idx+1);},5000);
  }

  if(prevBtn) prevBtn.addEventListener('click',function(){show(idx-1);restart();});
  if(nextBtn) nextBtn.addEventListener('click',function(){show(idx+1);restart();});
  dots.forEach(function(d,n){d.addEventListener('click',function(){show(n);restart();});});

  show(0);
  restart();
})();
