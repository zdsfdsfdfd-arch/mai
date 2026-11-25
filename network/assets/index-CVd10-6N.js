(function(){"use strict";const T='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',H='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',b=s=>String(s).padStart(2,"0");function p(s,t={},e=""){const a=document.createElement(s);for(const[l,i]of Object.entries(t))i===!1||i==null||a.setAttribute(l,i===!0?"":i);return e&&(a.innerHTML=e),a}function O(s){const t=p("div",{class:"chrome","aria-hidden":"false"});return t.innerHTML=`
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
        <div class="counter" aria-live="polite"><b class="cur">01</b> / ${b(s)}</div>
        <div class="nav-btns">
          <button class="nav-btn" type="button" data-action="prev" aria-label="Предыдущий слайд">${T}</button>
          <button class="nav-btn" type="button" data-action="next" aria-label="Следующий слайд">${H}</button>
        </div>
      </div>
    </div>
    <div class="progress" role="progressbar" aria-label="Прогресс презентации" aria-valuemin="1" aria-valuemax="${s}">
      <div class="progress-fill"></div>
      <div class="progress-ticks">
        ${Array.from({length:s},(e,a)=>`<button type="button" data-goto="${a}" aria-label="Слайд ${a+1}"></button>`).join("")}
      </div>
    </div>`,t}function P(s){const t=p("div",{class:"overlay",id:"overview",role:"dialog","aria-modal":"true","aria-label":"Содержание"});return t.innerHTML=`
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
    </div>`,t}function C(){const s=p("aside",{class:"notes",id:"notes","aria-label":"Заметки докладчика"});return s.innerHTML=`
    <div class="notes-inner">
      <div class="notes-label">Заметки докладчика<br><span class="muted">N — скрыть</span></div>
      <div class="notes-text"></div>
    </div>`,s}function R(){const s=[["Следующий слайд","→ · Пробел · PgDn"],["Предыдущий слайд","← · Shift+Пробел · PgUp"],["Первый / последний","Home · End"],["Содержание","O · Esc"],["Заметки докладчика","N"],["Полный экран","F"],["Источники фотографий","I"],["Эта подсказка","H · ?"]],t=p("div",{class:"overlay",id:"help",role:"dialog","aria-modal":"true","aria-label":"Управление"});return t.innerHTML=`
    <div class="overlay-panel" style="width:min(820px,100%)">
      <div class="overlay-head">
        <h2>Управление</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <div class="keys">
        ${s.map(([e,a])=>`<div><span>${e}</span><kbd>${a}</kbd></div>`).join("")}
      </div>
      <p class="muted" style="margin-top:24px;font-size:14px">На телефоне и планшете листайте свайпом влево и вправо.</p>
    </div>`,t}function j(s,t){const e=p("div",{class:"overlay",id:"credits",role:"dialog","aria-modal":"true","aria-label":"Источники фотографий"}),a=Object.values(s).map(l=>`
      <li>
        <img src="${t}${l.file}" alt="" loading="lazy">
        <div>
          <b>${l.title}</b>
          <span>${l.author} · ${l.license}</span><br>
          ${l.source?`<a href="${l.source}" target="_blank" rel="noopener">${l.source.replace("https://","")}</a>`:""}
        </div>
      </li>`).join("");return e.innerHTML=`
    <div class="overlay-panel">
      <div class="overlay-head">
        <h2>Источники фотографий</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <ul class="credits-list">${a}</ul>
    </div>`,e}const V=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches,F=s=>1-Math.pow(1-s,3);function x(s,t=0){const e=s.toFixed(t),[a,l]=e.split("."),i=a.length>4?a.replace(/\B(?=(\d{3})+(?!\d))/g," "):a;return l?`${i},${l}`:i}const f=new WeakMap;function I(s){s.querySelectorAll("[data-count]").forEach(t=>{const e=parseFloat(t.dataset.count),a=parseFloat(t.dataset.from??"0"),l=parseInt(t.dataset.decimals??"0",10),i=parseInt(t.dataset.duration??"1600",10),r=parseInt(t.dataset.delay??"350",10);if(cancelAnimationFrame(f.get(t)),V()){t.textContent=x(e,l);return}t.textContent=x(a,l);const n=performance.now()+r,d=$=>{const M=Math.min(1,Math.max(0,($-n)/i));t.textContent=x(a+(e-a)*F(M),l),M<1&&f.set(t,requestAnimationFrame(d))};f.set(t,requestAnimationFrame(d))})}function W(s){s.querySelectorAll("[data-count]").forEach(t=>{cancelAnimationFrame(f.get(t)),t.textContent=x(parseFloat(t.dataset.count),parseInt(t.dataset.decimals??"0",10))})}const q=1920,D=1080,Q=2600;class G{constructor(t,e,{images:a={},base:l="./"}={}){this.root=t,this.slides=e,this.images=a,this.base=l,this.index=-1,this.step=0,this.locked=!1}mount(){const{root:t,slides:e}=this;this.stage=p("div",{class:"stage","data-dir":"fwd"}),this.track=p("div",{class:"slides"}),this.sections=e.map((l,i)=>{const r=p("section",{class:`slide slide--${l.id}`,"data-theme":l.theme||"dark","data-index":i,"aria-roledescription":"слайд","aria-label":`${i+1} из ${e.length}: ${l.title}`});return r.innerHTML=l.html({base:this.base,img:this.img.bind(this)}),this.track.appendChild(r),r}),this.chrome=O(e.length),this.stage.append(this.track,this.chrome),this.overview=P(e),this.notes=C(),this.help=R(),this.credits=j(this.images,this.base),this.toast=p("div",{class:"toast",role:"status"},"→ или Пробел — дальше · H — управление"),t.append(this.stage,this.notes,this.overview,this.help,this.credits,this.toast),this.$={chapterWrap:this.chrome.querySelector(".chrome-chapter"),chapterNum:this.chrome.querySelector(".chrome-chapter .num"),chapterName:this.chrome.querySelector(".chrome-chapter .name"),counter:this.chrome.querySelector(".counter .cur"),fill:this.chrome.querySelector(".progress-fill"),progress:this.chrome.querySelector(".progress"),dots:this.chrome.querySelector(".step-dots"),prev:this.chrome.querySelector('[data-action="prev"]'),next:this.chrome.querySelector('[data-action="next"]'),notesText:this.notes.querySelector(".notes-text")},this.bind(),this.fit();const a=this.indexFromHash();return this.go(a??0,{instant:!0}),setTimeout(()=>this.toast.classList.add("is-show"),900),setTimeout(()=>this.toast.classList.remove("is-show"),5200),this.pokeIdle(),this}img(t,{alt:e,className:a="",position:l}={}){const i=this.images[t];if(!i)throw new Error(`Unknown image: ${t}`);const r=l||i.position,n=r?` style="object-position:${r}"`:"",d=a?` class="${a}"`:"";return`<img src="${this.base}${i.file}" alt="${e??i.alt}"${d} decoding="async" draggable="false"${n}>`}fit(){const t=this.root.clientWidth,e=this.root.clientHeight,a=Math.min(t/q,e/D);this.stage.style.setProperty("--scale",String(a))}stepsOf(t){return Math.max(1,this.slides[t]?.steps||1)}next(){if(this.step<this.stepsOf(this.index)-1)return this.setStep(this.step+1);this.index<this.slides.length-1&&this.go(this.index+1)}prev(){if(this.step>0)return this.setStep(this.step-1);this.index>0&&this.go(this.index-1,{step:this.stepsOf(this.index-1)-1})}go(t,{step:e=0,instant:a=!1}={}){const l=Math.max(0,Math.min(this.slides.length-1,t));if(l===this.index){this.setStep(e);return}const i=this.index,r=this.sections[i],n=this.sections[l],d=this.slides[l];this.stage.dataset.dir=l>i?"fwd":"back",r&&(r.classList.remove("is-active"),r.classList.add("is-leaving"),clearTimeout(r._leaveTimer),r._leaveTimer=setTimeout(()=>r.classList.remove("is-leaving"),750),r.setAttribute("aria-hidden","true"),r.inert=!0),n.classList.remove("is-leaving"),n.offsetWidth,a&&(n.style.transition="none"),n.classList.add("is-active"),n.removeAttribute("aria-hidden"),n.inert=!1,a&&requestAnimationFrame(()=>n.style.transition=""),this.index=l,this.step=-1,this.setStep(e,{silent:!0}),this.stage.classList.toggle("is-light",d.theme==="light"),I(n),r&&setTimeout(()=>W(r),800),d.onEnter?.(n,this),this.updateChrome(d,i===-1),this.updateHash()}setStep(t,{silent:e=!1}={}){const a=this.stepsOf(this.index)-1,l=Math.max(0,Math.min(a,t));if(l===this.step&&!e)return;this.step=l;const i=this.sections[this.index];i.dataset.step=String(l),this.slides[this.index].onStep?.(i,l,this),this.renderDots(),this.updateProgress(),this.updateNav()}updateChrome(t,e){const{chapterWrap:a,chapterNum:l,chapterName:i,counter:r,notesText:n}=this.$,d=()=>{l.textContent=b(this.index+1),i.textContent=t.chapter,a.classList.remove("is-swapping")};e?d():(a.classList.add("is-swapping"),setTimeout(d,260)),r.textContent=b(this.index+1),n.innerHTML=(t.notes||"").trim().split(/\n\s*\n/).map($=>`<p>${$.trim()}</p>`).join(""),this.overview.querySelectorAll(".overview-item").forEach(($,M)=>$.classList.toggle("is-current",M===this.index)),this.$.progress.setAttribute("aria-valuenow",String(this.index+1))}updateProgress(){const t=this.slides.length,e=this.stepsOf(this.index),a=e>1?this.step/e:0,l=(this.index+a+1)/t*100;this.$.fill.style.width=`${Math.min(100,l)}%`}renderDots(){const t=this.stepsOf(this.index);this.$.dots.innerHTML=t>1?Array.from({length:t},(e,a)=>`<i class="${a<=this.step?"on":""}"></i>`).join(""):""}updateNav(){const t=this.index===0&&this.step===0,e=this.index===this.slides.length-1&&this.step===this.stepsOf(this.index)-1;this.$.prev.disabled=t,this.$.next.disabled=e}updateHash(){const t=`#slide-${this.index+1}`;try{location.hash!==t&&history.replaceState(null,"",t)}catch{}}indexFromHash(){const t=/^#slide-(\d+)$/.exec(location.hash);if(!t)return null;const e=parseInt(t[1],10)-1;return e>=0&&e<this.slides.length?e:null}openOverlay(t){[this.overview,this.help,this.credits].forEach(a=>a!==t&&a.classList.remove("is-open")),t.classList.add("is-open"),this.activeOverlay=t;const e=t.querySelector(".is-current")||t.querySelector("[data-close]");setTimeout(()=>e?.focus({preventScroll:!0}),50)}closeOverlay(){return this.activeOverlay?(this.activeOverlay.classList.remove("is-open"),this.activeOverlay=null,!0):!1}toggleOverlay(t){this.activeOverlay===t?this.closeOverlay():this.openOverlay(t)}toggleNotes(){this.notes.classList.toggle("is-open")}async toggleFullscreen(){try{document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()}catch{}}pokeIdle(){this.root.classList.remove("is-idle"),clearTimeout(this.idleTimer),this.idleTimer=setTimeout(()=>this.root.classList.add("is-idle"),Q)}bind(){window.addEventListener("resize",()=>this.fit()),window.addEventListener("hashchange",()=>{const i=this.indexFromHash();i!=null&&i!==this.index&&this.go(i)}),document.addEventListener("keydown",i=>this.onKey(i)),document.addEventListener("mousemove",()=>this.pokeIdle(),{passive:!0}),this.root.addEventListener("click",i=>{const r=i.target.closest("[data-action],[data-goto],[data-close],[data-step-to]");if(!r)return;if(r.hasAttribute("data-close"))return void this.closeOverlay();if(r.dataset.goto!=null)return this.closeOverlay(),void this.go(parseInt(r.dataset.goto,10));if(r.dataset.stepTo!=null)return void this.setStep(parseInt(r.dataset.stepTo,10));const n=r.dataset.action;n==="next"?this.next():n==="prev"?this.prev():n==="overview"?this.toggleOverlay(this.overview):n==="credits"?this.toggleOverlay(this.credits):n==="help"&&this.toggleOverlay(this.help)}),[this.overview,this.help,this.credits].forEach(i=>i.addEventListener("click",r=>{r.target===i&&this.closeOverlay()}));let t=0,e=0,a=0;this.stage.addEventListener("touchstart",i=>{const r=i.touches[0];t=r.clientX,e=r.clientY,a=Date.now()},{passive:!0}),this.stage.addEventListener("touchend",i=>{const r=i.changedTouches[0],n=r.clientX-t,d=r.clientY-e;Date.now()-a<700&&Math.abs(n)>40&&Math.abs(n)>Math.abs(d)*1.3&&(n<0?this.next():this.prev())},{passive:!0});let l=0;window.addEventListener("wheel",i=>{if(this.activeOverlay)return;const r=Math.abs(i.deltaY)>Math.abs(i.deltaX)?i.deltaY:i.deltaX;if(Math.abs(r)<24)return;const n=Date.now();n<l||(l=n+900,r>0?this.next():this.prev())},{passive:!0})}onKey(t){if(t.metaKey||t.ctrlKey||t.altKey)return;const e=t.key;if(this.pokeIdle(),e==="Escape")return this.closeOverlay()?t.preventDefault():this.notes.classList.contains("is-open")?this.toggleNotes():this.openOverlay(this.overview);if(this.activeOverlay){(e==="o"||e==="O"||e==="щ"||e==="Щ")&&this.activeOverlay===this.overview&&this.closeOverlay(),(e==="i"||e==="I"||e==="ш"||e==="Ш")&&this.activeOverlay===this.credits&&this.closeOverlay(),(e==="h"||e==="H"||e==="?"||e==="р"||e==="Р")&&this.activeOverlay===this.help&&this.closeOverlay();return}const a=document.activeElement?.tagName==="BUTTON";switch(e){case"ArrowRight":case"ArrowDown":case"PageDown":return t.preventDefault(),this.next();case"ArrowLeft":case"ArrowUp":case"PageUp":return t.preventDefault(),this.prev();case" ":case"Spacebar":return a?void 0:(t.preventDefault(),t.shiftKey?this.prev():this.next());case"Enter":return a?void 0:(t.preventDefault(),this.next());case"Home":return t.preventDefault(),this.go(0);case"End":return t.preventDefault(),this.go(this.slides.length-1)}const i={f:"fs",F:"fs",а:"fs",А:"fs",n:"notes",N:"notes",т:"notes",Т:"notes",o:"overview",O:"overview",щ:"overview",Щ:"overview",h:"help",H:"help","?":"help",р:"help",Р:"help",i:"credits",I:"credits",ш:"credits",Ш:"credits"}[e];i==="fs"?this.toggleFullscreen():i==="notes"?this.toggleNotes():i==="overview"?this.toggleOverlay(this.overview):i==="help"?this.toggleOverlay(this.help):i==="credits"&&this.toggleOverlay(this.credits)}}const w=[{x:112,year:"Раздел 1",label:"Теория"},{x:560,year:"Раздел 1.3",label:"Рынок"},{x:1010,year:"Раздел 2",label:"Проект сети"},{x:1460,year:"Итог",label:"180 378 ₽"}],B={id:"cover",chapter:"Обложка",title:"Проектирование сетевой инфраструктуры для малого бизнеса",theme:"dark",notes:`
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
      ${w.map((t,e)=>`
        <g class="cv-station" style="--i:${e}">
          <line x1="${t.x}" y1="852" x2="${t.x}" y2="884"/>
          <circle cx="${t.x}" cy="868" r="${e===w.length-1?7:4}" class="${e===w.length-1?"is-now":""}"/>
        </g>`).join("")}
      <circle class="cv-runner" r="5">
        <animateMotion dur="7s" repeatCount="indefinite" path="M112 868 H 1808" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.45 0 0.55 1"/>
      </circle>
    </svg>

    <div class="cv-stations">
      ${w.map((t,e)=>`
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
  `},m=(s,t,e=10)=>`
  <div class="turn">
    <span class="turn__a" data-r="left" style="--i:${e}">${s}</span>
    <span class="turn__line" aria-hidden="true">
      <svg viewBox="0 0 100 20" preserveAspectRatio="none"><path class="draw" pathLength="1" d="M0 10 H100" style="--draw-delay:1500ms;--draw-dur:900ms"/></svg>
      <i></i>
    </span>
    <span class="turn__b" data-r="right" style="--i:${e+5}">${t}</span>
  </div>`,S=(s,t=4,e=!1)=>`
  <ul class="plist${e?" plist--num":""}">
    ${s.map(([a,l],i)=>`
      <li data-r style="--i:${i+t}">
        ${e?`<em>${String(i+1).padStart(2,"0")}</em>`:"<i></i>"}
        <div><b>${a}</b>${l?`<span>${l}</span>`:""}</div>
      </li>`).join("")}
  </ul>`,v=(s,t,e=14,a=-2)=>`
  <div class="meme" style="${t};--i:${e}" data-r="scale"><span style="--tilt:${a}deg">${s}</span></div>`,U=[["Сеть «как получилось»","бытовой роутер и одна сеть на всех: бухгалтерия рядом со смартфонами гостей"],["После 2022 года","западные производители ушли; параллельный импорт — без гарантии и обновлений"],["Российские линейки выросли","«Элтекс», QTECH и SNR выпускают оборудование и для небольших офисов"]],K={id:"goal",chapter:"Актуальность и цель",title:"Актуальность и цель работы",theme:"light",notes:`
    Во многих небольших офисах сеть собрана из бытового роутера и одной общей сети. Пока всё работает,
    это никого не беспокоит, но любая поломка или заражение одного компьютера останавливает весь офис.

    После 2022 года западные производители свернули поставки и поддержку, а российские компании
    расширили свои линейки. Поэтому вопрос, можно ли собрать сеть малого офиса только на российском
    оборудовании и сколько это стоит, — практический.

    Цель работы — спроектировать такую сеть: построить топологию, подобрать модели и рассчитать бюджет.

    Шутка для разрядки: на фото — не наш офис, но духовно очень близко.
  `,html:({img:s})=>`
    ${v("«и так сойдёт» — старая сеть, 2019–2026","right:136px;top:150px",12,2)}
    <div class="gl-main">
      <p class="eyebrow" data-r style="--i:1"><b>Введение</b> почему это важно</p>
      <h2 class="h1" data-r style="--i:2">Актуальность и цель</h2>
      ${S(U,3)}
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

    ${m("Практический вопрос","Хватит ли российского оборудования и сколько это стоит")}
  `},g=(s,t)=>`<path class="draw tp-line" pathLength="1" d="${s}" style="--draw-delay:${700+t*90}ms;--draw-dur:700ms"/>`,k=(s,t,e)=>`<circle class="tp-node" cx="${s}" cy="${t}" r="9" style="--i:${e}"/>`,Y=[{key:"bus",name:"Шина",svg:()=>{const s=[70,150,230,310];return g("M24 100 H356",0)+s.map((t,e)=>g(`M${t} 100 V${e%2?150:50}`,e+1)).join("")+s.map((t,e)=>k(t,e%2?150:50,e)).join("")},plus:"Мало кабеля, простой монтаж",minus:"Обрыв кабеля останавливает всю сеть"},{key:"ring",name:"Кольцо",svg:()=>{const s=Array.from({length:6},(t,e)=>{const a=Math.PI*2*e/6-Math.PI/2;return[Math.round(190+130*Math.cos(a)),Math.round(100+72*Math.sin(a))]});return s.map((t,e)=>g(`M${t[0]} ${t[1]} L${s[(e+1)%6][0]} ${s[(e+1)%6][1]}`,e)).join("")+s.map((t,e)=>k(t[0],t[1],e)).join("")},plus:"Предсказуемая задержка передачи",minus:"Отказ одного узла нарушает работу кольца"},{key:"star",name:"Звезда",svg:()=>{const s=Array.from({length:7},(t,e)=>{const a=Math.PI*2*e/7-Math.PI/2;return[Math.round(190+140*Math.cos(a)),Math.round(100+78*Math.sin(a))]});return s.map((t,e)=>g(`M190 100 L${t[0]} ${t[1]}`,e)).join("")+s.map((t,e)=>k(t[0],t[1],e)).join("")+'<rect class="tp-hub" x="172" y="86" width="36" height="28"/>'},plus:"Обрыв линии отключает один узел, легко расширять",minus:"Зависимость от центрального устройства",pick:!0},{key:"mesh",name:"Ячеистая",svg:()=>{const s=Array.from({length:5},(a,l)=>{const i=Math.PI*2*l/5-Math.PI/2;return[Math.round(190+120*Math.cos(i)),Math.round(104+82*Math.sin(i))]});let t="",e=0;for(let a=0;a<5;a++)for(let l=a+1;l<5;l++)t+=g(`M${s[a][0]} ${s[a][1]} L${s[l][0]} ${s[l][1]}`,e++*.6);return t+s.map((a,l)=>k(a[0],a[1],l)).join("")},plus:"Высокая отказоустойчивость",minus:"Дорого и сложно: магистрали и ЦОД"}],X={id:"theory",chapter:"Топология",title:"Выбор топологии сети",theme:"dark",notes:`
    В теоретической части я сравнил основные топологии. В офисных сетях Ethernet фактически используется
    только «звезда»: обрыв линии отключает один узел, сеть легко расширять, неисправность легко найти.

    Трёхуровневая модель — доступ, распределение, ядро — для малого офиса избыточна. Уровни ядра и
    распределения сворачиваются в одно устройство — маршрутизатор, а уровень доступа — это один коммутатор.
    Сегментация делается с помощью VLAN, между сегментами стоит межсетевой экран.

    Про «+1000 к ауре» можно сказать вслух: обрыв одной линии не роняет весь офис — это и есть аура.
  `,html:()=>`
    ${v("«звезда»: +1000 к ауре админа","right:112px;top:196px",13,-2)}
    <div class="frame">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 1.1</b> четыре варианта</p>
      <h2 class="h1 th-h" data-r style="--i:2">Выбор топологии</h2>
      <p class="lead th-lead" data-r style="--i:3">В офисном Ethernet каждое устройство подключается отдельной линией к коммутатору — это «звезда».</p>
    </div>

    <div class="th-grid">
      ${Y.map((s,t)=>`
        <article class="th-cell${s.pick?" is-pick":""}" data-r style="--i:${t+4}">
          <svg viewBox="0 0 380 200" aria-hidden="true">${s.svg()}</svg>
          <h3 class="h3">${s.name}${s.pick?'<span class="th-tag">выбрана</span>':""}</h3>
          <p><span class="label">плюс</span>${s.plus}</p>
          <p><span class="label">минус</span>${s.minus}</p>
        </article>`).join("")}
    </div>

    ${m("Трёхуровневая модель малому офису не нужна","«Звезда» со свёрнутым ядром",9)}
  `},z=89087,J=[{city:"Новосибирск",name:"«Элтекс»",price:75e3,approx:!0,model:"Eltex MES2324 · уровень L3",rows:["ESR, MES, WEP: полная линейка и собственное производство","Цены у дилеров часто только «по запросу»"]},{city:"Москва",name:"QTECH",price:89087,model:"QSW-3750-28T-AC-R · уровень L2+",rows:["QSW, QSR, QWP: корпоративный уровень, статус ТОРП","Высокие цены для малого бизнеса"]},{city:"Екатеринбург",name:"SNR (ГК «НАГ»)",price:23838,pick:!0,model:"SNR-S2985G-24T-UPS · уровень L2",rows:["SNR-S, SNR-AP: низкая цена, есть на складе","Наличие в реестре нужно проверять отдельно"]}],Z={id:"market",chapter:"Рынок",title:"Три российских производителя",theme:"light",notes:`
    Для малого офиса наиболее интересны три производителя: «Элтекс», QTECH и SNR.
    У «Элтекс» полная линейка и своё производство, у QTECH корпоративный уровень, но высокие цены,
    у SNR низкая цена и наличие на складе.

    На слайде — цены их 24-портовых управляемых коммутаторов: от 24 до 89 тысяч рублей.
    Модели не одного класса: L3, L2+ и L2, уровень подписан под каждой ценой.

    Вывод: сеть небольшого офиса уже можно собрать полностью из отечественных компонентов,
    но выбирать нужно сравнением конкретных моделей, а не по бренду.

    На цене QTECH сделай паузу. Правильная реакция аудитории — «окак».
  `,html:()=>`
    ${v("89 087 ₽ за коммутатор — окак","right:112px;top:212px",13,2)}
    <div class="frame">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 1.3</b> коммутатор на 24 порта — три цены</p>
      <h2 class="h1 mk-h" data-r style="--i:2">Три российских производителя</h2>
    </div>

    <div class="mk-grid">
      ${J.map((s,t)=>`
        <article class="mk-col${s.pick?" is-pick":""}" data-r style="--i:${t*2+3}">
          <span class="label">${s.city}</span>
          <h3 class="h3">${s.name}</h3>
          <div class="num-l mk-price">${s.approx?"<small>≈</small>":""}<span data-count="${s.price}" data-duration="1500" data-delay="${500+t*200}">${s.price}</span><small>₽</small></div>
          <div class="mk-bar"><i style="--w:${(s.price/z*100).toFixed(1)}%;--bd:${900+t*200}ms"></i></div>
          <p class="mk-model">${s.model}</p>
          ${s.rows.map(e=>`<p class="mk-row">${e}</p>`).join("")}
        </article>`).join("")}
    </div>

    ${m("Устройства одного назначения, цены отличаются в разы","Выбор — по характеристикам и цене",9)}
  `},tt=[["Интернет, 1С и МФУ для всех","канал 100 Мбит/с, база и общие папки на сервере"],["Гостевой Wi-Fi отдельно от офисной сети","клиенты не видят сервер и бухгалтерию"],["VPN для директора","удалённое подключение к серверу"],["Тихое и управляемое оборудование","шкаф стоит в бывшей кладовой, администратор приходящий"]],st=Array.from({length:24},(s,t)=>`<i class="${t<12?"on":""}${t===11?" up":""}" style="--p:${t}"></i>`).join(""),et={id:"company",chapter:"Постановка задачи",title:"ООО «Новый адрес»: постановка задачи",theme:"dark",notes:`
    Практическая часть выполнена на примере условной компании — агентства недвижимости «Новый адрес»
    в Новокузнецке. В штате восемь человек, к сети подключаются десять оконечных устройств:
    восемь компьютеров, сервер и МФУ.

    В старом офисе сеть была собрана из бытового роутера и неуправляемого коммутатора, пароль от Wi-Fi знали клиенты.
    Требования к новой сети: интернет, работа с 1С, изолированная гостевая сеть, защита сервера, VPN для директора.

    Расчёт портов: 12 портов с запасом 30 % — это 16, ближайший типоразмер — 24 порта, половина остаётся свободной.
    Бюджет вместе с материалами и работами — не более 200 тысяч рублей.

    Мем про «не сам себя отключил» — отсылка к Эпштейну: неуправляемый коммутатор без журналов событий никогда не расскажет, что с ним случилось.
  `,html:({img:s})=>`
    ${v("старый коммутатор не сам себя отключил","left:1080px;top:826px",16,-2)}
    <div class="cp-photo photo photo--archive kb grain" data-r="fade" style="--i:0">
      ${s("oldnet")}
    </div>
    <div class="cp-shade"></div>
    <p class="cp-photo-caption caption" data-r="fade" style="--i:9"><b>Было</b> · неуправляемый коммутатор, одна сеть на всех</p>

    <div class="cp-main">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 2.1</b> агентство недвижимости · Новокузнецк</p>
      <h2 class="h1" data-r style="--i:2">ООО «Новый адрес»</h2>
      <p class="lead cp-lead" data-r style="--i:3">Компания переезжает в новый офис и строит сеть заново.</p>
      ${S(tt,4)}
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
      <div class="cp-portgrid" aria-hidden="true">${st}</div>
      <p>10 устройств, точка доступа и маршрутизатор. С запасом 30 % нужно 16 портов; у 24-портовой модели свободна половина.</p>
    </div>

    ${m("Было: бытовой роутер и одна сеть на всех","Бюджет — не более 200 000 ₽",10)}
  `},L=[["ПК-01","Директор","pc"],["ПК-02","Бухгалтер","pc"],["ПК-03","Ресепшн","pc"],["ПК-04","Менеджер","pc"],["ПК-05","Менеджер","pc"],["ПК-06","Менеджер","pc"],["ПК-07","Менеджер","pc"],["ПК-08","Юрист","pc"],["SRV-01","1С, файлы","srv"],["MFP-01","МФУ","mfp"],["AP-01","WEP-30L","ap"]],y=s=>56+s*104,E=s=>323+s*22,at=(s,t)=>s==="pc"?`<rect x="${t-22}" y="500" width="44" height="30"/><path d="M${t} 530 v9 M${t-12} 539 h24"/>`:s==="srv"?`<rect x="${t-16}" y="496" width="32" height="44"/><path d="M${t-9} 508 h18 M${t-9} 518 h18 M${t-9} 528 h18"/>`:s==="mfp"?`<rect x="${t-22}" y="510" width="44" height="24"/><path d="M${t-13} 510 v-12 h26 v12 M${t-13} 534 v8 h26 v-8"/>`:`<circle cx="${t}" cy="524" r="5" class="tg-fill"/><path d="M${t-12} 512 a17 17 0 0 1 24 0 M${t-20} 504 a28 28 0 0 1 40 0"/><path d="M${t-20} 536 h40"/>`,it=[["VLAN 10","STAFF","192.168.10.0/24 · 8 ПК сотрудников"],["VLAN 20","SERVERS","192.168.20.0/24 · сервер и МФУ"],["VLAN 30","GUEST","192.168.30.0/24 · гостевой Wi-Fi"],["VLAN 99","MGMT","192.168.99.0/24 · управление"]],lt={id:"topology",chapter:"Топология сети",title:"Топология и логическая структура сети",theme:"light",notes:`
    Физическая топология — «звезда». В центре коммутатор SW1, к нему отдельными линиями подключены
    все рабочие места, сервер, МФУ и точка доступа.

    Маршрутизатор R1 соединён с коммутатором одним транком, маршрутизация между VLAN выполняется
    на нём через подынтерфейсы — схема «router on a stick».

    Сеть разделена на четыре VLAN: сотрудники, серверы, гости и управление. Гостевая сеть изолирована
    межсетевым экраном: клиенты получают только интернет.

    Про файлы Эпштейна: гости получают только интернет, во внутреннюю сеть им хода нет — вообще никак.
  `,html:()=>`
    ${v("VLAN 30 изолирован надёжнее, чем файлы Эпштейна","left:112px;top:800px",14,-2)}
    <div class="tg-main">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 2.2</b> «звезда»</p>
      <h2 class="h1" data-r style="--i:2">Топология сети</h2>
      <ul class="tg-vlans">
        ${it.map(([s,t,e],a)=>`
          <li data-r style="--i:${a+3}"><b><em>${s}</em>${t}</b><span>${e}</span></li>`).join("")}
      </ul>
      <p class="tg-note" data-r style="--i:8">Маршрутизация между VLAN — на R1, по одному транку 802.1Q.</p>
    </div>

    <svg class="tg-svg" viewBox="0 0 1160 800" role="img" aria-label="Схема сети: интернет, маршрутизатор R1, коммутатор SW1, восемь компьютеров, сервер, МФУ и точка доступа">
      <!-- lines -->
      <path class="draw tg-line" pathLength="1" d="M580 92 V150" style="--draw-delay:500ms;--draw-dur:500ms"/>
      <path class="draw tg-trunk" pathLength="1" d="M580 214 V300" style="--draw-delay:900ms;--draw-dur:600ms"/>
      ${L.map((s,t)=>`<path class="draw ${s[2]==="ap"?"tg-trunk tg-trunk--thin":"tg-line"}" pathLength="1" d="M${E(t)} 364 C ${E(t)} 440, ${y(t)} 420, ${y(t)} 492" style="--draw-delay:${1400+t*70}ms;--draw-dur:800ms"/>`).join("")}

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
        ${Array.from({length:24},(s,t)=>`<rect x="${E(t)-7}" y="340" width="14" height="14" class="tg-port${t<11?" on":""}${t===23?" up":""}"/>`).join("")}
        <text x="306" y="326" class="tg-name">SW1 · SNR-S2985G-24T-UPS</text>
        <text x="890" y="326" class="tg-cap">коммутатор L2 · 24 × 1G</text>
        <text x="890" y="346" class="tg-cap">порты 12–23 — резерв</text>
      </g>

      <!-- devices -->
      ${L.map((s,t)=>`
        <g class="tg-in tg-dev${s[2]==="ap"?" tg-dev--ap":""}" style="--t:${1900+t*70}ms">
          ${at(s[2],y(t))}
          <text x="${y(t)}" y="572" text-anchor="middle" class="tg-name tg-name--s">${s[0]}</text>
          <text x="${y(t)}" y="592" text-anchor="middle" class="tg-cap">${s[1]}</text>
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
  `},c=s=>20+s*80,o=s=>20+s*80,h=(s,t,e,a)=>`<path class="cb-wall" d="M${c(s)} ${o(t)} L${c(e)} ${o(a)}"/>`,rt=[["Р1 · ПК-01",12.3,2.4,"l"],["Р2 · ПК-02",8.6,.3,"b"],["Р3 · ПК-03",12.3,5.7,"l"],["Р4 · ПК-04",.2,1.6,"r"],["Р5 · ПК-05",.2,3.1,"r"],["Р6 · ПК-06",.2,4.6,"r"],["Р7 · ПК-07",.2,6.1,"r"],["Р8 · ПК-08",3.2,.3,"b"],["Р9 · МФУ",8,4.7,"b"],["Р10",7.3,3.6,"t"],["Р11 · резерв",2.6,7.8,"t"],["Р12 · резерв",12.3,7.2,"l"]],nt=([s,t,e,a],l)=>{const i=c(t),r=o(e),n=a==="l"?`x="${i-16}" y="${r+4}" text-anchor="end"`:a==="r"?`x="${i+16}" y="${r+4}"`:a==="b"?`x="${i}" y="${r+28}" text-anchor="middle"`:`x="${i}" y="${r-16}" text-anchor="middle"`;return`<g class="cb-sock" style="--t:${2200+l*90}ms"><rect x="${i-7}" y="${r-7}" width="14" height="14"/><text ${n}>${s}</text></g>`},u=(s,t,e,a)=>`<text class="cb-room" x="${c(e)}" y="${o(a)}" text-anchor="middle">${s}</text><text class="cb-area" x="${c(e)}" y="${o(a)+22}" text-anchor="middle">${t}</text>`,ct={id:"cabling",chapter:"Кабельная система",title:"План офиса и кабельная система",theme:"dark",notes:`
    На плане показано размещение шкафа, розеток и трасс кабеля. Телекоммуникационный шкаф стоит
    в серверной — бывшей кладовой. От него расходятся три трассы в кабель-канале.

    Средняя длина линии рассчитана по формуле с коэффициентом запаса 1,1 и запасом на разделку 3 метра —
    получилось 14,2 метра. На 12 линий нужно около 170 метров кабеля, достаточно одной бухты 305 метров.
    Кабель-канала — 48 метров.

    Все линии значительно короче 90 метров, то есть требование стандарта выполняется с запасом.
    Оборудование в шкафу подключено к ИБП 1000 ВА.
  `,html:()=>`
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
        <path class="cb-outer" d="M20 20 H1020 V660 H${c(11.8)} M${c(10.6)} 660 H20 V20"/>
        ${h(5.5,0,5.5,2.6)}${h(5.5,3.5,5.5,8)}
        ${h(5.5,2,5.8,2)}${h(6.6,2,7.5,2)}
        ${h(7.5,0,7.5,4.5)}${h(10,0,10,4.5)}
        ${h(5.5,4.5,5.6,4.5)}${h(7.4,4.5,8.9,4.5)}${h(9.7,4.5,10.9,4.5)}${h(11.7,4.5,12.5,4.5)}
        ${u("Общий зал","≈ 44 м²",2.9,3.9)}
        ${u("Серверная","",6.4,1.78)}
        ${u("Коридор","≈ 5 м²",6.4,2.85)}
        ${u("Бухгалтерия","≈ 11 м²",8.75,2.3)}
        ${u("Кабинет","директора · ≈ 11 м²",11.1,3.4)}
        ${u("Приёмная","≈ 25 м²",9.6,6.3)}
        <text class="cb-area" x="${c(11.2)}" y="690" text-anchor="middle">вход</text>
        <text class="cb-area" x="20" y="716">12,5 × 8 м · ≈ 100 м²</text>
      </g>

      <!-- cable routes -->
      <path class="draw cb-route" pathLength="1" style="--draw-delay:1100ms;--draw-dur:2200ms" d="M${c(5.94)} ${o(.3)} H${c(.2)} V${o(7.8)} H${c(2.6)}"/>
      <path class="draw cb-route" pathLength="1" style="--draw-delay:1300ms;--draw-dur:1500ms" d="M${c(7.25)} ${o(.3)} H${c(12.3)} V${o(2.4)}"/>
      <path class="draw cb-route" pathLength="1" style="--draw-delay:1500ms;--draw-dur:2200ms" d="M${c(7.3)} ${o(.67)} V${o(4.7)} H${c(12.3)} V${o(7.2)}"/>
      <path class="draw cb-route" pathLength="1" style="--draw-delay:2400ms;--draw-dur:500ms" d="M${c(7.3)} ${o(3.6)} H${c(6.7)}"/>

      <!-- cabinet, server, access point -->
      <g class="cb-in" style="--t:800ms">
        <rect class="cb-cab" x="${c(5.94)}" y="${o(.13)}" width="${1.31*80}" height="${.54*80}"/>
        <text class="cb-cab-t" x="${c(6.6)}" y="${o(.47)}" text-anchor="middle">ТШ 9U</text>
        <rect class="cb-srv" x="${c(5.72)}" y="${o(.9)}" width="40" height="40"/>
        <text class="cb-area" x="${c(5.72)+20}" y="${o(.9)+25}" text-anchor="middle">SRV</text>
      </g>
      <g class="cb-sock cb-ap" style="--t:2900ms">
        <circle cx="${c(6.5)}" cy="${o(3.6)}" r="15"/>
        <text x="${c(6.5)}" y="${o(3.6)+36}" text-anchor="middle">AP-01</text>
      </g>
      ${rt.map(nt).join("")}

      <g class="cb-in" style="--t:3300ms">
        <path class="cb-route cb-route--legend" d="M330 711 h44"/>
        <text class="cb-area" x="386" y="716">трасса в кабель-канале 25×16 мм</text>
        <rect class="cb-legend-sock" x="700" y="704" width="14" height="14"/>
        <text class="cb-area" x="726" y="716">розетка RJ-45 · номер = порт панели</text>
      </g>
    </svg>
  `},ot=[{role:"Маршрутизатор",model:"Eltex ESR-15",price:45e3,approx:!0,why:"VLAN, NAT, межсетевой экран, DHCP и VPN. Экран пропускает 1,51 Гбит/с при канале 100 Мбит/с.",alts:[["Eltex ESR-20","≈ 95 000 ₽"],["QTECH QSR-1920","≈ 60 000 ₽"]]},{role:"Коммутатор",model:"SNR-S2985G-24T-UPS",price:23838,pick:!0,why:"24 порта 1G, VLAN и транки 802.1Q. Без вентилятора: в кладовой работает бесшумно.",alts:[["Eltex MES2324","≈ 75 000 ₽"],["QTECH QSW-3750","89 087 ₽"]]},{role:"Точка доступа",model:"Eltex WEP-30L",price:22e3,approx:!0,why:"Wi-Fi 6, порт 2,5G, питание PoE, до 14 SSID. Внесена в реестр по ПП № 719.",alts:[["SNR-AP622-I","≈ 20 000 ₽"],["QTECH QWP-82E","47 579 ₽"]]}],dt={id:"equipment",chapter:"Выбор моделей",title:"Выбранное оборудование",theme:"light",notes:`
    Для каждого типа оборудования сравнивались три модели; под выбранной моделью — две не выбранные с ценами.

    Маршрутизатор — Eltex ESR-15: закрывает все задачи, а более мощный ESR-20 стоит вдвое дороже.
    Коммутатор — SNR: маршрутизация выполняется на ESR-15, порты 10G не нужны, он в три-четыре раза
    дешевле аналогов и работает бесшумно.
    Точка доступа — Eltex WEP-30L: Wi-Fi 6, есть в реестре, тот же производитель, что и у маршрутизатора.

    Знак «≈» — ориентировочная цена: дилеры называют её только по запросу.

    ESR-20 мощнее, но для восьми человек это оверкилл — «нас и тут неплохо кормят».
  `,html:()=>`
    ${v("ESR-20 за 95 000 ₽? нас и тут неплохо кормят","right:112px;top:212px",13,2)}
    <div class="frame">
      <p class="eyebrow" data-r style="--i:1"><b>Раздел 2.3</b> по три модели на каждую позицию</p>
      <h2 class="h1 mk-h" data-r style="--i:2">Выбранное оборудование</h2>
    </div>

    <div class="mk-grid eq-grid">
      ${ot.map((s,t)=>`
        <article class="mk-col${s.pick?" is-pick":""}" data-r style="--i:${t*2+3}">
          <span class="label">${s.role}</span>
          <h3 class="h3">${s.model}</h3>
          <div class="num-l mk-price">${s.approx?"<small>≈</small>":""}<span data-count="${s.price}" data-duration="1500" data-delay="${500+t*200}">${s.price}</span><small>₽</small></div>
          <p class="eq-why">${s.why}</p>
          <span class="label eq-alt-h">Не выбраны</span>
          ${s.alts.map(([e,a])=>`<p class="eq-alt"><span>${e}</span><span>${a}</span></p>`).join("")}
        </article>`).join("")}
    </div>

    ${m("Маршрутизация — на ESR-15, порты 10G не нужны","Коммутатору достаточно уровня L2",9)}
  `},A=s=>(s/2e5*80).toFixed(2),N=[["Активное оборудование",111338,"62 %","a"],["СКС и материалы",37440,"21 %","b"],["Работы",31600,"17 %","c"]],ht={id:"budget",chapter:"Бюджет",title:"Бюджет проекта",theme:"dark",notes:`
    Общая стоимость проекта — 180 378 рублей. Активное оборудование — около 62 %, пассивное оборудование
    и материалы — 21 %, работы — 17 %. Сумма укладывается в бюджет 200 тысяч, почти 20 тысяч остаётся
    на непредвиденные расходы.

    Если взять коммутатор того же производителя, что и маршрутизатор — Eltex MES2324, — проект подорожает
    на 51 тысячу, до 231 540 рублей, и выйдет за бюджет. Поэтому в сети сочетается оборудование двух производителей.
    Совместной работе это не мешает: VLAN и транки 802.1Q — открытые стандарты.

    Цены ориентировочные, на ноябрь 2026 года; компьютеры, сервер и МФУ в смету не входят.

    Уложиться в бюджет — rare W. А вариант с MES2324 — это L на 31 540 рублей.
  `,html:()=>`
    ${v("уложились в бюджет — rare W","right:112px;top:212px",13,-2)}
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
          ${N.map(([,s,,t],e)=>`<i class="bd-seg bd-seg--${t}" style="width:${A(s)}%;--bd:${900+e*350}ms"></i>`).join("")}
        </div>
        <div class="bd-legend">
          ${N.map(([s,t,e],a)=>`<div style="width:${A(t)}%"><span class="label">${s}</span><b>${t.toLocaleString("ru-RU").replace(/ /g," ")} ₽ · ${e}</b></div>`).join("")}
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

    ${m("С Eltex MES2324 бюджет превышен на 31 540 ₽","Поэтому в сети два производителя",12)}
  `},pt=[["«Звезда» со свёрнутым ядром","один маршрутизатор и один управляемый коммутатор"],["Четыре VLAN","гостевой Wi-Fi изолирован межсетевым экраном"],["Кабельная система из 12 линий","половина портов коммутатора свободна"],["180 378 ₽","в пределах бюджета 200 000 ₽"]],vt=[B,K,X,Z,et,lt,ct,dt,ht,{id:"conclusion",chapter:"Заключение",title:"Заключение",theme:"dark",notes:`
    Цель работы достигнута, все задачи решены. Спроектирована сеть с топологией «звезда», четырьмя VLAN
    и изолированной гостевой сетью, рассчитана кабельная система из 12 линий, подобраны модели оборудования,
    стоимость проекта укладывается в бюджет.

    Сеть можно развивать без замены основного оборудования: на коммутаторе остаётся 12 свободных портов,
    к маршрутизатору можно подключить резервный интернет-канал, добавить IP-камеры или вторую точку доступа.

    Проект можно использовать как типовое решение для офиса на 5–15 рабочих мест.
    Спасибо за внимание, готов ответить на вопросы.

    Закончи спокойно, как сигма: цель достигнута, бюджет цел, аура нафармлена.
  `,html:({img:s})=>`
    ${v("ауры нафармлено: 180 378","right:112px;top:150px",15,2)}
    <figure class="fn-photo photo photo--archive kb grain" data-r="mask" style="--i:0">
      ${s("patch")}
      <figcaption class="caption"><b>Патч-панель</b><br>каждая линия приходит на свой порт</figcaption>
    </figure>

    <div class="fn-main">
      <p class="eyebrow" data-r style="--i:1"><b>Итоги</b> цель достигнута</p>
      <h2 class="h1" data-r style="--i:2">Заключение</h2>
      ${S(pt,3,!0)}
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
  `}],_={cover:{file:"images/rack-rear.jpg",alt:"Задняя сторона серверной стойки с кабелями",title:"Задняя сторона стойки в дата-центре NERSC",author:"Derrick Coetzee",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Rear_of_rack_at_NERSC_data_center_-_closeup.jpg",position:"50% 50%"},mess:{file:"images/cable-spaghetti.jpg",alt:"Серверная стойка с перепутанными сетевыми кабелями",title:"Стойка с «лапшой» из сетевых кабелей",author:"Kim Scarborough",license:"CC BY-SA 2.0",source:"https://commons.wikimedia.org/wiki/File:Server_Rack_with_Spaghetti-Like_Mass_of_Network_Cables.jpg",position:"50% 45%"},oldnet:{file:"images/unmanaged-switch.jpg",alt:"Небольшой неуправляемый коммутатор на пять портов с подключёнными кабелями",title:"Неуправляемый гигабитный коммутатор на 5 портов",author:"Simon A. Eugster",license:"CC BY-SA 3.0",source:"https://commons.wikimedia.org/wiki/File:Netgear_Gigabit_Switch_5-port.jpg",position:"50% 50%"},patch:{file:"images/patch-panel.jpg",alt:"Патч-панель Ethernet с подключёнными патч-кордами",title:"Патч-панель Ethernet",author:"Kbh3rd",license:"CC BY 4.0",source:"https://commons.wikimedia.org/wiki/File:Ethernet_Patch_Panel_20171121_130458.jpg",position:"50% 50%"}},mt=document.getElementById("app");function ut(){const s="./",t=Object.values(_).map(l=>new Promise(i=>{const r=new Image;r.onload=r.onerror=i,r.src=`${s}${l.file}`})),e=document.fonts?document.fonts.ready:Promise.resolve(),a=new Promise(l=>setTimeout(l,2500));return Promise.race([Promise.all([...t,e]),a])}ut().then(()=>{const s=new G(mt,vt,{images:_,base:"./"}).mount();window.__deck=s})})();
