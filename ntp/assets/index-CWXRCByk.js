(function(){"use strict";const O='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',E='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',b=e=>String(e).padStart(2,"0");function v(e,t={},s=""){const a=document.createElement(e);for(const[n,i]of Object.entries(t))i===!1||i==null||a.setAttribute(n,i===!0?"":i);return s&&(a.innerHTML=s),a}function C(e){const t=v("div",{class:"chrome","aria-hidden":"false"});return t.innerHTML=`
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
        <div class="counter" aria-live="polite"><b class="cur">01</b> / ${b(e)}</div>
        <div class="nav-btns">
          <button class="nav-btn" type="button" data-action="prev" aria-label="Предыдущий слайд">${O}</button>
          <button class="nav-btn" type="button" data-action="next" aria-label="Следующий слайд">${E}</button>
        </div>
      </div>
    </div>
    <div class="progress" role="progressbar" aria-label="Прогресс презентации" aria-valuemin="1" aria-valuemax="${e}">
      <div class="progress-fill"></div>
      <div class="progress-ticks">
        ${Array.from({length:e},(s,a)=>`<button type="button" data-goto="${a}" aria-label="Слайд ${a+1}"></button>`).join("")}
      </div>
    </div>`,t}function H(e){const t=v("div",{class:"overlay",id:"overview",role:"dialog","aria-modal":"true","aria-label":"Содержание"});return t.innerHTML=`
    <div class="overlay-panel">
      <div class="overlay-head">
        <h2>Содержание</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <div class="overview-grid">
        ${e.map((s,a)=>`
          <button class="overview-item" type="button" data-goto="${a}">
            <span class="n">${b(a+1)} · ${s.chapter}</span>
            <span class="t">${s.title}</span>
          </button>`).join("")}
      </div>
    </div>`,t}function V(){const e=v("aside",{class:"notes",id:"notes","aria-label":"Заметки докладчика"});return e.innerHTML=`
    <div class="notes-inner">
      <div class="notes-label">Заметки докладчика<br><span class="muted">N — скрыть</span></div>
      <div class="notes-text"></div>
    </div>`,e}function R(){const e=[["Следующий слайд","→ · Пробел · PgDn"],["Предыдущий слайд","← · Shift+Пробел · PgUp"],["Первый / последний","Home · End"],["Содержание","O · Esc"],["Заметки докладчика","N"],["Полный экран","F"],["Источники фотографий","I"],["Эта подсказка","H · ?"]],t=v("div",{class:"overlay",id:"help",role:"dialog","aria-modal":"true","aria-label":"Управление"});return t.innerHTML=`
    <div class="overlay-panel" style="width:min(820px,100%)">
      <div class="overlay-head">
        <h2>Управление</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <div class="keys">
        ${e.map(([s,a])=>`<div><span>${s}</span><kbd>${a}</kbd></div>`).join("")}
      </div>
      <p class="muted" style="margin-top:24px;font-size:14px">На телефоне и планшете листайте свайпом влево и вправо.</p>
    </div>`,t}function D(e,t){const s=v("div",{class:"overlay",id:"credits",role:"dialog","aria-modal":"true","aria-label":"Источники фотографий"}),a=Object.values(e).map(n=>`
      <li>
        <img src="${t}${n.file}" alt="" loading="lazy">
        <div>
          <b>${n.title}</b>
          <span>${n.author} · ${n.license}</span><br>
          ${n.source?`<a href="${n.source}" target="_blank" rel="noopener">${n.source.replace("https://","")}</a>`:""}
        </div>
      </li>`).join("");return s.innerHTML=`
    <div class="overlay-panel">
      <div class="overlay-head">
        <h2>Источники фотографий</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <ul class="credits-list">${a}</ul>
    </div>`,s}const I=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches,j=e=>1-Math.pow(1-e,3);function T(e,t=0){const s=e.toFixed(t),[a,n]=s.split("."),i=a.length>4?a.replace(/\B(?=(\d{3})+(?!\d))/g," "):a;return n?`${i},${n}`:i}const L=new WeakMap;function q(e){e.querySelectorAll("[data-count]").forEach(t=>{const s=parseFloat(t.dataset.count),a=parseFloat(t.dataset.from??"0"),n=parseInt(t.dataset.decimals??"0",10),i=parseInt(t.dataset.duration??"1600",10),l=parseInt(t.dataset.delay??"350",10);if(cancelAnimationFrame(L.get(t)),I()){t.textContent=T(s,n);return}t.textContent=T(a,n);const c=performance.now()+l,p=r=>{const d=Math.min(1,Math.max(0,(r-c)/i));t.textContent=T(a+(s-a)*j(d),n),d<1&&L.set(t,requestAnimationFrame(p))};L.set(t,requestAnimationFrame(p))})}function F(e){e.querySelectorAll("[data-count]").forEach(t=>{cancelAnimationFrame(L.get(t)),t.textContent=T(parseFloat(t.dataset.count),parseInt(t.dataset.decimals??"0",10))})}const W=1920,B=1080,U=2600;class K{constructor(t,s,{images:a={},base:n="./"}={}){this.root=t,this.slides=s,this.images=a,this.base=n,this.index=-1,this.step=0,this.locked=!1}mount(){const{root:t,slides:s}=this;this.stage=v("div",{class:"stage","data-dir":"fwd"}),this.track=v("div",{class:"slides"}),this.sections=s.map((n,i)=>{const l=v("section",{class:`slide slide--${n.id}`,"data-theme":n.theme||"dark","data-index":i,"aria-roledescription":"слайд","aria-label":`${i+1} из ${s.length}: ${n.title}`});return l.innerHTML=n.html({base:this.base,img:this.img.bind(this)}),this.track.appendChild(l),l}),this.chrome=C(s.length),this.stage.append(this.track,this.chrome),this.overview=H(s),this.notes=V(),this.help=R(),this.credits=D(this.images,this.base),this.toast=v("div",{class:"toast",role:"status"},"→ или Пробел — дальше · H — управление"),t.append(this.stage,this.notes,this.overview,this.help,this.credits,this.toast),this.$={chapterWrap:this.chrome.querySelector(".chrome-chapter"),chapterNum:this.chrome.querySelector(".chrome-chapter .num"),chapterName:this.chrome.querySelector(".chrome-chapter .name"),counter:this.chrome.querySelector(".counter .cur"),fill:this.chrome.querySelector(".progress-fill"),progress:this.chrome.querySelector(".progress"),dots:this.chrome.querySelector(".step-dots"),prev:this.chrome.querySelector('[data-action="prev"]'),next:this.chrome.querySelector('[data-action="next"]'),notesText:this.notes.querySelector(".notes-text")},this.bind(),this.fit();const a=this.indexFromHash();return this.go(a??0,{instant:!0}),setTimeout(()=>this.toast.classList.add("is-show"),900),setTimeout(()=>this.toast.classList.remove("is-show"),5200),this.pokeIdle(),this}img(t,{alt:s,className:a="",position:n}={}){const i=this.images[t];if(!i)throw new Error(`Unknown image: ${t}`);const l=n||i.position,c=l?` style="object-position:${l}"`:"",p=a?` class="${a}"`:"";return`<img src="${this.base}${i.file}" alt="${s??i.alt}"${p} decoding="async" draggable="false"${c}>`}fit(){const t=this.root.clientWidth,s=this.root.clientHeight,a=Math.min(t/W,s/B);this.stage.style.setProperty("--scale",String(a))}stepsOf(t){return Math.max(1,this.slides[t]?.steps||1)}next(){if(this.step<this.stepsOf(this.index)-1)return this.setStep(this.step+1);this.index<this.slides.length-1&&this.go(this.index+1)}prev(){if(this.step>0)return this.setStep(this.step-1);this.index>0&&this.go(this.index-1,{step:this.stepsOf(this.index-1)-1})}go(t,{step:s=0,instant:a=!1}={}){const n=Math.max(0,Math.min(this.slides.length-1,t));if(n===this.index){this.setStep(s);return}const i=this.index,l=this.sections[i],c=this.sections[n],p=this.slides[n];this.stage.dataset.dir=n>i?"fwd":"back",l&&(l.classList.remove("is-active"),l.classList.add("is-leaving"),clearTimeout(l._leaveTimer),l._leaveTimer=setTimeout(()=>l.classList.remove("is-leaving"),750),l.setAttribute("aria-hidden","true"),l.inert=!0),c.classList.remove("is-leaving"),c.offsetWidth,a&&(c.style.transition="none"),c.classList.add("is-active"),c.removeAttribute("aria-hidden"),c.inert=!1,a&&requestAnimationFrame(()=>c.style.transition=""),this.index=n,this.step=-1,this.setStep(s,{silent:!0}),this.stage.classList.toggle("is-light",p.theme==="light"),q(c),l&&setTimeout(()=>F(l),800),p.onEnter?.(c,this),this.updateChrome(p,i===-1),this.updateHash()}setStep(t,{silent:s=!1}={}){const a=this.stepsOf(this.index)-1,n=Math.max(0,Math.min(a,t));if(n===this.step&&!s)return;this.step=n;const i=this.sections[this.index];i.dataset.step=String(n),this.slides[this.index].onStep?.(i,n,this),this.renderDots(),this.updateProgress(),this.updateNav()}updateChrome(t,s){const{chapterWrap:a,chapterNum:n,chapterName:i,counter:l,notesText:c}=this.$,p=()=>{n.textContent=b(this.index+1),i.textContent=t.chapter,a.classList.remove("is-swapping")};s?p():(a.classList.add("is-swapping"),setTimeout(p,260)),l.textContent=b(this.index+1),c.innerHTML=(t.notes||"").trim().split(/\n\s*\n/).map(r=>`<p>${r.trim()}</p>`).join(""),this.overview.querySelectorAll(".overview-item").forEach((r,d)=>r.classList.toggle("is-current",d===this.index)),this.$.progress.setAttribute("aria-valuenow",String(this.index+1))}updateProgress(){const t=this.slides.length,s=this.stepsOf(this.index),a=s>1?this.step/s:0,n=(this.index+a+1)/t*100;this.$.fill.style.width=`${Math.min(100,n)}%`}renderDots(){const t=this.stepsOf(this.index);this.$.dots.innerHTML=t>1?Array.from({length:t},(s,a)=>`<i class="${a<=this.step?"on":""}"></i>`).join(""):""}updateNav(){const t=this.index===0&&this.step===0,s=this.index===this.slides.length-1&&this.step===this.stepsOf(this.index)-1;this.$.prev.disabled=t,this.$.next.disabled=s}updateHash(){const t=`#slide-${this.index+1}`;try{location.hash!==t&&history.replaceState(null,"",t)}catch{}}indexFromHash(){const t=/^#slide-(\d+)$/.exec(location.hash);if(!t)return null;const s=parseInt(t[1],10)-1;return s>=0&&s<this.slides.length?s:null}openOverlay(t){[this.overview,this.help,this.credits].forEach(a=>a!==t&&a.classList.remove("is-open")),t.classList.add("is-open"),this.activeOverlay=t;const s=t.querySelector(".is-current")||t.querySelector("[data-close]");setTimeout(()=>s?.focus({preventScroll:!0}),50)}closeOverlay(){return this.activeOverlay?(this.activeOverlay.classList.remove("is-open"),this.activeOverlay=null,!0):!1}toggleOverlay(t){this.activeOverlay===t?this.closeOverlay():this.openOverlay(t)}toggleNotes(){this.notes.classList.toggle("is-open")}async toggleFullscreen(){try{document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()}catch{}}pokeIdle(){this.root.classList.remove("is-idle"),clearTimeout(this.idleTimer),this.idleTimer=setTimeout(()=>this.root.classList.add("is-idle"),U)}bind(){window.addEventListener("resize",()=>this.fit()),window.addEventListener("hashchange",()=>{const i=this.indexFromHash();i!=null&&i!==this.index&&this.go(i)}),document.addEventListener("keydown",i=>this.onKey(i)),document.addEventListener("mousemove",()=>this.pokeIdle(),{passive:!0}),this.root.addEventListener("click",i=>{const l=i.target.closest("[data-action],[data-goto],[data-close],[data-step-to]");if(!l)return;if(l.hasAttribute("data-close"))return void this.closeOverlay();if(l.dataset.goto!=null)return this.closeOverlay(),void this.go(parseInt(l.dataset.goto,10));if(l.dataset.stepTo!=null)return void this.setStep(parseInt(l.dataset.stepTo,10));const c=l.dataset.action;c==="next"?this.next():c==="prev"?this.prev():c==="overview"?this.toggleOverlay(this.overview):c==="credits"?this.toggleOverlay(this.credits):c==="help"&&this.toggleOverlay(this.help)}),[this.overview,this.help,this.credits].forEach(i=>i.addEventListener("click",l=>{l.target===i&&this.closeOverlay()}));let t=0,s=0,a=0;this.stage.addEventListener("touchstart",i=>{const l=i.touches[0];t=l.clientX,s=l.clientY,a=Date.now()},{passive:!0}),this.stage.addEventListener("touchend",i=>{const l=i.changedTouches[0],c=l.clientX-t,p=l.clientY-s;Date.now()-a<700&&Math.abs(c)>40&&Math.abs(c)>Math.abs(p)*1.3&&(c<0?this.next():this.prev())},{passive:!0});let n=0;window.addEventListener("wheel",i=>{if(this.activeOverlay)return;const l=Math.abs(i.deltaY)>Math.abs(i.deltaX)?i.deltaY:i.deltaX;if(Math.abs(l)<24)return;const c=Date.now();c<n||(n=c+900,l>0?this.next():this.prev())},{passive:!0})}onKey(t){if(t.metaKey||t.ctrlKey||t.altKey)return;const s=t.key;if(this.pokeIdle(),s==="Escape")return this.closeOverlay()?t.preventDefault():this.notes.classList.contains("is-open")?this.toggleNotes():this.openOverlay(this.overview);if(this.activeOverlay){(s==="o"||s==="O"||s==="щ"||s==="Щ")&&this.activeOverlay===this.overview&&this.closeOverlay(),(s==="i"||s==="I"||s==="ш"||s==="Ш")&&this.activeOverlay===this.credits&&this.closeOverlay(),(s==="h"||s==="H"||s==="?"||s==="р"||s==="Р")&&this.activeOverlay===this.help&&this.closeOverlay();return}const a=document.activeElement?.tagName==="BUTTON";switch(s){case"ArrowRight":case"ArrowDown":case"PageDown":return t.preventDefault(),this.next();case"ArrowLeft":case"ArrowUp":case"PageUp":return t.preventDefault(),this.prev();case" ":case"Spacebar":return a?void 0:(t.preventDefault(),t.shiftKey?this.prev():this.next());case"Enter":return a?void 0:(t.preventDefault(),this.next());case"Home":return t.preventDefault(),this.go(0);case"End":return t.preventDefault(),this.go(this.slides.length-1)}const i={f:"fs",F:"fs",а:"fs",А:"fs",n:"notes",N:"notes",т:"notes",Т:"notes",o:"overview",O:"overview",щ:"overview",Щ:"overview",h:"help",H:"help","?":"help",р:"help",Р:"help",i:"credits",I:"credits",ш:"credits",Ш:"credits"}[s];i==="fs"?this.toggleFullscreen():i==="notes"?this.toggleNotes():i==="overview"?this.toggleOverlay(this.overview):i==="help"?this.toggleOverlay(this.help):i==="credits"&&this.toggleOverlay(this.credits)}}const x=680,G=150;function z(){const e=window.AudioContext||window.webkitAudioContext;if(!e)return null;const t=new e,s=t.createGain();s.gain.value=.55,s.connect(t.destination);const a=t.createBuffer(1,t.sampleRate,t.sampleRate),n=a.getChannelData(0);for(let r=0;r<n.length;r++)n[r]=Math.random()*2-1;const i=(r,d=1,h=.32)=>{const m=t.createOscillator(),o=t.createGain();m.type="sine",m.frequency.setValueAtTime(170,r),m.frequency.exponentialRampToValueAtTime(38,r+h),o.gain.setValueAtTime(1e-4,r),o.gain.exponentialRampToValueAtTime(d,r+.008),o.gain.exponentialRampToValueAtTime(1e-4,r+h),m.connect(o).connect(s),m.start(r),m.stop(r+h+.05)},l=(r,d,h,m,o)=>{const y=t.createBufferSource();y.buffer=a,y.loop=!0;const w=t.createBiquadFilter();w.type="bandpass",w.Q.value=.9,w.frequency.setValueAtTime(h,r),w.frequency.exponentialRampToValueAtTime(m,r+d);const k=t.createGain();k.gain.setValueAtTime(1e-4,r),k.gain.exponentialRampToValueAtTime(o,r+Math.min(.01,d/2)),k.gain.exponentialRampToValueAtTime(1e-4,r+d),y.connect(w).connect(k).connect(s),y.start(r),y.stop(r+d+.05)},c=(r,d)=>{const h=t.createBufferSource();h.buffer=a,h.loop=!0;const m=t.createBiquadFilter();m.type="bandpass",m.Q.value=1.4,m.frequency.setValueAtTime(300,r),m.frequency.exponentialRampToValueAtTime(6e3,r+d);const o=t.createGain();o.gain.setValueAtTime(1e-4,r),o.gain.exponentialRampToValueAtTime(.35,r+d),o.gain.exponentialRampToValueAtTime(1e-4,r+d+.04),h.connect(m).connect(o).connect(s),h.start(r),h.stop(r+d+.1)},p=r=>{i(r,1,1.4);const d=t.createOscillator(),h=t.createGain();d.type="triangle",d.frequency.setValueAtTime(55,r),h.gain.setValueAtTime(1e-4,r),h.gain.exponentialRampToValueAtTime(.5,r+.02),h.gain.exponentialRampToValueAtTime(1e-4,r+1.6),d.connect(h).connect(s),d.start(r),d.stop(r+1.7),l(r,.9,5e3,400,.4)};return{play(r){const d=t.currentTime+.05;r.forEach((h,m)=>{const o=d+(m*x+G)/1e3;if(h.last)return p(o);i(o,.9),l(o,h.acc?.18:.07,h.acc?2400:7e3,h.acc?900:5e3,h.acc?.45:.25),h.photo&&c(o-x/1e3+.05,x/1e3-.08)})},stop(){try{s.gain.setTargetAtTime(0,t.currentTime,.05),setTimeout(()=>t.close(),400)}catch{}}}}function X(e,t){const s=window.matchMedia("(prefers-reduced-motion: reduce)").matches,a=/^#slide-(\d+)$/.exec(location.hash);if(s||a&&a[1]!=="1")return Promise.resolve();const n=[{big:"Курсовая",small:"МДК 01.02 · 2026"},{big:"UDP 123",small:"один порт на всю службу"},{big:"4 метки",small:"t1 · t2 · t3 · t4",acc:!0},{big:"Stratum 2",small:"сервер chrony"},{big:"0,18 мс",small:"смещение часов",acc:!0},{big:"Сверим часы",small:"все устройства · одно время"},{big:"Служба времени NTP",small:"синхронизация в корпоративной сети",last:!0}];return new Promise(i=>{const l=document.createElement("div");l.className="intro",l.innerHTML='<div class="intro__gate"><i></i><b>Начать</b><small>любая клавиша или клик · со звуком</small></div>'+n.map((o,y)=>`
        <div class="intro__beat${o.acc?" intro__beat--acc":""}${o.photo?" intro__beat--photo":""}${o.last?" intro__beat--last":""}" style="--n:${y}">
          ${o.photo?`<img src="${t}${o.photo}" alt="">`:""}
          <div><b>${o.big}</b><small>${o.small}</small></div>
        </div>`).join("")+`<i class="intro__bar" style="--total:${n.length*x}ms"></i><span class="intro__skip">любая клавиша — пропустить</span>`,e.appendChild(l);let c="gate",p=null;const r=()=>{c!=="done"&&(c="done",document.removeEventListener("keydown",m,!0),p?.stop(),l.classList.add("is-out"),setTimeout(()=>l.remove(),600),i())},d=()=>{c="playing";try{p=z(),p?.play(n)}catch{p=null}l.classList.add("is-playing"),setTimeout(r,n.length*x+1100)},h=()=>c==="gate"?d():r(),m=o=>{o.metaKey||o.ctrlKey||o.altKey||(o.stopPropagation(),o.preventDefault(),h())};document.addEventListener("keydown",m,!0),l.addEventListener("click",h)})}const f=(e,t,s=10)=>`
  <div class="turn">
    <span class="turn__a" data-r="left" style="--i:${s}">${e}</span>
    <span class="turn__line" aria-hidden="true">
      <svg viewBox="0 0 100 20" preserveAspectRatio="none"><path class="draw" pathLength="1" d="M0 10 H100" style="--draw-delay:1500ms;--draw-dur:900ms"/></svg>
      <i></i>
    </span>
    <span class="turn__b" data-r="right" style="--i:${s+5}">${t}</span>
  </div>`,S=(e,t=4,s=!1)=>`
  <ul class="plist${s?" plist--num":""}">
    ${e.map(([a,n],i)=>`
      <li data-r style="--i:${i+t}">
        ${s?`<em>${String(i+1).padStart(2,"0")}</em>`:"<i></i>"}
        <div><b>${a}</b>${n?`<span>${n}</span>`:""}</div>
      </li>`).join("")}
  </ul>`,$=(e,t,s=14,a=-2)=>`
  <div class="meme" style="${t};--i:${s}" data-r="scale"><span style="--tilt:${a}deg">${e}</span></div>`,M=(e,t,s,a,n=12,i=2)=>`
  <figure class="memecard" style="${a};--i:${n}" data-r="scale">
    <div class="memecard__in" style="--tilt:${i}deg">
      ${e}
      ${t?`<b class="memecard__t">${t}</b>`:""}
      ${s?`<b class="memecard__b">${s}</b>`:""}
    </div>
  </figure>`,P=(e="")=>`
  <svg class="dial ${e}" viewBox="-320 -320 640 640" aria-hidden="true">
    <circle r="300" class="dial__rim"/>
    <circle r="236" class="dial__ring"/>
    ${Array.from({length:60},(t,s)=>`<line class="dial__tick${s%5===0?" is-big":""}" x1="0" y1="${s%5===0?-262:-276}" x2="0" y2="-290" transform="rotate(${s*6})"/>`).join("")}
    ${[12,3,6,9].map((t,s)=>`<text class="dial__num" x="${[0,206,0,-206][s]}" y="${[-194,12,218,12][s]}" text-anchor="middle">${t}</text>`).join("")}
    <line class="dial__hand dial__hand--h" x1="0" y1="18" x2="0" y2="-140" transform="rotate(305)"/>
    <line class="dial__hand dial__hand--m" x1="0" y1="24" x2="0" y2="-214" transform="rotate(60)"/>
    <g class="dial__sec"><line x1="0" y1="44" x2="0" y2="-248"/><circle r="9"/></g>
  </svg>`,Y={id:"cover",chapter:"Обложка",title:"Внедрение протокола NTP на сетевом оборудовании",theme:"dark",notes:`
    Здравствуйте. Тема моей курсовой работы — внедрение протокола NTP на сетевом оборудовании:
    синхронизация времени в корпоративной сети.

    План доклада: как устроен NTP, чем он защищается, затем проект службы времени на базе chrony
    и Cisco IOS и проверка результата.
  `,html:()=>`
    <div class="cv2-dial" data-r="scale" style="--i:1">
      ${P()}
      <span class="cv2-utc">UTC · stratum 2 · offset 0,18 мс</span>
    </div>
    <div class="cv2-text">
      <p class="eyebrow" data-r style="--i:1"><b>Курсовая работа</b> МДК 01.02 · 2026</p>
      <h1 class="cv2-title">
        <span data-r="mask-up" style="--i:2">Синхронизация</span>
        <span data-r="mask-up" style="--i:3">времени</span>
        <span class="cv2-title__acc" data-r="mask-up" style="--i:4">по NTP</span>
      </h1>
      <p class="cv2-sub" data-r style="--i:6">Внедрение протокола NTP на сетевом оборудовании: синхронизация времени в корпоративной сети</p>
    </div>
    <dl class="cv2-meta">
      <div data-r style="--i:8"><dt>Выполнил</dt><dd>Г. К. Решетников</dd><dd class="cv2-dim">группа СА24-16</dd></div>
      <div data-r style="--i:9"><dt>Руководитель</dt><dd>Е. Д. Волкова</dd><dd class="cv2-dim">ПМ.01 · МДК 01.02</dd></div>
      <div data-r style="--i:10"><dt>Специальность</dt><dd>09.02.06</dd><dd class="cv2-dim">Сетевое и системное администрирование</dd></div>
    </dl>
  `},J=[["Журналы не сходятся","события с разных устройств встают в неправильном порядке"],["Сервисы требуют точного времени","Kerberos, сертификаты, резервное копирование, планировщики"],["Нужен один контролируемый источник","а не «каждое устройство ходит в интернет само»"]],Q={id:"goal",chapter:"Актуальность и цель",title:"Актуальность и цель работы",theme:"light",notes:`
    Время — единая координата для всех событий в сети. Если часы коммутатора, сервера и межсетевого экрана
    расходятся, записи в журналах встают в неправильном порядке, и причину сбоя искать намного дольше.

    Кроме того, Kerberos, проверка сертификатов, резервное копирование и планировщики заданий
    прямо зависят от точного времени.

    Цель работы — разработать проект внедрения NTP: единый источник времени для серверов и сетевых устройств,
    с настройкой и методикой проверки.
  `,html:()=>`
    <div class="gl-main">
      <p class="eyebrow" data-r style="--i:1"><b>Введение</b> почему это важно</p>
      <h2 class="h1" data-r style="--i:2">Актуальность и цель</h2>
      ${S(J,3)}
    </div>
    <div class="gl-clocks" data-r style="--i:2">
      <span class="label">одно событие · три журнала</span>
      <div class="gl-clockrow">
        <div><b>10:02:17</b><span>коммутатор SW1</span></div>
        <div class="is-off"><b>10:02:41</b><span>сервер · +24 с</span></div>
        <div class="is-off"><b>10:01:58</b><span>межсетевой экран · −19 с</span></div>
      </div>
    </div>

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
    ${$("опоздал не я — это задержка сети","left:112px;top:800px",14,-2)}
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
      ${Z.map((e,t)=>`
        <g class="tg-in" style="--t:${[900,1800,2200,3100][t]}ms">
          <circle cx="${e.x}" cy="${e.y}" r="9" class="hw-dot"/>
          <text x="${e.x}" y="${e.up?e.y+44:e.y-26}" text-anchor="middle" class="hw-t">${e.id}</text>
          <text x="${e.x}" y="${e.up?e.y+68:e.y-56}" text-anchor="middle" class="hw-cap">${e.text}</text>
        </g>`).join("")}
      <circle r="6" class="hw-runner"><animateMotion dur="3.2s" repeatCount="indefinite" begin="3.6s" path="M150 150 L360 430 L560 430 L770 150"/></circle>
    </svg>

    ${f("Задержку сети можно вычесть","Остаётся чистое расхождение часов",12)}
  `},st=[["0","Эталон: GPS, атомные часы","сам по сети время не раздаёт"],["1","Первичный сервер","подключён к эталону напрямую"],["2–15","Вторичные серверы","получают время по NTP уровнем выше"],["16","Не синхронизирован","раздавать время нельзя"]],g=(e,t,s,a,n,i="")=>`
  <rect x="${e}" y="${t}" width="${s}" height="64" class="st-box ${i}"/>
  <text x="${e+s/2}" y="${t+30}" text-anchor="middle" class="st-name ${i}">${a}</text>
  <text x="${e+s/2}" y="${t+50}" text-anchor="middle" class="st-sub ${i}">${n}</text>`,et={id:"stratum",chapter:"Иерархия Stratum",title:"Иерархия уровней Stratum",theme:"light",notes:`
    Stratum — это условное расстояние от эталонных часов. Эталон — уровень 0. Сервер, подключённый к нему напрямую, —
    Stratum 1. Каждый следующий, кто берёт время по NTP, получает номер на единицу больше.

    В проекте внутренний сервер chrony берёт время у внешних серверов и работает на уровне Stratum 2.
    Маршрутизатор и коммутаторы — Stratum 3, рабочие станции — Stratum 4.

    Значение 16 означает, что устройство не синхронизировано. Больший номер — не значит «плохо»,
    это просто больше ступеней до эталона.
  `,html:({img:e})=>`
    ${M(e("friendHood"),"stratum 16","рассинхрон","left:112px;top:704px;width:250px;height:226px",12,-3)}
    <div class="tg-main st-main">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 1.3</b> кто у кого берёт время</p>
      <h2 class="h1" data-r style="--i:2">Иерархия Stratum</h2>
      <ul class="tg-vlans">
        ${st.map(([t,s,a],n)=>`<li data-r style="--i:${n+3}"><b><em>${t}</em>${s}</b><span>${a}</span></li>`).join("")}
      </ul>
    </div>

    <svg class="st-svg" viewBox="0 0 1060 800" role="img" aria-label="Иерархия Stratum: эталонные часы, серверы Stratum 1, сервер chrony Stratum 2, сетевые устройства Stratum 3, станции Stratum 4">
      ${["Stratum 0","Stratum 1","Stratum 2","Stratum 3","Stratum 4"].map((t,s)=>`<g class="tg-in" style="--t:${300+s*450}ms"><text x="0" y="${72+s*170}" class="st-level">${t}</text><path class="st-rule" d="M0 ${130+s*170} H1060"/></g>`).join("")}

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
  `,html:()=>`
    ${$("PTP для офиса — оверкилл","right:112px;top:212px",13,2)}
    <div class="frame">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 1.6</b> типичная точность</p>
      <h2 class="h1 mk-h" data-r style="--i:2">NTP, SNTP или PTP</h2>
    </div>
    <div class="mk-grid cmp-grid">
      ${at.map((e,t)=>`
        <article class="mk-col${e.pick?" is-pick":""}" data-r style="--i:${t*2+3}">
          <span class="label${e.pick?" accent":""}">${e.tag}</span>
          <h3 class="h3">${e.name}</h3>
          <div class="num-l mk-price"><small>${e.prefix}</small>${e.num}<small>${e.unit}</small></div>
          <p class="mk-model">${e.model}</p>
          ${e.rows.map(s=>`<p class="mk-row">${s}</p>`).join("")}
        </article>`).join("")}
    </div>
    ${f("PTP требует специального оборудования","Для корпоративной сети достаточно NTPv4",9)}
  `},nt=[["Подмена пакетов","клиенту подсовывают чужое время"],["«Человек посередине»","ответы сервера изменяют по дороге"],["Переполнение запросами","отказ в обслуживании службы времени"],["Ненадёжный источник","клиент синхронизируется непонятно с кем"]],lt=[["Ограничение доступа","UDP/123 только между своими клиентами и сервером"],["Несколько источников","независимые вышестоящие серверы сверяют друг друга"],["Аутентификация","симметричные ключи, если поддерживают обе стороны"],["Мониторинг","контроль синхронизации и резких скачков смещения"],["Защита управления","ограниченный доступ и журнал изменений"]],rt={id:"security",chapter:"Безопасность",title:"Уязвимости и защита службы времени",theme:"light",notes:`
    Служба времени — часть инфраструктуры доверия. Если подменить время, перестают проходить проверки сертификатов,
    а журналы теряют смысл для расследования.

    Основные угрозы: подмена пакетов, атака «человек посередине», переполнение запросами и синхронизация
    с ненадёжным источником.

    Меры защиты взяты из RFC 8633: ограничить доступ к UDP/123, использовать несколько независимых источников,
    включить аутентификацию, вести мониторинг и защитить управление.
  `,html:({img:e})=>`
    ${M(e("friendsSync"),"клиент и сервер","время совпало","left:900px;top:140px;width:270px;height:164px",13,3)}
    ${$("время уехало — сертификат: окак","right:112px;top:212px",13,2)}
    <div class="frame">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 1.5</b> RFC 8633</p>
      <h2 class="h1 mk-h" data-r style="--i:2">Угрозы и защита</h2>
    </div>
    <div class="sc-grid">
      <div class="sc-col"><span class="label" data-r style="--i:3">Что может пойти не так</span>${S(nt,4)}</div>
      <div class="sc-col sc-col--acc"><span class="label accent" data-r style="--i:5">Что делаем</span>${S(lt,6,!0)}</div>
    </div>
    ${f("Подмена времени ломает сертификаты и журналы","UDP/123 — только своим",12)}
  `},ct=[["VLAN 10","управление","192.168.10.0/24 · сервер времени, R1, SW1, SW2, АРМ"],["VLAN 20","рабочие станции","192.168.20.0/24 · шлюз .1"],["VLAN 30","серверы","192.168.30.0/24 · шлюз .1"]],u=(e,t,s,a,n,i="")=>`
  <rect x="${e}" y="${t}" width="${s}" height="66" class="tp7-box ${i}"/>
  <text x="${e+s/2}" y="${t+30}" text-anchor="middle" class="tp7-name ${i}">${a}</text>
  <text x="${e+s/2}" y="${t+51}" text-anchor="middle" class="tp7-sub ${i}">${n}</text>`,ot=["M300 413 H470","M300 413 H470 M580 380 V250","M300 413 H470 M690 413 H820","M300 413 H470 M560 446 V600"],dt={id:"topology",chapter:"Топология",title:"Топология и план адресации",theme:"dark",notes:`
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
        ${ct.map(([e,t,s],a)=>`<li data-r style="--i:${a+3}"><b><em>${e}</em>${t}</b><span>${s}</span></li>`).join("")}
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
      ${ot.map((e,t)=>`<circle r="5" class="tp7-runner"><animateMotion dur="2.6s" repeatCount="indefinite" begin="${2.6+t*.5}s" path="${e}"/></circle>`).join("")}
    </svg>
  `},ht=[["c","# вышестоящие источники времени"],["","pool 3.ru.pool.ntp.org iburst"],["","pool time.nist.gov iburst"],["c","# кому разрешено спрашивать время"],["a","allow 192.168.10.0/24"],["c","# работать и без внешнего канала"],["","local stratum 10"],["c","# журнал измерений"],["","log measurements statistics tracking"],["","makestep 1 3"]],pt=[["c","! часовой пояс и сервер времени"],["","R1(config)# clock timezone KRAS 7"],["a","R1(config)# ntp server 192.168.10.10"],["c","! аутентификация по ключу"],["","R1(config)# ntp authentication-key 1 md5 ********"],["","R1(config)# ntp trusted-key 1"],["","R1(config)# ntp authenticate"],["c","! на коммутаторах — так же"],["a","SW1(config)# ntp server 192.168.10.10"],["a","SW2(config)# ntp server 192.168.10.10"]],N=(e,t,s)=>`
  <div class="cf-term" data-r style="--i:${s}">
    <div class="cf-bar"><i></i><i></i><i></i><span>${e}</span></div>
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
    ${$("sudo apt install chrony — и ты админ","right:112px;top:212px",13,2)}
    <div class="frame">
      <p class="eyebrow" data-r style="--i:1"><b>Разделы 2.4–2.5</b> сервер и клиенты</p>
      <h2 class="h1 mk-h" data-r style="--i:2">Настройка</h2>
    </div>
    <div class="cf-grid">
      ${N("/etc/chrony/chrony.conf · сервер Linux",ht,3)}
      ${N("Cisco IOS · R1, SW1, SW2",pt,5)}
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
  `,html:({img:e})=>`
    ${M(e("friendJuice"),"ping прошёл","можно и сок","left:600px;top:124px;width:250px;height:152px",13,-3)}
    <div class="vf-main">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 2.6</b> план испытаний</p>
      <h2 class="h1" data-r style="--i:2">Проверка</h2>
      <ul class="vf-plan">
        ${ut.map(([t,s],a)=>`<li data-r style="--i:${a+3}"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="draw" pathLength="1" d="M4 12.5 l5 5 L20 6" style="--draw-delay:${1300+a*220}ms;--draw-dur:400ms"/></svg><div><b>${t}</b><span>${s}</span></div></li>`).join("")}
      </ul>
    </div>
    <div class="vf-nums">
      <div data-r style="--i:4"><div class="num-l"><span data-count="2" data-duration="700">2</span></div><p><b>Stratum</b> сервера chrony</p></div>
      <div data-r style="--i:5"><div class="num-l"><span data-count="3" data-duration="900">3</span></div><p><b>Stratum</b> R1, SW1, SW2</p></div>
      <div data-r style="--i:6"><div class="num-l accent"><span data-count="0.18" data-decimals="2" data-duration="1400">0,18</span><small>мс</small></div><p><b>смещение</b> часов сервера</p></div>
    </div>
    <div class="cf-term vf-term" data-r style="--i:7">
      <div class="cf-bar"><i></i><i></i><i></i><span>типовой вывод · приложение В</span></div>
      <pre>${vt.map(([t,s],a)=>`<span class="cf-line ${s}" style="--n:${a}">${t||" "}</span>`).join(`
`)}</pre>
    </div>
    ${f("Stratum меньше 16 и малое смещение","Служба времени работает",12)}
  `},yt=[["Изучен NTPv4","четыре метки времени, Stratum, фильтрация и коррекция часов"],["Определены угрозы и меры защиты","по рекомендациям RFC 8633"],["Выбраны chrony и Cisco IOS","миллисекундной точности сети достаточно"],["Спроектирована топология","сервер 192.168.10.10 в VLAN 10, три сегмента"],["Описаны настройка и проверка","конфигурации, команды диагностики, план испытаний"]],ft=[Y,Q,tt,et,it,rt,dt,mt,gt,{id:"conclusion",chapter:"Заключение",title:"Заключение",theme:"dark",notes:`
    Цель работы достигнута: разработан проект внедрения NTP, который даёт серверам и сетевым устройствам
    единый источник времени.

    Изучен протокол, определены угрозы и меры защиты, обоснован выбор chrony и Cisco IOS, спроектированы
    топология и адресация, описаны настройка и методика проверки.

    Для промышленной эксплуатации рекомендую резервный сервер времени, несколько независимых источников,
    фильтрацию UDP/123, аутентификацию и постоянный мониторинг.
    Спасибо за внимание, готов ответить на вопросы.
  `,html:()=>`
    ${$("ауры нафармлено: stratum 2","right:112px;top:150px",15,2)}
    <div class="fn2-dial" data-r="scale" style="--i:2">
      ${P()}
      <span class="cv2-utc">все часы сети идут одинаково</span>
    </div>
    <div class="fn-main">
      <p class="eyebrow" data-r style="--i:1"><b>Итоги</b> цель достигнута</p>
      <h2 class="h1" data-r style="--i:2">Заключение</h2>
      ${S(yt,3,!0)}
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
  `}],A={friendsSync:{file:"images/friends-sync.jpg",alt:"Два парня за столиком в кафе",title:"Мем-карточка «Клиент и сервер»",author:"личное фото",license:"с согласия",source:""},friendHood:{file:"images/friend-hood.jpg",alt:"Парень в капюшоне",title:"Мем-карточка «Stratum 16»",author:"личное фото",license:"с согласия",source:""},friendJuice:{file:"images/friend-juice.jpg",alt:"Парень пьёт сок из пакета",title:"Мем-карточка «Ping прошёл»",author:"личное фото",license:"с согласия",source:""}},_=document.getElementById("app");function xt(){const e="./",t=Object.values(A).map(n=>new Promise(i=>{const l=new Image;l.onload=l.onerror=i,l.src=`${e}${n.file}`})),s=document.fonts?document.fonts.ready:Promise.resolve(),a=new Promise(n=>setTimeout(n,2500));return Promise.race([Promise.all([...t,s]),a])}xt().then(()=>X(_,"./")).then(()=>{const e=new K(_,ft,{images:A,base:"./"}).mount();window.__deck=e})})();
