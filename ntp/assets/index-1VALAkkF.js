(function(){"use strict";const C='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',O='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',b=s=>String(s).padStart(2,"0");function v(s,t={},e=""){const a=document.createElement(s);for(const[n,i]of Object.entries(t))i===!1||i==null||a.setAttribute(n,i===!0?"":i);return e&&(a.innerHTML=e),a}function E(s){const t=v("div",{class:"chrome","aria-hidden":"false"});return t.innerHTML=`
    <div class="chrome-top">
      <div class="chrome-brand"><i></i><span>Служба времени NTP · Курсовая работа</span></div>
      <div class="chrome-chapter"><span class="num"></span><span class="name"></span></div>
    </div>
    <div class="chrome-bottom">
      <div class="chrome-hint" aria-hidden="true">
        <span><kbd>←</kbd><kbd>→</kbd>навигация</span>
        <span><kbd>N</kbd>заметки</span>
        <span><kbd>O</kbd>содержание</span>
        <span><kbd>F</kbd>полный экран</span>
      </div>
      <div class="chrome-right">
        <div class="step-dots" aria-hidden="true"></div>
        <button class="menu-btn" type="button" data-action="overview" aria-label="Содержание">Содержание</button>
        <div class="counter" aria-live="polite"><b class="cur">01</b> / ${b(s)}</div>
        <div class="nav-btns">
          <button class="nav-btn" type="button" data-action="prev" aria-label="Предыдущий слайд">${C}</button>
          <button class="nav-btn" type="button" data-action="next" aria-label="Следующий слайд">${O}</button>
        </div>
      </div>
    </div>
    <div class="progress" role="progressbar" aria-label="Прогресс презентации" aria-valuemin="1" aria-valuemax="${s}">
      <div class="progress-fill"></div>
      <div class="progress-ticks">
        ${Array.from({length:s},(e,a)=>`<button type="button" data-goto="${a}" aria-label="Слайд ${a+1}"></button>`).join("")}
      </div>
    </div>`,t}function j(s){const t=v("div",{class:"overlay",id:"overview",role:"dialog","aria-modal":"true","aria-label":"Содержание"});return t.innerHTML=`
    <div class="overlay-panel">
      <div class="overlay-head">
        <h2>Содержание</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <div class="overview-grid">
        ${s.map((e,a)=>`
          <button class="overview-item" type="button" data-goto="${a}">
            <span class="n">${b(a+1)} · ${e.chapter}</span>
            <span class="t">${e.title}</span>
          </button>`).join("")}
      </div>
    </div>`,t}function H(){const s=v("aside",{class:"notes",id:"notes","aria-label":"Заметки докладчика"});return s.innerHTML=`
    <div class="notes-inner">
      <div class="notes-label">Заметки докладчика<br><span class="muted">N — скрыть</span></div>
      <div class="notes-text"></div>
    </div>`,s}function R(){const s=[["Следующий слайд","→ · Пробел · PgDn"],["Предыдущий слайд","← · Shift+Пробел · PgUp"],["Первый / последний","Home · End"],["Содержание","O · Esc"],["Заметки докладчика","N"],["Полный экран","F"],["Источники фотографий","I"],["Эта подсказка","H · ?"]],t=v("div",{class:"overlay",id:"help",role:"dialog","aria-modal":"true","aria-label":"Управление"});return t.innerHTML=`
    <div class="overlay-panel" style="width:min(820px,100%)">
      <div class="overlay-head">
        <h2>Управление</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <div class="keys">
        ${s.map(([e,a])=>`<div><span>${e}</span><kbd>${a}</kbd></div>`).join("")}
      </div>
      <p class="muted" style="margin-top:24px;font-size:14px">На телефоне и планшете листайте свайпом влево и вправо.</p>
    </div>`,t}function V(s,t){const e=v("div",{class:"overlay",id:"credits",role:"dialog","aria-modal":"true","aria-label":"Источники фотографий"}),a=Object.values(s).map(n=>`
      <li>
        <img src="${t}${n.file}" alt="" loading="lazy">
        <div>
          <b>${n.title}</b>
          <span>${n.author} · ${n.license}</span><br>
          ${n.source?`<a href="${n.source}" target="_blank" rel="noopener">${n.source.replace("https://","")}</a>`:""}
        </div>
      </li>`).join("");return e.innerHTML=`
    <div class="overlay-panel">
      <div class="overlay-head">
        <h2>Источники фотографий</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <ul class="credits-list">${a}</ul>
    </div>`,e}const F=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches,D=s=>1-Math.pow(1-s,3);function k(s,t=0){const e=s.toFixed(t),[a,n]=e.split("."),i=a.length>4?a.replace(/\B(?=(\d{3})+(?!\d))/g," "):a;return n?`${i},${n}`:i}const T=new WeakMap;function I(s){s.querySelectorAll("[data-count]").forEach(t=>{const e=parseFloat(t.dataset.count),a=parseFloat(t.dataset.from??"0"),n=parseInt(t.dataset.decimals??"0",10),i=parseInt(t.dataset.duration??"1600",10),r=parseInt(t.dataset.delay??"350",10);if(cancelAnimationFrame(T.get(t)),F()){t.textContent=k(e,n);return}t.textContent=k(a,n);const o=performance.now()+r,p=l=>{const d=Math.min(1,Math.max(0,(l-o)/i));t.textContent=k(a+(e-a)*D(d),n),d<1&&T.set(t,requestAnimationFrame(p))};T.set(t,requestAnimationFrame(p))})}function q(s){s.querySelectorAll("[data-count]").forEach(t=>{cancelAnimationFrame(T.get(t)),t.textContent=k(parseFloat(t.dataset.count),parseInt(t.dataset.decimals??"0",10))})}const B=1920,W=1080,K=2600;class U{constructor(t,e,{images:a={},base:n="./"}={}){this.root=t,this.slides=e,this.images=a,this.base=n,this.index=-1,this.step=0,this.locked=!1}mount(){const{root:t,slides:e}=this;this.stage=v("div",{class:"stage","data-dir":"fwd"}),this.track=v("div",{class:"slides"}),this.sections=e.map((n,i)=>{const r=v("section",{class:`slide slide--${n.id}`,"data-theme":n.theme||"dark","data-index":i,"aria-roledescription":"слайд","aria-label":`${i+1} из ${e.length}: ${n.title}`});return r.innerHTML=n.html({base:this.base,img:this.img.bind(this)}),this.track.appendChild(r),r}),this.chrome=E(e.length),this.stage.append(this.track,this.chrome),this.overview=j(e),this.notes=H(),this.help=R(),this.credits=V(this.images,this.base),this.toast=v("div",{class:"toast",role:"status"},"→ или Пробел — дальше · H — управление"),t.append(this.stage,this.notes,this.overview,this.help,this.credits,this.toast),this.$={chapterWrap:this.chrome.querySelector(".chrome-chapter"),chapterNum:this.chrome.querySelector(".chrome-chapter .num"),chapterName:this.chrome.querySelector(".chrome-chapter .name"),counter:this.chrome.querySelector(".counter .cur"),fill:this.chrome.querySelector(".progress-fill"),progress:this.chrome.querySelector(".progress"),dots:this.chrome.querySelector(".step-dots"),prev:this.chrome.querySelector('[data-action="prev"]'),next:this.chrome.querySelector('[data-action="next"]'),notesText:this.notes.querySelector(".notes-text")},this.bind(),this.fit();const a=this.indexFromHash();return this.go(a??0,{instant:!0}),setTimeout(()=>this.toast.classList.add("is-show"),900),setTimeout(()=>this.toast.classList.remove("is-show"),5200),this.pokeIdle(),this}img(t,{alt:e,className:a="",position:n}={}){const i=this.images[t];if(!i)throw new Error(`Unknown image: ${t}`);const r=n||i.position,o=r?` style="object-position:${r}"`:"",p=a?` class="${a}"`:"";return`<img src="${this.base}${i.file}" alt="${e??i.alt}"${p} decoding="async" draggable="false"${o}>`}fit(){const t=this.root.clientWidth,e=this.root.clientHeight,a=Math.min(t/B,e/W);this.stage.style.setProperty("--scale",String(a))}stepsOf(t){return Math.max(1,this.slides[t]?.steps||1)}next(){if(this.step<this.stepsOf(this.index)-1)return this.setStep(this.step+1);this.index<this.slides.length-1&&this.go(this.index+1)}prev(){if(this.step>0)return this.setStep(this.step-1);this.index>0&&this.go(this.index-1,{step:this.stepsOf(this.index-1)-1})}go(t,{step:e=0,instant:a=!1}={}){const n=Math.max(0,Math.min(this.slides.length-1,t));if(n===this.index){this.setStep(e);return}const i=this.index,r=this.sections[i],o=this.sections[n],p=this.slides[n];this.stage.dataset.dir=n>i?"fwd":"back",r&&(r.classList.remove("is-active"),r.classList.add("is-leaving"),clearTimeout(r._leaveTimer),r._leaveTimer=setTimeout(()=>r.classList.remove("is-leaving"),750),r.setAttribute("aria-hidden","true"),r.inert=!0),o.classList.remove("is-leaving"),o.offsetWidth,a&&(o.style.transition="none"),o.classList.add("is-active"),o.removeAttribute("aria-hidden"),o.inert=!1,a&&requestAnimationFrame(()=>o.style.transition=""),this.index=n,this.step=-1,this.setStep(e,{silent:!0}),this.stage.classList.toggle("is-light",p.theme==="light"),I(o),r&&setTimeout(()=>q(r),800),p.onEnter?.(o,this),this.updateChrome(p,i===-1),this.updateHash()}setStep(t,{silent:e=!1}={}){const a=this.stepsOf(this.index)-1,n=Math.max(0,Math.min(a,t));if(n===this.step&&!e)return;this.step=n;const i=this.sections[this.index];i.dataset.step=String(n),this.slides[this.index].onStep?.(i,n,this),this.renderDots(),this.updateProgress(),this.updateNav()}updateChrome(t,e){const{chapterWrap:a,chapterNum:n,chapterName:i,counter:r,notesText:o}=this.$,p=()=>{n.textContent=b(this.index+1),i.textContent=t.chapter,a.classList.remove("is-swapping")};e?p():(a.classList.add("is-swapping"),setTimeout(p,260)),r.textContent=b(this.index+1),o.innerHTML=(t.notes||"").trim().split(/\n\s*\n/).map(l=>`<p>${l.trim()}</p>`).join(""),this.overview.querySelectorAll(".overview-item").forEach((l,d)=>l.classList.toggle("is-current",d===this.index)),this.$.progress.setAttribute("aria-valuenow",String(this.index+1))}updateProgress(){const t=this.slides.length,e=this.stepsOf(this.index),a=e>1?this.step/e:0,n=(this.index+a+1)/t*100;this.$.fill.style.width=`${Math.min(100,n)}%`}renderDots(){const t=this.stepsOf(this.index);this.$.dots.innerHTML=t>1?Array.from({length:t},(e,a)=>`<i class="${a<=this.step?"on":""}"></i>`).join(""):""}updateNav(){const t=this.index===0&&this.step===0,e=this.index===this.slides.length-1&&this.step===this.stepsOf(this.index)-1;this.$.prev.disabled=t,this.$.next.disabled=e}updateHash(){const t=`#slide-${this.index+1}`;try{location.hash!==t&&history.replaceState(null,"",t)}catch{}}indexFromHash(){const t=/^#slide-(\d+)$/.exec(location.hash);if(!t)return null;const e=parseInt(t[1],10)-1;return e>=0&&e<this.slides.length?e:null}openOverlay(t){[this.overview,this.help,this.credits].forEach(a=>a!==t&&a.classList.remove("is-open")),t.classList.add("is-open"),this.activeOverlay=t;const e=t.querySelector(".is-current")||t.querySelector("[data-close]");setTimeout(()=>e?.focus({preventScroll:!0}),50)}closeOverlay(){return this.activeOverlay?(this.activeOverlay.classList.remove("is-open"),this.activeOverlay=null,!0):!1}toggleOverlay(t){this.activeOverlay===t?this.closeOverlay():this.openOverlay(t)}toggleNotes(){this.notes.classList.toggle("is-open")}async toggleFullscreen(){try{document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()}catch{}}pokeIdle(){this.root.classList.remove("is-idle"),clearTimeout(this.idleTimer),this.idleTimer=setTimeout(()=>this.root.classList.add("is-idle"),K)}bind(){window.addEventListener("resize",()=>this.fit()),window.addEventListener("hashchange",()=>{const i=this.indexFromHash();i!=null&&i!==this.index&&this.go(i)}),document.addEventListener("keydown",i=>this.onKey(i)),document.addEventListener("mousemove",()=>this.pokeIdle(),{passive:!0}),this.root.addEventListener("click",i=>{const r=i.target.closest("[data-action],[data-goto],[data-close],[data-step-to]");if(!r)return;if(r.hasAttribute("data-close"))return void this.closeOverlay();if(r.dataset.goto!=null)return this.closeOverlay(),void this.go(parseInt(r.dataset.goto,10));if(r.dataset.stepTo!=null)return void this.setStep(parseInt(r.dataset.stepTo,10));const o=r.dataset.action;o==="next"?this.next():o==="prev"?this.prev():o==="overview"?this.toggleOverlay(this.overview):o==="credits"?this.toggleOverlay(this.credits):o==="help"&&this.toggleOverlay(this.help)}),[this.overview,this.help,this.credits].forEach(i=>i.addEventListener("click",r=>{r.target===i&&this.closeOverlay()}));let t=0,e=0,a=0;this.stage.addEventListener("touchstart",i=>{const r=i.touches[0];t=r.clientX,e=r.clientY,a=Date.now()},{passive:!0}),this.stage.addEventListener("touchend",i=>{const r=i.changedTouches[0],o=r.clientX-t,p=r.clientY-e;Date.now()-a<700&&Math.abs(o)>40&&Math.abs(o)>Math.abs(p)*1.3&&(o<0?this.next():this.prev())},{passive:!0});let n=0;window.addEventListener("wheel",i=>{if(this.activeOverlay)return;const r=Math.abs(i.deltaY)>Math.abs(i.deltaX)?i.deltaY:i.deltaX;if(Math.abs(r)<24)return;const o=Date.now();o<n||(n=o+900,r>0?this.next():this.prev())},{passive:!0})}onKey(t){if(t.metaKey||t.ctrlKey||t.altKey)return;const e=t.key;if(this.pokeIdle(),e==="Escape")return this.closeOverlay()?t.preventDefault():this.notes.classList.contains("is-open")?this.toggleNotes():this.openOverlay(this.overview);if(this.activeOverlay){(e==="o"||e==="O"||e==="щ"||e==="Щ")&&this.activeOverlay===this.overview&&this.closeOverlay(),(e==="i"||e==="I"||e==="ш"||e==="Ш")&&this.activeOverlay===this.credits&&this.closeOverlay(),(e==="h"||e==="H"||e==="?"||e==="р"||e==="Р")&&this.activeOverlay===this.help&&this.closeOverlay();return}const a=document.activeElement?.tagName==="BUTTON";switch(e){case"ArrowRight":case"ArrowDown":case"PageDown":return t.preventDefault(),this.next();case"ArrowLeft":case"ArrowUp":case"PageUp":return t.preventDefault(),this.prev();case" ":case"Spacebar":return a?void 0:(t.preventDefault(),t.shiftKey?this.prev():this.next());case"Enter":return a?void 0:(t.preventDefault(),this.next());case"Home":return t.preventDefault(),this.go(0);case"End":return t.preventDefault(),this.go(this.slides.length-1)}const i={f:"fs",F:"fs",а:"fs",А:"fs",n:"notes",N:"notes",т:"notes",Т:"notes",o:"overview",O:"overview",щ:"overview",Щ:"overview",h:"help",H:"help","?":"help",р:"help",Р:"help",i:"credits",I:"credits",ш:"credits",Ш:"credits"}[e];i==="fs"?this.toggleFullscreen():i==="notes"?this.toggleNotes():i==="overview"?this.toggleOverlay(this.overview):i==="help"?this.toggleOverlay(this.help):i==="credits"&&this.toggleOverlay(this.credits)}}const x=680,G=150;function z(){const s=window.AudioContext||window.webkitAudioContext;if(!s)return null;const t=new s,e=t.createGain();e.gain.value=.55,e.connect(t.destination);const a=t.createBuffer(1,t.sampleRate,t.sampleRate),n=a.getChannelData(0);for(let l=0;l<n.length;l++)n[l]=Math.random()*2-1;const i=(l,d=1,h=.32)=>{const m=t.createOscillator(),c=t.createGain();m.type="sine",m.frequency.setValueAtTime(170,l),m.frequency.exponentialRampToValueAtTime(38,l+h),c.gain.setValueAtTime(1e-4,l),c.gain.exponentialRampToValueAtTime(d,l+.008),c.gain.exponentialRampToValueAtTime(1e-4,l+h),m.connect(c).connect(e),m.start(l),m.stop(l+h+.05)},r=(l,d,h,m,c)=>{const y=t.createBufferSource();y.buffer=a,y.loop=!0;const $=t.createBiquadFilter();$.type="bandpass",$.Q.value=.9,$.frequency.setValueAtTime(h,l),$.frequency.exponentialRampToValueAtTime(m,l+d);const P=t.createGain();P.gain.setValueAtTime(1e-4,l),P.gain.exponentialRampToValueAtTime(c,l+Math.min(.01,d/2)),P.gain.exponentialRampToValueAtTime(1e-4,l+d),y.connect($).connect(P).connect(e),y.start(l),y.stop(l+d+.05)},o=(l,d)=>{const h=t.createBufferSource();h.buffer=a,h.loop=!0;const m=t.createBiquadFilter();m.type="bandpass",m.Q.value=1.4,m.frequency.setValueAtTime(300,l),m.frequency.exponentialRampToValueAtTime(6e3,l+d);const c=t.createGain();c.gain.setValueAtTime(1e-4,l),c.gain.exponentialRampToValueAtTime(.35,l+d),c.gain.exponentialRampToValueAtTime(1e-4,l+d+.04),h.connect(m).connect(c).connect(e),h.start(l),h.stop(l+d+.1)},p=l=>{i(l,1,1.4);const d=t.createOscillator(),h=t.createGain();d.type="triangle",d.frequency.setValueAtTime(55,l),h.gain.setValueAtTime(1e-4,l),h.gain.exponentialRampToValueAtTime(.5,l+.02),h.gain.exponentialRampToValueAtTime(1e-4,l+1.6),d.connect(h).connect(e),d.start(l),d.stop(l+1.7),r(l,.9,5e3,400,.4)};return{play(l){const d=t.currentTime+.05;l.forEach((h,m)=>{const c=d+(m*x+G)/1e3;if(h.last)return p(c);i(c,.9),r(c,h.acc?.18:.07,h.acc?2400:7e3,h.acc?900:5e3,h.acc?.45:.25),h.photo&&o(c-x/1e3+.05,x/1e3-.08)})},stop(){try{e.gain.setTargetAtTime(0,t.currentTime,.05),setTimeout(()=>t.close(),400)}catch{}}}}function Y(s,t){const e=window.matchMedia("(prefers-reduced-motion: reduce)").matches,a=/^#slide-(\d+)$/.exec(location.hash);if(e||a&&a[1]!=="1")return Promise.resolve();const n=[{big:"Курсовая",small:"МДК 01.02 · 2026"},{big:"UDP 123",small:"один порт на всю службу"},{big:"4 метки",small:"t1 · t2 · t3 · t4",acc:!0},{big:"Stratum 2",small:"сервер chrony"},{big:"0,18 мс",small:"смещение часов",acc:!0},{big:"Погнали",small:"сверим часы",photo:"images/rack-rear.jpg"},{big:"Служба времени NTP",small:"синхронизация в корпоративной сети",last:!0}];return new Promise(i=>{const r=document.createElement("div");r.className="intro",r.innerHTML='<div class="intro__gate"><i></i><b>Начать</b><small>любая клавиша или клик · со звуком</small></div>'+n.map((c,y)=>`
        <div class="intro__beat${c.acc?" intro__beat--acc":""}${c.photo?" intro__beat--photo":""}${c.last?" intro__beat--last":""}" style="--n:${y}">
          ${c.photo?`<img src="${t}${c.photo}" alt="">`:""}
          <div><b>${c.big}</b><small>${c.small}</small></div>
        </div>`).join("")+`<i class="intro__bar" style="--total:${n.length*x}ms"></i><span class="intro__skip">любая клавиша — пропустить</span>`,s.appendChild(r);let o="gate",p=null;const l=()=>{o!=="done"&&(o="done",document.removeEventListener("keydown",m,!0),p?.stop(),r.classList.add("is-out"),setTimeout(()=>r.remove(),600),i())},d=()=>{o="playing";try{p=z(),p?.play(n)}catch{p=null}r.classList.add("is-playing"),setTimeout(l,n.length*x+1100)},h=()=>o==="gate"?d():l(),m=c=>{c.metaKey||c.ctrlKey||c.altKey||(c.stopPropagation(),c.preventDefault(),h())};document.addEventListener("keydown",m,!0),r.addEventListener("click",h)})}const S=[{x:112,year:"Раздел 1",label:"Как работает NTP"},{x:560,year:"Раздел 1.5",label:"Безопасность"},{x:1010,year:"Раздел 2",label:"Проект и настройка"},{x:1460,year:"Итог",label:"Stratum 2 · 0,18 мс"}],X={id:"cover",chapter:"Обложка",title:"Внедрение протокола NTP на сетевом оборудовании",theme:"dark",notes:`
    Здравствуйте. Тема моей курсовой работы — внедрение протокола NTP на сетевом оборудовании:
    синхронизация времени в корпоративной сети.

    План доклада: как устроен NTP, чем он защищается, затем проект службы времени на базе chrony
    и Cisco IOS и проверка результата.
  `,html:({img:s})=>`
    <div class="cv-photo photo kb grain" data-r="fade" style="--i:0">${s("cover")}</div>
    <div class="cv-shade"></div>
    <svg class="cv-flow" viewBox="0 0 1920 1080" aria-hidden="true">
      <path class="draw cv-flow__faint" pathLength="1" style="--draw-delay:500ms;--draw-dur:2200ms" d="M1920 560 C 1480 580, 1300 868, 1010 868"/>
      <path class="draw cv-flow__faint" pathLength="1" style="--draw-delay:650ms;--draw-dur:2200ms" d="M1920 740 C 1720 750, 1640 868, 1460 868"/>
      <path class="draw cv-flow__main" pathLength="1" style="--draw-delay:350ms;--draw-dur:2000ms" d="M112 868 H 1808"/>
      ${S.map((t,e)=>`
        <g class="cv-station" style="--i:${e}">
          <line x1="${t.x}" y1="852" x2="${t.x}" y2="884"/>
          <circle cx="${t.x}" cy="868" r="${e===S.length-1?7:4}" class="${e===S.length-1?"is-now":""}"/>
        </g>`).join("")}
      <circle class="cv-runner" r="5">
        <animateMotion dur="7s" repeatCount="indefinite" path="M112 868 H 1808" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.45 0 0.55 1"/>
      </circle>
    </svg>
    <div class="cv-stations">
      ${S.map((t,e)=>`<div class="cv-station-label" style="left:${t.x}px;--i:${e+7}" data-r="fade"><span>${t.year}</span><b>${t.label}</b></div>`).join("")}
    </div>
    <div class="cv-text">
      <p class="eyebrow" data-r style="--i:1"><b>Курсовая работа</b> МДК 01.02 · 2026</p>
      <h1 class="cv-title">
        <span class="cv-title__a" data-r="mask-up" style="--i:2">Внедрение протокола NTP на сетевом оборудовании</span>
        <span class="cv-title__b" data-r="mask-up" style="--i:3">синхронизация времени</span>
        <span class="cv-title__b" data-r="mask-up" style="--i:4">в корпоративной сети</span>
      </h1>
    </div>
    <dl class="cv-meta" data-r="fade" style="--i:8">
      <div><dt>Выполнил</dt><dd>Г. К. Решетников, группа СА24-16</dd></div>
      <div><dt>Руководитель</dt><dd>Е. Д. Волкова</dd></div>
      <div><dt>Специальность</dt><dd>09.02.06 Сетевое и системное администрирование</dd></div>
    </dl>
  `},f=(s,t,e=10)=>`
  <div class="turn">
    <span class="turn__a" data-r="left" style="--i:${e}">${s}</span>
    <span class="turn__line" aria-hidden="true">
      <svg viewBox="0 0 100 20" preserveAspectRatio="none"><path class="draw" pathLength="1" d="M0 10 H100" style="--draw-delay:1500ms;--draw-dur:900ms"/></svg>
      <i></i>
    </span>
    <span class="turn__b" data-r="right" style="--i:${e+5}">${t}</span>
  </div>`,L=(s,t=4,e=!1)=>`
  <ul class="plist${e?" plist--num":""}">
    ${s.map(([a,n],i)=>`
      <li data-r style="--i:${i+t}">
        ${e?`<em>${String(i+1).padStart(2,"0")}</em>`:"<i></i>"}
        <div><b>${a}</b>${n?`<span>${n}</span>`:""}</div>
      </li>`).join("")}
  </ul>`,M=(s,t,e=14,a=-2)=>`
  <div class="meme" style="${t};--i:${e}" data-r="scale"><span style="--tilt:${a}deg">${s}</span></div>`,w=(s,t,e,a,n=12,i=2)=>`
  <figure class="memecard" style="${a};--i:${n}" data-r="scale">
    <div class="memecard__in" style="--tilt:${i}deg">
      ${s}
      ${t?`<b class="memecard__t">${t}</b>`:""}
      ${e?`<b class="memecard__b">${e}</b>`:""}
    </div>
  </figure>`,J=[["Журналы не сходятся","события с разных устройств встают в неправильном порядке"],["Сервисы требуют точного времени","Kerberos, сертификаты, резервное копирование, планировщики"],["Нужен один контролируемый источник","а не «каждое устройство ходит в интернет само»"]],Q={id:"goal",chapter:"Актуальность и цель",title:"Актуальность и цель работы",theme:"light",notes:`
    Время — единая координата для всех событий в сети. Если часы коммутатора, сервера и межсетевого экрана
    расходятся, записи в журналах встают в неправильном порядке, и причину сбоя искать намного дольше.

    Кроме того, Kerberos, проверка сертификатов, резервное копирование и планировщики заданий
    прямо зависят от точного времени.

    Цель работы — разработать проект внедрения NTP: единый источник времени для серверов и сетевых устройств,
    с настройкой и методикой проверки.
  `,html:({img:s})=>`
    ${w(s("facepalm"),"три устройства","три разных времени","left:540px;top:596px;width:340px;height:250px",9,-3)}
    <div class="gl-main">
      <p class="eyebrow" data-r style="--i:1"><b>Введение</b> почему это важно</p>
      <h2 class="h1" data-r style="--i:2">Актуальность и цель</h2>
      ${L(J,3)}
    </div>
    <figure class="gl-photo photo photo--archive kb grain" data-r="mask" style="--i:2">
      ${s("clock")}
      <figcaption class="caption"><b>Сеть без единого времени</b><br>журналы разных устройств не сопоставить</figcaption>
    </figure>
    <div class="gl-goal" data-r style="--i:7">
      <span class="label accent">Цель работы</span>
      <p class="gl-statement">Разработать проект внедрения NTP: единый источник времени для серверов и сетевых устройств.</p>
    </div>
    <dl class="gl-kv" data-r style="--i:8">
      <div><dt>Объект</dt><dd>Работа и администрирование корпоративной сети</dd></div>
      <div><dt>Предмет</dt><dd>Синхронизация времени оборудования по протоколу NTP</dd></div>
      <div><dt>Стенд</dt><dd>Сервер chrony, маршрутизатор и два коммутатора Cisco IOS</dd></div>
    </dl>
    ${f("Время — единая координата событий","Часы всех устройств должны совпадать")}
  `},Z=[{id:"t1",x:150,y:150,text:"отправил запрос",up:!0},{id:"t2",x:360,y:430,text:"принял запрос",up:!1},{id:"t3",x:560,y:430,text:"отправил ответ",up:!1},{id:"t4",x:770,y:150,text:"получил ответ",up:!0}],tt={id:"how",chapter:"Как работает NTP",title:"Как работает NTP: четыре метки времени",theme:"dark",notes:`
    NTP работает по модели «клиент–сервер» поверх UDP, порт 123. В каждом обмене участвуют четыре метки времени:
    t1 — клиент отправил запрос, t2 — сервер его принял, t3 — сервер отправил ответ, t4 — клиент ответ получил.

    Из этих четырёх чисел клиент считает две величины. Задержка — сколько пакет провёл в сети:
    полный оборот минус время обработки на сервере. Смещение — насколько часы клиента расходятся с часами сервера.

    Это базовая идея; полная реализация из RFC 5905 ещё фильтрует измерения и выбирает лучший источник.
  `,html:()=>`
    ${M("опоздал не я — это задержка сети","left:112px;top:800px",14,-2)}
    <div class="hw-main">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 1.2</b> NTPv4 · RFC 5905</p>
      <h2 class="h1" data-r style="--i:2">Четыре метки времени</h2>
      <p class="lead hw-lead" data-r style="--i:3">Клиент спрашивает время у сервера и по четырём меткам отделяет расхождение часов от задержки сети.</p>
      <div class="hw-formula" data-r style="--i:5">
        <span class="label">задержка</span>
        <b>d = (t4 − t1) − (t3 − t2)</b>
      </div>
      <div class="hw-formula hw-formula--acc" data-r style="--i:6">
        <span class="label accent">смещение часов</span>
        <b>θ = ((t2 − t1) + (t3 − t4)) / 2</b>
      </div>
      <ul class="hw-facts" data-r style="--i:8">
        <li><b>UDP 123</b><span>порт службы</span></li>
        <li><b>48 байт</b><span>длина пакета</span></li>
        <li><b>1900 год</b><span>начало отсчёта</span></li>
      </ul>
    </div>

    <svg class="hw-svg" viewBox="0 0 920 600" role="img" aria-label="Обмен NTP: запрос от клиента к серверу и ответ, четыре метки времени">
      <g class="tg-in" style="--t:400ms">
        <text x="0" y="120" class="hw-who">Клиент</text>
        <text x="0" y="400" class="hw-who">Сервер</text>
        <path class="hw-axis" d="M0 150 H900 M0 430 H900"/>
        <path class="hw-axis-arrow" d="M900 150 l-12 -6 v12 z M900 430 l-12 -6 v12 z"/>
        <text x="900" y="186" text-anchor="end" class="hw-cap">время →</text>
      </g>
      <path class="draw hw-pkt" pathLength="1" d="M150 150 L360 430" style="--draw-delay:1000ms;--draw-dur:900ms"/>
      <path class="draw hw-pkt" pathLength="1" d="M560 430 L770 150" style="--draw-delay:2300ms;--draw-dur:900ms"/>
      <g class="tg-in" style="--t:1500ms"><text x="235" y="310" class="hw-cap hw-cap--acc" transform="rotate(53 235 310)">запрос</text></g>
      <g class="tg-in" style="--t:2800ms"><text x="632" y="330" class="hw-cap hw-cap--acc" transform="rotate(-53 632 330)">ответ</text></g>
      <g class="tg-in" style="--t:1900ms">
        <path class="hw-span" d="M360 470 v14 H560 v-14"/>
        <text x="460" y="512" text-anchor="middle" class="hw-cap">обработка на сервере: t3 − t2</text>
      </g>
      <g class="tg-in" style="--t:3300ms">
        <path class="hw-span" d="M150 110 v-14 H770 v14"/>
        <text x="460" y="80" text-anchor="middle" class="hw-cap">полный оборот: t4 − t1</text>
      </g>
      ${Z.map((s,t)=>`
        <g class="tg-in" style="--t:${[900,1800,2200,3100][t]}ms">
          <circle cx="${s.x}" cy="${s.y}" r="9" class="hw-dot"/>
          <text x="${s.x}" y="${s.up?s.y+44:s.y-26}" text-anchor="middle" class="hw-t">${s.id}</text>
          <text x="${s.x}" y="${s.up?s.y+68:s.y-56}" text-anchor="middle" class="hw-cap">${s.text}</text>
        </g>`).join("")}
      <circle r="6" class="hw-runner"><animateMotion dur="3.2s" repeatCount="indefinite" begin="3.6s" path="M150 150 L360 430 L560 430 L770 150"/></circle>
    </svg>

    ${f("Задержку сети можно вычесть","Остаётся чистое расхождение часов",12)}
  `},et=[["0","Эталон: GPS, атомные часы","сам по сети время не раздаёт"],["1","Первичный сервер","подключён к эталону напрямую"],["2–15","Вторичные серверы","получают время по NTP уровнем выше"],["16","Не синхронизирован","раздавать время нельзя"]],g=(s,t,e,a,n,i="")=>`
  <rect x="${s}" y="${t}" width="${e}" height="64" class="st-box ${i}"/>
  <text x="${s+e/2}" y="${t+30}" text-anchor="middle" class="st-name ${i}">${a}</text>
  <text x="${s+e/2}" y="${t+50}" text-anchor="middle" class="st-sub ${i}">${n}</text>`,st={id:"stratum",chapter:"Иерархия Stratum",title:"Иерархия уровней Stratum",theme:"light",notes:`
    Stratum — это условное расстояние от эталонных часов. Эталон — уровень 0. Сервер, подключённый к нему напрямую, —
    Stratum 1. Каждый следующий, кто берёт время по NTP, получает номер на единицу больше.

    В проекте внутренний сервер chrony берёт время у внешних серверов и работает на уровне Stratum 2.
    Маршрутизатор и коммутаторы — Stratum 3, рабочие станции — Stratum 4.

    Значение 16 означает, что устройство не синхронизировано. Больший номер — не значит «плохо»,
    это просто больше ступеней до эталона.
  `,html:({img:s})=>`
    ${w(s("friendHood"),"stratum 16","рассинхрон","left:112px;top:704px;width:250px;height:226px",12,-3)}
    <div class="tg-main st-main">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 1.3</b> кто у кого берёт время</p>
      <h2 class="h1" data-r style="--i:2">Иерархия Stratum</h2>
      <ul class="tg-vlans">
        ${et.map(([t,e,a],n)=>`<li data-r style="--i:${n+3}"><b><em>${t}</em>${e}</b><span>${a}</span></li>`).join("")}
      </ul>
    </div>

    <svg class="st-svg" viewBox="0 0 1060 800" role="img" aria-label="Иерархия Stratum: эталонные часы, серверы Stratum 1, сервер chrony Stratum 2, сетевые устройства Stratum 3, станции Stratum 4">
      ${["Stratum 0","Stratum 1","Stratum 2","Stratum 3","Stratum 4"].map((t,e)=>`<g class="tg-in" style="--t:${300+e*450}ms"><text x="0" y="${72+e*170}" class="st-level">${t}</text><path class="st-rule" d="M0 ${130+e*170} H1060"/></g>`).join("")}

      <path class="draw st-line" pathLength="1" d="M560 104 L390 210" style="--draw-delay:700ms;--draw-dur:500ms"/>
      <path class="draw st-line" pathLength="1" d="M560 104 L800 210" style="--draw-delay:700ms;--draw-dur:500ms"/>
      <path class="draw st-line st-line--acc" pathLength="1" d="M390 274 L590 380" style="--draw-delay:1150ms;--draw-dur:500ms"/>
      <path class="draw st-line st-line--acc" pathLength="1" d="M800 274 L600 380" style="--draw-delay:1150ms;--draw-dur:500ms"/>
      <path class="draw st-line" pathLength="1" d="M595 444 L310 550" style="--draw-delay:1600ms;--draw-dur:500ms"/>
      <path class="draw st-line" pathLength="1" d="M595 444 L595 550" style="--draw-delay:1600ms;--draw-dur:500ms"/>
      <path class="draw st-line" pathLength="1" d="M595 444 L880 550" style="--draw-delay:1600ms;--draw-dur:500ms"/>
      <path class="draw st-line" pathLength="1" d="M595 614 L595 720" style="--draw-delay:2050ms;--draw-dur:500ms"/>

      <g class="tg-in" style="--t:500ms">${g(430,40,260,"Эталонные часы","GPS · атомные часы")}</g>
      <g class="tg-in" style="--t:950ms">${g(270,210,240,"Сервер времени","3.ru.pool.ntp.org")}${g(680,210,240,"Сервер времени","time.nist.gov")}</g>
      <g class="tg-in" style="--t:1400ms">${g(415,380,360,"NTP-сервер chrony","192.168.10.10 · внутри сети","is-acc")}</g>
      <g class="tg-in" style="--t:1850ms">${g(200,550,220,"Коммутатор SW1","192.168.10.2")}${g(485,550,220,"Маршрутизатор R1","192.168.10.1")}${g(770,550,220,"Коммутатор SW2","192.168.10.3")}</g>
      <g class="tg-in" style="--t:2300ms">${g(435,720,320,"Рабочие станции и серверы","VLAN 20 и VLAN 30")}</g>
    </svg>
  `},at=[{tag:"упрощённый",name:"SNTP",num:"10",unit:"мс",prefix:"~",model:"единицы–десятки миллисекунд",rows:["Фильтрации и выбора источника нет","Простые клиенты без требований к точности"]},{tag:"выбран",name:"NTPv4",num:"1",unit:"мс",prefix:"~",model:"доли–единицы миллисекунд в локальной сети",rows:["Развитые алгоритмы фильтрации и выбора","Серверы и сетевое оборудование"],pick:!0},{tag:"IEEE 1588",name:"PTP",num:"1",unit:"мкс",prefix:"<",model:"субмикросекунды",rows:["Нужны аппаратные метки времени на портах","АСУ ТП, биржевая торговля, телеком"]}],it={id:"compare",chapter:"NTP, SNTP, PTP",title:"Сравнение протоколов синхронизации",theme:"dark",notes:`
    Кроме NTP есть ещё два протокола. SNTP — упрощённый вариант без фильтрации измерений, точность — десятки миллисекунд.
    PTP даёт субмикросекунды, но требует коммутаторов с аппаратными метками времени.

    Для корпоративной сети нужно сопоставлять журналы и обеспечивать работу Kerberos и резервного копирования —
    для этого миллисекундной точности NTPv4 достаточно, и специальное оборудование не нужно.
  `,html:({img:s})=>`
    ${w(s("grumpy"),"PTP для офиса?","нет.","right:112px;top:112px;width:310px;height:200px",12,3)}
    <div class="frame">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 1.6</b> типичная точность</p>
      <h2 class="h1 mk-h" data-r style="--i:2">NTP, SNTP или PTP</h2>
    </div>
    <div class="mk-grid cmp-grid">
      ${at.map((t,e)=>`
        <article class="mk-col${t.pick?" is-pick":""}" data-r style="--i:${e*2+3}">
          <span class="label${t.pick?" accent":""}">${t.tag}</span>
          <h3 class="h3">${t.name}</h3>
          <div class="num-l mk-price"><small>${t.prefix}</small>${t.num}<small>${t.unit}</small></div>
          <p class="mk-model">${t.model}</p>
          ${t.rows.map(a=>`<p class="mk-row">${a}</p>`).join("")}
        </article>`).join("")}
    </div>
    ${f("PTP требует специального оборудования","Для корпоративной сети достаточно NTPv4",9)}
  `},nt=[["Подмена пакетов","клиенту подсовывают чужое время"],["«Человек посередине»","ответы сервера изменяют по дороге"],["Переполнение запросами","отказ в обслуживании службы времени"],["Ненадёжный источник","клиент синхронизируется непонятно с кем"]],rt=[["Ограничение доступа","UDP/123 только между своими клиентами и сервером"],["Несколько источников","независимые вышестоящие серверы сверяют друг друга"],["Аутентификация","симметричные ключи, если поддерживают обе стороны"],["Мониторинг","контроль синхронизации и резких скачков смещения"],["Защита управления","ограниченный доступ и журнал изменений"]],lt={id:"security",chapter:"Безопасность",title:"Уязвимости и защита службы времени",theme:"light",notes:`
    Служба времени — часть инфраструктуры доверия. Если подменить время, перестают проходить проверки сертификатов,
    а журналы теряют смысл для расследования.

    Основные угрозы: подмена пакетов, атака «человек посередине», переполнение запросами и синхронизация
    с ненадёжным источником.

    Меры защиты взяты из RFC 8633: ограничить доступ к UDP/123, использовать несколько независимых источников,
    включить аутентификацию, вести мониторинг и защитить управление.
  `,html:({img:s})=>`
    ${w(s("friendsSync"),"клиент и сервер","время совпало","left:440px;top:716px;width:280px;height:168px",13,3)}
    ${M("время уехало — сертификат: окак","right:112px;top:212px",13,2)}
    <div class="frame">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 1.5</b> RFC 8633</p>
      <h2 class="h1 mk-h" data-r style="--i:2">Угрозы и защита</h2>
    </div>
    <div class="sc-grid">
      <div class="sc-col"><span class="label" data-r style="--i:3">Что может пойти не так</span>${L(nt,4)}</div>
      <div class="sc-col sc-col--acc"><span class="label accent" data-r style="--i:5">Что делаем</span>${L(rt,6,!0)}</div>
    </div>
    ${f("Подмена времени ломает сертификаты и журналы","UDP/123 — только своим",12)}
  `},ot=[["VLAN 10","управление","192.168.10.0/24 · сервер времени, R1, SW1, SW2, АРМ"],["VLAN 20","рабочие станции","192.168.20.0/24 · шлюз .1"],["VLAN 30","серверы","192.168.30.0/24 · шлюз .1"]],u=(s,t,e,a,n,i="")=>`
  <rect x="${s}" y="${t}" width="${e}" height="66" class="tp7-box ${i}"/>
  <text x="${s+e/2}" y="${t+30}" text-anchor="middle" class="tp7-name ${i}">${a}</text>
  <text x="${s+e/2}" y="${t+51}" text-anchor="middle" class="tp7-sub ${i}">${n}</text>`,ct=["M300 413 H470","M300 413 H470 M580 380 V250","M300 413 H470 M690 413 H820","M300 413 H470 M560 446 V600"],dt={id:"topology",chapter:"Топология",title:"Топология и план адресации",theme:"dark",notes:`
    Стенд — условная корпоративная сеть: маршрутизатор R1, два управляемых коммутатора, серверы и рабочие станции.

    Сервер времени на chrony стоит в управляющем сегменте VLAN 10 и имеет статический адрес 192.168.10.10 —
    так проще настраивать клиентов и фильтры. Наружу, к внешним серверам времени, ходит только он.

    Маршрутизатор и коммутаторы синхронизируются с ним. Рабочие станции в VLAN 20 и серверы в VLAN 30
    достают до него через маршрутизатор; между сегментами разрешён UDP/123.
  `,html:()=>`
    <div class="tg-main tp7-main">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 2.3</b> учебный стенд</p>
      <h2 class="h1" data-r style="--i:2">Топология сети</h2>
      <ul class="tg-vlans tp7-vlans">
        ${ot.map(([s,t,e],a)=>`<li data-r style="--i:${a+3}"><b><em>${s}</em>${t}</b><span>${e}</span></li>`).join("")}
      </ul>
      <p class="tp7-note" data-r style="--i:7">Наружу за временем ходит только сервер chrony. Остальные спрашивают время у него.</p>
    </div>

    <svg class="tp7-svg" viewBox="0 0 1100 790" role="img" aria-label="Топология: внешние серверы времени, маршрутизатор R1, сервер chrony, коммутаторы SW1 и SW2, рабочие станции и серверы">
      <path class="draw tp7-line" pathLength="1" d="M410 106 L580 184" style="--draw-delay:600ms;--draw-dur:500ms"/>
      <path class="draw tp7-line" pathLength="1" d="M760 106 L600 184" style="--draw-delay:600ms;--draw-dur:500ms"/>
      <path class="draw tp7-line tp7-line--thick" pathLength="1" d="M580 250 V380" style="--draw-delay:1000ms;--draw-dur:500ms"/>
      <path class="draw tp7-line tp7-line--acc" pathLength="1" d="M300 413 H470" style="--draw-delay:1400ms;--draw-dur:500ms"/>
      <path class="draw tp7-line" pathLength="1" d="M690 413 H820" style="--draw-delay:1400ms;--draw-dur:500ms"/>
      <path class="draw tp7-line" pathLength="1" d="M560 446 V600" style="--draw-delay:1800ms;--draw-dur:500ms"/>
      <path class="draw tp7-line" pathLength="1" d="M890 446 L800 600" style="--draw-delay:1800ms;--draw-dur:500ms"/>
      <path class="draw tp7-line" pathLength="1" d="M950 446 L990 600" style="--draw-delay:1800ms;--draw-dur:500ms"/>
      <path class="draw tp7-line" pathLength="1" d="M520 446 L260 600" style="--draw-delay:1800ms;--draw-dur:500ms"/>

      <g class="tg-in" style="--t:400ms">
        ${u(270,40,280,"3.ru.pool.ntp.org","внешний источник","is-ext")}
        ${u(620,40,280,"time.nist.gov","внешний источник","is-ext")}
        <text x="585" y="150" text-anchor="middle" class="tp7-cap">Интернет · UDP/123</text>
      </g>
      <g class="tg-in" style="--t:800ms">${u(470,184,220,"R1","маршрутизатор · .10.1")}<text x="710" y="322" class="tp7-cap">транк: VLAN 10, 20, 30</text></g>
      <g class="tg-in" style="--t:1200ms">
        ${u(20,380,280,"NTP-сервер chrony","192.168.10.10 · Stratum 2","is-acc")}
        ${u(470,380,220,"SW1","коммутатор · .10.2")}
        ${u(820,380,220,"SW2","коммутатор · .10.3")}
        <text x="385" y="400" text-anchor="middle" class="tp7-cap tp7-cap--acc">ntp server</text>
      </g>
      <g class="tg-in" style="--t:1700ms">
        ${u(130,600,260,"АРМ администратора","VLAN 10 · .10.100")}
        ${u(440,600,240,"Серверы","VLAN 30 · 192.168.30.0/24")}
        ${u(700,600,190,"Станции","VLAN 20")}
        ${u(905,600,190,"Станции","VLAN 20")}
      </g>
      <g class="tg-in" style="--t:2300ms">
        <path class="tp7-legend tp7-legend--acc" d="M20 746 h44"/><text x="76" y="751" class="tp7-cap">время от сервера chrony к клиентам</text>
        <text x="20" y="780" class="tp7-cap">Между VLAN маршрутизирует R1; UDP/123 разрешён от клиентов к 192.168.10.10</text>
      </g>
      ${ct.map((s,t)=>`<circle r="5" class="tp7-runner"><animateMotion dur="2.6s" repeatCount="indefinite" begin="${2.6+t*.5}s" path="${s}"/></circle>`).join("")}
    </svg>
  `},ht=[["c","# вышестоящие источники времени"],["","pool 3.ru.pool.ntp.org iburst"],["","pool time.nist.gov iburst"],["c","# кому разрешено спрашивать время"],["a","allow 192.168.10.0/24"],["c","# работать и без внешнего канала"],["","local stratum 10"],["c","# журнал измерений"],["","log measurements statistics tracking"],["","makestep 1 3"]],pt=[["c","! часовой пояс и сервер времени"],["","R1(config)# clock timezone KRAS 7"],["a","R1(config)# ntp server 192.168.10.10"],["c","! аутентификация по ключу"],["","R1(config)# ntp authentication-key 1 md5 ********"],["","R1(config)# ntp trusted-key 1"],["","R1(config)# ntp authenticate"],["c","! на коммутаторах — так же"],["a","SW1(config)# ntp server 192.168.10.10"],["a","SW2(config)# ntp server 192.168.10.10"]],_=(s,t,e)=>`
  <div class="cf-term" data-r style="--i:${e}">
    <div class="cf-bar"><i></i><i></i><i></i><span>${s}</span></div>
    <pre>${t.map(([a,n],i)=>`<span class="cf-line${a==="c"?" is-c":a==="a"?" is-a":""}" style="--n:${i}">${n}</span>`).join(`
`)}</pre>
  </div>`,mt={id:"config",chapter:"Настройка",title:"Настройка chrony и Cisco IOS",theme:"dark",notes:`
    Сервер: chrony на Linux. В конфигурации — два внешних пула, директива allow, которая разрешает отвечать
    только управляющему сегменту, и local stratum 10 на случай разрыва канала с интернетом.

    Сетевые устройства: на маршрутизаторе и коммутаторах одна главная команда — ntp server с адресом
    внутреннего сервера, плюс часовой пояс. На маршрутизаторе дополнительно показана аутентификация по ключу.

    Chrony выбран вместо классического ntpd: он быстрее выходит на синхронизацию и лучше ведёт себя
    при нестабильной задержке. Команды иллюстративные, под конкретную модель синтаксис нужно сверять.
  `,html:()=>`
    ${M("sudo apt install chrony — и ты админ","right:112px;top:212px",13,2)}
    <div class="frame">
      <p class="eyebrow" data-r style="--i:1"><b>Разделы 2.4–2.5</b> сервер и клиенты</p>
      <h2 class="h1 mk-h" data-r style="--i:2">Настройка</h2>
    </div>
    <div class="cf-grid">
      ${_("/etc/chrony/chrony.conf · сервер Linux",ht,3)}
      ${_("Cisco IOS · R1, SW1, SW2",pt,5)}
    </div>
    ${f("Один сервер времени — 192.168.10.10","Все устройства смотрят на него",12)}
  `},ut=[["IP-связность","ping до 192.168.10.10 из всех VLAN"],["Сервер chrony","Stratum 2, синхронизирован"],["Источники","один выбран (*), остальные — кандидаты (+)"],["Коммутаторы и R1","Stratum 3, clock is synchronized"],["Время устройств","расхождение не больше единиц секунд"]],vt=[["$ chronyc tracking","is-c"],["Reference ID  : 3.ru.pool.ntp.org",""],["Stratum       : 2","is-a"],["Last offset   : +0.000184 seconds","is-a"],["RMS offset    : 0.000312 seconds",""],["Leap status   : Normal",""],["",""],["R1# show ntp status","is-c"],["Clock is synchronized, stratum 3,","is-a"],["reference is 192.168.10.10",""]],gt={id:"verify",chapter:"Проверка",title:"Проверка и диагностика синхронизации",theme:"light",notes:`
    Проверка идёт по плану из пяти пунктов. На сервере — команды chronyc tracking и chronyc sources:
    уровень Stratum 2, смещение — доли миллисекунды, один источник отмечен звёздочкой как выбранный.

    На оборудовании Cisco — show ntp status и show ntp associations: часы синхронизированы, Stratum 3,
    источник — наш сервер 192.168.10.10.

    Главный признак проблемы — Stratum 16: устройство время не получило. Если смещение растёт сразу у всех —
    смотрим сервер и его внешние источники; если у одного устройства — его настройки и сетевой путь.
    Значения в выводе — типовые примеры из приложения В.
  `,html:({img:s})=>`
    ${w(s("catpc"),"админ читает chronyc","stratum 2 — всё ок","left:1470px;top:706px;width:290px;height:176px",12,3)}
    ${w(s("friendJuice"),"ping прошёл","можно и сок","left:112px;top:694px;width:256px;height:192px",13,-3)}
    <div class="vf-main">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 2.6</b> план испытаний</p>
      <h2 class="h1" data-r style="--i:2">Проверка</h2>
      <ul class="vf-plan">
        ${ut.map(([t,e],a)=>`<li data-r style="--i:${a+3}"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="draw" pathLength="1" d="M4 12.5 l5 5 L20 6" style="--draw-delay:${1300+a*220}ms;--draw-dur:400ms"/></svg><div><b>${t}</b><span>${e}</span></div></li>`).join("")}
      </ul>
    </div>
    <div class="vf-nums">
      <div data-r style="--i:4"><div class="num-l"><span data-count="2" data-duration="700">2</span></div><p><b>Stratum</b> сервера chrony</p></div>
      <div data-r style="--i:5"><div class="num-l"><span data-count="3" data-duration="900">3</span></div><p><b>Stratum</b> R1, SW1, SW2</p></div>
      <div data-r style="--i:6"><div class="num-l accent"><span data-count="0.18" data-decimals="2" data-duration="1400">0,18</span><small>мс</small></div><p><b>смещение</b> часов сервера</p></div>
    </div>
    <div class="cf-term vf-term" data-r style="--i:7">
      <div class="cf-bar"><i></i><i></i><i></i><span>типовой вывод · приложение В</span></div>
      <pre>${vt.map(([t,e],a)=>`<span class="cf-line ${e}" style="--n:${a}">${t||" "}</span>`).join(`
`)}</pre>
    </div>
    ${f("Stratum меньше 16 и малое смещение","Служба времени работает",12)}
  `},yt=[["Изучен NTPv4","четыре метки времени, Stratum, фильтрация и коррекция часов"],["Определены угрозы и меры защиты","по рекомендациям RFC 8633"],["Выбраны chrony и Cisco IOS","миллисекундной точности сети достаточно"],["Спроектирована топология","сервер 192.168.10.10 в VLAN 10, три сегмента"],["Описаны настройка и проверка","конфигурации, команды диагностики, план испытаний"]],ft=[X,Q,tt,st,it,lt,dt,mt,gt,{id:"conclusion",chapter:"Заключение",title:"Заключение",theme:"dark",notes:`
    Цель работы достигнута: разработан проект внедрения NTP, который даёт серверам и сетевым устройствам
    единый источник времени.

    Изучен протокол, определены угрозы и меры защиты, обоснован выбор chrony и Cisco IOS, спроектированы
    топология и адресация, описаны настройка и методика проверки.

    Для промышленной эксплуатации рекомендую резервный сервер времени, несколько независимых источников,
    фильтрацию UDP/123, аутентификацию и постоянный мониторинг.
    Спасибо за внимание, готов ответить на вопросы.
  `,html:({img:s})=>`
    ${M("ауры нафармлено: stratum 2","right:112px;top:150px",15,2)}
    <figure class="fn-photo photo photo--archive kb grain" data-r="mask" style="--i:0">
      ${s("patch")}
      <figcaption class="caption"><b>Одна сеть — одно время</b><br>от сервера chrony до каждого порта</figcaption>
    </figure>
    <div class="fn-main">
      <p class="eyebrow" data-r style="--i:1"><b>Итоги</b> цель достигнута</p>
      <h2 class="h1" data-r style="--i:2">Заключение</h2>
      ${L(yt,3,!0)}
      <div class="fn-next" data-r style="--i:9">
        <span class="label">Для промышленной эксплуатации</span>
        <div class="chips">
          <span class="chip"><i></i>резервный сервер</span>
          <span class="chip"><i></i>аутентификация</span>
          <span class="chip"><i></i>мониторинг смещения</span>
        </div>
      </div>
      <p class="fn-final" data-r style="--i:11">Один сервер chrony — единое время для всей сети.</p>
      <p class="fn-thanks label" data-r="fade" style="--i:14"><i class="pulse"></i>Спасибо за внимание</p>
    </div>
  `}],N={cover:{file:"images/rack-rear.jpg",alt:"Задняя сторона серверной стойки с кабелями",title:"Задняя сторона стойки в дата-центре NERSC",author:"Derrick Coetzee",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Rear_of_rack_at_NERSC_data_center_-_closeup.jpg"},clock:{file:"images/cable-spaghetti.jpg",alt:"Серверная стойка с перепутанными сетевыми кабелями",title:"Стойка с «лапшой» из сетевых кабелей",author:"Kim Scarborough",license:"CC BY-SA 2.0",source:"https://commons.wikimedia.org/wiki/File:Server_Rack_with_Spaghetti-Like_Mass_of_Network_Cables.jpg",position:"50% 45%"},patch:{file:"images/patch-panel.jpg",alt:"Патч-панель Ethernet с подключёнными патч-кордами",title:"Патч-панель Ethernet",author:"Kbh3rd",license:"CC BY 4.0",source:"https://commons.wikimedia.org/wiki/File:Ethernet_Patch_Panel_20171121_130458.jpg"},grumpy:{file:"images/grumpy-cat.jpg",alt:"Недовольная кошка Grumpy Cat",title:"Grumpy Cat",author:"Gage Skidmore",license:"CC BY-SA 2.0",source:"https://commons.wikimedia.org/wiki/File:Grumpy_Cat_(14351394877).jpg",position:"50% 60%"},catpc:{file:"images/cat-computer.jpg",alt:"Кошка сидит у компьютера",title:"Кошка и компьютер",author:"dougwoods",license:"CC BY 2.0",source:"https://commons.wikimedia.org/wiki/File:Midge_cat_and_computer.jpg",position:"50% 40%"},facepalm:{file:"images/facepalm.jpg",alt:"Статуя, закрывающая лицо рукой",title:"Статуя «Каин» в саду Тюильри («фейспалм»)",author:"Alex E. Proimos",license:"CC BY 2.0",source:"https://commons.wikimedia.org/wiki/File:Paris_Tuileries_Garden_Facepalm_statue.jpg",position:"50% 25%"},friendsSync:{file:"images/friends-sync.jpg",alt:"Два парня за столиком в кафе",title:"Мем-карточка «Клиент и сервер»",author:"личное фото",license:"с согласия",source:""},friendHood:{file:"images/friend-hood.jpg",alt:"Парень в капюшоне",title:"Мем-карточка «Stratum 16»",author:"личное фото",license:"с согласия",source:""},friendJuice:{file:"images/friend-juice.jpg",alt:"Парень пьёт сок из пакета",title:"Мем-карточка «Ping прошёл»",author:"личное фото",license:"с согласия",source:""}},A=document.getElementById("app");function wt(){const s="./",t=Object.values(N).map(n=>new Promise(i=>{const r=new Image;r.onload=r.onerror=i,r.src=`${s}${n.file}`})),e=document.fonts?document.fonts.ready:Promise.resolve(),a=new Promise(n=>setTimeout(n,2500));return Promise.race([Promise.all([...t,e]),a])}wt().then(()=>Y(A,"./")).then(()=>{const s=new U(A,ft,{images:N,base:"./"}).mount();window.__deck=s})})();
