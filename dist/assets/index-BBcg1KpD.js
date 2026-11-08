(function(){"use strict";const k='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',T='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',m=e=>String(e).padStart(2,"0");function h(e,t={},s=""){const i=document.createElement(e);for(const[n,o]of Object.entries(t))o===!1||o==null||i.setAttribute(n,o===!0?"":o);return s&&(i.innerHTML=s),i}function L(e){const t=h("div",{class:"chrome","aria-hidden":"false"});return t.innerHTML=`
    <div class="chrome-top">
      <div class="chrome-brand"><i></i><span>Lean Production · История</span></div>
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
        <div class="counter" aria-live="polite"><b class="cur">01</b> / ${m(e)}</div>
        <div class="nav-btns">
          <button class="nav-btn" type="button" data-action="prev" aria-label="Предыдущий слайд">${k}</button>
          <button class="nav-btn" type="button" data-action="next" aria-label="Следующий слайд">${T}</button>
        </div>
      </div>
    </div>
    <div class="progress" role="progressbar" aria-label="Прогресс презентации" aria-valuemin="1" aria-valuemax="${e}">
      <div class="progress-fill"></div>
      <div class="progress-ticks">
        ${Array.from({length:e},(s,i)=>`<button type="button" data-goto="${i}" aria-label="Слайд ${i+1}"></button>`).join("")}
      </div>
    </div>`,t}function j(e){const t=h("div",{class:"overlay",id:"overview",role:"dialog","aria-modal":"true","aria-label":"Содержание"});return t.innerHTML=`
    <div class="overlay-panel">
      <div class="overlay-head">
        <h2>Содержание</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <div class="overview-grid">
        ${e.map((s,i)=>`
          <button class="overview-item" type="button" data-goto="${i}">
            <span class="n">${m(i+1)} · ${s.chapter}</span>
            <span class="t">${s.title}</span>
          </button>`).join("")}
      </div>
    </div>`,t}function S(){const e=h("aside",{class:"notes",id:"notes","aria-label":"Заметки докладчика"});return e.innerHTML=`
    <div class="notes-inner">
      <div class="notes-label">Заметки докладчика<br><span class="muted">N — скрыть</span></div>
      <div class="notes-text"></div>
    </div>`,e}function F(){const e=[["Следующий слайд","→ · Пробел · PgDn"],["Предыдущий слайд","← · Shift+Пробел · PgUp"],["Первый / последний","Home · End"],["Содержание","O · Esc"],["Заметки докладчика","N"],["Полный экран","F"],["Источники фотографий","I"],["Эта подсказка","H · ?"]],t=h("div",{class:"overlay",id:"help",role:"dialog","aria-modal":"true","aria-label":"Управление"});return t.innerHTML=`
    <div class="overlay-panel" style="width:min(820px,100%)">
      <div class="overlay-head">
        <h2>Управление</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <div class="keys">
        ${e.map(([s,i])=>`<div><span>${s}</span><kbd>${i}</kbd></div>`).join("")}
      </div>
      <p class="muted" style="margin-top:24px;font-size:14px">На телефоне и планшете листайте свайпом влево и вправо.</p>
    </div>`,t}function P(e,t){const s=h("div",{class:"overlay",id:"credits",role:"dialog","aria-modal":"true","aria-label":"Источники фотографий"}),i=Object.values(e).map(n=>`
      <li>
        <img src="${t}${n.file}" alt="" loading="lazy">
        <div>
          <b>${n.title}</b>
          <span>${n.author} · ${n.license}</span><br>
          <a href="${n.source}" target="_blank" rel="noopener">${n.source.replace("https://","")}</a>
        </div>
      </li>`).join("");return s.innerHTML=`
    <div class="overlay-panel">
      <div class="overlay-head">
        <h2>Источники фотографий</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <ul class="credits-list">${i}</ul>
    </div>`,s}const I=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches,A=e=>1-Math.pow(1-e,3);function y(e,t=0){const s=e.toFixed(t),[i,n]=s.split("."),o=i.length>4?i.replace(/\B(?=(\d{3})+(?!\d))/g," "):i;return n?`${o},${n}`:o}const b=new WeakMap;function C(e){e.querySelectorAll("[data-count]").forEach(t=>{const s=parseFloat(t.dataset.count),i=parseFloat(t.dataset.from??"0"),n=parseInt(t.dataset.decimals??"0",10),o=parseInt(t.dataset.duration??"1600",10),l=parseInt(t.dataset.delay??"350",10);if(cancelAnimationFrame(b.get(t)),I()){t.textContent=y(s,n);return}t.textContent=y(i,n);const c=performance.now()+l,p=u=>{const g=Math.min(1,Math.max(0,(u-c)/o));t.textContent=y(i+(s-i)*A(g),n),g<1&&b.set(t,requestAnimationFrame(p))};b.set(t,requestAnimationFrame(p))})}function O(e){e.querySelectorAll("[data-count]").forEach(t=>{cancelAnimationFrame(b.get(t)),t.textContent=y(parseFloat(t.dataset.count),parseInt(t.dataset.decimals??"0",10))})}const E=1920,H=1080,q=2600;class z{constructor(t,s,{images:i={},base:n="./"}={}){this.root=t,this.slides=s,this.images=i,this.base=n,this.index=-1,this.step=0,this.locked=!1}mount(){const{root:t,slides:s}=this;this.stage=h("div",{class:"stage","data-dir":"fwd"}),this.track=h("div",{class:"slides"}),this.sections=s.map((n,o)=>{const l=h("section",{class:`slide slide--${n.id}`,"data-theme":n.theme||"dark","data-index":o,"aria-roledescription":"слайд","aria-label":`${o+1} из ${s.length}: ${n.title}`});return l.innerHTML=n.html({base:this.base,img:this.img.bind(this)}),this.track.appendChild(l),l}),this.chrome=L(s.length),this.stage.append(this.track,this.chrome),this.overview=j(s),this.notes=S(),this.help=F(),this.credits=P(this.images,this.base),this.toast=h("div",{class:"toast",role:"status"},"→ или Пробел — дальше · H — управление"),t.append(this.stage,this.notes,this.overview,this.help,this.credits,this.toast),this.$={chapterWrap:this.chrome.querySelector(".chrome-chapter"),chapterNum:this.chrome.querySelector(".chrome-chapter .num"),chapterName:this.chrome.querySelector(".chrome-chapter .name"),counter:this.chrome.querySelector(".counter .cur"),fill:this.chrome.querySelector(".progress-fill"),progress:this.chrome.querySelector(".progress"),dots:this.chrome.querySelector(".step-dots"),prev:this.chrome.querySelector('[data-action="prev"]'),next:this.chrome.querySelector('[data-action="next"]'),notesText:this.notes.querySelector(".notes-text")},this.bind(),this.fit();const i=this.indexFromHash();return this.go(i??0,{instant:!0}),setTimeout(()=>this.toast.classList.add("is-show"),900),setTimeout(()=>this.toast.classList.remove("is-show"),5200),this.pokeIdle(),this}img(t,{alt:s,className:i="",position:n}={}){const o=this.images[t];if(!o)throw new Error(`Unknown image: ${t}`);const l=n||o.position,c=l?` style="object-position:${l}"`:"",p=i?` class="${i}"`:"";return`<img src="${this.base}${o.file}" alt="${s??o.alt}"${p} decoding="async" draggable="false"${c}>`}fit(){const t=this.root.clientWidth,s=this.root.clientHeight,i=Math.min(t/E,s/H);this.stage.style.setProperty("--scale",String(i))}stepsOf(t){return Math.max(1,this.slides[t]?.steps||1)}next(){if(this.step<this.stepsOf(this.index)-1)return this.setStep(this.step+1);this.index<this.slides.length-1&&this.go(this.index+1)}prev(){if(this.step>0)return this.setStep(this.step-1);this.index>0&&this.go(this.index-1,{step:this.stepsOf(this.index-1)-1})}go(t,{step:s=0,instant:i=!1}={}){const n=Math.max(0,Math.min(this.slides.length-1,t));if(n===this.index){this.setStep(s);return}const o=this.index,l=this.sections[o],c=this.sections[n],p=this.slides[n];this.stage.dataset.dir=n>o?"fwd":"back",l&&(l.classList.remove("is-active"),l.classList.add("is-leaving"),clearTimeout(l._leaveTimer),l._leaveTimer=setTimeout(()=>l.classList.remove("is-leaving"),750),l.setAttribute("aria-hidden","true"),l.inert=!0),c.classList.remove("is-leaving"),c.offsetWidth,i&&(c.style.transition="none"),c.classList.add("is-active"),c.removeAttribute("aria-hidden"),c.inert=!1,i&&requestAnimationFrame(()=>c.style.transition=""),this.index=n,this.step=-1,this.setStep(s,{silent:!0}),this.stage.classList.toggle("is-light",p.theme==="light"),C(c),l&&setTimeout(()=>O(l),800),p.onEnter?.(c,this),this.updateChrome(p,o===-1),this.updateHash()}setStep(t,{silent:s=!1}={}){const i=this.stepsOf(this.index)-1,n=Math.max(0,Math.min(i,t));if(n===this.step&&!s)return;this.step=n;const o=this.sections[this.index];o.dataset.step=String(n),this.slides[this.index].onStep?.(o,n,this),this.renderDots(),this.updateProgress(),this.updateNav()}updateChrome(t,s){const{chapterWrap:i,chapterNum:n,chapterName:o,counter:l,notesText:c}=this.$,p=()=>{n.textContent=m(this.index+1),o.textContent=t.chapter,i.classList.remove("is-swapping")};s?p():(i.classList.add("is-swapping"),setTimeout(p,260)),l.textContent=m(this.index+1),c.innerHTML=(t.notes||"").trim().split(/\n\s*\n/).map(u=>`<p>${u.trim()}</p>`).join(""),this.overview.querySelectorAll(".overview-item").forEach((u,g)=>u.classList.toggle("is-current",g===this.index)),this.$.progress.setAttribute("aria-valuenow",String(this.index+1))}updateProgress(){const t=this.slides.length,s=this.stepsOf(this.index),i=s>1?this.step/s:0,n=(this.index+i+1)/t*100;this.$.fill.style.width=`${Math.min(100,n)}%`}renderDots(){const t=this.stepsOf(this.index);this.$.dots.innerHTML=t>1?Array.from({length:t},(s,i)=>`<i class="${i<=this.step?"on":""}"></i>`).join(""):""}updateNav(){const t=this.index===0&&this.step===0,s=this.index===this.slides.length-1&&this.step===this.stepsOf(this.index)-1;this.$.prev.disabled=t,this.$.next.disabled=s}updateHash(){const t=`#slide-${this.index+1}`;try{location.hash!==t&&history.replaceState(null,"",t)}catch{}}indexFromHash(){const t=/^#slide-(\d+)$/.exec(location.hash);if(!t)return null;const s=parseInt(t[1],10)-1;return s>=0&&s<this.slides.length?s:null}openOverlay(t){[this.overview,this.help,this.credits].forEach(i=>i!==t&&i.classList.remove("is-open")),t.classList.add("is-open"),this.activeOverlay=t;const s=t.querySelector(".is-current")||t.querySelector("[data-close]");setTimeout(()=>s?.focus({preventScroll:!0}),50)}closeOverlay(){return this.activeOverlay?(this.activeOverlay.classList.remove("is-open"),this.activeOverlay=null,!0):!1}toggleOverlay(t){this.activeOverlay===t?this.closeOverlay():this.openOverlay(t)}toggleNotes(){this.notes.classList.toggle("is-open")}async toggleFullscreen(){try{document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()}catch{}}pokeIdle(){this.root.classList.remove("is-idle"),clearTimeout(this.idleTimer),this.idleTimer=setTimeout(()=>this.root.classList.add("is-idle"),q)}bind(){window.addEventListener("resize",()=>this.fit()),window.addEventListener("hashchange",()=>{const o=this.indexFromHash();o!=null&&o!==this.index&&this.go(o)}),document.addEventListener("keydown",o=>this.onKey(o)),document.addEventListener("mousemove",()=>this.pokeIdle(),{passive:!0}),this.root.addEventListener("click",o=>{const l=o.target.closest("[data-action],[data-goto],[data-close],[data-step-to]");if(!l)return;if(l.hasAttribute("data-close"))return void this.closeOverlay();if(l.dataset.goto!=null)return this.closeOverlay(),void this.go(parseInt(l.dataset.goto,10));if(l.dataset.stepTo!=null)return void this.setStep(parseInt(l.dataset.stepTo,10));const c=l.dataset.action;c==="next"?this.next():c==="prev"?this.prev():c==="overview"?this.toggleOverlay(this.overview):c==="credits"?this.toggleOverlay(this.credits):c==="help"&&this.toggleOverlay(this.help)}),[this.overview,this.help,this.credits].forEach(o=>o.addEventListener("click",l=>{l.target===o&&this.closeOverlay()}));let t=0,s=0,i=0;this.stage.addEventListener("touchstart",o=>{const l=o.touches[0];t=l.clientX,s=l.clientY,i=Date.now()},{passive:!0}),this.stage.addEventListener("touchend",o=>{const l=o.changedTouches[0],c=l.clientX-t,p=l.clientY-s;Date.now()-i<700&&Math.abs(c)>40&&Math.abs(c)>Math.abs(p)*1.3&&(c<0?this.next():this.prev())},{passive:!0});let n=0;window.addEventListener("wheel",o=>{if(this.activeOverlay)return;const l=Math.abs(o.deltaY)>Math.abs(o.deltaX)?o.deltaY:o.deltaX;if(Math.abs(l)<24)return;const c=Date.now();c<n||(n=c+900,l>0?this.next():this.prev())},{passive:!0})}onKey(t){if(t.metaKey||t.ctrlKey||t.altKey)return;const s=t.key;if(this.pokeIdle(),s==="Escape")return this.closeOverlay()?t.preventDefault():this.notes.classList.contains("is-open")?this.toggleNotes():this.openOverlay(this.overview);if(this.activeOverlay){(s==="o"||s==="O"||s==="щ"||s==="Щ")&&this.activeOverlay===this.overview&&this.closeOverlay(),(s==="i"||s==="I"||s==="ш"||s==="Ш")&&this.activeOverlay===this.credits&&this.closeOverlay(),(s==="h"||s==="H"||s==="?"||s==="р"||s==="Р")&&this.activeOverlay===this.help&&this.closeOverlay();return}const i=document.activeElement?.tagName==="BUTTON";switch(s){case"ArrowRight":case"ArrowDown":case"PageDown":return t.preventDefault(),this.next();case"ArrowLeft":case"ArrowUp":case"PageUp":return t.preventDefault(),this.prev();case" ":case"Spacebar":return i?void 0:(t.preventDefault(),t.shiftKey?this.prev():this.next());case"Enter":return i?void 0:(t.preventDefault(),this.next());case"Home":return t.preventDefault(),this.go(0);case"End":return t.preventDefault(),this.go(this.slides.length-1)}const o={f:"fs",F:"fs",а:"fs",А:"fs",n:"notes",N:"notes",т:"notes",Т:"notes",o:"overview",O:"overview",щ:"overview",Щ:"overview",h:"help",H:"help","?":"help",р:"help",Р:"help",i:"credits",I:"credits",ш:"credits",Ш:"credits"}[s];o==="fs"?this.toggleFullscreen():o==="notes"?this.toggleNotes():o==="overview"?this.toggleOverlay(this.overview):o==="help"?this.toggleOverlay(this.help):o==="credits"&&this.toggleOverlay(this.credits)}}const f=[{x:112,year:"1913",label:"Ford"},{x:560,year:"1950-е",label:"Toyota"},{x:1010,year:"1988",label:"Lean"},{x:1460,year:"2020-е",label:"Smart Factory"}],D={id:"cover",chapter:"Обложка",title:"История возникновения Lean Production",theme:"dark",notes:`
    Сегодня мы проследим, как появилась концепция Lean Production — бережливого производства.
    Путь займёт больше ста лет: от конвейера Генри Форда в 1913 году до «умных» заводов 2020-х.

    Главный вопрос презентации: почему подход, придуманный на японском автозаводе после войны,
    сегодня используют больницы, банки, IT-компании и даже школы?

    Фото на обложке сделано в 2011 году на заводе во Фримонте (Калифорния). С 1984 по 2010 год
    здесь работал NUMMI — совместный завод General Motors и Toyota, где американские инженеры
    учились производственной системе Toyota.
  `,html:({img:e})=>`
    <div class="cover-photo photo photo--modern kb grain" data-r="fade" style="--i:0">
      ${e("cover")}
    </div>
    <div class="cover-shade"></div>

    <svg class="cover-flow" viewBox="0 0 1920 1080" aria-hidden="true">
      <path class="draw cover-flow__faint" pathLength="1" style="--draw-delay:500ms;--draw-dur:2200ms"
        d="M1920 560 C 1480 580, 1300 868, 1010 868"/>
      <path class="draw cover-flow__faint" pathLength="1" style="--draw-delay:650ms;--draw-dur:2200ms"
        d="M1920 740 C 1720 750, 1640 868, 1460 868"/>
      <path class="draw cover-flow__main" id="cover-line" pathLength="1" style="--draw-delay:350ms;--draw-dur:2000ms"
        d="M112 868 H 1808"/>
      ${f.map((t,s)=>`
        <g class="cover-station" style="--i:${s}">
          <line x1="${t.x}" y1="852" x2="${t.x}" y2="884"/>
          <circle cx="${t.x}" cy="868" r="${s===f.length-1?7:4}" class="${s===f.length-1?"is-now":""}"/>
        </g>`).join("")}
      <circle class="cover-runner" r="5">
        <animateMotion dur="7s" repeatCount="indefinite" path="M112 868 H 1808" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.45 0 0.55 1"/>
      </circle>
    </svg>

    <div class="cover-stations">
      ${f.map((t,s)=>`
        <div class="cover-station-label" style="left:${t.x}px;--i:${s+6}" data-r="fade">
          <span>${t.year}</span><b>${t.label}</b>
        </div>`).join("")}
    </div>

    <div class="cover-text">
      <p class="eyebrow" data-r style="--i:1"><b>Бережливое производство</b> 1913 — 2026</p>
      <h1 class="cover-title">
        <span class="cover-title__a" data-r="mask-up" style="--i:2">История возникновения</span>
        <span class="cover-title__b" data-r="mask-up" style="--i:3">Lean Production</span>
      </h1>
      <p class="cover-sub" data-r style="--i:5">От производственной системы Toyota до&nbsp;современного бережливого производства</p>
    </div>

    <div class="cover-jp" data-r="fade" style="--i:8">
      <span class="jp-vertical">リーン生産方式の歴史</span>
      <i class="cover-jp__dot"></i>
    </div>
  `},a=(e,t="")=>`<path d="${e}" pathLength="1" class="draw ${t}"/>`,r=(e,t,s,i,n="",o=0)=>`<rect x="${e}" y="${t}" width="${s}" height="${i}" rx="${o}" pathLength="1" class="draw ${n}"/>`,d=(e,t,s,i="")=>`<circle cx="${e}" cy="${t}" r="${s}" pathLength="1" class="draw ${i}"/>`,N={value:a("M14 24 22 12h20l8 12-18 28z")+a("M14 24h36")+a("M26 24l6 28 6-28","ac")+a("M22 12l4 12 6-12 6 12 4-12","ac"),nowaste:a("M6 32h14M44 32h14")+d(32,32,11,"ac")+a("M27 27l10 10M37 27 27 37","ac"),kaizen:a("M8 54h12V44h12V34h12V24h12")+a("M36 10h16v16","ac")+a("M52 10 34 28","ac"),people:d(24,21,7)+a("M11 50c0-9 5-14 13-14s13 5 13 14")+d(43,24,6,"ac")+a("M38 37c1.5-.7 3.2-1 5-1 6.5 0 10 5 10 12","ac"),flow:a("M6 32h50")+a("M50 26l6 6-6 6")+r(12,24,12,12)+r(30,24,12,12,"ac"),batch:r(8,40,16,14)+r(24,40,16,14)+r(40,40,16,14)+r(16,26,16,14)+r(32,26,16,14)+r(24,12,16,14,"ac"),warehouse:a("M8 26 32 12l24 14v28H8z")+a("M18 54V34h28v20")+a("M18 41h28M18 48h28","ac"),hourglass:a("M18 9h28M18 55h28")+a("M21 9c0 12 11 15 11 23S21 43 21 55M43 9c0 12-11 15-11 23s11 11 11 23")+a("M26 49h12l-6-6z","ac"),demand:a("M8 56h48M8 56V8")+a("M12 44c8-2 12-16 20-16s12 14 20 8","ac")+a("M12 34h42"),overproduction:r(8,40,14,14)+r(22,40,14,14)+r(15,26,14,14)+r(42,10,14,14,"ac")+a("M49 14v6M46 17h6","ac")+a("M36 54h20","ac"),waiting:d(32,35,19)+a("M32 24v11l8 6","ac")+a("M26 8h12M32 8v8"),transport:r(8,8,14,14)+a("M15 26v8h34v9H15v9h33","ac")+a("M44 47l5 5-5 5","ac"),overprocessing:d(27,35,9)+a("M27 19v5M27 46v5M11 35h5M38 35h5M15.7 23.7l3.5 3.5M34.8 42.8l3.5 3.5M15.7 46.3l3.5-3.5M34.8 27.2l3.5-3.5")+a("M50 6v12M44 12h12M53 26v8M49 30h8","ac"),inventory:a("M10 8v48M54 8v48M10 23h44M10 39h44M10 56h44")+r(14,13,10,10)+r(27,15,8,8)+r(38,28,12,11,"ac")+r(14,45,12,11)+r(30,45,10,11),motion:d(18,12,5)+a("M18 18v16M18 34l-7 18M18 34l7 18M18 24l-8 8M18 24l9 7")+a("M34 48c4-14 10-24 22-31","ac")+a("M49 14l7 3-2 7","ac"),defects:a("M32 7l21 12v26L32 57 11 45V19z")+a("M31 7l-5 14 9 7-7 10 7 8-4 11","ac"),talent:a("M24 42c-6-4-10-10-10-17a18 18 0 0 1 36 0c0 7-4 13-10 17v6H24z")+a("M26 55h12")+a("M27 35l5-9 5 9M29 31h6","ac"),kanban:r(14,7,36,50,"",2)+a("M20 17h24M20 25h16M20 33h20")+r(20,42,11,8,"ac"),crisis:a("M22 9S10 26 10 34a12 12 0 0 0 24 0c0-8-12-25-12-25z")+a("M47 14v34M41 42l6 6 6-6","ac"),globe:d(32,32,22)+a("M10 32h44M32 10c-8 8-8 36 0 44M32 10c8 8 8 36 0 44")+a("M15 20c11 4 23 4 34 0","ac"),book:a("M8 14c8-2 16-2 24 4v36c-8-6-16-6-24-4z")+a("M56 14c-8-2-16-2-24 4v36c8-6 16-6 24-4z")+a("M39 25h10M39 32h10","ac"),cross:r(9,9,46,46,"",4)+a("M27 18h10v9h9v10h-9v9H27v-9h-9V27h9z","ac"),screen:r(7,10,50,34,"",2)+a("M24 10v34M40 10v34M24 54h16M32 44v10")+r(11,16,9,6,"ac")+r(28,16,8,6)+r(11,26,9,6)+r(44,16,9,6),chip:r(18,18,28,28,"",3)+a("M26 10v8M32 10v8M38 10v8M26 46v8M32 46v8M38 46v8M10 26h8M10 32h8M10 38h8M46 26h8M46 32h8M46 38h8")+r(26,26,12,12,"ac",1),car:a("M6 43V32l9-13h25l11 13h7v11z")+a("M15 32h36M27 19v13")+d(18,45,5,"ac")+d(45,45,5,"ac"),factory:a("M8 54V30l12 8v-8l12 8v-8l12 8V12h8v42z")+a("M16 46h6M28 46h6M40 46h6","ac"),medicine:a("M32 53S10 39 10 24a11 11 0 0 1 22-3 11 11 0 0 1 22 3c0 15-22 29-22 29z")+a("M15 32h9l4-8 6 14 4-6h11","ac"),code:r(7,11,50,42,"",3)+a("M7 20h50")+a("M26 30l-6 6 6 6M38 30l6 6-6 6","ac"),truck:a("M5 15h33v27H5zM38 25h11l9 9v8H38z")+d(16,46,5,"ac")+d(47,46,5,"ac"),bank:a("M8 24 32 10l24 14z")+a("M10 48h44M7 55h50")+a("M16 28v16M26 28v16M38 28v16M48 28v16")+a("M28 19h8","ac"),restaurant:a("M9 44h46M14 44a18 18 0 0 1 36 0")+a("M32 26v-5M28 21h8")+a("M7 51h50","ac"),education:a("M4 24 32 12l28 12-28 12z")+a("M16 30v12c8 6 24 6 32 0V30")+a("M58 25v15","ac"),automation:d(32,32,7)+a("M32 15v5M32 44v5M15 32h5M44 32h5")+a("M50 20A22 22 0 0 0 13 23M14 44a22 22 0 0 0 37-3","ac")+a("M13 14v9h9M51 50v-9h-9","ac"),iot:d(32,42,4,"ac")+a("M23 33a13 13 0 0 1 18 0M16 26a23 23 0 0 1 32 0M9 19a33 33 0 0 1 46 0")+a("M32 46v10M24 56h16"),data:a("M14 14c0-3.3 8-6 18-6s18 2.7 18 6-8 6-18 6-18-2.7-18-6z")+a("M14 14v36c0 3.3 8 6 18 6s18-2.7 18-6V14")+a("M14 26c0 3.3 8 6 18 6s18-2.7 18-6","ac")+a("M14 38c0 3.3 8 6 18 6s18-2.7 18-6"),robot:a("M8 56h28M14 56v-6h16v6")+a("M22 50 30 29l17-7")+d(30,29,3.5)+d(22,50,3.5)+a("M47 22l7-7M47 22l7 5","ac")};function v(e,{size:t=56,cls:s=""}={}){const i=N[e];if(!i)throw new Error(`Unknown icon: ${e}`);return`<svg class="icon ${s}" viewBox="0 0 64 64" width="${t}" height="${t}" aria-hidden="true">${i}</svg>`}const B=[{icon:"value",title:"Ценность",text:"Понять, за что клиент действительно готов платить"},{icon:"nowaste",title:"Без потерь",text:"Убрать действия, которые не добавляют ценности"},{icon:"kaizen",title:"Кайдзен",text:"Улучшать процесс понемногу — каждый день"},{icon:"people",title:"Уважение к людям",text:"Лучшие идеи — у тех, кто делает работу"},{icon:"flow",title:"Поток",text:"Работа движется без очередей и остановок"}],M=[["w",15],["v",4],["w",22],["v",3],["w",27],["v",4],["w",14],["v",3],["w",8]],R={id:"what",chapter:"Понятие",title:"Что такое Lean Production?",theme:"light",notes:`
    Lean в переводе с английского — «стройный», «без лишнего жира». В русском языке прижился термин
    «бережливое производство».

    Посмотрите на схему: в обычном процессе ценность для клиента создают только короткие красные отрезки.
    Всё серое — ожидание, перемещения, склады, переделки. Lean не заставляет людей работать быстрее —
    он убирает серое. Ценности столько же, а процесс становится короче.

    Пять идей внизу — основа подхода: ценность, устранение потерь, постоянное улучшение (кайдзен),
    уважение к людям и непрерывный поток.
  `,html:()=>`
    <div class="what-head">
      <p class="eyebrow" data-r style="--i:0"><b>Понятие</b> lean — «стройный, без лишнего»</p>
      <h2 class="h1" data-r style="--i:1">Что такое<br>Lean Production?</h2>
      <p class="lead" data-r style="--i:2">Подход к организации работы, где всё подчинено <b class="ink">ценности для клиента</b>, а всё лишнее последовательно убирается.</p>
    </div>

    <div class="what-formula" data-r style="--i:3">
      <div class="what-formula__row">
        <span class="what-formula__k">Ценность для клиента</span>
        <span class="what-formula__v is-up">максимум</span>
      </div>
      <div class="what-formula__row">
        <span class="what-formula__k">Потери</span>
        <span class="what-formula__v is-down">минимум</span>
      </div>
    </div>

    <figure class="what-diagram" data-r style="--i:4">
      <figcaption class="label">Один процесс глазами клиента</figcaption>
      <div class="what-bar-wrap">
        <span class="what-bar-label">Обычный процесс</span>
        <div class="what-bar">
          ${M.map(([e,t])=>`<i class="${e}" style="--g:${(t*6.9).toFixed(1)}"></i>`).join("")}
        </div>
      </div>
      <div class="what-bar-wrap">
        <span class="what-bar-label">Lean-процесс</span>
        <div class="what-bar is-lean">
          ${M.map(([e,t],s)=>`<i class="${e}" style="--g:${(t*6.9).toFixed(1)};--k:${s}"></i>`).join("")}
        </div>
        <span class="what-bar-note">та же ценность — <b>в разы быстрее</b></span>
      </div>
      <div class="what-legend">
        <span><i class="v"></i>Ценность — то, за что клиент платит</span>
        <span><i class="w"></i>Потери — ожидание, перемещения, запасы, переделки</span>
      </div>
    </figure>

    <ol class="what-principles">
      <li class="what-line" aria-hidden="true"><svg viewBox="0 0 1696 12" preserveAspectRatio="none"><path class="draw" pathLength="1" d="M0 6 H1696" style="--draw-delay:900ms;--draw-dur:1800ms"/></svg></li>
      ${B.map((e,t)=>`
        <li class="what-principle" data-r style="--i:${t+7}">
          <span class="what-node"></span>
          ${v(e.icon,{size:52})}
          <h3>${e.title}</h3>
          <p>${e.text}</p>
        </li>`).join("")}
    </ol>
  `},V=[{icon:"batch",text:"Огромные партии одинаковых изделий"},{icon:"warehouse",text:"Большие склады и запасы"},{icon:"hourglass",text:"Длинные производственные циклы"},{icon:"demand",text:"Медленная реакция на спрос"}],$=(e,t)=>`
  <div class="bl-flow bl-flow--${t}">
    ${e.map((s,i)=>`
      <div class="bl-step">
        <span class="bl-step__n">${String(i+1).padStart(2,"0")}</span>
        <span class="bl-step__t">${s}</span>
        ${t==="push"&&i===1?'<span class="bl-pile" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>':""}
      </div>
      ${i<e.length-1?'<span class="bl-link" aria-hidden="true"><i></i></span>':""}`).join("")}
  </div>`,J={id:"before",chapter:"До Lean",title:"До появления Lean: эпоха массового производства",theme:"dark",notes:`
    В первой половине XX века промышленность жила по логике массового производства:
    чем больше одинаковых изделий выпускается за раз, тем дешевле обходится каждое.

    Поэтому заводы делали огромные партии, а готовая продукция и детали месяцами лежали на складах.
    Если спрос менялся, перестроиться было трудно и дорого.

    Lean переворачивает эту логику: не «произвести много и потом продать», а «произвести ровно то,
    что нужно клиенту, и тогда, когда нужно».
  `,html:({img:e})=>`
    <figure class="bl-photo photo photo--archive kb grain" data-r="mask" style="--i:0">
      ${e("massprod")}
      <figcaption class="caption"><b>Одинаковые шасси Model T на конвейере</b><br>Ford, Хайленд-Парк, 1913</figcaption>
    </figure>

    <div class="bl-main">
      <p class="eyebrow" data-r style="--i:1"><b>1900–1950</b> до появления Lean</p>
      <h2 class="h1" data-r style="--i:2">Эпоха массового<br>производства</h2>
      <p class="lead" data-r style="--i:3">Главная цель — выпустить как можно больше. Чем больше партия, тем дешевле каждая штука.</p>

      <ul class="bl-traits">
        ${V.map((t,s)=>`<li data-r style="--i:${s+4}">${v(t.icon,{size:46})}<span>${t.text}</span></li>`).join("")}
      </ul>

      <div class="bl-compare">
        <div class="bl-row" data-r style="--i:8">
          <div class="bl-row__head">
            <span class="label">Традиционная модель</span>
            <span class="bl-tag">«толкаем» продукцию на склад</span>
          </div>
          ${$(["Произвести много","Хранить","Продавать"],"push")}
        </div>
        <div class="bl-row bl-row--lean" data-r style="--i:10">
          <div class="bl-row__head">
            <span class="label accent">Будущая модель Lean</span>
            <span class="bl-tag">клиент «вытягивает» продукцию</span>
          </div>
          ${$(["Произвести необходимое","Тогда, когда нужно","Без лишних потерь"],"pull")}
        </div>
      </div>
    </div>
  `},K={id:"ford",chapter:"Генри Форд",title:"Генри Форд и массовое производство",theme:"dark",notes:`
    В 1908 году Ford выпустил Model T — простой, надёжный и доступный автомобиль.
    В 1913 году на заводе в Хайленд-Парке заработал движущийся сборочный конвейер:
    машина сама ехала мимо рабочих, а каждый выполнял одну простую операцию.

    К 1914 году время сборки шасси сократилось примерно с 12,5 часа до 93 минут. Всего выпустили
    около 15 миллионов Model T, а цена упала с 850 до менее чем 300 долларов.

    Форд заложил основу современной эффективности: конвейер, стандартизация, разделение операций.
    Но его система была рассчитана на огромные партии одинаковых машин — отсюда знаменитая фраза
    про любой цвет, «если он чёрный».
  `,html:({img:e})=>`
    <figure class="ford-photo photo photo--archive kb grain" data-r="mask" style="--i:0">
      ${e("fordline")}
      <figcaption class="caption"><b>Сборочный конвейер Ford</b><br>Хайленд-Парк, Мичиган, 1913</figcaption>
    </figure>

    <figure class="ford-car photo photo--archive grain" data-r="mask-up" style="--i:6">
      ${e("modelt")}
      <figcaption class="caption"><b>Ford Model T</b> · 1908–1927</figcaption>
    </figure>

    <div class="ford-main">
      <p class="eyebrow" data-r style="--i:1"><b>1908–1927</b> США</p>

      <div class="ford-person" data-r style="--i:2">
        <div class="ford-portrait photo photo--archive">${e("ford")}</div>
        <div>
          <h2 class="h1">Генри Форд<br>и конвейер</h2>
          <p class="ford-who">1863–1947 · основатель Ford Motor Company</p>
        </div>
      </div>

      <div class="ford-stats">
        <div class="ford-stat" data-r style="--i:3">
          <div class="num-l"><span data-count="93" data-from="750" data-duration="1800">93</span><small>мин</small></div>
          <p>на сборку одного шасси к 1914 году — вместо 12,5 часа до конвейера</p>
        </div>
        <div class="ford-stat" data-r style="--i:4">
          <div class="num-l"><span data-count="15">15</span><small>млн</small></div>
          <p>автомобилей Model T — первого по-настоящему массового автомобиля</p>
        </div>
      </div>

      <ul class="chips" data-r style="--i:5">
        <li class="chip"><i></i>Движущийся конвейер</li>
        <li class="chip"><i></i>Стандартизация</li>
        <li class="chip"><i></i>Разделение операций</li>
      </ul>

      <blockquote class="ford-quote" data-r style="--i:7">
        <p>«Автомобиль может быть любого цвета, если этот цвет — чёрный»</p>
        <footer>Генри Форд о Model T · <span>мощная система, но только для огромных партий одинаковых машин</span></footer>
      </blockquote>
    </div>
  `},W=[["Нехватка ресурсов","сырья, энергии и оборудования"],["Мало капитала","нет денег на огромные заводы и склады"],["Маленький внутренний рынок","покупателей в разы меньше, чем в США"],["Нельзя производить огромными партиями","не хватит ни денег, ни спроса"],["Нужны разные модели","легковые машины, грузовики — малыми сериями"]],G={id:"japan",chapter:"Послевоенная Япония",title:"Япония после Второй мировой войны",theme:"dark",notes:`
    После 1945 года японская промышленность была в руинах. Не хватало сырья, энергии, денег,
    а внутренний рынок был крошечным по сравнению с американским.

    Цифры из исследования MIT показывают масштаб разрыва: Toyota за 13 лет, с 1937 по 1950 год,
    выпустила 2 685 автомобилей. Завод Ford River Rouge в 1950 году выпускал около 7 000 машин в день.

    В 1950 году Эйдзи Тоёда изучал завод Ford в США и пришёл к выводу: копировать американскую
    систему в Японии бессмысленно. Нужен свой подход — производить разные модели небольшими партиями
    и без потерь.
  `,html:({img:e})=>`
    <div class="jp-photo photo photo--archive kb grain" data-r="fade" style="--i:0">
      ${e("tokyo")}
    </div>
    <div class="jp-shade"></div>
    <p class="jp-photo-caption caption" data-r="fade" style="--i:9"><b>Хатиодзи, Токио · 1945</b> · город после авианалётов</p>

    <div class="jp-main">
      <p class="eyebrow" data-r style="--i:1"><b>1945–1950</b> Япония</p>
      <h2 class="h1" data-r style="--i:2">Япония после войны</h2>
      <p class="lead jp-lead" data-r style="--i:3">Промышленность разрушена — начинать приходится почти с нуля.</p>
      <ul class="jp-problems">
        ${W.map(([t,s],i)=>`
          <li data-r style="--i:${i+4}">
            <i></i>
            <div><b>${t}</b><span>${s}</span></div>
          </li>`).join("")}
      </ul>
    </div>

    <div class="jp-numbers">
      <div class="jp-num" data-r style="--i:4">
        <div class="num-xl"><span data-count="2685" data-duration="1800">2 685</span></div>
        <p><b>автомобилей за 13 лет</b> выпустила Toyota с 1937 по 1950 год</p>
      </div>
      <div class="jp-vs" data-r="fade" style="--i:6">vs</div>
      <div class="jp-num" data-r style="--i:7">
        <div class="num-xl accent"><span data-count="7000" data-duration="1800">7 000</span></div>
        <p><b>автомобилей в день</b> выпускал завод Ford River Rouge в 1950 году</p>
      </div>
      <p class="jp-source caption" data-r="fade" style="--i:9">Womack, Jones, Roos · The Machine That Changed the World, 1990</p>
    </div>

    <div class="jp-turn">
      <span class="jp-turn__a" data-r="left" style="--i:10">Условия не позволяли копировать американскую модель</span>
      <span class="jp-turn__line" aria-hidden="true">
        <svg viewBox="0 0 100 20" preserveAspectRatio="none"><path class="draw" pathLength="1" d="M0 10 H100" style="--draw-delay:1500ms;--draw-dur:900ms"/></svg>
        <i></i>
      </span>
      <span class="jp-turn__b" data-r="right" style="--i:15">Нужно было придумать другой подход</span>
    </div>
  `},U=[{key:"sakichi",name:"Сакити Тоёда",years:"1867–1930",text:"Изобрёл ткацкий станок, который сам останавливается при обрыве нити. Отсюда идея дзидока."},{key:"kiichiro",name:"Киитиро Тоёда",years:"1894–1952",text:"Основал Toyota Motor (1937) и сформулировал принцип Just-in-Time."},{key:null,jp:"新郷重夫",name:"Сигео Синго",years:"1909–1990",text:"Инженер-консультант: быстрая переналадка SMED и защита от ошибок poka-yoke."}],X={id:"tps",chapter:"Toyota Production System",title:"Toyota Production System: люди и два столпа",theme:"dark",steps:2,notes:`
    Шаг 1 — люди. Корни TPS — в ткацком станке Сакити Тоёды: он сам останавливался, если рвалась нить.
    Его сын Киитиро основал автомобильную компанию Toyota и сформулировал идею «точно вовремя».
    Систему в цехах построил инженер Тайити Оно: с конца 1940-х по 1970-е он ввёл канбан,
    описал семь видов потерь и метод «пяти почему». Сигео Синго добавил быструю переналадку
    оборудования и защиту от ошибок.

    Шаг 2 — два столпа TPS. Just-in-Time: производить только то, что нужно, когда нужно и сколько нужно.
    Jidoka: автоматизация с человеческим контролем — при любой проблеме линия останавливается,
    чтобы брак не пошёл дальше. В основании — стандартная работа, выравнивание и кайдзен.
  `,onStep(e,t){e.querySelectorAll(".tps-tab").forEach((s,i)=>s.setAttribute("aria-selected",String(i===t)))},html:({img:e})=>`
    <div class="tps-head">
      <p class="eyebrow" data-r style="--i:0"><b>1948–1975</b> Toyota, Япония</p>
      <h2 class="h1" data-r style="--i:1">Toyota Production System</h2>
    </div>
    <span class="tps-jp jp-vertical" data-r="fade" style="--i:4">トヨタ生産方式</span>

    <div class="tps-tabs" role="tablist" data-r="fade" style="--i:2">
      <button class="tps-tab" role="tab" type="button" data-step-to="0"><span>01</span>Люди</button>
      <button class="tps-tab" role="tab" type="button" data-step-to="1"><span>02</span>Два столпа</button>
    </div>

    <!-- Scene 1: people -->
    <div class="tps-scene tps-scene--people">
      <figure class="tps-ohno-photo photo photo--archive grain" data-r="mask-up" style="--i:2">
        ${e("ohno")}
      </figure>

      <div class="tps-ohno" data-r style="--i:3">
        <span class="label accent">Архитектор системы</span>
        <h3 class="tps-ohno__name">Тайити Оно</h3>
        <p class="tps-ohno__meta">1912–1990 · инженер, позже вице-президент Toyota</p>
        <ul class="tps-ohno__list">
          <li><b>Канбан</b> — карточки, по которым следующий участок «вытягивает» детали</li>
          <li><b>7 видов потерь</b> — что не добавляет ценности</li>
          <li><b>«5 почему»</b> — искать корневую причину проблемы</li>
        </ul>
        <blockquote class="tps-quote">
          «Мы смотрим на время от заказа клиента до получения денег — и сокращаем его, убирая потери»
        </blockquote>
      </div>

      <ul class="tps-founders">
        ${U.map((t,s)=>`
          <li class="tps-founder" data-r="right" style="--i:${s+5}">
            <div class="tps-founder__pic photo photo--archive">${t.key?e(t.key):`<span class="tps-nameplate jp">${t.jp}</span>`}</div>
            <div>
              <h4>${t.name}</h4>
              <span class="tps-founder__years">${t.years}</span>
              <p>${t.text}</p>
            </div>
          </li>`).join("")}
      </ul>
    </div>

    <!-- Scene 2: the TPS "house" -->
    <div class="tps-scene tps-scene--house" aria-label="Схема Toyota Production System">
      <div class="tps-house">
        <svg class="tps-roof" viewBox="0 0 1040 170" aria-hidden="true">
          <path d="M8 162 L520 8 L1032 162 Z" />
        </svg>
        <div class="tps-roof__text">
          <span class="label">Цель</span>
          <b>Качество · Низкая стоимость · Короткие сроки</b>
        </div>

        <div class="tps-pillars">
          <div class="tps-pillar">
            <span class="tps-pillar__jp jp">ジャスト・イン・タイム</span>
            <h3>Just-in-Time</h3>
            <p>Производить <b>только то, что нужно</b>, тогда, когда нужно, и столько, сколько нужно.</p>
            <span class="tps-pillar__tools">канбан · поток · вытягивание</span>
          </div>

          <div class="tps-core">
            <span class="tps-core__ring"></span>
            <b>Люди</b>
            <span>командная работа и кайдзен</span>
          </div>

          <div class="tps-pillar">
            <span class="tps-pillar__jp jp">自働化</span>
            <h3>Jidoka</h3>
            <p>Автоматизация с человеческим контролем: при проблеме <b>линия останавливается</b>, чтобы брак не пошёл дальше.</p>
            <span class="tps-pillar__tools">андон · стоп-шнур · poka-yoke</span>
          </div>
        </div>

        <div class="tps-base">
          <span>Стандартная работа</span><i></i><span>Выравнивание (хейдзунка)</span><i></i><span>Стабильные процессы</span>
        </div>
      </div>

      <aside class="tps-origin">
        <figure class="tps-loom photo photo--archive">
          ${e("loom")}
        </figure>
        <p class="caption"><b>Автоматический ткацкий станок Toyoda, тип G (1924)</b><br>Останавливался сам, если рвалась нить, — один человек мог следить за многими станками. Это и есть дзидока.</p>
        <div class="tps-origin__map">
          <div><span class="accent">JIT</span><i class="arr"></i>идея Киитиро Тоёды, 1930-е</div>
          <div><span class="accent">Jidoka</span><i class="arr"></i>станок Сакити Тоёды, 1924</div>
        </div>
      </aside>
    </div>
  `},Y=[{icon:"overproduction",title:"Перепроизводство",text:"Сделать больше или раньше, чем нужно",example:"Испекли 100 пирожков, а купили 60. Остальное — в мусор."},{icon:"waiting",title:"Ожидание",text:"Люди и машины простаивают",example:"Станок ждёт детали, рабочий ждёт, пока освободится станок."},{icon:"transport",title:"Лишняя транспортировка",text:"Детали возят туда-сюда",example:"Склад в другом конце завода: каждую партию везут через весь цех."},{icon:"overprocessing",title:"Избыточная обработка",text:"Делать больше, чем ценит клиент",example:"Полировать деталь, которую никто никогда не увидит."},{icon:"inventory",title:"Запасы",text:"Лишние материалы и продукция",example:"Полки забиты деталями «на всякий случай» — это замороженные деньги."},{icon:"motion",title:"Лишние движения",text:"Ненужные шаги, наклоны, поиски",example:"Инструмент лежит далеко — за ним приходится ходить десятки раз в день."},{icon:"defects",title:"Дефекты",text:"Брак, переделки, исправления",example:"Ошибку заметили в конце линии — переделывать приходится весь узел."}],Z={id:"wastes",chapter:"7 видов потерь",title:"7 видов потерь (муда)",theme:"light",notes:`
    Тайити Оно описал семь видов потерь — по-японски «муда». Это всё, что тратит время, силы
    и деньги, но не делает продукт ценнее для клиента.

    Самой опасной Оно считал перепроизводство: оно порождает остальные потери — запасы,
    транспортировку, ожидание.

    Нажмите на любую карточку, чтобы увидеть пример из жизни. Сегодня к семи видам часто добавляют
    восьмой — неиспользованный потенциал людей: идеи сотрудников, которые никто не спросил.
  `,onEnter(e){e.querySelectorAll(".waste.is-open").forEach(t=>{t.classList.remove("is-open"),t.setAttribute("aria-expanded","false")}),!e.dataset.bound&&(e.dataset.bound="1",e.addEventListener("click",t=>{const s=t.target.closest(".waste");if(!s)return;const i=!s.classList.contains("is-open");e.querySelectorAll(".waste.is-open").forEach(n=>{n.classList.remove("is-open"),n.setAttribute("aria-expanded","false")}),s.classList.toggle("is-open",i),s.setAttribute("aria-expanded",String(i))}))},html:()=>`
    <div class="ws-head">
      <p class="eyebrow" data-r style="--i:0"><b>Муда</b> классификация Тайити Оно</p>
      <h2 class="h1" data-r style="--i:1">7 видов потерь</h2>
      <p class="lead" data-r style="--i:2">Всё, что тратит время и ресурсы, но не делает продукт ценнее для клиента.</p>
    </div>
    <div class="ws-kanji jp" aria-hidden="true" data-r="blur" style="--i:3">無駄</div>
    <p class="ws-hint label" data-r="fade" style="--i:12">Нажмите на карточку — пример</p>

    <ol class="ws-grid">
      ${Y.map((e,t)=>`
        <li>
          <button class="waste" type="button" aria-expanded="false" data-r style="--i:${t*1.6+3}">
            <span class="waste__n">${String(t+1).padStart(2,"0")}</span>
            <span class="waste__icon" style="--draw-delay:${500+t*130}ms">${v(e.icon,{size:84})}</span>
            <span class="waste__title">${e.title}</span>
            <span class="waste__text">${e.text}</span>
            <span class="waste__example"><span class="label">Пример</span>${e.example}</span>
          </button>
        </li>`).join("")}
      <li class="ws-extra" data-r style="--i:15">
        <span class="waste__n">+1</span>
        <span class="waste__icon">${v("talent",{size:84})}</span>
        <span class="waste__title">Неиспользованный потенциал людей</span>
        <span class="waste__text">Современное дополнение: идеи сотрудников, которые никто не спросил</span>
      </li>
    </ol>
  `},Q=[{when:"1948–1975",title:"Toyota Production System",text:"Система рождается в цехах Toyota. Снаружи её называют просто «японскими методами»."},{when:"1985–1990",title:"Исследования MIT",text:"Международная программа IMVP пять лет сравнивает автозаводы Японии, США и Европы."},{when:"1988",title:"Термин «Lean Production»",text:"Исследователь MIT Джон Крафчик называет систему Toyota «lean» — «бережливой»."},{when:"1990 →",title:"Мировое распространение",text:"Книга о результатах исследования становится бестселлером. Lean изучают во всём мире."}],tt=["человеческих усилий","производственных площадей","инвестиций в оборудование","времени на разработку модели"],st={id:"term",chapter:"Термин Lean",title:"Как появился термин «Lean Production»",theme:"dark",notes:`
    Важно: сама система Toyota существовала задолго до слова «Lean». Десятилетиями её называли
    просто Toyota Production System или «японскими методами».

    В 1980-х годах в Массачусетском технологическом институте (MIT) работала международная
    программа IMVP. Исследователи сравнивали автозаводы разных стран и увидели, что японские заводы
    делают машины быстрее, качественнее и с меньшими затратами.

    В 1988 году участник программы Джон Крафчик в своей статье назвал такой подход «lean» —
    «стройный, бережливый». А в 1990 году вышла книга Джеймса Вумека, Дэниела Джонса и Дэниела Руса
    «The Machine That Changed the World» («Машина, которая изменила мир»). После неё термин
    Lean Production стал известен во всём мире.
  `,html:()=>`
    <div class="tm-intro">
      <p class="eyebrow" data-r style="--i:0"><b>1988–1990</b> MIT, США</p>
      <h2 class="h1" data-r style="--i:1">Откуда взялось слово «Lean»</h2>
      <p class="lead" data-r style="--i:2">Система Toyota работала десятилетиями, прежде чем у неё появилось международное имя.</p>

      <div class="tm-half" data-r style="--i:9">
        <div class="tm-half__num">½</div>
        <div>
          <p class="tm-half__q">Почему «бережливое»? По сравнению с массовым производством — вдвое меньше:</p>
          <ul class="tm-half__list">
            ${tt.map(e=>`<li><i><b></b></i>${e}</li>`).join("")}
          </ul>
        </div>
      </div>
    </div>

    <ol class="tm-steps">
      <li class="tm-steps__line" aria-hidden="true">
        <svg viewBox="0 0 4 640" preserveAspectRatio="none"><path class="draw" pathLength="1" d="M2 0 V640" style="--draw-delay:500ms;--draw-dur:2200ms"/></svg>
      </li>
      ${Q.map((e,t)=>`
        <li class="tm-step ${t===2?"is-key":""}" data-r style="--i:${t*2+3}">
          <span class="tm-dot"></span>
          <span class="tm-when">${e.when}</span>
          <h3>${e.title}</h3>
          <p>${e.text}</p>
        </li>`).join("")}
    </ol>

    <figure class="tm-book" data-r="scale" style="--i:6">
      <div class="tm-cover">
        <span class="tm-cover__top">MIT · International Motor Vehicle Program</span>
        <span class="tm-cover__title">The Machine That Changed the World</span>
        <span class="tm-cover__line"></span>
        <span class="tm-cover__sub">The Story of Lean Production</span>
        <span class="tm-cover__authors">James P. Womack<br>Daniel T. Jones<br>Daniel Roos</span>
      </div>
      <figcaption>
        <b>«The Machine That Changed the World»</b>
        <span>Вумек, Джонс, Рус · 1990 · книга, сделавшая Lean известным</span>
      </figcaption>
    </figure>
  `},w=[{when:"1940–50-е",icon:"kanban",title:"Рождение TPS",text:"Тайити Оно строит систему в цехах Toyota: канбан, Just-in-Time, дзидока."},{when:"1960–70-е",icon:"crisis",title:"Проверка кризисом",text:"После нефтяного кризиса 1973 года Toyota восстанавливается быстрее других — методы перенимает вся Япония."},{when:"1980-е",icon:"globe",title:"Запад учится",text:"GM и Toyota открывают совместный завод NUMMI (1984). Методы Toyota изучают в США и Европе."},{when:"1990-е",icon:"book",title:"Слово «Lean»",text:"Книги «The Machine That Changed the World» (1990) и «Lean Thinking» (1996)."},{when:"2000-е",icon:"cross",title:"За пределами заводов",text:"Lean приходит в больницы, банки, логистику и сервис. Появляется Lean Six Sigma."},{when:"2010-е",icon:"screen",title:"Lean + digital",text:"Lean Startup, Agile и Kanban-доски в IT. Процессы становятся цифровыми."},{when:"2020-е",icon:"chip",title:"Lean + AI",text:"Industry 4.0: датчики, данные, ИИ и роботы помогают убирать потери."}],et={id:"timeline",chapter:"Развитие Lean",title:"Как развивался Lean: 1940-е — 2020-е",theme:"dark",notes:`
    Пройдём по десятилетиям. В 1940–50-е годы Тайити Оно создаёт систему в цехах Toyota.
    В 1973 году нефтяной кризис ударил по всем автопроизводителям, но Toyota восстановилась быстрее —
    и японские компании начали массово перенимать её методы.

    В 1980-е Запад начинает учиться: General Motors и Toyota открывают совместный завод NUMMI
    в Калифорнии. В 1990-е появляется слово Lean и выходят ключевые книги.

    В 2000-е Lean выходит за пределы заводов — в больницы, банки, логистику. В 2010-е — в IT:
    Lean Startup, Agile, Kanban-доски. Сегодня Lean соединяется с данными, ИИ и роботизацией.
  `,html:()=>`
    <div class="tl-head">
      <p class="eyebrow" data-r style="--i:0"><b>80 лет</b> развития</p>
      <h2 class="h1" data-r style="--i:1">Как развивался Lean</h2>
    </div>
    <p class="tl-aside lead" data-r style="--i:2">От одного японского завода — к способу работы по всему миру.</p>

    <div class="tl">
      <svg class="tl-line" viewBox="0 0 1696 4" preserveAspectRatio="none" aria-hidden="true">
        <path class="tl-line__base" d="M0 2 H1696"/>
        <path class="draw tl-line__run" pathLength="1" d="M0 2 H1696" style="--draw-delay:400ms;--draw-dur:2600ms"/>
      </svg>
      <ol class="tl-eras">
        ${w.map((e,t)=>`
          <li class="tl-era ${t===w.length-1?"is-now":""}" style="--k:${t}">
            <div class="tl-era__top" data-r style="--i:${t*2.4+3}">
              <span class="tl-era__icon" style="--draw-delay:${700+t*330}ms">${v(e.icon,{size:60})}</span>
              <span class="tl-era__when">${e.when}</span>
            </div>
            <span class="tl-node">${t===w.length-1?'<span class="pulse"></span>':""}</span>
            <div class="tl-era__body" data-r style="--i:${t*2.4+4}">
              <h3>${e.title}</h3>
              <p>${e.text}</p>
            </div>
          </li>`).join("")}
      </ol>
    </div>

    <figure class="tl-scope">
      <div class="tl-scope__shape" data-r="mask" style="--i:19">
      <svg viewBox="0 0 1696 110" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="tl-scope-fill" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" style="stop-color:var(--accent);stop-opacity:0.06"/>
            <stop offset="1" style="stop-color:var(--accent);stop-opacity:0.5"/>
          </linearGradient>
        </defs>
        <path d="M0 53 C 760 52, 1250 38, 1696 0 L1696 110 C 1250 72, 760 58, 0 57 Z" fill="url(#tl-scope-fill)"/>
        <path d="M0 55 C 760 55, 1250 55, 1696 55" fill="none" style="stroke:var(--accent);stroke-width:1;stroke-dasharray:2 6;vector-effect:non-scaling-stroke"/>
      </svg>
      </div>
      <figcaption data-r="fade" style="--i:21">
        <span class="label">Масштаб применения</span>
        <span class="label">один завод <i class="arr"></i> весь мир, любые отрасли</span>
      </figcaption>
    </figure>
  `},at=[{icon:"car",title:"Автомобилестроение",text:"Канбан и Just-in-Time на сборочных линиях"},{icon:"factory",title:"Промышленность",text:"От станков и электроники до самолётов"},{icon:"medicine",title:"Медицина",text:"Меньше ожидания для пациентов, порядок в операционных"},{icon:"code",title:"IT",text:"Kanban-доски, Lean Startup, быстрые релизы"},{icon:"truck",title:"Логистика",text:"Поставки точно в срок, склады без завалов"},{icon:"bank",title:"Банки",text:"Решение по кредиту за дни, а не за недели"},{icon:"restaurant",title:"Рестораны",text:"Продуманное рабочее место, свежие продукты, быстрая выдача"},{icon:"education",title:"Образование",text:"Понятные процессы: расписание, документы, проекты"}],it={id:"today",chapter:"Lean сегодня",title:"Lean сегодня: не только автомобили",theme:"light",notes:`
    Сегодня Lean давно вышел за пределы автозаводов. Больницы сокращают время ожидания пациентов
    и наводят порядок в операционных. Банки ускоряют одобрение кредитов. IT-команды работают
    с Kanban-досками и выпускают продукт маленькими шагами. Рестораны продумывают рабочее место повара.

    Главная мысль слайда: Lean — это не набор инструментов для заводов. Это способ смотреть
    на любую работу как на процесс, который можно сделать понятнее, быстрее и без лишнего.
  `,html:({img:e})=>`
    <div class="td-left">
      <p class="eyebrow" data-r style="--i:0"><b>Сегодня</b> 2000-е — 2020-е</p>
      <h2 class="h1" data-r style="--i:1">Lean сегодня</h2>
      <p class="lead" data-r style="--i:2">Не только автомобили: подход работает везде, где есть процесс.</p>
      <figure class="td-photo photo photo--modern" data-r="mask" style="--i:3">
        ${e("kanbanboard")}
      </figure>
      <p class="td-thesis" data-r style="--i:4">Lean — это не набор инструментов для заводов. <span>Это способ организации процессов.</span></p>
    </div>

    <ul class="td-grid">
      ${at.map((t,s)=>`
        <li class="td-item" data-r style="--i:${s+3}">
          <span class="td-item__icon" style="--draw-delay:${500+s*110}ms">${v(t.icon,{size:52})}</span>
          <div>
            <h3>${t.title}</h3>
            <p>${t.text}</p>
          </div>
        </li>`).join("")}
    </ul>
  `},ot=[{icon:"automation",name:"Automation",ru:"автоматизация рутинных операций"},{icon:"iot",name:"IoT",ru:"датчики сообщают о состоянии станков"},{icon:"data",name:"Big Data",ru:"решения на основе данных, а не догадок"},{icon:"chip",name:"AI",ru:"прогноз поломок, спроса и брака"},{icon:"robot",name:"Robotics",ru:"точность и скорость на тяжёлых операциях"}],nt=[{x:210,y:250,label:"Датчик · вибрация",value:"норма"},{x:520,y:520,label:"ИИ-контроль качества",value:"99,7 %"},{x:170,y:760,label:"Прогноз обслуживания",value:"через 6 дн."}],lt={id:"tech",chapter:"Lean + технологии",title:"Lean + современные технологии",theme:"dark",notes:`
    Сегодня Lean соединяется с технологиями Industry 4.0: автоматизацией, интернетом вещей,
    большими данными, искусственным интеллектом и роботами.

    Важно понимать порядок. Lean сначала убирает ненужные процессы. Технологии потом помогают
    делать нужные процессы быстрее, точнее и дешевле. Если автоматизировать процесс с потерями,
    потери тоже станут автоматическими — и быстрыми.

    Так появляется «умный завод»: датчики следят за станками, ИИ замечает брак и предсказывает
    поломки заранее, а люди занимаются улучшениями.
  `,html:({img:e})=>`
    <figure class="tc-photo photo photo--modern kb grain" data-r="fade" style="--i:0">
      ${e("smartfactory")}
    </figure>
    <div class="tc-shade"></div>

    <div class="tc-hud" aria-hidden="true">
      ${nt.map((t,s)=>`
        <div class="tc-tag" style="left:${t.x}px;top:${t.y}px;--i:${s*2+9}" data-r="scale">
          <i></i><span>${t.label}</span><b>${t.value}</b>
        </div>`).join("")}
      <span class="tc-badge" data-r style="--i:14">= Smart Factory</span>
    </div>

    <div class="tc-main">
      <p class="eyebrow" data-r style="--i:0"><b>Industry 4.0</b> 2010-е — 2020-е</p>
      <h2 class="h1" data-r style="--i:1">Lean + технологии</h2>

      <ol class="tc-stack">
        <li class="tc-lean" data-r style="--i:2"><strong>Lean</strong><span class="tc-lean__text">сначала убираем всё ненужное</span></li>
        ${ot.map((t,s)=>`
          <li data-r="left" style="--i:${s+3}">
            <em>+</em>
            <span class="tc-ic" style="--draw-delay:${600+s*140}ms">${v(t.icon,{size:36})}</span>
            <b>${t.name}</b>
            <span>${t.ru}</span>
          </li>`).join("")}
      </ol>

      <div class="tc-split" data-r style="--i:9">
        <p><span class="label">Lean</span><span>устраняет <b>ненужные</b> процессы</span></p>
        <p><span class="label accent">AI и автоматизация</span><span>делают <b>необходимые</b> процессы быстрее, точнее и дешевле</span></p>
      </div>
    </div>
  `},x=[{name:"Ford",when:"1913",note:"конвейер"},{name:"Toyota",when:"1937",note:"своя дорога"},{name:"TPS",when:"1950-е",note:"JIT + Jidoka"},{name:"Lean Production",when:"1988",note:"имя для всего мира"},{name:"Continuous Improvement",when:"каждый день",note:"кайдзен"},{name:"Smart Factory",when:"2020-е",note:"Lean + AI"}],rt=[D,R,J,K,G,X,Z,st,et,it,lt,{id:"finale",chapter:"Итог",title:"Итог: культура постоянного улучшения",theme:"dark",notes:`
    Подведём итог. Lean Production возникла из необходимости: у послевоенной Toyota не было
    ресурсов, чтобы повторять путь Форда. Пришлось научиться делать больше с меньшими ресурсами.

    Цепочка развития: конвейер Форда, собственный путь Toyota, Toyota Production System,
    международное имя Lean Production, культура постоянного улучшения — и сегодня умные заводы.

    Главная мысль: Lean — это не просто технология производства. Это культура, в которой каждый
    каждый день немного улучшает свою работу. Спасибо за внимание!
  `,html:()=>`
    <div class="fn-kanji jp" aria-hidden="true" data-r="blur" style="--i:0">改善</div>

    <div class="fn-head">
      <p class="eyebrow" data-r style="--i:0"><b>Итог</b> 1913 — сегодня</p>
      <h2 class="fn-title" data-r style="--i:1">Lean Production возникла из необходимости делать <span>больше с&nbsp;меньшими ресурсами</span></h2>
    </div>

    <div class="fn-chain">
      <svg class="fn-line" viewBox="0 0 1696 4" preserveAspectRatio="none" aria-hidden="true">
        <path class="fn-line__base" d="M0 2 H1696"/>
        <path class="draw fn-line__run" pathLength="1" d="M0 2 H1696" style="--draw-delay:700ms;--draw-dur:2400ms"/>
      </svg>
      <ol>
        ${x.map((e,t)=>`
          <li class="fn-node ${t===x.length-1?"is-last":""}" style="--k:${t}">
            <span class="fn-when" data-r="fade" style="--i:${t*2.6+4}">${e.when}</span>
            <span class="fn-dot"></span>
            <b data-r style="--i:${t*2.6+5}">${e.name}</b>
            <span class="fn-note" data-r="fade" style="--i:${t*2.6+6}">${e.note}</span>
          </li>`).join("")}
      </ol>
    </div>

    <blockquote class="fn-quote" data-r style="--i:20">
      «Lean — это не просто технология производства. <span>Это культура постоянного улучшения.»</span>
    </blockquote>

    <div class="fn-bottom" data-r="fade" style="--i:23">
      <span class="fn-thanks">Спасибо за внимание</span>
      <span class="fn-seal"><span class="seal">改善</span><span class="caption">кайдзен — <b>непрерывное улучшение</b></span></span>
      <button class="fn-credits" type="button" data-action="credits">Источники фото</button>
    </div>
  `}],_={cover:{file:"images/cover-robots.jpg",alt:"Красные промышленные роботы собирают кузов автомобиля в светлом цехе",title:"Роботы на сборочной линии, завод во Фримонте, Калифорния (2011)",author:"Steve Jurvetson",license:"CC BY 2.0",source:"https://commons.wikimedia.org/wiki/File:Tesla_auto_bots.jpg",position:"62% 50%"},massprod:{file:"images/highland-park-line.jpg",alt:"Ряд одинаковых шасси Ford Model T на сборочном конвейере",title:"Шасси Model T на конвейере, Ford, Хайленд-Парк (1913)",author:"Library of Congress",license:"Public domain",source:"https://commons.wikimedia.org/wiki/File:Assembly_line_at_the_Ford_Motor_Company%27s_Highland_Park_plant_LCCN2011661021.jpg",position:"40% 50%"},fordline:{file:"images/ford-assembly-line-1913.jpg",alt:"Рабочие собирают магнето на конвейере Ford, 1913 год",title:"Конвейер сборки магнето, Ford (1913)",author:"Ford Motor Company",license:"Public domain",source:"https://commons.wikimedia.org/wiki/File:Ford_assembly_line_-_1913.jpg",position:"30% 50%"},ford:{file:"images/henry-ford-1919.jpg",alt:"Портрет Генри Форда",title:"Генри Форд (около 1919)",author:"Fred Hartsook",license:"Public domain",source:"https://commons.wikimedia.org/wiki/File:Henry_ford_1919.jpg",position:"50% 18%"},modelt:{file:"images/ford-model-t-1910.jpg",alt:"Автомобиль Ford Model T 1910 года",title:"Ford Model T (1910)",author:"Harry Shipler",license:"Public domain",source:"https://commons.wikimedia.org/wiki/File:1910Ford-T.jpg",position:"60% 70%"},tokyo:{file:"images/hachioji-1945.jpg",alt:"Город Хатиодзи под Токио после авианалётов, руины домов",title:"Хатиодзи (префектура Токио) после авианалётов, август 1945",author:"Исикава Коё (Ishikawa Kōyō)",license:"Public domain",source:"https://commons.wikimedia.org/wiki/File:Photo-TokyoAirRaids-1945-8-2-Hachi%C5%8Dji-View-1.png"},ohno:{file:"images/taiichi-ohno.jpg",alt:"Портрет Тайити Оно",title:"Тайити Оно (опубликовано в 1958)",author:"Toyota Motor Co. (история компании)",license:"Public domain",source:"https://commons.wikimedia.org/wiki/File:Ohno-Taiichi-1.jpg"},sakichi:{file:"images/sakichi-toyoda.jpg",alt:"Портрет Сакити Тоёды",title:"Сакити Тоёда (до 1930)",author:"Автор неизвестен",license:"Public domain",source:"https://commons.wikimedia.org/wiki/File:Sakichi_Toyoda.jpg"},kiichiro:{file:"images/kiichiro-toyoda.jpg",alt:"Портрет Киитиро Тоёды",title:"Киитиро Тоёда (до 1952)",author:"Автор неизвестен",license:"Public domain",source:"https://commons.wikimedia.org/wiki/File:Kiichiro_Toyoda.jpg"},loom:{file:"images/toyoda-loom.jpg",alt:"Автоматический ткацкий станок Toyoda",title:"Автоматический ткацкий станок Toyoda, тип G",author:"Daderot",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Toyoda_Automatic_Loom_-_National_Museum_of_Nature_and_Science,_Tokyo_-_DSC07343.JPG"},kanbanboard:{file:"images/kanban-board.jpg",alt:"Kanban-доска с карточками задач",title:"Kanban-доска: «Сделать — В работе — Готово»",author:"Jeff.lasovski",license:"CC BY-SA 3.0",source:"https://commons.wikimedia.org/wiki/File:Simple-kanban-board-.jpg",position:"50% 18%"},smartfactory:{file:"images/smart-factory.jpg",alt:"Роботы KUKA выполняют точечную сварку кузовов автомобилей",title:"Роботизированная сварка кузовов, завод BMW в Лейпциге (2005)",author:"BMW Werk Leipzig",license:"CC BY-SA 2.0 DE",source:"https://commons.wikimedia.org/wiki/File:BMW_Leipzig_MEDIA_050719_Download_Karosseriebau_max.jpg"}},ct=document.getElementById("app");function dt(){const e="./",t=Object.values(_).map(n=>new Promise(o=>{const l=new Image;l.onload=l.onerror=o,l.src=`${e}${n.file}`})),s=document.fonts?document.fonts.ready:Promise.resolve(),i=new Promise(n=>setTimeout(n,2500));return Promise.race([Promise.all([...t,s]),i])}dt().then(()=>{const e=new z(ct,rt,{images:_,base:"./"}).mount();window.__deck=e})})();
