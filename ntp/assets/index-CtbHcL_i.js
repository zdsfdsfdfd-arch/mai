(function(){"use strict";const j='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',D='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',P=s=>String(s).padStart(2,"0");function $(s,t={},e=""){const a=document.createElement(s);for(const[n,i]of Object.entries(t))i===!1||i==null||a.setAttribute(n,i===!0?"":i);return e&&(a.innerHTML=e),a}function I(s){const t=$("div",{class:"chrome","aria-hidden":"false"});return t.innerHTML=`
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
        <div class="counter" aria-live="polite"><b class="cur">01</b> / ${P(s)}</div>
        <div class="nav-btns">
          <button class="nav-btn" type="button" data-action="prev" aria-label="Предыдущий слайд">${j}</button>
          <button class="nav-btn" type="button" data-action="next" aria-label="Следующий слайд">${D}</button>
        </div>
      </div>
    </div>
    <div class="progress" role="progressbar" aria-label="Прогресс презентации" aria-valuemin="1" aria-valuemax="${s}">
      <div class="progress-fill"></div>
      <div class="progress-ticks">
        ${Array.from({length:s},(e,a)=>`<button type="button" data-goto="${a}" aria-label="Слайд ${a+1}"></button>`).join("")}
      </div>
    </div>`,t}function F(s){const t=$("div",{class:"overlay",id:"overview",role:"dialog","aria-modal":"true","aria-label":"Содержание"});return t.innerHTML=`
    <div class="overlay-panel">
      <div class="overlay-head">
        <h2>Содержание</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <div class="overview-grid">
        ${s.map((e,a)=>`
          <button class="overview-item" type="button" data-goto="${a}">
            <span class="n">${P(a+1)} · ${e.chapter}</span>
            <span class="t">${e.title}</span>
          </button>`).join("")}
      </div>
    </div>`,t}function q(){const s=$("aside",{class:"notes",id:"notes","aria-label":"Заметки докладчика"});return s.innerHTML=`
    <div class="notes-inner">
      <div class="notes-label">Заметки докладчика<br><span class="muted">N — скрыть</span></div>
      <div class="notes-text"></div>
    </div>`,s}function B(){const s=[["Следующий слайд","→ · Пробел · PgDn"],["Предыдущий слайд","← · Shift+Пробел · PgUp"],["Первый / последний","Home · End"],["Содержание","O · Esc"],["Заметки докладчика","N"],["Полный экран","F"],["Источники фотографий","I"],["Эта подсказка","H · ?"]],t=$("div",{class:"overlay",id:"help",role:"dialog","aria-modal":"true","aria-label":"Управление"});return t.innerHTML=`
    <div class="overlay-panel" style="width:min(820px,100%)">
      <div class="overlay-head">
        <h2>Управление</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <div class="keys">
        ${s.map(([e,a])=>`<div><span>${e}</span><kbd>${a}</kbd></div>`).join("")}
      </div>
      <p class="muted" style="margin-top:24px;font-size:14px">На телефоне и планшете листайте свайпом влево и вправо.</p>
    </div>`,t}function W(s,t){const e=$("div",{class:"overlay",id:"credits",role:"dialog","aria-modal":"true","aria-label":"Источники фотографий"}),a=Object.values(s).map(n=>`
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
    </div>`,e}const G=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches,U=s=>1-Math.pow(1-s,3);function _(s,t=0){const e=s.toFixed(t),[a,n]=e.split("."),i=a.length>4?a.replace(/\B(?=(\d{3})+(?!\d))/g," "):a;return n?`${i},${n}`:i}const N=new WeakMap;function K(s){s.querySelectorAll("[data-count]").forEach(t=>{const e=parseFloat(t.dataset.count),a=parseFloat(t.dataset.from??"0"),n=parseInt(t.dataset.decimals??"0",10),i=parseInt(t.dataset.duration??"1600",10),r=parseInt(t.dataset.delay??"350",10);if(cancelAnimationFrame(N.get(t)),G()){t.textContent=_(e,n);return}t.textContent=_(a,n);const l=performance.now()+r,m=o=>{const d=Math.min(1,Math.max(0,(o-l)/i));t.textContent=_(a+(e-a)*U(d),n),d<1&&N.set(t,requestAnimationFrame(m))};N.set(t,requestAnimationFrame(m))})}function Y(s){s.querySelectorAll("[data-count]").forEach(t=>{cancelAnimationFrame(N.get(t)),t.textContent=_(parseFloat(t.dataset.count),parseInt(t.dataset.decimals??"0",10))})}const X=1920,J=1080,Q=2600;class Z{constructor(t,e,{images:a={},base:n="./"}={}){this.root=t,this.slides=e,this.images=a,this.base=n,this.index=-1,this.step=0,this.locked=!1}mount(){const{root:t,slides:e}=this;this.stage=$("div",{class:"stage","data-dir":"fwd"}),this.track=$("div",{class:"slides"}),this.sections=e.map((n,i)=>{const r=$("section",{class:`slide slide--${n.id}`,"data-theme":n.theme||"dark","data-index":i,"aria-roledescription":"слайд","aria-label":`${i+1} из ${e.length}: ${n.title}`});return r.innerHTML=n.html({base:this.base,img:this.img.bind(this)}),this.track.appendChild(r),r}),this.chrome=I(e.length),this.stage.append(this.track,this.chrome),this.overview=F(e),this.notes=q(),this.help=B(),this.credits=W(this.images,this.base),this.toast=$("div",{class:"toast",role:"status"},"→ или Пробел — дальше · H — управление"),t.append(this.stage,this.notes,this.overview,this.help,this.credits,this.toast),this.$={chapterWrap:this.chrome.querySelector(".chrome-chapter"),chapterNum:this.chrome.querySelector(".chrome-chapter .num"),chapterName:this.chrome.querySelector(".chrome-chapter .name"),counter:this.chrome.querySelector(".counter .cur"),fill:this.chrome.querySelector(".progress-fill"),progress:this.chrome.querySelector(".progress"),dots:this.chrome.querySelector(".step-dots"),prev:this.chrome.querySelector('[data-action="prev"]'),next:this.chrome.querySelector('[data-action="next"]'),notesText:this.notes.querySelector(".notes-text")},this.bind(),this.fit();const a=this.indexFromHash();return this.go(a??0,{instant:!0}),setTimeout(()=>this.toast.classList.add("is-show"),900),setTimeout(()=>this.toast.classList.remove("is-show"),5200),this.pokeIdle(),this}img(t,{alt:e,className:a="",position:n}={}){const i=this.images[t];if(!i)throw new Error(`Unknown image: ${t}`);const r=n||i.position,l=r?` style="object-position:${r}"`:"",m=a?` class="${a}"`:"";return`<img src="${this.base}${i.file}" alt="${e??i.alt}"${m} decoding="async" draggable="false"${l}>`}fit(){const t=this.root.clientWidth,e=this.root.clientHeight,a=Math.min(t/X,e/J);this.stage.style.setProperty("--scale",String(a))}stepsOf(t){return Math.max(1,this.slides[t]?.steps||1)}next(){if(this.step<this.stepsOf(this.index)-1)return this.setStep(this.step+1);this.index<this.slides.length-1&&this.go(this.index+1)}prev(){if(this.step>0)return this.setStep(this.step-1);this.index>0&&this.go(this.index-1,{step:this.stepsOf(this.index-1)-1})}go(t,{step:e=0,instant:a=!1}={}){const n=Math.max(0,Math.min(this.slides.length-1,t));if(n===this.index){this.setStep(e);return}const i=this.index,r=this.sections[i],l=this.sections[n],m=this.slides[n];this.stage.dataset.dir=n>i?"fwd":"back",r&&(r.classList.remove("is-active"),r.classList.add("is-leaving"),clearTimeout(r._leaveTimer),r._leaveTimer=setTimeout(()=>r.classList.remove("is-leaving"),750),r.setAttribute("aria-hidden","true"),r.inert=!0),l.classList.remove("is-leaving"),l.offsetWidth,a&&(l.style.transition="none"),l.classList.add("is-active"),l.removeAttribute("aria-hidden"),l.inert=!1,a&&requestAnimationFrame(()=>l.style.transition=""),this.index=n,this.step=-1,this.setStep(e,{silent:!0}),this.stage.classList.toggle("is-light",m.theme==="light"),K(l),r&&setTimeout(()=>Y(r),800),m.onEnter?.(l,this),this.updateChrome(m,i===-1),this.updateHash()}setStep(t,{silent:e=!1}={}){const a=this.stepsOf(this.index)-1,n=Math.max(0,Math.min(a,t));if(n===this.step&&!e)return;this.step=n;const i=this.sections[this.index];i.dataset.step=String(n),this.slides[this.index].onStep?.(i,n,this),this.renderDots(),this.updateProgress(),this.updateNav()}updateChrome(t,e){const{chapterWrap:a,chapterNum:n,chapterName:i,counter:r,notesText:l}=this.$,m=()=>{n.textContent=P(this.index+1),i.textContent=t.chapter,a.classList.remove("is-swapping")};e?m():(a.classList.add("is-swapping"),setTimeout(m,260)),r.textContent=P(this.index+1),l.innerHTML=(t.notes||"").trim().split(/\n\s*\n/).map(o=>`<p>${o.trim()}</p>`).join(""),this.overview.querySelectorAll(".overview-item").forEach((o,d)=>o.classList.toggle("is-current",d===this.index)),this.$.progress.setAttribute("aria-valuenow",String(this.index+1))}updateProgress(){const t=this.slides.length,e=this.stepsOf(this.index),a=e>1?this.step/e:0,n=(this.index+a+1)/t*100;this.$.fill.style.width=`${Math.min(100,n)}%`}renderDots(){const t=this.stepsOf(this.index);this.$.dots.innerHTML=t>1?Array.from({length:t},(e,a)=>`<i class="${a<=this.step?"on":""}"></i>`).join(""):""}updateNav(){const t=this.index===0&&this.step===0,e=this.index===this.slides.length-1&&this.step===this.stepsOf(this.index)-1;this.$.prev.disabled=t,this.$.next.disabled=e}updateHash(){const t=`#slide-${this.index+1}`;try{location.hash!==t&&history.replaceState(null,"",t)}catch{}}indexFromHash(){const t=/^#slide-(\d+)$/.exec(location.hash);if(!t)return null;const e=parseInt(t[1],10)-1;return e>=0&&e<this.slides.length?e:null}openOverlay(t){[this.overview,this.help,this.credits].forEach(a=>a!==t&&a.classList.remove("is-open")),t.classList.add("is-open"),this.activeOverlay=t;const e=t.querySelector(".is-current")||t.querySelector("[data-close]");setTimeout(()=>e?.focus({preventScroll:!0}),50)}closeOverlay(){return this.activeOverlay?(this.activeOverlay.classList.remove("is-open"),this.activeOverlay=null,!0):!1}toggleOverlay(t){this.activeOverlay===t?this.closeOverlay():this.openOverlay(t)}toggleNotes(){this.notes.classList.toggle("is-open")}async toggleFullscreen(){try{document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()}catch{}}pokeIdle(){this.root.classList.remove("is-idle"),clearTimeout(this.idleTimer),this.idleTimer=setTimeout(()=>this.root.classList.add("is-idle"),Q)}bind(){window.addEventListener("resize",()=>this.fit()),window.addEventListener("hashchange",()=>{const i=this.indexFromHash();i!=null&&i!==this.index&&this.go(i)}),document.addEventListener("keydown",i=>this.onKey(i)),document.addEventListener("mousemove",()=>this.pokeIdle(),{passive:!0}),this.root.addEventListener("click",i=>{const r=i.target.closest("[data-action],[data-goto],[data-close],[data-step-to]");if(!r)return;if(r.hasAttribute("data-close"))return void this.closeOverlay();if(r.dataset.goto!=null)return this.closeOverlay(),void this.go(parseInt(r.dataset.goto,10));if(r.dataset.stepTo!=null)return void this.setStep(parseInt(r.dataset.stepTo,10));const l=r.dataset.action;l==="next"?this.next():l==="prev"?this.prev():l==="overview"?this.toggleOverlay(this.overview):l==="credits"?this.toggleOverlay(this.credits):l==="help"&&this.toggleOverlay(this.help)}),[this.overview,this.help,this.credits].forEach(i=>i.addEventListener("click",r=>{r.target===i&&this.closeOverlay()}));let t=0,e=0,a=0;this.stage.addEventListener("touchstart",i=>{const r=i.touches[0];t=r.clientX,e=r.clientY,a=Date.now()},{passive:!0}),this.stage.addEventListener("touchend",i=>{const r=i.changedTouches[0],l=r.clientX-t,m=r.clientY-e;Date.now()-a<700&&Math.abs(l)>40&&Math.abs(l)>Math.abs(m)*1.3&&(l<0?this.next():this.prev())},{passive:!0});let n=0;window.addEventListener("wheel",i=>{if(this.activeOverlay)return;const r=Math.abs(i.deltaY)>Math.abs(i.deltaX)?i.deltaY:i.deltaX;if(Math.abs(r)<24)return;const l=Date.now();l<n||(n=l+900,r>0?this.next():this.prev())},{passive:!0})}onKey(t){if(t.metaKey||t.ctrlKey||t.altKey)return;const e=t.key;if(this.pokeIdle(),e==="Escape")return this.closeOverlay()?t.preventDefault():this.notes.classList.contains("is-open")?this.toggleNotes():this.openOverlay(this.overview);if(this.activeOverlay){(e==="o"||e==="O"||e==="щ"||e==="Щ")&&this.activeOverlay===this.overview&&this.closeOverlay(),(e==="i"||e==="I"||e==="ш"||e==="Ш")&&this.activeOverlay===this.credits&&this.closeOverlay(),(e==="h"||e==="H"||e==="?"||e==="р"||e==="Р")&&this.activeOverlay===this.help&&this.closeOverlay();return}const a=document.activeElement?.tagName==="BUTTON";switch(e){case"ArrowRight":case"ArrowDown":case"PageDown":return t.preventDefault(),this.next();case"ArrowLeft":case"ArrowUp":case"PageUp":return t.preventDefault(),this.prev();case" ":case"Spacebar":return a?void 0:(t.preventDefault(),t.shiftKey?this.prev():this.next());case"Enter":return a?void 0:(t.preventDefault(),this.next());case"Home":return t.preventDefault(),this.go(0);case"End":return t.preventDefault(),this.go(this.slides.length-1)}const i={f:"fs",F:"fs",а:"fs",А:"fs",n:"notes",N:"notes",т:"notes",Т:"notes",o:"overview",O:"overview",щ:"overview",Щ:"overview",h:"help",H:"help","?":"help",р:"help",Р:"help",i:"credits",I:"credits",ш:"credits",Ш:"credits"}[e];i==="fs"?this.toggleFullscreen():i==="notes"?this.toggleNotes():i==="overview"?this.toggleOverlay(this.overview):i==="help"?this.toggleOverlay(this.help):i==="credits"&&this.toggleOverlay(this.credits)}}const M=680,tt=150;function et(){const s=window.AudioContext||window.webkitAudioContext;if(!s)return null;const t=new s,e=t.createGain();e.gain.value=.55,e.connect(t.destination);const a=t.createBuffer(1,t.sampleRate,t.sampleRate),n=a.getChannelData(0);for(let o=0;o<n.length;o++)n[o]=Math.random()*2-1;const i=(o,d=1,u=.32)=>{const g=t.createOscillator(),p=t.createGain();g.type="sine",g.frequency.setValueAtTime(170,o),g.frequency.exponentialRampToValueAtTime(38,o+u),p.gain.setValueAtTime(1e-4,o),p.gain.exponentialRampToValueAtTime(d,o+.008),p.gain.exponentialRampToValueAtTime(1e-4,o+u),g.connect(p).connect(e),g.start(o),g.stop(o+u+.05)},r=(o,d,u,g,p)=>{const S=t.createBufferSource();S.buffer=a,S.loop=!0;const A=t.createBiquadFilter();A.type="bandpass",A.Q.value=.9,A.frequency.setValueAtTime(u,o),A.frequency.exponentialRampToValueAtTime(g,o+d);const C=t.createGain();C.gain.setValueAtTime(1e-4,o),C.gain.exponentialRampToValueAtTime(p,o+Math.min(.01,d/2)),C.gain.exponentialRampToValueAtTime(1e-4,o+d),S.connect(A).connect(C).connect(e),S.start(o),S.stop(o+d+.05)},l=(o,d)=>{const u=t.createBufferSource();u.buffer=a,u.loop=!0;const g=t.createBiquadFilter();g.type="bandpass",g.Q.value=1.4,g.frequency.setValueAtTime(300,o),g.frequency.exponentialRampToValueAtTime(6e3,o+d);const p=t.createGain();p.gain.setValueAtTime(1e-4,o),p.gain.exponentialRampToValueAtTime(.35,o+d),p.gain.exponentialRampToValueAtTime(1e-4,o+d+.04),u.connect(g).connect(p).connect(e),u.start(o),u.stop(o+d+.1)},m=o=>{i(o,1,1.4);const d=t.createOscillator(),u=t.createGain();d.type="triangle",d.frequency.setValueAtTime(55,o),u.gain.setValueAtTime(1e-4,o),u.gain.exponentialRampToValueAtTime(.5,o+.02),u.gain.exponentialRampToValueAtTime(1e-4,o+1.6),d.connect(u).connect(e),d.start(o),d.stop(o+1.7),r(o,.9,5e3,400,.4)};return{play(o){const d=t.currentTime+.05;o.forEach((u,g)=>{const p=d+(g*M+tt)/1e3;if(u.last)return m(p);i(p,.9),r(p,u.acc?.18:.07,u.acc?2400:7e3,u.acc?900:5e3,u.acc?.45:.25),u.photo&&l(p-M/1e3+.05,M/1e3-.08)})},stop(){try{e.gain.setTargetAtTime(0,t.currentTime,.05),setTimeout(()=>t.close(),400)}catch{}}}}function st(s,t){const e=window.matchMedia("(prefers-reduced-motion: reduce)").matches,a=/^#slide-(\d+)$/.exec(location.hash);if(e||a&&a[1]!=="1")return Promise.resolve();const n=[{big:"Курсовая",small:"МДК 01.02 · 2026"},{big:"UDP 123",small:"один порт на всю службу"},{big:"4 метки",small:"t1 · t2 · t3 · t4",acc:!0},{big:"Stratum 2",small:"сервер chrony"},{big:"0,18 мс",small:"смещение часов",acc:!0},{big:"Сверим часы",small:"все устройства · одно время"},{big:"Служба времени NTP",small:"синхронизация в корпоративной сети",last:!0}];return new Promise(i=>{const r=document.createElement("div");r.className="intro",r.innerHTML='<div class="intro__gate"><i></i><b>Начать</b><small>любая клавиша или клик · со звуком</small></div>'+n.map((p,S)=>`
        <div class="intro__beat${p.acc?" intro__beat--acc":""}${p.photo?" intro__beat--photo":""}${p.last?" intro__beat--last":""}" style="--n:${S}">
          ${p.photo?`<img src="${t}${p.photo}" alt="">`:""}
          <div><b>${p.big}</b><small>${p.small}</small></div>
        </div>`).join("")+`<i class="intro__bar" style="--total:${n.length*M}ms"></i><span class="intro__skip">любая клавиша — пропустить</span>`,s.appendChild(r);let l="gate",m=null;const o=()=>{l!=="done"&&(l="done",document.removeEventListener("keydown",g,!0),m?.stop(),r.classList.add("is-out"),setTimeout(()=>r.remove(),600),i())},d=()=>{l="playing";try{m=et(),m?.play(n)}catch{m=null}r.classList.add("is-playing"),setTimeout(o,n.length*M+1100)},u=()=>l==="gate"?d():o(),g=p=>{p.metaKey||p.ctrlKey||p.altKey||(p.stopPropagation(),p.preventDefault(),u())};document.addEventListener("keydown",g,!0),r.addEventListener("click",u)})}const h=s=>typeof s=="number"?`${s}px`:s,c=(s,{x:t,y:e,w:a,h:n,rot:i=0,tone:r="cream",i:l=1,cls:m="",deco:o="",r:d=""}={})=>`
  <div class="sheet sheet--${r} ${m}" data-r${d?`="${d}"`:""} style="left:${h(t)};top:${h(e)};width:${h(a)};${n?`height:${h(n)};`:""}--rot:${i}deg;--i:${l}">
    <div class="sheet__in">${s}</div>${o}
  </div>`,y=({x:s,y:t,rot:e=-4,w:a=120,tone:n=""}={})=>`<i class="tape ${n?`tape--${n}`:""}" style="left:${h(s)};top:${h(t)};width:${h(a)};--rot:${e}deg"></i>`,x=({x:s,y:t,tone:e=""}={})=>`<i class="pin ${e?`pin--${e}`:""}" style="left:${h(s)};top:${h(t)}"></i>`,at=({x:s,y:t,rot:e=8}={})=>`
  <svg class="clip" style="left:${h(s)};top:${h(t)};--rot:${e}deg" viewBox="0 0 40 96" aria-hidden="true">
    <path d="M12 26 V70 a8 8 0 0 0 16 0 V18 a12 12 0 0 0 -24 0 V72 a16 16 0 0 0 32 0 V30"/>
  </svg>`,k=(s,t,{x:e,y:a,w:n,h:i=240,rot:r=2,i:l=3,kind:m="polaroid",fix:o="tape"}={})=>{const d=o==="tape"?y({x:n/2-62,y:-18,rot:-3-r}):o==="clip"?at({x:n-70,y:-34}):o==="pin"?x({x:n/2-12,y:6}):o==="corners"?'<i class="corner corner--tl"></i><i class="corner corner--tr"></i><i class="corner corner--bl"></i><i class="corner corner--br"></i>':"";return`
  <figure class="photo2 photo2--${m}" data-r="slip" style="left:${h(e)};top:${h(a)};width:${h(n)};--rot:${r}deg;--i:${l}">
    <div class="photo2__in">
      <div class="photo2__pic" style="height:${h(i)}">${s}</div>
      ${t?`<figcaption>${t}</figcaption>`:""}
    </div>${d}
  </figure>`},w=(s,t="",{x:e=110,y:a=118,rot:n=-1.2,i=1}={})=>`
  <div class="ttl" style="left:${h(e)};top:${h(a)}">
    <h2 class="ttl__strip" data-r style="--rot:${n}deg;--i:${i}"><span>${s}</span></h2>
    ${t?`<em class="ttl__hand" data-r="fade" style="--i:${i+3}">${t}</em>`:""}
  </div>`,L=(s,{x:t,y:e,rot:a=-2,size:n=46,i=12,color:r="",w:l}={})=>`
  <p class="scrib ${r?`scrib--${r}`:""}" data-r="fade" style="left:${h(t)};top:${h(e)};--rot:${a}deg;--i:${i};font-size:${n}px;${l?`width:${h(l)};`:""}">
    <span>${s}</span>
    <svg viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden="true"><path class="draw" pathLength="1" d="M3 9 C 50 3, 90 13, 150 8 S 250 4, 297 9" style="--draw-delay:${900+i*90}ms;--draw-dur:700ms"/></svg>
  </p>`,v=(s,{x:t,y:e,rot:a=-4,size:n=30,i=10,color:r=""}={})=>`<p class="note ${r?`note--${r}`:""}" data-r="fade" style="left:${h(t)};top:${h(e)};--rot:${a}deg;--i:${i};font-size:${n}px">${s}</p>`,T=(s,t,{x:e,y:a,w:n,h:i,delay:r=1500,color:l=""}={})=>`
  <svg class="pen ${l?`pen--${l}`:""}" style="left:${h(e)};top:${h(a)};width:${h(n)};height:${h(i)}" viewBox="0 0 ${n} ${i}" aria-hidden="true">
    <path class="draw" pathLength="1" d="${s}" style="--draw-delay:${r}ms;--draw-dur:700ms"/>
    <path class="draw" pathLength="1" d="${t}" style="--draw-delay:${r+650}ms;--draw-dur:250ms"/>
  </svg>`,O=({x:s,y:t,w:e,h:a,delay:n=1600,color:i="red"}={})=>`
  <svg class="pen pen--${i}" style="left:${h(s)};top:${h(t)};width:${h(e)};height:${h(a)}" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true">
    <path class="draw" pathLength="1" d="M28 22 C 70 2, 150 4, 180 30 S 170 92, 100 94 S 10 80, 14 44 S 60 8, 120 10" style="--draw-delay:${n}ms;--draw-dur:900ms"/>
  </svg>`,E=s=>`<mark class="hl">${s}</mark>`,it=(s,t=2)=>{const e=["cream","terra","white","green","yellow","kraft"],a=[-5,3,-2,6,-4,2,-6,4];return`<span class="cut" aria-label="${s}">${[...s].map((n,i)=>`<b class="cut__l cut__l--${e[i%e.length]}" data-r style="--rot:${a[i%a.length]}deg;--i:${t+i}" aria-hidden="true">${n}</b>`).join("")}</span>`},nt=()=>`
  <svg class="dial" viewBox="-320 -320 640 640" aria-hidden="true">
    <circle r="300" class="dial__rim"/>
    ${Array.from({length:60},(s,t)=>`<line class="dial__tick${t%5===0?" is-big":""}" x1="0" y1="${t%5===0?-250:-268}" x2="0" y2="-284" transform="rotate(${t*6})"/>`).join("")}
    ${[12,3,6,9].map((s,t)=>`<text class="dial__num" x="${[0,196,0,-196][t]}" y="${[-176,20,214,20][t]}" text-anchor="middle">${s}</text>`).join("")}
    <line class="dial__hand dial__hand--h" x1="0" y1="18" x2="0" y2="-136" transform="rotate(305)"/>
    <line class="dial__hand dial__hand--m" x1="0" y1="24" x2="0" y2="-208" transform="rotate(60)"/>
    <g class="dial__sec"><line x1="0" y1="44" x2="0" y2="-236"/><circle r="9"/></g>
  </svg>`,rt={id:"cover",chapter:"обложка",title:"Внедрение протокола NTP на сетевом оборудовании",theme:"light",notes:`
    Здравствуйте. Тема моей курсовой работы — внедрение протокола NTP на сетевом оборудовании:
    синхронизация времени в корпоративной сети.

    План доклада: как устроен NTP, чем он защищается, затем проект службы времени на базе chrony
    и Cisco IOS и проверка результата.
  `,html:({img:s})=>`
    ${c(`<p class="kicker" data-r="type" style="--i:3">Курсовая работа · МДК 01.02 · 2026</p>
       <h1 class="cv-h">Синхронизация<br>времени <em>по</em> ${it("NTP",5)}</h1>
       <p class="body cv-sub">Внедрение протокола NTP на сетевом оборудовании: синхронизация времени в корпоративной сети</p>`,{x:96,y:150,w:1010,rot:-1.4,tone:"cream",i:1,deco:y({x:60,y:-16,rot:-7,tone:"green"})+y({x:830,y:-14,rot:5})})}

    ${k(s("stclock"),"вокзальные часы — одни на всех",{x:1250,y:104,w:400,h:330,rot:3.5,i:5,fix:"tape"})}
    ${k(s("gps"),"спутник GPS: атомные часы на орбите",{x:1460,y:560,w:340,h:210,rot:-4,i:8,fix:"pin"})}

    <div class="dialwrap cv-dial" data-r style="--rot:-6deg;--i:7">${nt()}</div>
    ${v("все часы сети<br>должны идти так же",{x:1120,y:890,rot:-3,size:34,i:12})}

    ${c(`<dl class="cv-card">
         <div><dt>Выполнил</dt><dd>Г. К. Решетников</dd><dd class="s">группа СА24-16</dd></div>
         <div><dt>Руководитель</dt><dd>Е. Д. Волкова</dd><dd class="s">ПМ.01 Настройка сетевой инфраструктуры</dd></div>
         <div><dt>Специальность</dt><dd>09.02.06</dd><dd class="s">Сетевое и системное администрирование</dd></div>
       </dl>`,{x:130,y:760,w:900,rot:1.2,tone:"white",i:9})}
  `},ot={id:"goal",chapter:"актуальность и цель",title:"Актуальность и цель работы",theme:"light",notes:`
    Время — единая координата для всех событий в сети. Если часы коммутатора, сервера и межсетевого экрана
    расходятся, записи в журналах встают в неправильном порядке, и причину сбоя искать намного дольше.

    Кроме того, Kerberos, проверка сертификатов, резервное копирование и планировщики заданий
    прямо зависят от точного времени.

    Цель работы — разработать проект внедрения NTP: единый источник времени для серверов и сетевых устройств,
    с настройкой и методикой проверки.
  `,html:()=>`
    ${w("Актуальность и цель","зачем?")}

    ${c(`<ul class="rows">
         <li><span class="n">1</span><div><b>Журналы ${E("не сходятся")}</b><span>события с разных устройств встают в неправильном порядке</span></div></li>
         <li><span class="n">2</span><div><b>Сервисам нужно ${E("точное время")}</b><span>Kerberos, сертификаты, резервное копирование, планировщики</span></div></li>
         <li><span class="n">3</span><div><b>Нужен ${E("один источник")}</b><span>а не «каждое устройство ходит в интернет само»</span></div></li>
       </ul>`,{x:96,y:262,w:830,rot:.7,tone:"lined",i:2,deco:y({x:340,y:-18,rot:3})})}

    <div class="tickets">
      ${c('<span class="kicker">коммутатор SW1</span><b class="tk">10:02:17</b>',{x:1010,y:214,w:240,rot:-3,tone:"white",i:4,deco:x({x:108,y:-8,tone:"green"})})}
      ${c('<span class="kicker">сервер</span><b class="tk">10:02:41</b>',{x:1270,y:236,w:240,rot:2,tone:"yellow",i:5,deco:x({x:108,y:-8})})}
      ${c('<span class="kicker">межсетевой экран</span><b class="tk">10:01:58</b>',{x:1530,y:208,w:270,rot:-1.5,tone:"cream",i:6,deco:x({x:120,y:-8})})}
    </div>
    ${O({x:1276,y:290,w:228,h:76,delay:1900})}
    ${O({x:1548,y:262,w:236,h:76,delay:2100})}
    ${v("одно событие — три разных времени!",{x:1030,y:372,rot:-3,size:32,i:11,color:"red"})}

    ${c(`<span class="kicker">Цель работы</span>
       <p class="big">Разработать проект внедрения NTP: единый источник времени для серверов и сетевых устройств.</p>`,{x:1010,y:450,w:760,rot:-1.2,tone:"green",i:7,deco:y({x:600,y:-16,rot:6})})}

    ${c(`<dl class="kv">
         <div><dt>объект</dt><dd>работа и администрирование корпоративной сети</dd></div>
         <div><dt>предмет</dt><dd>синхронизация времени оборудования по NTP</dd></div>
         <div><dt>стенд</dt><dd>сервер chrony, маршрутизатор и два коммутатора Cisco IOS</dd></div>
       </dl>`,{x:1060,y:706,w:740,rot:1.4,tone:"white",i:9})}

    ${v("знакомо?",{x:660,y:660,rot:-6,size:38,i:12,color:"red"})}
    ${L("Часы всех устройств должны совпадать",{x:110,y:868,rot:-1.5,size:54,i:13,w:800})}
  `},lt=[{id:"t1",x:150,y:150,text:"отправил запрос",up:!0},{id:"t2",x:380,y:440,text:"принял запрос",up:!1},{id:"t3",x:600,y:440,text:"отправил ответ",up:!1},{id:"t4",x:830,y:150,text:"получил ответ",up:!0}],ct={id:"how",chapter:"как работает NTP",title:"Как работает NTP: четыре метки времени",theme:"light",notes:`
    NTP работает по модели «клиент–сервер» поверх UDP, порт 123. В каждом обмене участвуют четыре метки времени:
    t1 — клиент отправил запрос, t2 — сервер его принял, t3 — сервер отправил ответ, t4 — клиент ответ получил.

    Из этих четырёх чисел клиент считает две величины. Задержка — сколько пакет провёл в сети:
    полный оборот минус время обработки на сервере. Смещение — насколько часы клиента расходятся с часами сервера.

    Это базовая идея; полная реализация из RFC 5905 ещё фильтрует измерения и выбирает лучший источник.
  `,html:()=>`
    ${w("Четыре метки времени","раздел 1.2 · NTPv4")}

    ${c(`<svg class="dwg" viewBox="0 0 980 620" role="img" aria-label="Обмен NTP: запрос от клиента к серверу и ответ, четыре метки времени">
        <g class="in" style="--t:500ms">
          <text x="10" y="252" class="nm" style="font-size:28px">Клиент</text>
          <text x="10" y="410" class="nm" style="font-size:28px">Сервер</text>
          <path class="ln" d="M10 150 H950 M934 140 L952 150 L934 160"/>
          <path class="ln" d="M10 440 H950 M934 430 L952 440 L934 450"/>
          <text x="950" y="480" text-anchor="end" class="sub">время →</text>
        </g>
        <path class="draw ln ln--red" pathLength="1" d="M150 150 L380 440" style="--draw-delay:1100ms;--draw-dur:900ms"/>
        <path class="draw ln ln--red" pathLength="1" d="M600 440 L830 150" style="--draw-delay:2400ms;--draw-dur:900ms"/>
        <g class="in" style="--t:1700ms"><text x="238" y="322" class="hw" transform="rotate(51 238 322)">запрос</text></g>
        <g class="in" style="--t:3000ms"><text x="672" y="342" class="hw" transform="rotate(-51 672 342)">ответ</text></g>
        <g class="in" style="--t:2100ms">
          <path class="ln ln--thin" d="M380 486 v16 H600 v-16"/>
          <text x="490" y="536" text-anchor="middle" class="hw hw--ink" style="font-size:26px">сервер думает: t3 − t2</text>
        </g>
        <g class="in" style="--t:3500ms">
          <path class="ln ln--thin" d="M150 104 v-16 H830 v16"/>
          <text x="490" y="72" text-anchor="middle" class="hw hw--ink" style="font-size:26px">полный оборот: t4 − t1</text>
        </g>
        ${lt.map((s,t)=>{const e=t===0||t===2?16:-16,a=t===0||t===2?"start":"end",n=s.up?s.y-20:s.y+40,i=s.up?s.x+(t===0?-16:16):s.x+e,r=s.up?t===0?"end":"start":a;return`
          <g class="in" style="--t:${[1e3,2e3,2300,3300][t]}ms">
            <circle cx="${s.x}" cy="${s.y}" r="10" class="dot"/>
            <text x="${s.x+e}" y="${n}" text-anchor="${a}" class="nm" style="font-family:var(--f-mono);font-size:26px">${s.id}</text>
            <text x="${i}" y="${s.up?s.y+30:n+24}" text-anchor="${r}" class="sub">${s.text}</text>
          </g>`}).join("")}
        <circle r="7" class="run"><animateMotion dur="3.4s" repeatCount="indefinite" begin="3.8s" path="M150 150 L380 440 L600 440 L830 150"/></circle>
      </svg>`,{x:760,y:150,w:1060,rot:.9,tone:"graph",i:2,deco:y({x:40,y:-16,rot:-8})+y({x:900,y:-14,rot:6,tone:"terra"})})}

    ${c('<p class="body">Клиент спрашивает время у сервера и по четырём меткам <mark class="hl">отделяет расхождение часов от задержки сети</mark>.</p>',{x:96,y:270,w:600,rot:-1.2,tone:"cream",i:3})}
    ${c('<span class="kicker">задержка</span><p class="typed fm">d = (t4 − t1) − (t3 − t2)</p>',{x:120,y:470,w:560,rot:1.3,tone:"white",i:5,deco:y({x:-34,y:26,rot:-82,w:90})})}
    ${c('<span class="kicker">смещение часов</span><p class="typed fm">θ = ((t2 − t1) + (t3 − t4)) / 2</p>',{x:100,y:610,w:600,rot:-1.6,tone:"yellow",i:6,deco:y({x:540,y:22,rot:84,w:90,tone:"green"})})}

    <div class="stamp" data-r style="left:120px;top:790px;--rot:-8deg;--i:8"><div><b>UDP 123</b><span>порт службы</span></div></div>
    <div class="stamp stamp--green" data-r style="left:320px;top:806px;--rot:5deg;--i:9"><div><b>48</b><span>байт в пакете</span></div></div>
    <div class="stamp" data-r style="left:520px;top:788px;--rot:-3deg;--i:10"><div><b>1900</b><span>начало отсчёта</span></div></div>

    ${v("опоздал не я —<br>это задержка сети",{x:1570,y:846,rot:-5,size:30,i:13})}
    ${L("задержку вычли — осталось расхождение часов",{x:770,y:896,rot:-1.2,size:40,i:14,w:760})}
  `},f=(s,t,e,a,n,i="")=>`
  <rect x="${s}" y="${t}" width="${e}" height="70" class="lab ${i}"/>
  <text x="${s+e/2}" y="${t+31}" text-anchor="middle" class="nm ${i==="lab--terra"?"nm--light":""}">${a}</text>
  <text x="${s+e/2}" y="${t+54}" text-anchor="middle" class="sub ${i==="lab--terra"?"sub--light":""}">${n}</text>`,dt={id:"stratum",chapter:"иерархия Stratum",title:"Иерархия уровней Stratum",theme:"light",notes:`
    Stratum — это условное расстояние от эталонных часов. Эталон — уровень 0. Сервер, подключённый к нему напрямую, —
    Stratum 1. Каждый следующий, кто берёт время по NTP, получает номер на единицу больше.

    В проекте внутренний сервер chrony берёт время у внешних серверов и работает на уровне Stratum 2.
    Маршрутизатор и коммутаторы — Stratum 3, рабочие станции — Stratum 4.

    Значение 16 означает, что устройство не синхронизировано. Больший номер — не значит «плохо»,
    это просто больше ступеней до эталона.
  `,html:({img:s})=>`
    ${w("Иерархия Stratum","кто у кого берёт время")}

    ${k(s("gps"),"Stratum 0 — спутник GPS",{x:110,y:250,w:400,h:250,rot:-3,i:2,fix:"tape"})}

    ${c(`<ul class="lv">
         <li><b>0</b><span>эталон: GPS, атомные часы</span></li>
         <li><b>1</b><span>сервер рядом с эталоном</span></li>
         <li><b>2–15</b><span>берут время уровнем выше</span></li>
         <li><b>16</b><span>не синхронизирован</span></li>
       </ul>`,{x:110,y:640,w:500,rot:1.6,tone:"lined",i:4})}

    <svg class="dwg st-dwg" viewBox="0 0 1080 820" role="img" aria-label="Иерархия Stratum: эталонные часы, серверы Stratum 1, сервер chrony Stratum 2, сетевые устройства Stratum 3, станции Stratum 4">
      ${["0","1","2","3","4"].map((t,e)=>`<g class="in" style="--t:${400+e*450}ms"><text x="0" y="${86+e*170}" class="hw hw--ink" style="font-size:34px">stratum ${t}</text></g>`).join("")}
      <path class="draw ln" pathLength="1" d="M620 114 L450 220" style="--draw-delay:800ms;--draw-dur:500ms"/>
      <path class="draw ln" pathLength="1" d="M620 114 L860 220" style="--draw-delay:800ms;--draw-dur:500ms"/>
      <path class="draw ln ln--red" pathLength="1" d="M450 290 L650 390" style="--draw-delay:1250ms;--draw-dur:500ms"/>
      <path class="draw ln ln--red" pathLength="1" d="M860 290 L660 390" style="--draw-delay:1250ms;--draw-dur:500ms"/>
      <path class="draw ln" pathLength="1" d="M655 460 L370 560" style="--draw-delay:1700ms;--draw-dur:500ms"/>
      <path class="draw ln" pathLength="1" d="M655 460 L655 560" style="--draw-delay:1700ms;--draw-dur:500ms"/>
      <path class="draw ln" pathLength="1" d="M655 460 L940 560" style="--draw-delay:1700ms;--draw-dur:500ms"/>
      <path class="draw ln" pathLength="1" d="M655 630 L655 730" style="--draw-delay:2150ms;--draw-dur:500ms"/>
      <g class="in" style="--t:600ms" transform="rotate(-1.5 620 80)">${f(490,44,260,"Эталонные часы","GPS · атомные часы","lab--yellow")}</g>
      <g class="in" style="--t:1050ms"><g transform="rotate(1.2 450 255)">${f(330,220,240,"Сервер времени","3.ru.pool.ntp.org")}</g><g transform="rotate(-1 860 255)">${f(740,220,240,"Сервер времени","time.nist.gov")}</g></g>
      <g class="in" style="--t:1500ms" transform="rotate(-0.8 655 425)">${f(475,390,360,"NTP-сервер chrony","192.168.10.10 · внутри сети","lab--terra")}</g>
      <g class="in" style="--t:1950ms"><g transform="rotate(-1.5 370 595)">${f(260,560,220,"Коммутатор SW1","192.168.10.2")}</g><g transform="rotate(0.8 655 595)">${f(545,560,220,"Маршрутизатор R1","192.168.10.1")}</g><g transform="rotate(1.6 940 595)">${f(830,560,220,"Коммутатор SW2","192.168.10.3")}</g></g>
      <g class="in" style="--t:2400ms" transform="rotate(-1 655 765)">${f(495,730,320,"Рабочие станции и серверы","VLAN 20 и VLAN 30","lab--green")}</g>
    </svg>

    ${v("наш сервер",{x:1560,y:500,rot:-5,size:36,i:12,color:"red"})}
    ${T("M150 20 C 110 4, 50 10, 12 40","M30 22 L10 42 L36 48",{x:1420,y:520,w:160,h:60,delay:2700,color:"red"})}

    ${k(s("friendHood"),"stratum 16: рассинхрон",{x:1610,y:740,w:210,h:160,rot:5,i:11,fix:"clip"})}
  `},V=(s,t,e,a,n,i)=>`
  <span class="kicker">${s}</span>
  <h3 class="tg-name">${t}</h3>
  <p class="tg-num">${e}<small>${a}</small></p>
  <p class="tg-what">${n}</p>
  ${i.map(r=>`<p class="tg-row">${r}</p>`).join("")}`,ht={id:"compare",chapter:"NTP, SNTP, PTP",title:"Сравнение протоколов синхронизации",theme:"light",notes:`
    Кроме NTP есть ещё два протокола. SNTP — упрощённый вариант без фильтрации измерений, точность — десятки миллисекунд.
    PTP даёт субмикросекунды, но требует коммутаторов с аппаратными метками времени.

    Для корпоративной сети нужно сопоставлять журналы и обеспечивать работу Kerberos и резервного копирования —
    для этого миллисекундной точности NTPv4 достаточно, и специальное оборудование не нужно.
  `,html:()=>`
    ${w("NTP, SNTP или PTP","что выбрать?")}

    ${c(V("упрощённый","SNTP","~10","мс","единицы–десятки миллисекунд",["фильтрации и выбора источника нет","простые клиенты без требований к точности"]),{x:110,y:290,w:500,rot:-2.2,tone:"cream",i:2,cls:"tagcard",deco:x({x:238,y:10,tone:"green"})})}
    ${c(V("наш выбор","NTPv4","~1","мс","доли–единицы миллисекунд в локальной сети",["развитые алгоритмы фильтрации и выбора","серверы и сетевое оборудование"]),{x:700,y:250,w:530,rot:1,tone:"white",i:4,cls:"tagcard",deco:y({x:200,y:-18,rot:-3,tone:"terra"})})}
    ${c(V("IEEE 1588","PTP","<1","мкс","субмикросекунды",["нужны аппаратные метки времени на портах","АСУ ТП, биржевая торговля, телеком"]),{x:1300,y:300,w:500,rot:2.6,tone:"yellow",i:6,cls:"tagcard",deco:x({x:238,y:10})})}

    ${O({x:716,y:300,w:300,h:110,delay:2e3})}
    ${v("берём!",{x:1040,y:196,rot:6,size:48,i:11,color:"red"})}
    ${T("M70 6 C 60 30, 40 46, 10 54","M26 38 L8 54 L32 62",{x:990,y:236,w:90,h:70,delay:2500,color:"red"})}
    ${v("для офиса —<br>оверкилл",{x:1560,y:770,rot:-5,size:34,i:12})}
    ${T("M40 60 C 44 40, 36 22, 20 8","M14 30 L18 6 L40 16",{x:1500,y:720,w:60,h:70,delay:2700})}
    ${v("точности мало",{x:180,y:760,rot:-4,size:34,i:12})}

    ${L("Для корпоративной сети достаточно NTPv4",{x:520,y:880,rot:-1.2,size:50,i:13,w:980})}
  `},pt=s=>`<svg class="x" viewBox="0 0 24 24" aria-hidden="true"><path class="draw" pathLength="1" d="M4 4 L20 20 M20 4 L4 20" style="--draw-delay:${1300+s*220}ms;--draw-dur:350ms"/></svg>`,ut=s=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path class="draw" pathLength="1" d="M3 13 l6 6 L21 5" style="--draw-delay:${1800+s*220}ms;--draw-dur:350ms"/></svg>`,mt=[["Подмена пакетов","клиенту подсовывают чужое время"],["«Человек посередине»","ответы сервера изменяют по дороге"],["Переполнение запросами","отказ в обслуживании службы времени"],["Ненадёжный источник","клиент синхронизируется непонятно с кем"]],yt=[["Ограничение доступа","UDP/123 — только между своими клиентами и сервером"],["Несколько источников","независимые серверы сверяют друг друга"],["Аутентификация","симметричные ключи, если их понимают обе стороны"],["Мониторинг","контроль синхронизации и скачков смещения"],["Защита управления","ограниченный доступ и журнал изменений"]],gt={id:"security",chapter:"безопасность",title:"Уязвимости и защита службы времени",theme:"light",notes:`
    Служба времени — часть инфраструктуры доверия. Если подменить время, перестают проходить проверки сертификатов,
    а журналы теряют смысл для расследования.

    Основные угрозы: подмена пакетов, атака «человек посередине», переполнение запросами и синхронизация
    с ненадёжным источником.

    Меры защиты взяты из RFC 8633: ограничить доступ к UDP/123, использовать несколько независимых источников,
    включить аутентификацию, вести мониторинг и защитить управление.
  `,html:({img:s})=>`
    ${w("Угрозы и защита","по RFC 8633")}

    ${c(`<span class="kicker">что может пойти не так</span>
       <ul class="rows rows--tight">${mt.map(([t,e],a)=>`<li>${pt(a)}<div><b>${t}</b><span>${e}</span></div></li>`).join("")}</ul>`,{x:96,y:262,w:720,rot:-1.6,tone:"cream",i:2,deco:y({x:60,y:-16,rot:-6,tone:"terra"})})}

    ${c(`<span class="kicker">что делаем</span>
       <ul class="rows">${yt.map(([t,e],a)=>`<li>${ut(a)}<div><b>${t}</b><span>${e}</span></div></li>`).join("")}</ul>`,{x:930,y:196,w:880,rot:1,tone:"lined",i:4,deco:y({x:700,y:-16,rot:5,tone:"green"})})}

    ${k(s("friendsSync"),"клиент и сервер: время совпало",{x:560,y:672,w:310,h:186,rot:-4,i:9,fix:"tape"})}
    ${v("время уехало —<br>сертификаты не проходят",{x:110,y:770,rot:-4,size:32,i:11,color:"red"})}

    <div class="stamp stamp--rect" data-r style="left:1500px;top:812px;--rot:-6deg;--i:13"><div><b>UDP/123</b><span>только своим</span></div></div>
    ${L("подмена времени ломает сертификаты и журналы",{x:900,y:890,rot:-1,size:40,i:12,w:560})}
  `},b=(s,t,e,a,n,i="",r=0)=>`
  <g transform="rotate(${r} ${s+e/2} ${t+35})">
    <rect x="${s}" y="${t}" width="${e}" height="70" class="lab ${i}"/>
    <text x="${s+e/2}" y="${t+31}" text-anchor="middle" class="nm ${i==="lab--terra"?"nm--light":""}">${a}</text>
    <text x="${s+e/2}" y="${t+54}" text-anchor="middle" class="sub ${i==="lab--terra"?"sub--light":""}">${n}</text>
  </g>`,vt=["M300 415 H470","M470 415 H580 V254","M300 415 H820","M470 415 H560 V600"],$t={id:"topology",chapter:"топология",title:"Топология и план адресации",theme:"light",notes:`
    Стенд — условная корпоративная сеть: маршрутизатор R1, два управляемых коммутатора, серверы и рабочие станции.

    Сервер времени на chrony стоит в управляющем сегменте VLAN 10 и имеет статический адрес 192.168.10.10 —
    так проще настраивать клиентов и фильтры. Наружу, к внешним серверам времени, ходит только он.

    Маршрутизатор и коммутаторы синхронизируются с ним. Рабочие станции в VLAN 20 и серверы в VLAN 30
    достают до него через маршрутизатор; между сегментами разрешён UDP/123.
  `,html:()=>`
    ${w("Топология сети","учебный стенд")}

    ${c(`<svg class="dwg" viewBox="0 0 1100 720" role="img" aria-label="Топология: внешние серверы времени, маршрутизатор R1, сервер chrony, коммутаторы SW1 и SW2, рабочие станции и серверы">
        <path class="draw ln ln--thin" pathLength="1" d="M410 110 L580 184" style="--draw-delay:800ms;--draw-dur:500ms"/>
        <path class="draw ln ln--thin" pathLength="1" d="M760 110 L600 184" style="--draw-delay:800ms;--draw-dur:500ms"/>
        <path class="draw ln" pathLength="1" d="M580 254 V380" style="--draw-delay:1200ms;--draw-dur:500ms"/>
        <path class="draw ln ln--red" pathLength="1" d="M300 415 H470" style="--draw-delay:1600ms;--draw-dur:500ms"/>
        <path class="draw ln" pathLength="1" d="M690 415 H820" style="--draw-delay:1600ms;--draw-dur:500ms"/>
        <path class="draw ln" pathLength="1" d="M560 450 V600" style="--draw-delay:2000ms;--draw-dur:500ms"/>
        <path class="draw ln" pathLength="1" d="M890 450 L800 600" style="--draw-delay:2000ms;--draw-dur:500ms"/>
        <path class="draw ln" pathLength="1" d="M950 450 L990 600" style="--draw-delay:2000ms;--draw-dur:500ms"/>
        <path class="draw ln" pathLength="1" d="M520 450 L260 600" style="--draw-delay:2000ms;--draw-dur:500ms"/>
        <g class="in" style="--t:600ms">
          <g transform="rotate(-1.5 410 75)"><rect x="270" y="40" width="280" height="70" class="lab lab--dash"/><text x="410" y="71" text-anchor="middle" class="nm">3.ru.pool.ntp.org</text><text x="410" y="94" text-anchor="middle" class="sub">внешний источник</text></g>
          <g transform="rotate(1.2 760 75)"><rect x="620" y="40" width="280" height="70" class="lab lab--dash"/><text x="760" y="71" text-anchor="middle" class="nm">time.nist.gov</text><text x="760" y="94" text-anchor="middle" class="sub">внешний источник</text></g>
          <text x="590" y="156" text-anchor="middle" class="hw hw--ink" style="font-size:24px">интернет · UDP/123</text>
        </g>
        <g class="in" style="--t:1000ms">${b(470,184,220,"R1","маршрутизатор · .10.1","",1)}<text x="606" y="326" class="hw hw--ink" style="font-size:24px">транк: VLAN 10, 20, 30</text></g>
        <g class="in" style="--t:1400ms">
          ${b(20,380,280,"NTP-сервер chrony","192.168.10.10 · Stratum 2","lab--terra",-1.5)}
          ${b(470,380,220,"SW1","коммутатор · .10.2","",.8)}
          ${b(820,380,220,"SW2","коммутатор · .10.3","",-1)}
        </g>
        <g class="in" style="--t:1900ms">
          ${b(130,600,260,"АРМ администратора","VLAN 10 · .10.100","",1.2)}
          ${b(440,600,240,"Серверы","VLAN 30","lab--yellow",-1)}
          ${b(700,600,190,"Станции","VLAN 20","lab--green",1.5)}
          ${b(905,600,190,"Станции","VLAN 20","lab--green",-1.2)}
        </g>
        ${vt.map((s,t)=>`<circle r="6" class="run"><animateMotion dur="2.6s" repeatCount="indefinite" begin="${2.8+t*.5}s" path="${s}"/></circle>`).join("")}
      </svg>`,{x:640,y:150,w:1180,rot:-.7,tone:"graph",i:2,deco:y({x:30,y:-16,rot:-7})+y({x:1030,y:-14,rot:6,tone:"green"})})}

    ${c('<span class="kicker">VLAN 10 · управление</span><p class="vl">192.168.10.0/24</p><p class="vs">сервер времени, R1, SW1, SW2, АРМ</p>',{x:100,y:270,w:470,rot:-2,tone:"white",i:4,deco:x({x:30,y:-6})})}
    ${c('<span class="kicker">VLAN 20 · рабочие станции</span><p class="vl">192.168.20.0/24</p><p class="vs">шлюз .1</p>',{x:130,y:460,w:440,rot:1.5,tone:"green",i:5,deco:x({x:380,y:-6,tone:"green"})})}
    ${c('<span class="kicker">VLAN 30 · серверы</span><p class="vl">192.168.30.0/24</p><p class="vs">шлюз .1</p>',{x:100,y:630,w:440,rot:-1.2,tone:"yellow",i:6,deco:x({x:30,y:-6})})}

    ${v("наружу за временем<br>ходит только он",{x:130,y:836,rot:-4,size:34,i:12,color:"red"})}
    ${T("M10 215 C 120 222, 240 150, 282 22","M256 34 L283 18 L290 48",{x:420,y:640,w:300,h:230,delay:2800,color:"red"})}
  `},xt=[["c","# вышестоящие источники времени"],["","pool 3.ru.pool.ntp.org iburst"],["","pool time.nist.gov iburst"],["c","# кому разрешено спрашивать время"],["m","allow 192.168.10.0/24"],["c","# работать и без внешнего канала"],["","local stratum 10"],["c","# журнал измерений"],["","log measurements statistics tracking"],["","makestep 1 3"]],wt=[["c","! часовой пояс и сервер времени"],["","R1(config)# clock timezone KRAS 7"],["m","R1(config)# ntp server 192.168.10.10"],["c","! аутентификация по ключу"],["","R1(config)# ntp authentication-key 1 md5 ****"],["","R1(config)# ntp trusted-key 1"],["","R1(config)# ntp authenticate"],["c","! на коммутаторах — так же"],["m","SW1(config)# ntp server 192.168.10.10"],["m","SW2(config)# ntp server 192.168.10.10"]],R=(s,t)=>`
  <span class="kicker">${s}</span>
  <pre class="ls">${t.map(([e,a],n)=>`<span style="--n:${n}">${e==="c"?`<i class="c">${a}</i>`:e==="m"?`<i class="m">${a}</i>`:a}</span>`).join("")}</pre>`,ft={id:"config",chapter:"настройка",title:"Настройка chrony и Cisco IOS",theme:"light",notes:`
    Сервер: chrony на Linux. В конфигурации — два внешних пула, директива allow, которая разрешает отвечать
    только управляющему сегменту, и local stratum 10 на случай разрыва канала с интернетом.

    Сетевые устройства: на маршрутизаторе и коммутаторах одна главная команда — ntp server с адресом
    внутреннего сервера, плюс часовой пояс. На маршрутизаторе дополнительно показана аутентификация по ключу.

    Chrony выбран вместо классического ntpd: он быстрее выходит на синхронизацию и лучше ведёт себя
    при нестабильной задержке. Команды иллюстративные, под конкретную модель синтаксис нужно сверять.
  `,html:()=>`
    ${w("Настройка","сервер и клиенты")}

    ${c(R("/etc/chrony/chrony.conf · сервер Linux",xt),{x:96,y:262,w:800,rot:-1.2,tone:"listing",i:2,deco:y({x:330,y:-18,rot:3})})}
    ${c(R("Cisco IOS · R1, SW1, SW2",wt),{x:960,y:226,w:860,rot:1.1,tone:"listing",i:4,deco:y({x:360,y:-18,rot:-4,tone:"terra"})})}

    ${v("только своя сеть",{x:600,y:396,rot:-5,size:34,i:11,color:"red"})}
    ${T("M110 20 C 80 10, 50 14, 12 32","M32 14 L10 32 L34 42",{x:480,y:400,w:120,h:50,delay:2600,color:"red"})}
    ${v("одна строка<br>на каждом устройстве",{x:1500,y:640,rot:-4,size:32,i:12,color:"red"})}
    ${T("M70 60 C 60 40, 40 20, 14 10","M18 34 L12 8 L38 10",{x:1440,y:566,w:90,h:70,delay:2900,color:"red"})}

    ${v("sudo apt install chrony —<br>и ты админ",{x:120,y:760,rot:-3,size:30,i:13})}
    ${L("Все устройства смотрят на 192.168.10.10",{x:700,y:880,rot:-1.3,size:52,i:14,w:840})}
  `},bt=s=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path class="draw" pathLength="1" d="M3 13 l6 6 L21 5" style="--draw-delay:${1400+s*240}ms;--draw-dur:380ms"/></svg>`,kt=[["IP-связность","ping до 192.168.10.10 из всех VLAN"],["Сервер chrony","Stratum 2, синхронизирован"],["Источники","один выбран (*), остальные — кандидаты (+)"],["Коммутаторы и R1","Stratum 3, clock is synchronized"],["Время устройств","расхождение не больше единиц секунд"]],Lt=[["c","$ chronyc tracking"],["","Reference ID  : 3.ru.pool.ntp.org"],["m","Stratum       : 2"],["m","Last offset   : +0.000184 seconds"],["","RMS offset    : 0.000312 seconds"],["c","R1# show ntp status"],["m","Clock is synchronized, stratum 3,"],["","reference is 192.168.10.10"]],St={id:"verify",chapter:"проверка",title:"Проверка и диагностика синхронизации",theme:"light",notes:`
    Проверка идёт по плану из пяти пунктов. На сервере — команды chronyc tracking и chronyc sources:
    уровень Stratum 2, смещение — доли миллисекунды, один источник отмечен звёздочкой как выбранный.

    На оборудовании Cisco — show ntp status и show ntp associations: часы синхронизированы, Stratum 3,
    источник — наш сервер 192.168.10.10.

    Главный признак проблемы — Stratum 16: устройство время не получило. Если смещение растёт сразу у всех —
    смотрим сервер и его внешние источники; если у одного устройства — его настройки и сетевой путь.
    Значения в выводе — типовые примеры из приложения В.
  `,html:({img:s})=>`
    ${w("Проверка","план испытаний")}

    ${c(`<ul class="rows">${kt.map(([t,e],a)=>`<li>${bt(a)}<div><b>${t}</b><span>${e}</span></div></li>`).join("")}</ul>`,{x:96,y:262,w:760,rot:-.9,tone:"lined",i:2,deco:y({x:560,y:-16,rot:6,tone:"green"})})}

    ${c('<b class="bn">2</b><span class="kicker">stratum сервера</span>',{x:940,y:150,w:230,rot:-3,tone:"white",i:4,cls:"numcard"})}
    ${c('<b class="bn">3</b><span class="kicker">stratum R1, SW1, SW2</span>',{x:1180,y:172,w:250,rot:2,tone:"cream",i:5,cls:"numcard"})}
    ${c('<b class="bn">0,18<small>мс</small></b><span class="kicker">смещение часов</span>',{x:1440,y:140,w:360,rot:-1.5,tone:"yellow",i:6,cls:"numcard"})}
    ${O({x:1450,y:150,w:330,h:150,delay:2400})}

    ${c(`<span class="kicker">типовой вывод · приложение В</span>
       <pre class="ls">${Lt.map(([t,e],a)=>`<span style="--n:${a}">${t==="c"?`<i class="c">${e}</i>`:t==="m"?`<i class="m">${e}</i>`:e}</span>`).join("")}</pre>`,{x:930,y:420,w:720,rot:1.2,tone:"listing",i:7,deco:y({x:300,y:-18,rot:-3})})}

    ${k(s("friendJuice"),"ping прошёл — можно и сок",{x:1560,y:600,w:250,h:190,rot:5,i:10,fix:"clip"})}
    ${v("stratum 16 = беда",{x:620,y:790,rot:-5,size:34,i:12,color:"red"})}
    ${L("Stratum меньше 16 и малое смещение — служба работает",{x:110,y:890,rot:-1.2,size:42,i:13,w:980})}
  `},Tt=[["Изучен NTPv4","четыре метки времени, Stratum, фильтрация и коррекция часов"],["Определены угрозы и меры защиты","по рекомендациям RFC 8633"],["Выбраны chrony и Cisco IOS","миллисекундной точности сети достаточно"],["Спроектирована топология","сервер 192.168.10.10 в VLAN 10, три сегмента"],["Описаны настройка и проверка","конфигурации, команды диагностики, план испытаний"]],Mt=[rt,ot,ct,dt,ht,gt,$t,ft,St,{id:"conclusion",chapter:"заключение",title:"Заключение",theme:"light",notes:`
    Цель работы достигнута: разработан проект внедрения NTP, который даёт серверам и сетевым устройствам
    единый источник времени.

    Изучен протокол, определены угрозы и меры защиты, обоснован выбор chrony и Cisco IOS, спроектированы
    топология и адресация, описаны настройка и методика проверки.

    Для промышленной эксплуатации рекомендую резервный сервер времени, несколько независимых источников,
    фильтрацию UDP/123, аутентификацию и постоянный мониторинг.
    Спасибо за внимание, готов ответить на вопросы.
  `,html:({img:s})=>`
    ${w("Заключение","цель достигнута")}

    ${c(`<ul class="rows">${Tt.map(([t,e],a)=>`<li><span class="n">${a+1}</span><div><b>${t}</b><span>${e}</span></div></li>`).join("")}</ul>`,{x:96,y:262,w:880,rot:-.8,tone:"lined",i:2,deco:y({x:80,y:-16,rot:-6,tone:"terra"})})}

    ${k(s("atomic"),"цезиевые часы: с них начинается вся иерархия",{x:1090,y:150,w:600,h:370,rot:2.6,i:4,kind:"polaroid",fix:"corners"})}

    ${c(`<span class="kicker">для промышленной эксплуатации</span>
       <ul class="todo"><li>резервный сервер времени</li><li>аутентификация NTP</li><li>мониторинг смещения</li></ul>`,{x:1140,y:650,w:480,rot:-2.4,tone:"yellow",i:8,deco:y({x:170,y:-18,rot:4})})}

    ${v("спасибо<br>за внимание!",{x:1650,y:720,rot:6,size:42,i:14,color:"red"})}
    ${L("Один сервер chrony — единое время для всей сети",{x:110,y:880,rot:-1.3,size:52,i:13,w:920})}
  `}],H={friendsSync:{file:"images/friends-sync.jpg",alt:"Два парня за столиком в кафе",title:"Мем-карточка «Клиент и сервер»",author:"личное фото",license:"с согласия",source:""},friendHood:{file:"images/friend-hood.jpg",alt:"Парень в капюшоне",title:"Мем-карточка «Stratum 16»",author:"личное фото",license:"с согласия",source:""},friendJuice:{file:"images/friend-juice.jpg",alt:"Парень пьёт сок из пакета",title:"Мем-карточка «Ping прошёл»",author:"личное фото",license:"с согласия",source:""},stclock:{file:"images/station-clock.jpg",alt:"Башня с часами на вокзале",title:"Часовая башня вокзала в Майсуре",author:"Timothy A. Gonsalves",license:"CC BY-SA 4.0",source:"https://commons.wikimedia.org/wiki/File:Clock_Tower_Mysore_Rly_Stn_Karnataka_Apr22_A7C_01904.jpg",position:"50% 20%"},gps:{file:"images/gps-satellite.jpg",alt:"Спутник GPS над Землёй",title:"Спутник GPS Block IIF (иллюстрация NASA)",author:"NASA",license:"Public domain",source:"https://commons.wikimedia.org/wiki/File:GPS_Satellite_NASA_art-iif.jpg",position:"50% 35%"},atomic:{file:"images/caesium-clock.jpg",alt:"Лабораторные цезиевые атомные часы",title:"Цезиевый стандарт частоты (ESO)",author:"ESO",license:"CC BY 4.0",source:"https://commons.wikimedia.org/wiki/File:President_Pi%C3%B1era_receives_ESO%27s_first_atomic_clock.jpg",position:"50% 40%"}},z=document.getElementById("app");document.body.insertAdjacentHTML("afterbegin",`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <filter id="torn" x="-4%" y="-6%" width="108%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="4" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="torn2" x="-4%" y="-6%" width="108%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="11" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="G" yChannelSelector="R"/>
    </filter>
    <filter id="wobble" filterUnits="userSpaceOnUse" x="-60" y="-60" width="2200" height="1400">
      <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="2" seed="7" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="4"/>
    </filter>
  </defs></svg>`);function At(){const s="./",t=Object.values(H).map(n=>new Promise(i=>{const r=new Image;r.onload=r.onerror=i,r.src=`${s}${n.file}`})),e=document.fonts?document.fonts.ready:Promise.resolve(),a=new Promise(n=>setTimeout(n,2500));return Promise.race([Promise.all([...t,e]),a])}At().then(()=>st(z,"./")).then(()=>{const s=new Z(z,Mt,{images:H,base:"./"}).mount();window.__deck=s})})();
