(function(){"use strict";const T='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',P='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',f=s=>String(s).padStart(2,"0");function m(s,t={},e=""){const a=document.createElement(s);for(const[i,l]of Object.entries(t))l===!1||l==null||a.setAttribute(i,l===!0?"":l);return e&&(a.innerHTML=e),a}function O(s){const t=m("div",{class:"chrome","aria-hidden":"false"});return t.innerHTML=`
    <div class="chrome-top">
      <div class="chrome-brand"><i></i><span>Сеть малого офиса · Курсовая работа</span></div>
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
        <div class="counter" aria-live="polite"><b class="cur">01</b> / ${f(s)}</div>
        <div class="nav-btns">
          <button class="nav-btn" type="button" data-action="prev" aria-label="Предыдущий слайд">${T}</button>
          <button class="nav-btn" type="button" data-action="next" aria-label="Следующий слайд">${P}</button>
        </div>
      </div>
    </div>
    <div class="progress" role="progressbar" aria-label="Прогресс презентации" aria-valuemin="1" aria-valuemax="${s}">
      <div class="progress-fill"></div>
      <div class="progress-ticks">
        ${Array.from({length:s},(e,a)=>`<button type="button" data-goto="${a}" aria-label="Слайд ${a+1}"></button>`).join("")}
      </div>
    </div>`,t}function H(s){const t=m("div",{class:"overlay",id:"overview",role:"dialog","aria-modal":"true","aria-label":"Содержание"});return t.innerHTML=`
    <div class="overlay-panel">
      <div class="overlay-head">
        <h2>Содержание</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <div class="overview-grid">
        ${s.map((e,a)=>`
          <button class="overview-item" type="button" data-goto="${a}">
            <span class="n">${f(a+1)} · ${e.chapter}</span>
            <span class="t">${e.title}</span>
          </button>`).join("")}
      </div>
    </div>`,t}function R(){const s=m("aside",{class:"notes",id:"notes","aria-label":"Заметки докладчика"});return s.innerHTML=`
    <div class="notes-inner">
      <div class="notes-label">Заметки докладчика<br><span class="muted">N — скрыть</span></div>
      <div class="notes-text"></div>
    </div>`,s}function V(){const s=[["Следующий слайд","→ · Пробел · PgDn"],["Предыдущий слайд","← · Shift+Пробел · PgUp"],["Первый / последний","Home · End"],["Содержание","O · Esc"],["Заметки докладчика","N"],["Полный экран","F"],["Источники фотографий","I"],["Эта подсказка","H · ?"]],t=m("div",{class:"overlay",id:"help",role:"dialog","aria-modal":"true","aria-label":"Управление"});return t.innerHTML=`
    <div class="overlay-panel" style="width:min(820px,100%)">
      <div class="overlay-head">
        <h2>Управление</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <div class="keys">
        ${s.map(([e,a])=>`<div><span>${e}</span><kbd>${a}</kbd></div>`).join("")}
      </div>
      <p class="muted" style="margin-top:24px;font-size:14px">На телефоне и планшете листайте свайпом влево и вправо.</p>
    </div>`,t}function W(s,t){const e=m("div",{class:"overlay",id:"credits",role:"dialog","aria-modal":"true","aria-label":"Источники фотографий"}),a=Object.values(s).map(i=>`
      <li>
        <img src="${t}${i.file}" alt="" loading="lazy">
        <div>
          <b>${i.title}</b>
          <span>${i.author} · ${i.license}</span><br>
          ${i.source?`<a href="${i.source}" target="_blank" rel="noopener">${i.source.replace("https://","")}</a>`:""}
        </div>
      </li>`).join("");return e.innerHTML=`
    <div class="overlay-panel">
      <div class="overlay-head">
        <h2>Источники фотографий</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <ul class="credits-list">${a}</ul>
    </div>`,e}const B=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches,I=s=>1-Math.pow(1-s,3);function w(s,t=0){const e=s.toFixed(t),[a,i]=e.split("."),l=a.length>4?a.replace(/\B(?=(\d{3})+(?!\d))/g," "):a;return i?`${l},${i}`:l}const k=new WeakMap;function q(s){s.querySelectorAll("[data-count]").forEach(t=>{const e=parseFloat(t.dataset.count),a=parseFloat(t.dataset.from??"0"),i=parseInt(t.dataset.decimals??"0",10),l=parseInt(t.dataset.duration??"1600",10),r=parseInt(t.dataset.delay??"350",10);if(cancelAnimationFrame(k.get(t)),B()){t.textContent=w(e,i);return}t.textContent=w(a,i);const c=performance.now()+r,d=g=>{const h=Math.min(1,Math.max(0,(g-c)/l));t.textContent=w(a+(e-a)*I(h),i),h<1&&k.set(t,requestAnimationFrame(d))};k.set(t,requestAnimationFrame(d))})}function D(s){s.querySelectorAll("[data-count]").forEach(t=>{cancelAnimationFrame(k.get(t)),t.textContent=w(parseFloat(t.dataset.count),parseInt(t.dataset.decimals??"0",10))})}const G=1920,Q=1080,Y=2600;class U{constructor(t,e,{images:a={},base:i="./"}={}){this.root=t,this.slides=e,this.images=a,this.base=i,this.index=-1,this.step=0,this.locked=!1}mount(){const{root:t,slides:e}=this;this.stage=m("div",{class:"stage","data-dir":"fwd"}),this.track=m("div",{class:"slides"}),this.sections=e.map((i,l)=>{const r=m("section",{class:`slide slide--${i.id}`,"data-theme":i.theme||"dark","data-index":l,"aria-roledescription":"слайд","aria-label":`${l+1} из ${e.length}: ${i.title}`});return r.innerHTML=i.html({base:this.base,img:this.img.bind(this)}),this.track.appendChild(r),r}),this.chrome=O(e.length),this.stage.append(this.track,this.chrome),this.overview=H(e),this.notes=R(),this.help=V(),this.credits=W(this.images,this.base),this.toast=m("div",{class:"toast",role:"status"},"→ или Пробел — дальше · H — управление"),t.append(this.stage,this.notes,this.overview,this.help,this.credits,this.toast),this.$={chapterWrap:this.chrome.querySelector(".chrome-chapter"),chapterNum:this.chrome.querySelector(".chrome-chapter .num"),chapterName:this.chrome.querySelector(".chrome-chapter .name"),counter:this.chrome.querySelector(".counter .cur"),fill:this.chrome.querySelector(".progress-fill"),progress:this.chrome.querySelector(".progress"),dots:this.chrome.querySelector(".step-dots"),prev:this.chrome.querySelector('[data-action="prev"]'),next:this.chrome.querySelector('[data-action="next"]'),notesText:this.notes.querySelector(".notes-text")},this.bind(),this.fit();const a=this.indexFromHash();return this.go(a??0,{instant:!0}),setTimeout(()=>this.toast.classList.add("is-show"),900),setTimeout(()=>this.toast.classList.remove("is-show"),5200),this.pokeIdle(),this}img(t,{alt:e,className:a="",position:i}={}){const l=this.images[t];if(!l)throw new Error(`Unknown image: ${t}`);const r=i||l.position,c=r?` style="object-position:${r}"`:"",d=a?` class="${a}"`:"";return`<img src="${this.base}${l.file}" alt="${e??l.alt}"${d} decoding="async" draggable="false"${c}>`}fit(){const t=this.root.clientWidth,e=this.root.clientHeight,a=Math.min(t/G,e/Q);this.stage.style.setProperty("--scale",String(a))}stepsOf(t){return Math.max(1,this.slides[t]?.steps||1)}next(){if(this.step<this.stepsOf(this.index)-1)return this.setStep(this.step+1);this.index<this.slides.length-1&&this.go(this.index+1)}prev(){if(this.step>0)return this.setStep(this.step-1);this.index>0&&this.go(this.index-1,{step:this.stepsOf(this.index-1)-1})}go(t,{step:e=0,instant:a=!1}={}){const i=Math.max(0,Math.min(this.slides.length-1,t));if(i===this.index){this.setStep(e);return}const l=this.index,r=this.sections[l],c=this.sections[i],d=this.slides[i];this.stage.dataset.dir=i>l?"fwd":"back",r&&(r.classList.remove("is-active"),r.classList.add("is-leaving"),clearTimeout(r._leaveTimer),r._leaveTimer=setTimeout(()=>r.classList.remove("is-leaving"),750),r.setAttribute("aria-hidden","true"),r.inert=!0),c.classList.remove("is-leaving"),c.offsetWidth,a&&(c.style.transition="none"),c.classList.add("is-active"),c.removeAttribute("aria-hidden"),c.inert=!1,a&&requestAnimationFrame(()=>c.style.transition=""),this.index=i,this.step=-1,this.setStep(e,{silent:!0}),this.stage.classList.toggle("is-light",d.theme==="light"),q(c),r&&setTimeout(()=>D(r),800),d.onEnter?.(c,this),this.updateChrome(d,l===-1),this.updateHash()}setStep(t,{silent:e=!1}={}){const a=this.stepsOf(this.index)-1,i=Math.max(0,Math.min(a,t));if(i===this.step&&!e)return;this.step=i;const l=this.sections[this.index];l.dataset.step=String(i),this.slides[this.index].onStep?.(l,i,this),this.renderDots(),this.updateProgress(),this.updateNav()}updateChrome(t,e){const{chapterWrap:a,chapterNum:i,chapterName:l,counter:r,notesText:c}=this.$,d=()=>{i.textContent=f(this.index+1),l.textContent=t.chapter,a.classList.remove("is-swapping")};e?d():(a.classList.add("is-swapping"),setTimeout(d,260)),r.textContent=f(this.index+1),c.innerHTML=(t.notes||"").trim().split(/\n\s*\n/).map(g=>`<p>${g.trim()}</p>`).join(""),this.overview.querySelectorAll(".overview-item").forEach((g,h)=>g.classList.toggle("is-current",h===this.index)),this.$.progress.setAttribute("aria-valuenow",String(this.index+1))}updateProgress(){const t=this.slides.length,e=this.stepsOf(this.index),a=e>1?this.step/e:0,i=(this.index+a+1)/t*100;this.$.fill.style.width=`${Math.min(100,i)}%`}renderDots(){const t=this.stepsOf(this.index);this.$.dots.innerHTML=t>1?Array.from({length:t},(e,a)=>`<i class="${a<=this.step?"on":""}"></i>`).join(""):""}updateNav(){const t=this.index===0&&this.step===0,e=this.index===this.slides.length-1&&this.step===this.stepsOf(this.index)-1;this.$.prev.disabled=t,this.$.next.disabled=e}updateHash(){const t=`#slide-${this.index+1}`;try{location.hash!==t&&history.replaceState(null,"",t)}catch{}}indexFromHash(){const t=/^#slide-(\d+)$/.exec(location.hash);if(!t)return null;const e=parseInt(t[1],10)-1;return e>=0&&e<this.slides.length?e:null}openOverlay(t){[this.overview,this.help,this.credits].forEach(a=>a!==t&&a.classList.remove("is-open")),t.classList.add("is-open"),this.activeOverlay=t;const e=t.querySelector(".is-current")||t.querySelector("[data-close]");setTimeout(()=>e?.focus({preventScroll:!0}),50)}closeOverlay(){return this.activeOverlay?(this.activeOverlay.classList.remove("is-open"),this.activeOverlay=null,!0):!1}toggleOverlay(t){this.activeOverlay===t?this.closeOverlay():this.openOverlay(t)}toggleNotes(){this.notes.classList.toggle("is-open")}async toggleFullscreen(){try{document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()}catch{}}pokeIdle(){this.root.classList.remove("is-idle"),clearTimeout(this.idleTimer),this.idleTimer=setTimeout(()=>this.root.classList.add("is-idle"),Y)}bind(){window.addEventListener("resize",()=>this.fit()),window.addEventListener("hashchange",()=>{const l=this.indexFromHash();l!=null&&l!==this.index&&this.go(l)}),document.addEventListener("keydown",l=>this.onKey(l)),document.addEventListener("mousemove",()=>this.pokeIdle(),{passive:!0}),this.root.addEventListener("click",l=>{const r=l.target.closest("[data-action],[data-goto],[data-close],[data-step-to]");if(!r)return;if(r.hasAttribute("data-close"))return void this.closeOverlay();if(r.dataset.goto!=null)return this.closeOverlay(),void this.go(parseInt(r.dataset.goto,10));if(r.dataset.stepTo!=null)return void this.setStep(parseInt(r.dataset.stepTo,10));const c=r.dataset.action;c==="next"?this.next():c==="prev"?this.prev():c==="overview"?this.toggleOverlay(this.overview):c==="credits"?this.toggleOverlay(this.credits):c==="help"&&this.toggleOverlay(this.help)}),[this.overview,this.help,this.credits].forEach(l=>l.addEventListener("click",r=>{r.target===l&&this.closeOverlay()}));let t=0,e=0,a=0;this.stage.addEventListener("touchstart",l=>{const r=l.touches[0];t=r.clientX,e=r.clientY,a=Date.now()},{passive:!0}),this.stage.addEventListener("touchend",l=>{const r=l.changedTouches[0],c=r.clientX-t,d=r.clientY-e;Date.now()-a<700&&Math.abs(c)>40&&Math.abs(c)>Math.abs(d)*1.3&&(c<0?this.next():this.prev())},{passive:!0});let i=0;window.addEventListener("wheel",l=>{if(this.activeOverlay)return;const r=Math.abs(l.deltaY)>Math.abs(l.deltaX)?l.deltaY:l.deltaX;if(Math.abs(r)<24)return;const c=Date.now();c<i||(i=c+900,r>0?this.next():this.prev())},{passive:!0})}onKey(t){if(t.metaKey||t.ctrlKey||t.altKey)return;const e=t.key;if(this.pokeIdle(),e==="Escape")return this.closeOverlay()?t.preventDefault():this.notes.classList.contains("is-open")?this.toggleNotes():this.openOverlay(this.overview);if(this.activeOverlay){(e==="o"||e==="O"||e==="щ"||e==="Щ")&&this.activeOverlay===this.overview&&this.closeOverlay(),(e==="i"||e==="I"||e==="ш"||e==="Ш")&&this.activeOverlay===this.credits&&this.closeOverlay(),(e==="h"||e==="H"||e==="?"||e==="р"||e==="Р")&&this.activeOverlay===this.help&&this.closeOverlay();return}const a=document.activeElement?.tagName==="BUTTON";switch(e){case"ArrowRight":case"ArrowDown":case"PageDown":return t.preventDefault(),this.next();case"ArrowLeft":case"ArrowUp":case"PageUp":return t.preventDefault(),this.prev();case" ":case"Spacebar":return a?void 0:(t.preventDefault(),t.shiftKey?this.prev():this.next());case"Enter":return a?void 0:(t.preventDefault(),this.next());case"Home":return t.preventDefault(),this.go(0);case"End":return t.preventDefault(),this.go(this.slides.length-1)}const l={f:"fs",F:"fs",а:"fs",А:"fs",n:"notes",N:"notes",т:"notes",Т:"notes",o:"overview",O:"overview",щ:"overview",Щ:"overview",h:"help",H:"help","?":"help",р:"help",Р:"help",i:"credits",I:"credits",ш:"credits",Ш:"credits"}[e];l==="fs"?this.toggleFullscreen():l==="notes"?this.toggleNotes():l==="overview"?this.toggleOverlay(this.overview):l==="help"?this.toggleOverlay(this.help):l==="credits"&&this.toggleOverlay(this.credits)}}const E=680;function z(s,t){const e=window.matchMedia("(prefers-reduced-motion: reduce)").matches,a=/^#slide-(\d+)$/.exec(location.hash);if(e||a&&a[1]!=="1")return Promise.resolve();const i=[{big:"Курсовая",small:"МДК 01.02 · 2026"},{big:"8 мест",small:"один офис"},{big:"4 VLAN",small:"гости отдельно",acc:!0},{big:"12 линий",small:"170 метров кабеля"},{big:"0 ₽",small:"на западное железо",acc:!0},{big:"Погнали",small:"180 378 ₽ · не больше",photo:"images/m5.jpg"},{big:"Сеть малого офиса",small:"на российском оборудовании",last:!0}];return new Promise(l=>{const r=document.createElement("div");r.className="intro",r.innerHTML=i.map((h,kt)=>`
        <div class="intro__beat${h.acc?" intro__beat--acc":""}${h.photo?" intro__beat--photo":""}${h.last?" intro__beat--last":""}" style="--n:${kt}">
          ${h.photo?`<img src="${t}${h.photo}" alt="">`:""}
          <div><b>${h.big}</b><small>${h.small}</small></div>
        </div>`).join("")+`<i class="intro__bar" style="--total:${i.length*E}ms"></i><span class="intro__skip">любая клавиша — пропустить</span>`,s.appendChild(r);let c=!1;const d=()=>{c||(c=!0,document.removeEventListener("keydown",g,!0),r.classList.add("is-out"),setTimeout(()=>r.remove(),600),l())},g=h=>{h.stopPropagation(),h.preventDefault(),d()};document.addEventListener("keydown",g,!0),r.addEventListener("click",d),r.addEventListener("touchend",d,{passive:!0}),setTimeout(d,i.length*E+900)})}const _=[{x:112,year:"Раздел 1",label:"Теория"},{x:560,year:"Раздел 1.3",label:"Рынок"},{x:1010,year:"Раздел 2",label:"Проект сети"},{x:1460,year:"Итог",label:"180 378 ₽"}],K={id:"cover",chapter:"Обложка",title:"Проектирование сетевой инфраструктуры для малого бизнеса",theme:"dark",notes:`
    Здравствуйте. Тема моей курсовой работы — проектирование сетевой инфраструктуры для малого бизнеса
    на оборудовании российских производителей: построение топологии, выбор моделей и расчёт бюджета.

    План доклада: коротко теория и рынок, затем проект сети для конкретного офиса и итоговая смета.
  `,html:({img:s})=>`
    <div class="cv-photo photo kb grain" data-r="fade" style="--i:0">
      ${s("cover")}
    </div>
    <div class="cv-shade"></div>

    <svg class="cv-flow" viewBox="0 0 1920 1080" aria-hidden="true">
      <path class="draw cv-flow__faint" pathLength="1" style="--draw-delay:500ms;--draw-dur:2200ms"
        d="M1920 560 C 1480 580, 1300 868, 1010 868"/>
      <path class="draw cv-flow__faint" pathLength="1" style="--draw-delay:650ms;--draw-dur:2200ms"
        d="M1920 740 C 1720 750, 1640 868, 1460 868"/>
      <path class="draw cv-flow__main" pathLength="1" style="--draw-delay:350ms;--draw-dur:2000ms"
        d="M112 868 H 1808"/>
      ${_.map((t,e)=>`
        <g class="cv-station" style="--i:${e}">
          <line x1="${t.x}" y1="852" x2="${t.x}" y2="884"/>
          <circle cx="${t.x}" cy="868" r="${e===_.length-1?7:4}" class="${e===_.length-1?"is-now":""}"/>
        </g>`).join("")}
      <circle class="cv-runner" r="5">
        <animateMotion dur="7s" repeatCount="indefinite" path="M112 868 H 1808" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.45 0 0.55 1"/>
      </circle>
    </svg>

    <div class="cv-stations">
      ${_.map((t,e)=>`
        <div class="cv-station-label" style="left:${t.x}px;--i:${e+7}" data-r="fade">
          <span>${t.year}</span><b>${t.label}</b>
        </div>`).join("")}
    </div>

    <div class="cv-text">
      <p class="eyebrow" data-r style="--i:1"><b>Курсовая работа</b> МДК 01.02 · 2026</p>
      <h1 class="cv-title">
        <span class="cv-title__a" data-r="mask-up" style="--i:2">Проектирование сетевой инфраструктуры для малого бизнеса</span>
        <span class="cv-title__b" data-r="mask-up" style="--i:3">на оборудовании российских</span>
        <span class="cv-title__b" data-r="mask-up" style="--i:4">производителей</span>
      </h1>
      <p class="cv-sub" data-r style="--i:6">Построение топологии, выбор моделей, расчёт бюджета</p>
    </div>

    <dl class="cv-meta" data-r="fade" style="--i:8">
      <div><dt>Выполнил</dt><dd>А. М. Талыбов, группа СА24-16</dd></div>
      <div><dt>Руководитель</dt><dd>Е. Д. Волкова</dd></div>
      <div><dt>Специальность</dt><dd>09.02.06 Сетевое и системное администрирование</dd></div>
    </dl>
  `},v=(s,t,e=10)=>`
  <div class="turn">
    <span class="turn__a" data-r="left" style="--i:${e}">${s}</span>
    <span class="turn__line" aria-hidden="true">
      <svg viewBox="0 0 100 20" preserveAspectRatio="none"><path class="draw" pathLength="1" d="M0 10 H100" style="--draw-delay:1500ms;--draw-dur:900ms"/></svg>
      <i></i>
    </span>
    <span class="turn__b" data-r="right" style="--i:${e+5}">${t}</span>
  </div>`,S=(s,t=4,e=!1)=>`
  <ul class="plist${e?" plist--num":""}">
    ${s.map(([a,i],l)=>`
      <li data-r style="--i:${l+t}">
        ${e?`<em>${String(l+1).padStart(2,"0")}</em>`:"<i></i>"}
        <div><b>${a}</b>${i?`<span>${i}</span>`:""}</div>
      </li>`).join("")}
  </ul>`,u=(s,t,e=14,a=-2)=>`
  <div class="meme" style="${t};--i:${e}" data-r="scale"><span style="--tilt:${a}deg">${s}</span></div>`,y=(s,t,e,a,i=12,l=2)=>`
  <figure class="memecard" style="${a};--i:${i}" data-r="scale">
    <div class="memecard__in" style="--tilt:${l}deg">
      ${s}
      ${t?`<b class="memecard__t">${t}</b>`:""}
      ${e?`<b class="memecard__b">${e}</b>`:""}
    </div>
  </figure>`,X=[["Сеть «как получилось»","бытовой роутер и одна сеть на всех: бухгалтерия рядом со смартфонами гостей"],["После 2022 года","западные производители ушли; параллельный импорт — без гарантии и обновлений"],["Российские линейки выросли","«Элтекс», QTECH и SNR выпускают оборудование и для небольших офисов"]],J={id:"goal",chapter:"Актуальность и цель",title:"Актуальность и цель работы",theme:"light",notes:`
    Во многих небольших офисах сеть собрана из бытового роутера и одной общей сети. Пока всё работает,
    это никого не беспокоит, но любая поломка или заражение одного компьютера останавливает весь офис.

    После 2022 года западные производители свернули поставки и поддержку, а российские компании
    расширили свои линейки. Поэтому вопрос, можно ли собрать сеть малого офиса только на российском
    оборудовании и сколько это стоит, — практический.

    Цель работы — спроектировать такую сеть: построить топологию, подобрать модели и рассчитать бюджет.

    Шутка для разрядки: на фото — не наш офис, но духовно очень близко.
  `,html:({img:s})=>`
    ${u("«и так сойдёт» — старая сеть, 2019–2026","right:136px;top:150px",12,2)}
    ${y(s("facepalm"),"пароль от Wi-Fi","знают все клиенты","left:540px;top:596px;width:340px;height:250px",9,-3)}
    <div class="gl-main">
      <p class="eyebrow" data-r style="--i:1"><b>Введение</b> почему это важно</p>
      <h2 class="h1" data-r style="--i:2">Актуальность и цель</h2>
      ${S(X,3)}
    </div>

    <figure class="gl-photo photo photo--archive kb grain" data-r="mask" style="--i:2">
      ${s("mess")}
      <figcaption class="caption"><b>Так выглядит сеть без проекта</b><br>кабели без маркировки, всё в одном сегменте</figcaption>
    </figure>

    <div class="gl-goal" data-r style="--i:7">
      <span class="label accent">Цель работы</span>
      <p class="gl-statement">Спроектировать сеть малого предприятия на российском оборудовании: топология, модели, бюджет.</p>
    </div>
    <dl class="gl-kv" data-r style="--i:8">
      <div><dt>Объект</dt><dd>Локальная вычислительная сеть малого предприятия</dd></div>
      <div><dt>Предмет</dt><dd>Топология, выбор оборудования, расчёт стоимости</dd></div>
      <div><dt>Пример</dt><dd>ООО «Новый адрес», агентство недвижимости, Новокузнецк</dd></div>
    </dl>

    ${v("Практический вопрос","Хватит ли российского оборудования и сколько это стоит")}
  `},$=(s,t)=>`<path class="draw tp-line" pathLength="1" d="${s}" style="--draw-delay:${700+t*90}ms;--draw-dur:700ms"/>`,M=(s,t,e)=>`<circle class="tp-node" cx="${s}" cy="${t}" r="9" style="--i:${e}"/>`,Z=[{key:"bus",name:"Шина",svg:()=>{const s=[70,150,230,310];return $("M24 100 H356",0)+s.map((t,e)=>$(`M${t} 100 V${e%2?150:50}`,e+1)).join("")+s.map((t,e)=>M(t,e%2?150:50,e)).join("")},plus:"Мало кабеля, простой монтаж",minus:"Обрыв кабеля останавливает всю сеть"},{key:"ring",name:"Кольцо",svg:()=>{const s=Array.from({length:6},(t,e)=>{const a=Math.PI*2*e/6-Math.PI/2;return[Math.round(190+130*Math.cos(a)),Math.round(100+72*Math.sin(a))]});return s.map((t,e)=>$(`M${t[0]} ${t[1]} L${s[(e+1)%6][0]} ${s[(e+1)%6][1]}`,e)).join("")+s.map((t,e)=>M(t[0],t[1],e)).join("")},plus:"Предсказуемая задержка передачи",minus:"Отказ одного узла нарушает работу кольца"},{key:"star",name:"Звезда",svg:()=>{const s=Array.from({length:7},(t,e)=>{const a=Math.PI*2*e/7-Math.PI/2;return[Math.round(190+140*Math.cos(a)),Math.round(100+78*Math.sin(a))]});return s.map((t,e)=>$(`M190 100 L${t[0]} ${t[1]}`,e)).join("")+s.map((t,e)=>M(t[0],t[1],e)).join("")+'<rect class="tp-hub" x="172" y="86" width="36" height="28"/>'},plus:"Обрыв линии отключает один узел, легко расширять",minus:"Зависимость от центрального устройства",pick:!0},{key:"mesh",name:"Ячеистая",svg:()=>{const s=Array.from({length:5},(a,i)=>{const l=Math.PI*2*i/5-Math.PI/2;return[Math.round(190+120*Math.cos(l)),Math.round(104+82*Math.sin(l))]});let t="",e=0;for(let a=0;a<5;a++)for(let i=a+1;i<5;i++)t+=$(`M${s[a][0]} ${s[a][1]} L${s[i][0]} ${s[i][1]}`,e++*.6);return t+s.map((a,i)=>M(a[0],a[1],i)).join("")},plus:"Высокая отказоустойчивость",minus:"Дорого и сложно: магистрали и ЦОД"}],tt={id:"theory",chapter:"Топология",title:"Выбор топологии сети",theme:"dark",notes:`
    В теоретической части я сравнил основные топологии. В офисных сетях Ethernet фактически используется
    только «звезда»: обрыв линии отключает один узел, сеть легко расширять, неисправность легко найти.

    Трёхуровневая модель — доступ, распределение, ядро — для малого офиса избыточна. Уровни ядра и
    распределения сворачиваются в одно устройство — маршрутизатор, а уровень доступа — это один коммутатор.
    Сегментация делается с помощью VLAN, между сегментами стоит межсетевой экран.

    Про «+1000 к ауре» можно сказать вслух: обрыв одной линии не роняет весь офис — это и есть аура.
  `,html:()=>`
    ${u("«звезда»: +1000 к ауре админа","right:112px;top:352px",14,-2)}
    <figure class="th-meme" data-r="scale" style="--i:11">
      <div class="th-meme__in">
        <div><svg viewBox="0 0 190 120" aria-hidden="true"><path d="M95 60 L40 24 M95 60 L150 24 M95 60 L28 78 M95 60 L162 78 M95 60 L70 104 M95 60 L120 104" class="th-meme__ok"/><rect x="85" y="52" width="20" height="16" class="th-meme__hub"/><g class="th-meme__n"><circle cx="40" cy="24" r="6"/><circle cx="150" cy="24" r="6"/><circle cx="28" cy="78" r="6"/><circle cx="162" cy="78" r="6"/><circle cx="70" cy="104" r="6"/><circle cx="120" cy="104" r="6"/></g></svg><b>по учебнику</b></div>
        <div><svg viewBox="0 0 190 120" aria-hidden="true"><path d="M20 30 C 80 -10, 60 130, 120 60 S 190 10, 150 100 S 30 120, 60 50 S 170 60, 100 20 S 10 90, 170 70 S 60 10, 40 100" class="th-meme__bad"/><g class="th-meme__n"><circle cx="20" cy="30" r="6"/><circle cx="150" cy="100" r="6"/><circle cx="60" cy="50" r="6"/><circle cx="100" cy="20" r="6"/><circle cx="170" cy="70" r="6"/><circle cx="40" cy="100" r="6"/></g></svg><b>в старом офисе</b></div>
      </div>
    </figure>
    <div class="frame">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 1.1</b> четыре варианта</p>
      <h2 class="h1 th-h" data-r style="--i:2">Выбор топологии</h2>
      <p class="lead th-lead" data-r style="--i:3">В офисном Ethernet каждое устройство подключается отдельной линией к коммутатору — это «звезда».</p>
    </div>

    <div class="th-grid">
      ${Z.map((s,t)=>`
        <article class="th-cell${s.pick?" is-pick":""}" data-r style="--i:${t+4}">
          <svg viewBox="0 0 380 200" aria-hidden="true">${s.svg()}</svg>
          <h3 class="h3">${s.name}${s.pick?'<span class="th-tag">выбрана</span>':""}</h3>
          <p><span class="label">плюс</span>${s.plus}</p>
          <p><span class="label">минус</span>${s.minus}</p>
        </article>`).join("")}
    </div>

    ${v("Трёхуровневая модель малому офису не нужна","«Звезда» со свёрнутым ядром",9)}
  `},et=89087,st=[{city:"Новосибирск",name:"«Элтекс»",price:75e3,approx:!0,model:"Eltex MES2324 · уровень L3",rows:["ESR, MES, WEP: полная линейка и собственное производство","Цены у дилеров часто только «по запросу»"]},{city:"Москва",name:"QTECH",price:89087,model:"QSW-3750-28T-AC-R · уровень L2+",rows:["QSW, QSR, QWP: корпоративный уровень, статус ТОРП","Высокие цены для малого бизнеса"]},{city:"Екатеринбург",name:"SNR (ГК «НАГ»)",price:23838,pick:!0,model:"SNR-S2985G-24T-UPS · уровень L2",rows:["SNR-S, SNR-AP: низкая цена, есть на складе","Наличие в реестре нужно проверять отдельно"]}],at={id:"market",chapter:"Рынок",title:"Три российских производителя",theme:"light",notes:`
    Для малого офиса наиболее интересны три производителя: «Элтекс», QTECH и SNR.
    У «Элтекс» полная линейка и своё производство, у QTECH корпоративный уровень, но высокие цены,
    у SNR низкая цена и наличие на складе.

    На слайде — цены их 24-портовых управляемых коммутаторов: от 24 до 89 тысяч рублей.
    Модели не одного класса: L3, L2+ и L2, уровень подписан под каждой ценой.

    Вывод: сеть небольшого офиса уже можно собрать полностью из отечественных компонентов,
    но выбирать нужно сравнением конкретных моделей, а не по бренду.

    На цене QTECH сделай паузу. Правильная реакция аудитории — «окак».
  `,html:({img:s})=>`
    ${y(s("grumpy"),"89 087 ₽ за коммутатор?","нет.","right:112px;top:112px;width:310px;height:200px",12,3)}
    <div class="frame">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 1.3</b> коммутатор на 24 порта — три цены</p>
      <h2 class="h1 mk-h" data-r style="--i:2">Три российских производителя</h2>
    </div>

    <div class="mk-grid">
      ${st.map((t,e)=>`
        <article class="mk-col${t.pick?" is-pick":""}" data-r style="--i:${e*2+3}">
          <span class="label">${t.city}</span>
          <h3 class="h3">${t.name}</h3>
          <div class="num-l mk-price">${t.approx?"<small>≈</small>":""}<span data-count="${t.price}" data-duration="1500" data-delay="${500+e*200}">${t.price}</span><small>₽</small></div>
          <div class="mk-bar"><i style="--w:${(t.price/et*100).toFixed(1)}%;--bd:${900+e*200}ms"></i></div>
          <p class="mk-model">${t.model}</p>
          ${t.rows.map(a=>`<p class="mk-row">${a}</p>`).join("")}
        </article>`).join("")}
    </div>

    ${v("Устройства одного назначения, цены отличаются в разы","Выбор — по характеристикам и цене",9)}
  `},it=[["Интернет, 1С и МФУ для всех","канал 100 Мбит/с, база и общие папки на сервере"],["Гостевой Wi-Fi отдельно от офисной сети","клиенты не видят сервер и бухгалтерию"],["VPN для директора","удалённое подключение к серверу"],["Тихое и управляемое оборудование","шкаф стоит в бывшей кладовой, администратор приходящий"]],lt=Array.from({length:24},(s,t)=>`<i class="${t<12?"on":""}${t===11?" up":""}" style="--p:${t}"></i>`).join(""),rt={id:"company",chapter:"Постановка задачи",title:"ООО «Новый адрес»: постановка задачи",theme:"dark",notes:`
    Практическая часть выполнена на примере условной компании — агентства недвижимости «Новый адрес»
    в Новокузнецке. В штате восемь человек, к сети подключаются десять оконечных устройств:
    восемь компьютеров, сервер и МФУ.

    В старом офисе сеть была собрана из бытового роутера и неуправляемого коммутатора, пароль от Wi-Fi знали клиенты.
    Требования к новой сети: интернет, работа с 1С, изолированная гостевая сеть, защита сервера, VPN для директора.

    Расчёт портов: 12 портов с запасом 30 % — это 16, ближайший типоразмер — 24 порта, половина остаётся свободной.
    Бюджет вместе с материалами и работами — не более 200 тысяч рублей.

    Мем про «не сам себя отключил» — отсылка к Эпштейну: неуправляемый коммутатор без журналов событий никогда не расскажет, что с ним случилось.
  `,html:({img:s})=>`
    ${u("старый коммутатор не сам себя отключил","left:1080px;top:826px",16,-2)}
    <div class="cp-photo photo photo--archive kb grain" data-r="fade" style="--i:0">
      ${s("oldnet")}
    </div>
    <div class="cp-shade"></div>
    <p class="cp-photo-caption caption" data-r="fade" style="--i:9"><b>Было</b> · неуправляемый коммутатор, одна сеть на всех</p>

    <div class="cp-main">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 2.1</b> агентство недвижимости · Новокузнецк</p>
      <h2 class="h1" data-r style="--i:2">ООО «Новый адрес»</h2>
      <p class="lead cp-lead" data-r style="--i:3">Компания переезжает в новый офис и строит сеть заново.</p>
      ${S(it,4)}
    </div>

    <div class="cp-numbers">
      <div class="cp-num" data-r style="--i:4">
        <div class="num-xl"><span data-count="8" data-duration="900">8</span></div>
        <p><b>рабочих мест</b> в офисе площадью около 100 м²</p>
      </div>
      <div class="cp-num" data-r style="--i:6">
        <div class="num-xl accent"><span data-count="10" data-duration="1100">10</span></div>
        <p><b>устройств в сети:</b> 8 ПК, сервер и МФУ</p>
      </div>
    </div>

    <div class="cp-ports" data-r style="--i:9">
      <span class="label accent">Расчёт портов коммутатора</span>
      <b>12 × 1,3 ≈ 16<span class="arr"></span>модель на 24 порта</b>
      <div class="cp-portgrid" aria-hidden="true">${lt}</div>
      <p>10 устройств, точка доступа и маршрутизатор. С запасом 30 % нужно 16 портов; у 24-портовой модели свободна половина.</p>
    </div>

    ${v("Было: бытовой роутер и одна сеть на всех","Бюджет — не более 200 000 ₽",10)}
  `},j=[["ПК-01","Директор","pc"],["ПК-02","Бухгалтер","pc"],["ПК-03","Ресепшн","pc"],["ПК-04","Менеджер","pc"],["ПК-05","Менеджер","pc"],["ПК-06","Менеджер","pc"],["ПК-07","Менеджер","pc"],["ПК-08","Юрист","pc"],["SRV-01","1С, файлы","srv"],["MFP-01","МФУ","mfp"],["AP-01","WEP-30L","ap"]],x=s=>56+s*104,L=s=>323+s*22,ct=(s,t)=>s==="pc"?`<rect x="${t-22}" y="500" width="44" height="30"/><path d="M${t} 530 v9 M${t-12} 539 h24"/>`:s==="srv"?`<rect x="${t-16}" y="496" width="32" height="44"/><path d="M${t-9} 508 h18 M${t-9} 518 h18 M${t-9} 528 h18"/>`:s==="mfp"?`<rect x="${t-22}" y="510" width="44" height="24"/><path d="M${t-13} 510 v-12 h26 v12 M${t-13} 534 v8 h26 v-8"/>`:`<circle cx="${t}" cy="524" r="5" class="tg-fill"/><path d="M${t-12} 512 a17 17 0 0 1 24 0 M${t-20} 504 a28 28 0 0 1 40 0"/><path d="M${t-20} 536 h40"/>`,nt=[["VLAN 10","STAFF","192.168.10.0/24 · 8 ПК сотрудников"],["VLAN 20","SERVERS","192.168.20.0/24 · сервер и МФУ"],["VLAN 30","GUEST","192.168.30.0/24 · гостевой Wi-Fi"],["VLAN 99","MGMT","192.168.99.0/24 · управление"]],ot={id:"topology",chapter:"Топология сети",title:"Топология и логическая структура сети",theme:"light",notes:`
    Физическая топология — «звезда». В центре коммутатор SW1, к нему отдельными линиями подключены
    все рабочие места, сервер, МФУ и точка доступа.

    Маршрутизатор R1 соединён с коммутатором одним транком, маршрутизация между VLAN выполняется
    на нём через подынтерфейсы — схема «router on a stick».

    Сеть разделена на четыре VLAN: сотрудники, серверы, гости и управление. Гостевая сеть изолирована
    межсетевым экраном: клиенты получают только интернет.

    Про файлы Эпштейна: гости получают только интернет, во внутреннюю сеть им хода нет — вообще никак.
  `,html:()=>`
    ${u("VLAN 30 изолирован надёжнее, чем файлы Эпштейна","left:112px;top:800px",14,-2)}
    <div class="tg-main">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 2.2</b> «звезда»</p>
      <h2 class="h1" data-r style="--i:2">Топология сети</h2>
      <ul class="tg-vlans">
        ${nt.map(([s,t,e],a)=>`
          <li data-r style="--i:${a+3}"><b><em>${s}</em>${t}</b><span>${e}</span></li>`).join("")}
      </ul>
      <p class="tg-note" data-r style="--i:8">Маршрутизация между VLAN — на R1, по одному транку 802.1Q.</p>
    </div>

    <svg class="tg-svg" viewBox="0 0 1160 800" role="img" aria-label="Схема сети: интернет, маршрутизатор R1, коммутатор SW1, восемь компьютеров, сервер, МФУ и точка доступа">
      <!-- lines -->
      <path class="draw tg-line" pathLength="1" d="M580 92 V150" style="--draw-delay:500ms;--draw-dur:500ms"/>
      <path class="draw tg-trunk" pathLength="1" d="M580 214 V300" style="--draw-delay:900ms;--draw-dur:600ms"/>
      ${j.map((s,t)=>`<path class="draw ${s[2]==="ap"?"tg-trunk tg-trunk--thin":"tg-line"}" pathLength="1" d="M${L(t)} 364 C ${L(t)} 440, ${x(t)} 420, ${x(t)} 492" style="--draw-delay:${1400+t*70}ms;--draw-dur:800ms"/>`).join("")}

      <!-- internet -->
      <g class="tg-in" style="--t:300ms">
        <circle cx="580" cy="62" r="28" class="tg-shape"/>
        <path class="tg-shape" d="M552 62 h56 M580 34 c-16 14 -16 42 0 56 M580 34 c16 14 16 42 0 56"/>
        <text x="624" y="58" class="tg-name">Интернет</text>
        <text x="624" y="78" class="tg-cap">провайдер · статический IP · 100 Мбит/с</text>
      </g>

      <!-- router -->
      <g class="tg-in" style="--t:700ms">
        <rect x="480" y="150" width="200" height="64" class="tg-box"/>
        <text x="580" y="189" text-anchor="middle" class="tg-name">R1 · Eltex ESR-15</text>
        <text x="700" y="178" class="tg-cap">маршрутизатор</text>
        <text x="700" y="198" class="tg-cap">NAT · межсетевой экран · DHCP · VPN</text>
        <text x="560" y="254" text-anchor="end" class="tg-cap tg-cap--acc">транк 802.1Q</text>
        <text x="560" y="274" text-anchor="end" class="tg-cap">VLAN 10, 20, 30, 99</text>
      </g>

      <!-- switch with 24 ports -->
      <g class="tg-in" style="--t:1100ms">
        <rect x="290" y="300" width="580" height="64" class="tg-box"/>
        ${Array.from({length:24},(s,t)=>`<rect x="${L(t)-7}" y="340" width="14" height="14" class="tg-port${t<11?" on":""}${t===23?" up":""}"/>`).join("")}
        <text x="306" y="326" class="tg-name">SW1 · SNR-S2985G-24T-UPS</text>
        <text x="890" y="326" class="tg-cap">коммутатор L2 · 24 × 1G</text>
        <text x="890" y="346" class="tg-cap">порты 12–23 — резерв</text>
      </g>

      <!-- devices -->
      ${j.map((s,t)=>`
        <g class="tg-in tg-dev${s[2]==="ap"?" tg-dev--ap":""}" style="--t:${1900+t*70}ms">
          ${ct(s[2],x(t))}
          <text x="${x(t)}" y="572" text-anchor="middle" class="tg-name tg-name--s">${s[0]}</text>
          <text x="${x(t)}" y="592" text-anchor="middle" class="tg-cap">${s[1]}</text>
        </g>`).join("")}

      <!-- VLAN brackets -->
      <g class="tg-in" style="--t:2900ms">
        <path class="tg-bracket" d="M20 624 v14 H820 v-14"/>
        <text x="420" y="668" text-anchor="middle" class="tg-name tg-name--s">VLAN 10 · STAFF</text>
        <text x="420" y="690" text-anchor="middle" class="tg-cap">192.168.10.0/24 · шлюз .1</text>
        <path class="tg-bracket" d="M852 624 v14 H1028 v-14"/>
        <text x="940" y="668" text-anchor="middle" class="tg-name tg-name--s">VLAN 20 · SERVERS</text>
        <text x="940" y="690" text-anchor="middle" class="tg-cap">192.168.20.0/24</text>
        <path class="tg-bracket tg-bracket--acc" d="M1056 624 v14 H1140 v-14"/>
        <text x="1140" y="714" text-anchor="end" class="tg-cap">Wi-Fi «Office» → VLAN 10</text>
        <text x="1140" y="734" text-anchor="end" class="tg-cap tg-cap--acc">Wi-Fi «Guest» → VLAN 30</text>
        <path class="tg-bracket tg-bracket--acc" d="M1098 638 V698"/>
      </g>
      <g class="tg-in" style="--t:3200ms">
        <path class="tg-legend" d="M20 748 h44"/>
        <text x="76" y="753" class="tg-cap">витая пара кат. 5e, 1 Гбит/с</text>
        <path class="tg-legend tg-legend--acc" d="M360 748 h44"/>
        <text x="416" y="753" class="tg-cap">транк IEEE 802.1Q</text>
        <text x="20" y="784" class="tg-cap">VLAN 99 · MGMT · 192.168.99.0/24 — управление: R1 .1, SW1 .2, AP-01 .3</text>
      </g>
    </svg>
  `},n=s=>20+s*80,o=s=>20+s*80,p=(s,t,e,a)=>`<path class="cb-wall" d="M${n(s)} ${o(t)} L${n(e)} ${o(a)}"/>`,dt=[["Р1 · ПК-01",12.3,2.4,"l"],["Р2 · ПК-02",8.6,.3,"b"],["Р3 · ПК-03",12.3,5.7,"l"],["Р4 · ПК-04",.2,1.6,"r"],["Р5 · ПК-05",.2,3.1,"r"],["Р6 · ПК-06",.2,4.6,"r"],["Р7 · ПК-07",.2,6.1,"r"],["Р8 · ПК-08",3.2,.3,"b"],["Р9 · МФУ",8,4.7,"b"],["Р10",7.3,3.6,"t"],["Р11 · резерв",2.6,7.8,"t"],["Р12 · резерв",12.3,7.2,"l"]],ht=([s,t,e,a],i)=>{const l=n(t),r=o(e),c=a==="l"?`x="${l-16}" y="${r+4}" text-anchor="end"`:a==="r"?`x="${l+16}" y="${r+4}"`:a==="b"?`x="${l}" y="${r+28}" text-anchor="middle"`:`x="${l}" y="${r-16}" text-anchor="middle"`;return`<g class="cb-sock" style="--t:${2200+i*90}ms"><rect x="${l-7}" y="${r-7}" width="14" height="14"/><text ${c}>${s}</text></g>`},b=(s,t,e,a)=>`<text class="cb-room" x="${n(e)}" y="${o(a)}" text-anchor="middle">${s}</text><text class="cb-area" x="${n(e)}" y="${o(a)+22}" text-anchor="middle">${t}</text>`,pt={id:"cabling",chapter:"Кабельная система",title:"План офиса и кабельная система",theme:"dark",notes:`
    На плане показано размещение шкафа, розеток и трасс кабеля. Телекоммуникационный шкаф стоит
    в серверной — бывшей кладовой. От него расходятся три трассы в кабель-канале.

    Средняя длина линии рассчитана по формуле с коэффициентом запаса 1,1 и запасом на разделку 3 метра —
    получилось 14,2 метра. На 12 линий нужно около 170 метров кабеля, достаточно одной бухты 305 метров.
    Кабель-канала — 48 метров.

    Все линии значительно короче 90 метров, то есть требование стандарта выполняется с запасом.
    Оборудование в шкафу подключено к ИБП 1000 ВА.
  `,html:({img:s})=>`
    ${y(s("friendWifi"),"когда упал Wi-Fi","а сделка горит","left:420px;top:790px;width:264px;height:178px",12,-3)}
    <div class="cb-main">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 2.2</b> план офиса</p>
      <h2 class="h1" data-r style="--i:2">Кабельная<br>система</h2>
      <ul class="cb-stats">
        <li data-r style="--i:3"><div class="num-l"><span data-count="12" data-duration="900">12</span></div><p><b>линий</b>10 устройств, точка доступа и 2 резерва</p></li>
        <li data-r style="--i:4"><div class="num-l"><span data-count="14.2" data-decimals="1" data-duration="1200">14,2</span><small>м</small></div><p><b>средняя длина линии</b>от 3 до 17,3 м по трассе</p></li>
        <li data-r style="--i:5"><div class="num-l accent"><span data-count="170" data-duration="1500">170</span><small>м</small></div><p><b>кабеля кат. 5e</b>одна бухта 305 м, остаток — в запас</p></li>
      </ul>
      <p class="cb-formula" data-r style="--i:6">L<sub>ср</sub> = (3 + 17,3) / 2 × 1,1 + 3 ≈ 14,2 м</p>
      <p class="cb-note" data-r style="--i:7">Все линии короче 90 м — требование ГОСТ Р 53246 выполнено.</p>
    </div>

    <svg class="cb-svg" viewBox="0 0 1040 730" role="img" aria-label="План офиса 12,5 на 8 метров с розетками и трассами кабеля">
      <g class="cb-in" style="--t:300ms">
        <path class="cb-outer" d="M20 20 H1020 V660 H${n(11.8)} M${n(10.6)} 660 H20 V20"/>
        ${p(5.5,0,5.5,2.6)}${p(5.5,3.5,5.5,8)}
        ${p(5.5,2,5.8,2)}${p(6.6,2,7.5,2)}
        ${p(7.5,0,7.5,4.5)}${p(10,0,10,4.5)}
        ${p(5.5,4.5,5.6,4.5)}${p(7.4,4.5,8.9,4.5)}${p(9.7,4.5,10.9,4.5)}${p(11.7,4.5,12.5,4.5)}
        ${b("Общий зал","≈ 44 м²",2.9,3.9)}
        ${b("Серверная","",6.4,1.78)}
        ${b("Коридор","≈ 5 м²",6.4,2.85)}
        ${b("Бухгалтерия","≈ 11 м²",8.75,2.3)}
        ${b("Кабинет","директора · ≈ 11 м²",11.1,3.4)}
        ${b("Приёмная","≈ 25 м²",9.6,6.3)}
        <text class="cb-area" x="${n(11.2)}" y="690" text-anchor="middle">вход</text>
        <text class="cb-area" x="20" y="716">12,5 × 8 м · ≈ 100 м²</text>
      </g>

      <!-- cable routes -->
      <path class="draw cb-route" pathLength="1" style="--draw-delay:1100ms;--draw-dur:2200ms" d="M${n(5.94)} ${o(.3)} H${n(.2)} V${o(7.8)} H${n(2.6)}"/>
      <path class="draw cb-route" pathLength="1" style="--draw-delay:1300ms;--draw-dur:1500ms" d="M${n(7.25)} ${o(.3)} H${n(12.3)} V${o(2.4)}"/>
      <path class="draw cb-route" pathLength="1" style="--draw-delay:1500ms;--draw-dur:2200ms" d="M${n(7.3)} ${o(.67)} V${o(4.7)} H${n(12.3)} V${o(7.2)}"/>
      <path class="draw cb-route" pathLength="1" style="--draw-delay:2400ms;--draw-dur:500ms" d="M${n(7.3)} ${o(3.6)} H${n(6.7)}"/>

      <!-- cabinet, server, access point -->
      <g class="cb-in" style="--t:800ms">
        <rect class="cb-cab" x="${n(5.94)}" y="${o(.13)}" width="${1.31*80}" height="${.54*80}"/>
        <text class="cb-cab-t" x="${n(6.6)}" y="${o(.47)}" text-anchor="middle">ТШ 9U</text>
        <rect class="cb-srv" x="${n(5.72)}" y="${o(.9)}" width="40" height="40"/>
        <text class="cb-area" x="${n(5.72)+20}" y="${o(.9)+25}" text-anchor="middle">SRV</text>
      </g>
      <g class="cb-sock cb-ap" style="--t:2900ms">
        <circle cx="${n(6.5)}" cy="${o(3.6)}" r="15"/>
        <text x="${n(6.5)}" y="${o(3.6)+36}" text-anchor="middle">AP-01</text>
      </g>
      ${dt.map(ht).join("")}

      <g class="cb-in" style="--t:3300ms">
        <path class="cb-route cb-route--legend" d="M330 711 h44"/>
        <text class="cb-area" x="386" y="716">трасса в кабель-канале 25×16 мм</text>
        <rect class="cb-legend-sock" x="700" y="704" width="14" height="14"/>
        <text class="cb-area" x="726" y="716">розетка RJ-45 · номер = порт панели</text>
      </g>
    </svg>
  `},mt=[{role:"Маршрутизатор",model:"Eltex ESR-15",price:45e3,approx:!0,why:"VLAN, NAT, межсетевой экран, DHCP и VPN. Экран пропускает 1,51 Гбит/с при канале 100 Мбит/с.",alts:[["Eltex ESR-20","≈ 95 000 ₽"],["QTECH QSR-1920","≈ 60 000 ₽"]]},{role:"Коммутатор",model:"SNR-S2985G-24T-UPS",price:23838,pick:!0,why:"24 порта 1G, VLAN и транки 802.1Q. Без вентилятора: в кладовой работает бесшумно.",alts:[["Eltex MES2324","≈ 75 000 ₽"],["QTECH QSW-3750","89 087 ₽"]]},{role:"Точка доступа",model:"Eltex WEP-30L",price:22e3,approx:!0,why:"Wi-Fi 6, порт 2,5G, питание PoE, до 14 SSID. Внесена в реестр по ПП № 719.",alts:[["SNR-AP622-I","≈ 20 000 ₽"],["QTECH QWP-82E","47 579 ₽"]]}],ut={id:"equipment",chapter:"Выбор моделей",title:"Выбранное оборудование",theme:"light",notes:`
    Для каждого типа оборудования сравнивались три модели; под выбранной моделью — две не выбранные с ценами.

    Маршрутизатор — Eltex ESR-15: закрывает все задачи, а более мощный ESR-20 стоит вдвое дороже.
    Коммутатор — SNR: маршрутизация выполняется на ESR-15, порты 10G не нужны, он в три-четыре раза
    дешевле аналогов и работает бесшумно.
    Точка доступа — Eltex WEP-30L: Wi-Fi 6, есть в реестре, тот же производитель, что и у маршрутизатора.

    Знак «≈» — ориентировочная цена: дилеры называют её только по запросу.

    ESR-20 мощнее, но для восьми человек это оверкилл — «нас и тут неплохо кормят».
  `,html:({img:s})=>`
    ${u("ESR-20 за 95 000 ₽? нас и тут неплохо кормят","right:380px;top:236px",13,-2)}
    ${y(s("friendAdmin"),"приходящий админ","выбор одобряет","right:112px;top:106px;width:236px;height:208px",11,3)}
    <div class="frame">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 2.3</b> по три модели на каждую позицию</p>
      <h2 class="h1 mk-h" data-r style="--i:2">Выбранное оборудование</h2>
    </div>

    <div class="mk-grid eq-grid">
      ${mt.map((t,e)=>`
        <article class="mk-col${t.pick?" is-pick":""}" data-r style="--i:${e*2+3}">
          <span class="label">${t.role}</span>
          <h3 class="h3">${t.model}</h3>
          <div class="num-l mk-price">${t.approx?"<small>≈</small>":""}<span data-count="${t.price}" data-duration="1500" data-delay="${500+e*200}">${t.price}</span><small>₽</small></div>
          <p class="eq-why">${t.why}</p>
          <span class="label eq-alt-h">Не выбраны</span>
          ${t.alts.map(([a,i])=>`<p class="eq-alt"><span>${a}</span><span>${i}</span></p>`).join("")}
        </article>`).join("")}
    </div>

    ${v("Маршрутизация — на ESR-15, порты 10G не нужны","Коммутатору достаточно уровня L2",9)}
  `},A=s=>(s/2e5*80).toFixed(2),C=[["Активное оборудование",111338,"62 %","a"],["СКС и материалы",37440,"21 %","b"],["Работы",31600,"17 %","c"]],gt={id:"budget",chapter:"Бюджет",title:"Бюджет проекта",theme:"dark",notes:`
    Общая стоимость проекта — 180 378 рублей. Активное оборудование — около 62 %, пассивное оборудование
    и материалы — 21 %, работы — 17 %. Сумма укладывается в бюджет 200 тысяч, почти 20 тысяч остаётся
    на непредвиденные расходы.

    Если взять коммутатор того же производителя, что и маршрутизатор — Eltex MES2324, — проект подорожает
    на 51 тысячу, до 231 540 рублей, и выйдет за бюджет. Поэтому в сети сочетается оборудование двух производителей.
    Совместной работе это не мешает: VLAN и транки 802.1Q — открытые стандарты.

    Цены ориентировочные, на ноябрь 2026 года; компьютеры, сервер и МФУ в смету не входят.

    Уложиться в бюджет — rare W. А вариант с MES2324 — это L на 31 540 рублей.
  `,html:({img:s})=>`
    ${y(s("catpc"),"главбух проверяет смету","замечаний нет","right:112px;top:286px;width:330px;height:236px",10,2)}
    ${u("уложились в бюджет — rare W","right:470px;top:300px",13,-2)}
    <div class="frame">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 2.3</b> смета: оборудование, материалы, работы</p>
      <h2 class="h1 mk-h" data-r style="--i:2">Бюджет проекта</h2>
    </div>

    <div class="bd-total" data-r style="--i:3">
      <div class="num-xl"><span data-count="180378" data-duration="2000">180 378</span><small>₽</small></div>
      <p><b>при лимите 200 000 ₽</b>около 22,5 тыс. ₽ на одно рабочее место</p>
    </div>

    <div class="bd-chart">
      <div class="bd-limit" data-r="fade" style="--i:12"><span>лимит 200 000 ₽</span></div>

      <div class="bd-row" data-r="fade" style="--i:5">
        <span class="label">Проект</span>
        <div class="bd-bar">
          ${C.map(([,t,,e],a)=>`<i class="bd-seg bd-seg--${e}" style="width:${A(t)}%;--bd:${900+a*350}ms"></i>`).join("")}
        </div>
        <div class="bd-legend">
          ${C.map(([t,e,a],i)=>`<div style="width:${A(e)}%"><span class="label">${t}</span><b>${e.toLocaleString("ru-RU").replace(/ /g," ")} ₽ · ${a}</b></div>`).join("")}
        </div>
      </div>

      <div class="bd-row bd-row--alt" data-r="fade" style="--i:9">
        <span class="label">Если коммутатор — Eltex MES2324</span>
        <div class="bd-bar">
          <i class="bd-seg bd-seg--ghost" style="width:80%;--bd:2100ms"></i><i class="bd-seg bd-seg--over" style="width:${(31540/2e5*80).toFixed(2)}%;--bd:2500ms"></i>
          <b class="bd-alt-v">231 540 ₽</b>
        </div>
      </div>
    </div>

    ${v("С Eltex MES2324 бюджет превышен на 31 540 ₽","Поэтому в сети два производителя",12)}
  `},vt=[["«Звезда» со свёрнутым ядром","один маршрутизатор и один управляемый коммутатор"],["Четыре VLAN","гостевой Wi-Fi изолирован межсетевым экраном"],["Кабельная система из 12 линий","половина портов коммутатора свободна"],["180 378 ₽","в пределах бюджета 200 000 ₽"]],yt={id:"conclusion",chapter:"Заключение",title:"Заключение",theme:"dark",notes:`
    Цель работы достигнута, все задачи решены. Спроектирована сеть с топологией «звезда», четырьмя VLAN
    и изолированной гостевой сетью, рассчитана кабельная система из 12 линий, подобраны модели оборудования,
    стоимость проекта укладывается в бюджет.

    Сеть можно развивать без замены основного оборудования: на коммутаторе остаётся 12 свободных портов,
    к маршрутизатору можно подключить резервный интернет-канал, добавить IP-камеры или вторую точку доступа.

    Проект можно использовать как типовое решение для офиса на 5–15 рабочих мест.
    Спасибо за внимание, готов ответить на вопросы.

    Закончи спокойно, как сигма: цель достигнута, бюджет цел, аура нафармлена.
  `,html:({img:s})=>`
    ${u("ауры нафармлено: 180 378","right:112px;top:150px",15,2)}
    ${y(s("friendDark"),"свет отключили","ИБП держит сеть","right:112px;top:214px;width:270px;height:192px",12,2)}
    <figure class="fn-photo photo photo--archive kb grain" data-r="mask" style="--i:0">
      ${s("patch")}
      <figcaption class="caption"><b>Патч-панель</b><br>каждая линия приходит на свой порт</figcaption>
    </figure>

    <div class="fn-main">
      <p class="eyebrow" data-r style="--i:1"><b>Итоги</b> цель достигнута</p>
      <h2 class="h1" data-r style="--i:2">Заключение</h2>
      ${S(vt,3,!0)}
      <div class="fn-next" data-r style="--i:8">
        <span class="label">Развитие без замены оборудования</span>
        <div class="chips">
          <span class="chip"><i></i>12 свободных портов</span>
          <span class="chip"><i></i>резервный интернет-канал</span>
          <span class="chip"><i></i>IP-камеры, вторая точка доступа</span>
        </div>
      </div>
      <p class="fn-final" data-r style="--i:10">Офисную сеть можно целиком собрать на&nbsp;российском оборудовании.</p>
      <p class="fn-thanks label" data-r="fade" style="--i:13"><i class="pulse"></i>Спасибо за внимание</p>
    </div>
  `},bt=[{key:"lincoln",name:"Авраам Линкольн",role:"эксперт по сегментации",quote:"Сеть народа и для народа. Но без гостевого доступа к бухгалтерии."},{key:"franklin",name:"Бенджамин Франклин",role:"эксперт по смете",quote:"Сбережённый рубль — заработанный рубль. Тут сберегли 19 622."},{key:"obama",name:"Барак Обама",role:"эксперт по мотивации",quote:"Yes, we VLAN."},{key:"trump",name:"Дональд Трамп",role:"эксперт по масштабу",quote:"Это лучшая сеть. Огромная. Все так говорят."}],$t={id:"experts",chapter:"Бонус: экспертный совет",title:"Экспертный совет проекта",theme:"light",notes:`
    Бонусный слайд, если комиссия в хорошем настроении. Цитаты выдуманы — это прямо написано на слайде.

    19 622 рубля — это разница между лимитом 200 000 и сметой 180 378, тут всё честно.
    «Yes, we VLAN» произноси уверенно. Сик севен.
  `,html:({img:s})=>`
    <div class="frame">
      <p class="eyebrow" data-r style="--i:1"><b>Бонус</b> мнения, которых никто не спрашивал</p>
      <h2 class="h1 mk-h" data-r style="--i:2">Экспертный совет проекта</h2>
    </div>

    <div class="ex-grid">
      ${bt.map((t,e)=>`
        <figure class="ex-card" data-r style="--i:${e*2+3}">
          <div class="ex-pic photo photo--archive grain">${s(t.key)}</div>
          <figcaption>
            <span class="label accent">${t.role}</span>
            <b>${t.name}</b>
            <p>«${t.quote}»</p>
          </figcaption>
        </figure>`).join("")}
    </div>

    ${v("Цитаты выдуманы, это мем","Смета настоящая",12)}
  `},xt=[{key:"scooter",tag:"бытовой роутер",text:"едет, пока сухо и под горку"},{key:"familia",tag:"Eltex ESR-15 · ≈ 45 000 ₽",text:"надёжно, красиво, без понтов"},{key:"m5",tag:"Eltex MES2324 · ≈ 75 000 ₽",text:"мечта, но бюджет говорит «нет»"},{key:"panther",tag:"пассивное охлаждение",text:"работает бесшумно"},{key:"banya",tag:"серверная без кондиционера",text:"бывшая кладовая, лето"},{key:"bunker",tag:"VLAN 30 · гости",text:"наружу — пожалуйста, внутрь — никак"}],ft=[K,J,tt,at,rt,ot,pt,ut,gt,yt,$t,{id:"garage",chapter:"Бонус: на понятном языке",title:"Выбор оборудования на понятном языке",theme:"dark",notes:`
    Второй бонусный слайд: весь выбор оборудования на картинках.

    Самокат — старый бытовой роутер. Красная Mazda Familia —
    маршрутизатор ESR-15: без понтов, зато едет каждый день. BMW M5 — коммутатор MES2324: хочется, но не в этот бюджет.
    Пантера — пассивное охлаждение. Баня — серверная без кондиционера. Бункер — гостевая сеть.

    Газява и хрумки в смету не вошли — это отдельная статья расходов. В Rust за это время можно было бы
    отстроить базу, но мы строили сеть.
  `,html:({img:s})=>`
    ${u("six seven","right:112px;top:262px",12,3)}
    ${u("нейрослопа: 0 %","right:250px;top:300px",14,-2)}
    <div class="frame">
      <p class="eyebrow" data-r style="--i:1"><b>Бонус</b> для тех, кто не админ</p>
      <h2 class="h1 mk-h" data-r style="--i:2">Выбор оборудования на&nbsp;понятном языке</h2>
    </div>

    <div class="gr-grid">
      ${xt.map((t,e)=>`
        <figure class="gr-tile" data-r style="--i:${e+3}">
          <div class="gr-pic photo kb">${s(t.key)}</div>
          <figcaption><span class="label accent">${t.tag}</span><b>${t.text}</b></figcaption>
        </figure>`).join("")}
      <div class="gr-side" data-r style="--i:11">
        <span class="label">В смету не вошли</span>
        <ul>
          <li><i></i>газява и хрумки</li>
          <li><i></i>2000 часов в Rust</li>
          <li><i></i>баня после защиты</li>
        </ul>
      </div>
    </div>
  `}],N={cover:{file:"images/rack-rear.jpg",alt:"Задняя сторона серверной стойки с кабелями",title:"Задняя сторона стойки в дата-центре NERSC",author:"Derrick Coetzee",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Rear_of_rack_at_NERSC_data_center_-_closeup.jpg",position:"50% 50%"},mess:{file:"images/cable-spaghetti.jpg",alt:"Серверная стойка с перепутанными сетевыми кабелями",title:"Стойка с «лапшой» из сетевых кабелей",author:"Kim Scarborough",license:"CC BY-SA 2.0",source:"https://commons.wikimedia.org/wiki/File:Server_Rack_with_Spaghetti-Like_Mass_of_Network_Cables.jpg",position:"50% 45%"},oldnet:{file:"images/unmanaged-switch.jpg",alt:"Небольшой неуправляемый коммутатор на пять портов с подключёнными кабелями",title:"Неуправляемый гигабитный коммутатор на 5 портов",author:"Simon A. Eugster",license:"CC BY-SA 3.0",source:"https://commons.wikimedia.org/wiki/File:Netgear_Gigabit_Switch_5-port.jpg",position:"50% 50%"},patch:{file:"images/patch-panel.jpg",alt:"Патч-панель Ethernet с подключёнными патч-кордами",title:"Патч-панель Ethernet",author:"Kbh3rd",license:"CC BY 4.0",source:"https://commons.wikimedia.org/wiki/File:Ethernet_Patch_Panel_20171121_130458.jpg",position:"50% 50%"},grumpy:{file:"images/grumpy-cat.jpg",alt:"Недовольная кошка Grumpy Cat",title:"Grumpy Cat",author:"Gage Skidmore",license:"CC BY-SA 2.0",source:"https://commons.wikimedia.org/wiki/File:Grumpy_Cat_(14351394877).jpg",position:"50% 60%"},catpc:{file:"images/cat-computer.jpg",alt:"Кошка сидит у компьютера",title:"Кошка и компьютер",author:"dougwoods",license:"CC BY 2.0",source:"https://commons.wikimedia.org/wiki/File:Midge_cat_and_computer.jpg",position:"50% 40%"},facepalm:{file:"images/facepalm.jpg",alt:"Статуя, закрывающая лицо рукой",title:"Статуя «Каин» в саду Тюильри («фейспалм»)",author:"Alex E. Proimos",license:"CC BY 2.0",source:"https://commons.wikimedia.org/wiki/File:Paris_Tuileries_Garden_Facepalm_statue.jpg",position:"50% 25%"},friendAdmin:{file:"images/friend-admin.jpg",alt:"Парень в очках улыбается",title:"Мем-карточка «Приходящий админ»",author:"личное фото",license:"с согласия",source:""},friendWifi:{file:"images/friend-wifi.jpg",alt:"Парень кричит в камеру",title:"Мем-карточка «Когда упал Wi-Fi»",author:"личное фото",license:"с согласия",source:""},friendDark:{file:"images/friend-dark.jpg",alt:"Тёмное селфи с жестом «мир»",title:"Мем-карточка «Свет отключили»",author:"личное фото",license:"с согласия",source:""},trump:{file:"images/trump.jpg",alt:"Портрет Дональда Трампа",title:"Дональд Трамп, официальный портрет",author:"Shealeah Craighead",license:"Public domain",source:"https://commons.wikimedia.org/wiki/File:Donald_Trump_official_portrait.jpg"},obama:{file:"images/obama.jpg",alt:"Портрет Барака Обамы",title:"Барак Обама, официальный портрет",author:"Official White House Photo by Pete Souza",license:"Public domain",source:"https://commons.wikimedia.org/wiki/File:President_Barack_Obama.jpg"},lincoln:{file:"images/lincoln.jpg",alt:"Портрет Авраама Линкольна",title:"Авраам Линкольн (1863)",author:"Alexander Gardner",license:"Public domain",source:"https://commons.wikimedia.org/wiki/File:Abraham_Lincoln_O-77_matte_collodion_print.jpg"},franklin:{file:"images/franklin.jpg",alt:"Портрет Бенджамина Франклина",title:"Бенджамин Франклин, портрет работы Дюплесси",author:"Joseph-Siffred Duplessis",license:"Public domain",source:"https://commons.wikimedia.org/wiki/File:Joseph_Siffrein_Duplessis_-_Benjamin_Franklin_-_Google_Art_Project.jpg"},m5:{file:"images/m5.jpg",alt:"Зелёный BMW M5, вид сзади",title:"BMW M5 (F90)",author:"Sebastiaan Broekhoven",license:"CC BY-SA 4.0",source:"https://commons.wikimedia.org/wiki/File:BMW_M5_(F90)_-_front_three-quarter_view_-_Netherlands.jpg"},familia:{file:"images/familia.jpg",alt:"Красная Mazda Familia 1966 года",title:"Mazda Familia Coupe 1000 (1966)",author:"TTTNIS",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:1966_Mazda_Familia_Coupe_1000.jpg"},bunker:{file:"images/bunker.jpg",alt:"Бетонный вход в бункер",title:"Бункер в Саргансе",author:"Kecko from Eastern Switzerland",license:"CC BY 2.0",source:"https://commons.wikimedia.org/wiki/File:Sargans_SBB_-_BSO_Bunker_(48397102692).jpg"},scooter:{file:"images/scooter.jpg",position:"40% 70%",alt:"Самокат у набережной",title:"Самокат",author:"Matti Blume",license:"CC BY-SA 4.0",source:"https://commons.wikimedia.org/wiki/File:Ex_scooter,_Frankfurt_am_Main_(LRM_20210815_134347).jpg"},panther:{file:"images/panther.jpg",position:"25% 45%",alt:"Чёрная пантера в траве",title:"Чёрная пантера (леопард-меланист)",author:"FlyTheMouse",license:"CC BY 4.0",source:"https://commons.wikimedia.org/wiki/File:A_black_panther_(melanistic_african_leopard),_yawning.jpg"},banya:{file:"images/banya.jpg",alt:"Плавучая сауна у причала",title:"Плавучая сауна, Тьювхольмен, Осло",author:"Frank Schulenburg",license:"CC BY-SA 4.0",source:"https://commons.wikimedia.org/wiki/File:Tjuvholmen,_Sauna_(2024)-L1006528.jpg"}},F=document.getElementById("app");function wt(){const s="./",t=Object.values(N).map(i=>new Promise(l=>{const r=new Image;r.onload=r.onerror=l,r.src=`${s}${i.file}`})),e=document.fonts?document.fonts.ready:Promise.resolve(),a=new Promise(i=>setTimeout(i,2500));return Promise.race([Promise.all([...t,e]),a])}wt().then(()=>z(F,"./")).then(()=>{const s=new U(F,ft,{images:N,base:"./"}).mount();window.__deck=s})})();
