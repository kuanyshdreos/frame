const I18N={en:{"intro.brand":"FRAME · STUDIO","intro.q":"Choose your language","nav.stories":"Stories","nav.commercials":"Commercials","nav.personal":"Personal","nav.work":"Work","nav.about":"About","nav.pricing":"Pricing","hero.featured":"★ Featured","hero.no":"No.","hero.year":"Year","hero.client":"Client","grid.h1":"Selected","grid.h2":"work","filter.all":"All","filter.stories":"Stories","filter.commercials":"Commercials","filter.personal":"Personal","price.book":"Book this →","foot.studio":"Studio","foot.about":"About","foot.pricing":"Pricing","foot.work":"Work","foot.contact":"Contact","foot.social":"Social","admin.login":"Admin access","admin.loginSub":"Enter password.","admin.password":"Password","admin.enter":"Enter","admin.cancel":"Cancel","modal.openSource":"Open in source","about.noMedia":"No media set","contact.tag":"Contact","contact.h":"Let's talk","contact.sub":"Reach out — Telegram is fastest. We respond within 24 hours.","contact.telegram":"Telegram","contact.whatsapp":"WhatsApp","contact.email":"Email","contact.notconfig":"No contacts configured yet."},ru:{"intro.brand":"FRAME · СТУДИЯ","intro.q":"Выберите язык","nav.stories":"Истории","nav.commercials":"Реклама","nav.personal":"Личное","nav.work":"Работы","nav.about":"О нас","nav.pricing":"Цены","hero.featured":"★ Избранное","hero.no":"№","hero.year":"Год","hero.client":"Клиент","grid.h1":"Избранные","grid.h2":"работы","filter.all":"Все","filter.stories":"Истории","filter.commercials":"Реклама","filter.personal":"Личное","price.book":"Забронировать →","foot.studio":"Студия","foot.about":"О нас","foot.pricing":"Цены","foot.work":"Работы","foot.contact":"Контакты","foot.social":"Соцсети","admin.login":"Вход в админку","admin.loginSub":"Введите пароль.","admin.password":"Пароль","admin.enter":"Войти","admin.cancel":"Отмена","modal.openSource":"Открыть оригинал","about.noMedia":"Медиа не задано","contact.tag":"Контакты","contact.h":"Давайте обсудим","contact.sub":"Пишите — в Telegram быстрее всего. Отвечаем в течение 24 часов.","contact.telegram":"Telegram","contact.whatsapp":"WhatsApp","contact.email":"Email","contact.notconfig":"Контакты ещё не добавлены."},kk:{"intro.brand":"FRAME · СТУДИЯ","intro.q":"Тілді таңдаңыз","nav.stories":"Оқиғалар","nav.commercials":"Жарнама","nav.personal":"Жеке","nav.work":"Жұмыстар","nav.about":"Біз туралы","nav.pricing":"Бағалар","hero.featured":"★ Таңдаулы","hero.no":"№","hero.year":"Жыл","hero.client":"Тапсырыс","grid.h1":"Таңдаулы","grid.h2":"жұмыстар","filter.all":"Барлығы","filter.stories":"Оқиғалар","filter.commercials":"Жарнама","filter.personal":"Жеке","price.book":"Брондау →","foot.studio":"Студия","foot.about":"Біз туралы","foot.pricing":"Бағалар","foot.work":"Жұмыстар","foot.contact":"Байланыс","foot.social":"Желілер","admin.login":"Кіру","admin.loginSub":"Құпия сөз.","admin.password":"Құпия сөз","admin.enter":"Кіру","admin.cancel":"Болдырмау","modal.openSource":"Түпнұсқаны ашу","about.noMedia":"Медиа қойылмаған","contact.tag":"Байланыс","contact.h":"Хабарласайық","contact.sub":"Telegram арқылы тезірек жауап береміз. 24 сағат ішінде хабарласамыз.","contact.telegram":"Telegram","contact.whatsapp":"WhatsApp","contact.email":"Email","contact.notconfig":"Байланыстар әлі қосылмаған."}};

let DATA={},currentLang=localStorage.getItem("frame_lang")||"en",isAdmin=false,editingProjectId=null,currentCategory="all",adminTab="projects";

// ───── Supabase backend ─────
const Backend={
  client:null,user:null,enabled:false,_sdkLoading:null,
  _loadSDK(){
    if(window.supabase)return Promise.resolve();
    if(this._sdkLoading)return this._sdkLoading;
    this._sdkLoading=new Promise((res,rej)=>{
      const s=document.createElement("script");
      s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
      s.onload=()=>res();s.onerror=rej;
      document.head.appendChild(s);
    });
    return this._sdkLoading;
  },
  getConfig(){
    try{return JSON.parse(localStorage.getItem("frame_backend")||"null");}catch(e){return null;}
  },
  setConfig(url,key){localStorage.setItem("frame_backend",JSON.stringify({url,key}));},
  clearConfig(){localStorage.removeItem("frame_backend");this.client=null;this.user=null;this.enabled=false;},
  async init(){
    const cfg=this.getConfig();if(!cfg||!cfg.url||!cfg.key)return false;
    try{
      await this._loadSDK();
      this.client=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true}});
      const {data}=await this.client.auth.getSession();
      if(data&&data.session){this.user=data.session.user;this.enabled=true;}
      return true;
    }catch(e){console.warn("Backend init failed:",e);return false;}
  },
  async signIn(email,password){
    if(!this.client){await this.init();}
    if(!this.client)return{error:{message:"Не настроено"}};
    const {data,error}=await this.client.auth.signInWithPassword({email,password});
    if(data&&data.user){this.user=data.user;this.enabled=true;}
    return{data,error};
  },
  async signOut(){
    if(!this.client)return;
    await this.client.auth.signOut();
    this.user=null;this.enabled=false;
  },
  async load(){
    if(!this.client)return null;
    try{
      const {data,error}=await this.client.from("site_data").select("data").eq("id",1).maybeSingle();
      if(error){console.warn("Backend load error:",error);return null;}
      return data?data.data:null;
    }catch(e){console.warn(e);return null;}
  },
  async save(d){
    if(!this.enabled||!this.client)return{ok:false,error:"Не авторизован"};
    try{
      const {error}=await this.client.from("site_data").upsert({id:1,data:d,updated_at:new Date().toISOString()},{onConflict:"id"});
      if(error)return{ok:false,error:error.message};
      return{ok:true};
    }catch(e){return{ok:false,error:e.message};}
  }
};
window.Backend=Backend;

function esc(s){return s?String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}
function gl(o){if(!o)return "";if(typeof o==="string")return o;return o[currentLang]||o.en||o.ru||o.kk||""}
function uid(){return Math.random().toString(36).substr(2,9)}
function toEmbed(url){
  if(!url)return null;
  if(url.includes("vimeo.com")){const id=url.split("/").pop().split("?")[0];return "https://player.vimeo.com/video/"+id;}
  if(url.includes("youtube.com")||url.includes("youtu.be")){let id="";if(url.includes("v="))id=url.split("v=")[1].split("&")[0];else id=url.split("/").pop();return "https://www.youtube.com/embed/"+id;}
  return url;
}
async function loadData(){
  // Try backend first
  try{
    const ok=await Backend.init();
    if(ok){
      const remote=await Backend.load();
      if(remote&&typeof remote==="object"&&Object.keys(remote).length){
        localStorage.setItem("frame_data",JSON.stringify(remote));
        return remote;
      }
    }
  }catch(e){console.warn("Backend load skipped:",e);}
  try{const l=localStorage.getItem("frame_data");if(l)return JSON.parse(l);const r=await fetch("data.json");if(r.ok)return await r.json();}catch(e){}
  return {site:{name:"FRAME",email:"hello@frame.studio",phone:"+7 777 000 00 00",introWords:["Cinematic","Stories","Frame"],socials:[]},hero:{featuredId:""},projects:[],pricing:{headline:{en:"Pricing",ru:"Цены",kk:"Бағалар"},sub:{en:"Bespoke solutions",ru:"Индивидуальный подход",kk:"Жеке тәсіл"},currency:{en:"$"},packages:[]}};
}
let _saveTimer=null,_syncTimer=null;
function saveData(){
  localStorage.setItem("frame_data",JSON.stringify(DATA));
  const st=document.getElementById("ap-status");
  if(st){st.textContent="● Локально…";st.className="ap-status dirty";}
  clearTimeout(_saveTimer);
  _saveTimer=setTimeout(()=>{
    if(st){st.textContent=Backend.enabled?"✓ Синхронизация…":"✓ Сохранено локально";st.className="ap-status saved";}
    const ls=document.getElementById("last-save");
    if(ls){const d=new Date();ls.textContent=String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")+":"+String(d.getSeconds()).padStart(2,"0");}
    const sz=document.getElementById("storage-size");
    if(sz){const kb=Math.round(JSON.stringify(DATA).length/1024);sz.textContent=kb+" KB";}
  },350);
  // debounced sync to backend
  if(Backend.enabled){
    clearTimeout(_syncTimer);
    _syncTimer=setTimeout(async()=>{
      const res=await Backend.save(DATA);
      if(st){
        if(res.ok){st.textContent="☁ Синхронизировано";st.className="ap-status saved";}
        else{st.textContent="⚠ Ошибка sync: "+(res.error||"unknown");st.className="ap-status dirty";}
      }
    },1200);
  }
}

async function translateText(text,from,to){
  if(!text||!text.trim())return "";
  try{
    // de= параметр повышает квоту MyMemory с 10k до 50k слов/день + чуть лучше качество
    const email=(DATA.site&&DATA.site.email)||"hello@frame.studio";
    const url=`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}&de=${encodeURIComponent(email)}`;
    const r=await fetch(url);
    const d=await r.json();
    if(d.responseStatus===200){
      let out=d.responseData.translatedText||"";
      // MyMemory иногда возвращает "MYMEMORY WARNING: ..."
      if(/^MYMEMORY WARNING/i.test(out))return "";
      // Сохраняем регистр исходника (UPPERCASE → UPPERCASE)
      if(text===text.toUpperCase()&&text.length>1)out=out.toUpperCase();
      return out;
    }
  }catch(e){console.warn("Translation error:",e);}
  return "";
}

async function translateAllOnTab(){
  // ловим И обычные поля И списки (.ru на конце)
  const scalars=[...document.querySelectorAll('#ap-content [data-bind$=".ru"]')];
  const lists=[...document.querySelectorAll('#ap-content [data-bind-list$=".ru"]')];
  const total=scalars.length+lists.length;
  if(!total){showToast("Нет RU полей на вкладке");return;}
  if(!confirm(`Перевести ${total} RU полей на EN и KK?\n(скаляров: ${scalars.length}, списков: ${lists.length})`))return;
  const btn=document.getElementById("btn-translate-all");
  if(btn)btn.disabled=true;
  showToast("🌐 Перевожу…");
  let ok=0,skip=0,fail=0;
  function setVal(path,val){
    const parts=path.split(".");let t=DATA;
    for(let i=0;i<parts.length-1;i++){if(t[parts[i]]===undefined)t[parts[i]]={};t=t[parts[i]];}
    t[parts[parts.length-1]]=val;
  }
  // ── скалярные поля ──
  for(const inp of scalars){
    const ru=(inp.value||"").trim();
    if(!ru){skip++;continue;}
    const base=inp.dataset.bind.replace(/\.ru$/,"");
    try{
      const [en,kk]=await Promise.all([translateText(ru,"ru","en"),translateText(ru,"ru","kk")]);
      if(en){setVal(base+".en",en);ok++;}else{fail++;}
      if(kk)setVal(base+".kk",kk);
    }catch(e){console.warn(e);fail++;}
  }
  // ── списки (textarea с массивами) ──
  for(const inp of lists){
    const raw=(inp.value||"").split("\n").map(s=>s.trim()).filter(Boolean);
    if(!raw.length){skip++;continue;}
    const base=inp.dataset.bindList.replace(/\.ru$/,"");
    try{
      const enArr=[],kkArr=[];
      for(const line of raw){
        const [en,kk]=await Promise.all([translateText(line,"ru","en"),translateText(line,"ru","kk")]);
        enArr.push(en||line);
        kkArr.push(kk||line);
      }
      setVal(base+".en",enArr);
      setVal(base+".kk",kkArr);
      ok++;
    }catch(e){console.warn(e);fail++;}
  }
  saveData();renderAdmin();render();
  if(btn)btn.disabled=false;
  showToast(`✅ Готово: ${ok}, пропущено: ${skip}${fail?`, ошибок: ${fail}`:""}`);
}

async function autoTranslate(basePath,ruText){
  if(!ruText||!ruText.trim()){showToast("Сначала введите текст на русском");return;}
  showToast("🔄 Перевод...");
  const [en,kk]=await Promise.all([translateText(ruText,"ru","en"),translateText(ruText,"ru","kk")]);
  const path=basePath.split(".");
  let t=DATA;for(let i=0;i<path.length-1;i++){if(!t[path[i]])t[path[i]]={};t=t[path[i]];}
  if(en)t[path[path.length-1]]=Object.assign(t[path[path.length-1]]||{},{en:en,kk:kk||ruText});
  saveData();render();renderAdmin();render();
  showToast("✅ Переведено!");
}

function getEnabledLangs(){
  const all=["en","ru","kk"];
  const list=DATA.site&&Array.isArray(DATA.site.enabledLangs)?DATA.site.enabledLangs.filter(l=>all.includes(l)):all;
  return list.length?list:all;
}
function applyEnabledLangs(){
  const enabled=getEnabledLangs();
  document.querySelectorAll(".lang-pill button,.lang-row button,.lang-btn").forEach(b=>{
    if(!b.dataset.lang)return;
    b.style.display=enabled.includes(b.dataset.lang)?"":"none";
  });
  document.querySelectorAll(".lang-pill").forEach(p=>{p.style.display=enabled.length<=1?"none":"";});
  // intro: скрываем целиком если один язык
  const introQ=document.querySelector(".intro-question");
  const langRow=document.querySelector(".intro #intro .lang-row")||document.querySelector("#intro .lang-row");
  if(enabled.length<=1){
    if(introQ)introQ.style.display="none";
    if(langRow)langRow.style.display="none";
  } else {
    if(introQ)introQ.style.display="";
    if(langRow)langRow.style.display="";
  }
  // если текущий язык отключён — переключаемся на первый разрешённый
  if(!enabled.includes(currentLang)&&enabled.length){
    applyLang(enabled[0]);
  }
}
window.toggleLang=function(code,on,el){
  if(!DATA.site)DATA.site={};
  let arr=Array.isArray(DATA.site.enabledLangs)?DATA.site.enabledLangs.slice():["en","ru","kk"];
  if(on){if(!arr.includes(code))arr.push(code);}
  else{
    arr=arr.filter(x=>x!==code);
    if(!arr.length){
      showToast("⚠ Минимум 1 язык");
      if(el){el.checked=true;const pill=el.closest(".toggle-pill");if(pill)pill.classList.add("on");}
      return;
    }
  }
  DATA.site.enabledLangs=arr;
  // обновляем только конкретную пилюлю — без re-render всей админки, чтобы анимация не срабатывала на других
  if(el){const pill=el.closest(".toggle-pill");if(pill)pill.classList.toggle("on",on);}
  saveData();applyEnabledLangs();render();
};

function applyLang(lang){
  currentLang=lang;localStorage.setItem("frame_lang",lang);
  const d=I18N[lang]||I18N.en;
  document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=d[el.dataset.i18n]||el.dataset.i18n);
  // Override intro labels from DATA.site.intro если задано
  if(DATA.site&&DATA.site.intro){
    const it=DATA.site.intro;
    const brandEl=document.querySelector('[data-i18n="intro.brand"]');
    const brand=gl(it.brand);
    if(brandEl&&brand)brandEl.textContent=brand;
    const qEl=document.querySelector('[data-i18n="intro.q"]');
    const q=gl(it.question);
    if(qEl&&q)qEl.textContent=q;
  }
  document.querySelectorAll("[data-site-name]").forEach(el=>el.textContent=DATA.site&&DATA.site.name||"FRAME");
  if(DATA.site&&DATA.site.introWords){const spans=document.querySelectorAll(".intro-words .iw");DATA.site.introWords.forEach((w,i)=>{if(spans[i])spans[i].textContent=w;});}
  document.querySelectorAll(".lang-pill button,.lang-row button,.lang-btn").forEach(b=>b.classList.toggle("on",b.dataset.lang===lang));
  render();
}

function render(){
  try{renderNav();renderDpHero();renderMarquee();renderStudioStrip();renderPricing();renderFooter();renderClients();renderAbout();renderContactCTAs();renderStructuredData();}catch(e){console.error(e);}
}

function renderAwards(){
  const el=document.getElementById("awards");if(!el)return;
  const a=DATA.awards;
  if(!a||!Array.isArray(a.items)||!a.items.length){el.innerHTML="";el.style.display="none";return;}
  el.style.display="";
  const tag=gl(a.tag)||"Awards & Press";
  el.innerHTML=`<div class="aw-inner">
    <div class="aw-label">${esc(tag)}</div>
    <div class="aw-list">
      ${a.items.map(it=>`<div class="aw-item">
        ${it.year?`<span class="aw-year">${esc(it.year)}</span>`:""}
        <span class="aw-name">${esc(gl(it.name)||it.name||"")}</span>
        ${gl(it.note)||it.note?`<span class="aw-note">${esc(gl(it.note)||it.note)}</span>`:""}
      </div>`).join("")}
    </div>
  </div>`;
}

function renderTestimonials(){
  const el=document.getElementById("testimonials");if(!el)return;
  const t=DATA.testimonials;
  if(!t||!Array.isArray(t.items)||!t.items.length){el.innerHTML="";el.style.display="none";return;}
  el.style.display="";
  const tag=gl(t.tag)||"Reviews";
  const heading=gl(t.heading)||"What clients say";
  el.innerHTML=`<div class="ts-inner">
    <div class="ts-head">
      <span class="ts-tag">${esc(tag)}</span>
      <h2 class="ts-h">${esc(heading)}</h2>
    </div>
    <div class="ts-grid">
      ${t.items.map(it=>`<figure class="ts-card">
        <blockquote class="ts-quote">${esc(gl(it.quote))}</blockquote>
        <figcaption class="ts-author">
          ${it.photo?`<div class="ts-photo" style="background-image:url('${esc(it.photo)}')"></div>`:""}
          <div class="ts-author-text">
            <div class="ts-name">${esc(gl(it.name)||it.name||"")}</div>
            <div class="ts-role">${esc(gl(it.role)||it.role||"")}</div>
          </div>
        </figcaption>
      </figure>`).join("")}
    </div>
  </div>`;
}

function renderProcess(){
  const el=document.getElementById("process");if(!el)return;
  const p=DATA.process;
  if(!p||!Array.isArray(p.steps)||!p.steps.length){el.innerHTML="";el.style.display="none";return;}
  el.style.display="";
  const tag=gl(p.tag)||"Process";
  const heading=gl(p.heading)||"How we work";
  el.innerHTML=`<div class="process-inner">
    <div class="process-head">
      <span class="process-tag">${esc(tag)}</span>
      <h2 class="process-h">${esc(heading)}</h2>
    </div>
    <div class="process-grid">
      ${p.steps.map((st,i)=>`<div class="process-step">
        <div class="process-num">${String(i+1).padStart(2,"0")}</div>
        <h3 class="process-step-h">${esc(gl(st.title))}</h3>
        <p class="process-step-d">${esc(gl(st.desc))}</p>
      </div>`).join("")}
    </div>
  </div>`;
}

function renderStructuredData(){
  const s=DATA.site||{};
  const projects=DATA.projects||[];
  const data={
    "@context":"https://schema.org",
    "@type":"Organization",
    "name":s.name||"FRAME",
    "description":gl(s.heroTagline)||(s.name||"FRAME")+" — production studio",
    "email":s.email||"",
    "telephone":s.phone||"",
    "url":location.origin+location.pathname,
    "sameAs":(s.socials||[]).map(x=>x.url).filter(Boolean),
    "address":{"@type":"PostalAddress","addressLocality":"Almaty","addressCountry":"KZ"}
  };
  const works={
    "@context":"https://schema.org",
    "@type":"ItemList",
    "itemListElement":projects.map((p,i)=>({
      "@type":"ListItem",
      "position":i+1,
      "item":{
        "@type":"VideoObject",
        "name":gl(p.title)||p.client||"Untitled",
        "description":gl(p.summary)||"",
        "thumbnailUrl":p.cover||"",
        "uploadDate":p.year?p.year+"-01-01":undefined,
        "duration":p.runtime?"PT"+(p.runtime.replace(":","M")+"S"):undefined,
        "creator":{"@type":"Organization","name":s.name||"FRAME"}
      }
    }))
  };
  let s1=document.getElementById("ld-org"),s2=document.getElementById("ld-works");
  if(!s1){s1=document.createElement("script");s1.type="application/ld+json";s1.id="ld-org";document.head.appendChild(s1);}
  if(!s2){s2=document.createElement("script");s2.type="application/ld+json";s2.id="ld-works";document.head.appendChild(s2);}
  s1.textContent=JSON.stringify(data);
  s2.textContent=JSON.stringify(works);
}

function renderMarquee(){
  const track=document.getElementById("marquee-track");if(!track)return;
  const m=(DATA.site&&DATA.site.marqueeItems);
  let items;
  if(Array.isArray(m)) items=m;
  else if(m&&typeof m==="object") items=m[currentLang]||m.en||[];
  else items=[];
  if(!items.length) items=["BRAND FILMS","WEDDING FILMS","MUSIC VIDEOS","COMMERCIALS","SHORT FILMS","CGI · 3D","COLOR GRADE","SOUND DESIGN"];
  const set=items.map(t=>`<span>${esc(t)}</span><span class="sep">—</span>`).join("");
  track.innerHTML=set+set;
}

function renderStudioStrip(){
  const el=document.getElementById("studio-strip");if(!el)return;
  const s=DATA.site||{};
  const tag=(s.studioTag&&gl(s.studioTag))||"Studio";
  const text=(s.studioText&&gl(s.studioText))||"A studio of one — and a small circle of trusted collaborators. We tell stories with <em>cinema in mind.</em>";
  if(!s.studioStats||!Array.isArray(s.studioStats)||s.studioStats.length===0){
    s.studioStats=[{num:"6+",lbl:"Years of work"},{num:"40+",lbl:"Projects completed"},{num:"3",lbl:"Countries"},{num:"∞",lbl:"Stories to tell"}];
  }
  el.innerHTML=`<div class="studio-strip-inner">
    <div class="studio-strip-tag">${esc(tag)}</div>
    <div class="studio-strip-text">${text}</div>
  </div>
  <div class="studio-strip-stats">
    ${s.studioStats.map(st=>`<div class="studio-stat"><div class="studio-stat-num">${esc(st.num||"")}</div><div class="studio-stat-lbl">${esc(st.lbl||"")}</div></div>`).join("")}
  </div>`;
}

let _rotInt=null;
function startRotator(words){
  const rot=document.getElementById("dp-rotator");
  if(!rot)return;
  if(_rotInt){clearInterval(_rotInt);_rotInt=null;}
  if(!words||!words.length){rot.innerHTML="";return;}
  rot.innerHTML=words.map((w,i)=>`<span class="dp-rot-word${i===0?' active':''}">${esc(w)}</span>`).join("");
  if(words.length<2)return;
  let idx=0;
  _rotInt=setInterval(()=>{
    const items=rot.querySelectorAll(".dp-rot-word");
    if(!items.length)return;
    const cur=items[idx];
    cur.classList.remove("active");cur.classList.add("exit");
    setTimeout(()=>cur.classList.remove("exit"),700);
    idx=(idx+1)%items.length;
    items[idx].classList.add("active");
  },2400);
}

function renderAbout(){
  const v=document.getElementById("view-about");if(!v)return;
  const s=DATA.site||{};
  const ab=DATA.about||{};
  const lead=gl(ab.lead)||"A studio of one — and a small circle of trusted collaborators. We tell stories with <em>cinema in mind.</em>";
  const p1=gl(ab.p1)||"FRAME is a boutique production studio based in Almaty. We specialize in brand films, weddings, and music videos — every frame crafted with intention.";
  const p2=gl(ab.p2)||"From script to color grade, we work end-to-end. No bloat, no middle-men. Just stories that hold up on a big screen.";
  const facts=ab.facts||(ab.facts=[
    {label:{en:"Approach",ru:"Подход",kk:"Тәсіл"},value:{en:"Cinematic, patient, honest.",ru:"Кинематографично, спокойно, честно.",kk:"Кинематографиялық, шынайы."}},
    {label:{en:"Tools",ru:"Техника",kk:"Техника"},value:{en:"ARRI · RED · Sony FX · DJI",ru:"ARRI · RED · Sony FX · DJI",kk:"ARRI · RED · Sony FX · DJI"}},
    {label:{en:"Languages",ru:"Языки",kk:"Тілдер"},value:{en:"KK · RU · EN",ru:"KK · RU · EN",kk:"KK · RU · EN"}},
    {label:{en:"Reach",ru:"География",kk:"Аймақ"},value:{en:"Almaty / Worldwide",ru:"Алматы / Весь мир",kk:"Алматы / Бүкіл әлем"}}
  ]);
  const mUrl=(ab.media&&ab.media.url)||"";
  const hasMedia=!!mUrl;
  const isVid=hasMedia&&/vimeo\.com|youtube\.com|youtu\.be/i.test(mUrl);
  let mediaBlock="";
  if(hasMedia){
    if(isVid){
      const e=toEmbed(mUrl);
      const src=e.includes("vimeo")?e+"?autoplay=1&loop=1&muted=1&controls=0&background=1":e+"?autoplay=1&mute=1&loop=1&controls=0&playlist="+e.split("/").pop();
      mediaBlock=`<div class="ab-media ab-video"><iframe src="${esc(src)}" allow="autoplay;fullscreen" frameborder="0"></iframe></div>`;
    }else{
      mediaBlock=`<div class="ab-media" style="background-image:url('${esc(mUrl)}')"></div>`;
    }
  }
  v.innerHTML=`<section class="ab ${hasMedia?'has-media':'no-media'}"><div class="ab-inner">
    <div class="ab-head">
      <span class="ab-tag">${esc((DATA.site&&gl(DATA.site.clientsLabel)==="Clients"?"Studio":gl(DATA.site.clientsLabel))||"Studio")}</span>
      <h1 class="ab-hero">${lead}</h1>
    </div>
    <div class="ab-body">
      ${mediaBlock}
      <div class="ab-text">
        <p>${p1}</p>
        <p>${p2}</p>
        <a href="mailto:${esc(s.email||'')}" class="ab-cta">${esc(s.email||'hello@studio.com')} <span>↗</span></a>
      </div>
    </div>
    <div class="ab-facts">
      ${facts.map(f=>`<div class="ab-fact"><h5>${esc(gl(f.label))}</h5><p>${esc(gl(f.value))}</p></div>`).join("")}
    </div>
  </div></section>`;
}

function route(){
  const h=location.hash||"";
  const home=document.getElementById("view-home");
  const about=document.getElementById("view-about");
  const isAbout=h.startsWith("#/about");
  if(home)home.classList.toggle("active",!isAbout);
  if(about)about.classList.toggle("active",isAbout);
  document.body.dataset.route=isAbout?"about":"home";
  window.scrollTo(0,0);
  applySolidNav();
}
function applySolidNav(){
  const nav=document.getElementById("nav");if(!nav)return;
  const isAbout=document.body.dataset.route==="about";
  nav.classList.toggle("solid",isAbout||window.scrollY>60);
}
window.addEventListener("hashchange",()=>{
  const newIsAbout=(location.hash||"").startsWith("#/about");
  const oldIsAbout=document.body.dataset.route==="about";
  // Если роут не меняется — просто route() без маски (для якорей внутри страницы)
  if(newIsAbout===oldIsAbout){route();return;}
  const mask=document.getElementById("mask");
  if(mask){
    mask.classList.remove("out");
    mask.classList.add("in");
    setTimeout(()=>{
      route();
      mask.classList.remove("in");
      mask.classList.add("out");
      setTimeout(()=>mask.classList.remove("out"),550);
    },300);
  } else {
    route();
  }
});

// Keyboard
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){
    if(document.querySelectorAll(".modal-backdrop.show").length){closeModal();return;}
    const ap=document.getElementById("admin-panel");
    if(ap&&ap.classList.contains("open")){closeAdminPanel();return;}
  }
  // skip if typing in an input
  const tag=(e.target.tagName||"").toLowerCase();
  if(tag==="input"||tag==="textarea"||tag==="select"||e.target.isContentEditable)return;
  // modal arrows = prev/next project
  if(_modalProjectId&&(e.key==="ArrowLeft"||e.key==="ArrowRight")){
    e.preventDefault();
    navModal(e.key==="ArrowLeft"?-1:1);
    return;
  }
  // home page arrows = scroll carousel
  if((e.key==="ArrowLeft"||e.key==="ArrowRight")&&document.body.dataset.route!=="about"){
    const car=document.querySelector(".dp-carousel");
    if(car&&window._dpNudge){window._dpNudge(e.key==="ArrowLeft"?280:-280);}
  }
});

function defaultMenu(){
  return [
    {href:"#/",label:{en:"Work",ru:"Работы",kk:"Жұмыстар"}},
    {href:"#/about",label:{en:"About",ru:"О нас",kk:"Біз туралы"}},
    {href:"#pricing",label:{en:"Pricing",ru:"Цены",kk:"Бағалар"}},
    {href:"#contact",label:{en:"Contact",ru:"Контакты",kk:"Байланыс"}}
  ];
}
window.defaultMenu=defaultMenu;

function initMenuDnD(){
  const list=document.getElementById("ap-menu-list");if(!list)return;
  let dragIdx=-1;
  list.querySelectorAll(".ap-menu-row").forEach(row=>{
    row.addEventListener("dragstart",e=>{
      dragIdx=+row.dataset.midx;row.classList.add("dragging");
      e.dataTransfer.effectAllowed="move";
      try{e.dataTransfer.setData("text/plain",String(dragIdx));}catch(err){}
    });
    row.addEventListener("dragend",()=>{
      row.classList.remove("dragging");
      list.querySelectorAll(".ap-menu-row").forEach(r=>r.classList.remove("drag-over"));
    });
    row.addEventListener("dragover",e=>{
      e.preventDefault();e.dataTransfer.dropEffect="move";
      const cur=+row.dataset.midx;
      if(cur===dragIdx)return;
      list.querySelectorAll(".ap-menu-row").forEach(r=>r.classList.remove("drag-over"));
      row.classList.add("drag-over");
    });
    row.addEventListener("drop",e=>{
      e.preventDefault();
      const to=+row.dataset.midx;
      if(dragIdx<0||dragIdx===to||!DATA.site||!DATA.site.menu)return;
      const moved=DATA.site.menu.splice(dragIdx,1)[0];
      DATA.site.menu.splice(to,0,moved);
      saveData();render();renderAdmin();
      showToast("Порядок меню обновлён");
    });
  });
}

function renderNav(){
  if(!DATA.site)DATA.site={};
  const s=DATA.site;
  if(!Array.isArray(s.menu)||!s.menu.length) s.menu=defaultMenu();
  const items=s.menu.map(m=>`<a href="${esc(m.href||"#")}">${esc(gl(m.label)||"")}</a>`).join("");
  const navL=document.querySelector("#nav .nav-l");
  if(navL)navL.innerHTML=items;
  const mm=document.getElementById("mobile-menu");
  if(mm){
    const pill=mm.querySelector(".lang-pill");
    mm.innerHTML=items;
    if(pill)mm.appendChild(pill);
  }
  // Логотип: SVG/IMG если задан, иначе текстовое название
  const navC=document.querySelector(".nav-c");
  if(navC){
    if(s.logoUrl){
      navC.innerHTML=`<img src="${esc(s.logoUrl)}" alt="${esc(s.name||"FRAME")}" style="height:22px;width:auto;display:block;object-fit:contain"/>`;
    } else {
      navC.textContent=s.name||"FRAME";
    }
  }
}

function renderContactCTAs(){
  const el=document.getElementById("contact-ctas");if(!el)return;
  const s=DATA.site||{};
  const tg=(s.telegram||"").trim();
  const wa=(s.phone||"").replace(/[^+0-9]/g,"");
  const email=s.email||"";
  const t=I18N[currentLang]||I18N.en;
  const items=[];
  if(tg){
    const url=tg.startsWith("http")?tg:`https://t.me/${tg.replace(/^@/,"")}`;
    items.push({type:"telegram",url,label:t["contact.telegram"]||"Telegram",handle:tg.startsWith("http")?tg.split("/").pop():tg,icon:"✈"});
  }
  if(wa){
    const url=`https://wa.me/${wa.replace(/^\+/,"")}`;
    items.push({type:"whatsapp",url,label:t["contact.whatsapp"]||"WhatsApp",handle:s.phone||"",icon:"●"});
  }
  if(email){
    items.push({type:"email",url:"mailto:"+email,label:t["contact.email"]||"Email",handle:email,icon:"@"});
  }
  if(!items.length){el.innerHTML=`<p style="color:var(--muted);font-size:13px">${esc(t["contact.notconfig"]||"No contacts configured yet.")}</p>`;return;}
  el.innerHTML=items.map(it=>`<a href="${esc(it.url)}" target="_blank" rel="noopener" class="contact-card contact-${it.type}">
    <span class="cc-icon">${it.icon}</span>
    <div class="cc-text">
      <span class="cc-label">${esc(it.label)}</span>
      <span class="cc-handle">${esc(it.handle)}</span>
    </div>
    <span class="cc-arrow">↗</span>
  </a>`).join("");
}

function renderClients(){
  const section=document.querySelector(".clients-section");
  const el=document.getElementById("clients-list");
  const lbl=document.querySelector(".clients-label");
  const clients=[...new Set((DATA.projects||[]).map(p=>p.client).filter(Boolean))];
  if(!clients.length){if(section)section.style.display="none";return;}
  if(section)section.style.display="";
  if(lbl)lbl.textContent=(DATA.site&&gl(DATA.site.clientsLabel))||"Clients";
  if(el)el.innerHTML=clients.map(c=>`<span>${esc(c)}</span>`).join("");
}

function renderDpHero(){
  const titleEl=document.getElementById("dp-title");
  const tagEl=document.getElementById("dp-tagline");
  const tagsEl=document.getElementById("dp-tags");
  const track=document.getElementById("dp-track");
  if(!track)return;
  const site=DATA.site||{};
  // префикс: строка ИЛИ {en,ru,kk}
  const prefix=(typeof site.heroPrefix==="object"?gl(site.heroPrefix):site.heroPrefix)||"CRAFTING";
  // слова: массив (legacy) ИЛИ {en:[],ru:[],kk:[]}
  let words;
  if(Array.isArray(site.heroWords)) words=site.heroWords;
  else if(site.heroWords&&typeof site.heroWords==="object") words=site.heroWords[currentLang]||site.heroWords.en||[];
  else words=[];
  if(!words.length) words=["REELS","STORIES","BRANDS","FILMS"];
  if(titleEl){
    titleEl.innerHTML=`<span class="dp-title-prefix">${esc(prefix)}</span><span class="dp-title-rotator" id="dp-rotator"></span>`;
    startRotator(words);
  }
  // tagline (gl handles both strings and {en,ru,kk} objects)
  const tagline = gl(site.heroTagline) || ((site.name||"FRAME")+" — REELS PRODUCTION FROM ALMATY, CRAFTING STORIES FOR BRANDS.");
  if(tagEl) tagEl.textContent = tagline;
  // carousel
  const list=(DATA.projects||[]).filter(p=>p.videoUrl||p.cover);
  if(!list.length){track.innerHTML="";return;}
  const items=[...list,...list];
  track.innerHTML=items.map((p,i)=>{
    const embed=toEmbed(p.videoUrl);
    const reelSrc=embed?(embed.includes("vimeo")?embed+"?autoplay=0&loop=1&muted=1&controls=0&dnt=1&playsinline=1&transparent=0":embed+"?autoplay=0&mute=1&loop=1&playlist="+embed.split("/").pop()+"&controls=0&modestbranding=1&playsinline=1&enablejsapi=1"):"";
    const variant=(i%list.length)%5;
    return `<div class="dp-card v${variant}" data-id="${esc(p.id)}" data-src="${esc(reelSrc)}">
      <div class="dp-card-poster" style="background-image:url('${esc(p.cover||'')}')"></div>
      <div class="dp-card-label"><span class="dot">●</span> ${esc((p.client||gl(p.title)||"").toUpperCase())}</div>
      ${p.runtime?`<div class="dp-card-runtime">${esc(p.runtime)}</div>`:""}
    </div>`;
  }).join("");
  initDpCarousel(track);
}

function initDpCarousel(track){
  const carousel=track.parentElement;
  // take over from CSS animation
  track.style.animation="none";
  carousel.classList.add("draggable");

  let translateX=0;
  const autoSpeed=-0.35;
  let isDragging=false,startX=0,startTranslate=0,lastX=0,lastT=0,userVel=0,pauseUntil=0,moved=0;

  const halfWidth=()=>{
    const kids=track.children;
    const n=Math.floor(kids.length/2);
    if(kids[n]) return kids[n].offsetLeft;
    return track.scrollWidth/2;
  };

  function tick(){
    const now=performance.now();
    if(!isDragging){
      if(now>pauseUntil) translateX+=autoSpeed;
      if(Math.abs(userVel)>0.05){translateX+=userVel;userVel*=0.93;}
      const hw=halfWidth();
      if(hw>0){
        while(translateX<=-hw) translateX+=hw;
        while(translateX>0) translateX-=hw;
      }
      track.style.transform=`translate3d(${translateX}px,0,0)`;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  let lastDragMoved=0;
  carousel.addEventListener("pointerdown",e=>{
    if(e.target.closest("iframe"))return;
    // mouse only: prevent browser back-swipe gesture on horizontal drag
    if(e.pointerType==="mouse")e.preventDefault();
    isDragging=true;moved=0;lastDragMoved=0;
    startX=e.clientX;startTranslate=translateX;
    lastX=e.clientX;lastT=performance.now();userVel=0;
    carousel.classList.add("grabbing");
    try{carousel.setPointerCapture(e.pointerId);}catch(err){}
  });
  carousel.addEventListener("pointermove",e=>{
    if(!isDragging)return;
    const dx=e.clientX-startX;
    moved=Math.max(moved,Math.abs(dx));
    translateX=startTranslate+dx;
    const now=performance.now(),dt=now-lastT;
    if(dt>0) userVel=((e.clientX-lastX)/dt)*16;
    lastX=e.clientX;lastT=now;
    track.style.transform=`translate3d(${translateX}px,0,0)`;
  });
  function endDrag(){
    if(!isDragging)return;
    isDragging=false;
    carousel.classList.remove("grabbing");
    pauseUntil=performance.now()+2500;
  }
  carousel.addEventListener("pointerup",endDrag);
  carousel.addEventListener("pointercancel",endDrag);

  carousel.addEventListener("wheel",e=>{
    if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){
      translateX-=e.deltaX;
      pauseUntil=performance.now()+1500;
      e.preventDefault();
    }
  },{passive:false});

  // Drag-hint + стрелки: исчезают при активности, возвращаются через 5с простоя
  let lastInteract=performance.now();
  const hint=()=>document.getElementById("dp-drag-hint");
  const arrows=()=>document.querySelectorAll(".dp-nav-btn");
  const touchHint=()=>{
    const h=hint();if(h)h.classList.add("gone");
    arrows().forEach(b=>b.classList.add("inactive"));
    lastInteract=performance.now();
  };
  setInterval(()=>{
    if(performance.now()-lastInteract>5000){
      const h=hint();if(h)h.classList.remove("gone");
      arrows().forEach(b=>b.classList.remove("inactive"));
    }
  },1000);

  window._dpNudge=function(delta){
    translateX+=delta;
    pauseUntil=performance.now()+2000;
    touchHint();
  };

  // Стрелки декоративные — без click-хэндлеров

  // Trackers — каждое взаимодействие сбрасывает таймер и прячет подсказку
  carousel.addEventListener("pointerdown",touchHint);
  carousel.addEventListener("wheel",touchHint,{passive:true});
  carousel.addEventListener("pointermove",e=>{if(isDragging)touchHint();});

  // lazy iframe + hover play/pause
  const cards=track.querySelectorAll(".dp-card");
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      const card=e.target;
      if(e.isIntersecting && !card.querySelector("iframe") && card.dataset.src){
        const ifr=document.createElement("iframe");
        ifr.src=card.dataset.src;ifr.allow="autoplay; fullscreen";
        ifr.setAttribute("frameborder","0");ifr.loading="lazy";
        card.appendChild(ifr);
      }
    });
  },{rootMargin:"400px"});

  function play(card){
    const ifr=card.querySelector("iframe");if(!ifr||!ifr.contentWindow)return;
    try{
      ifr.contentWindow.postMessage('{"method":"play"}',"*");
      ifr.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}',"*");
    }catch(e){}
    card.classList.add("playing");
  }
  function pause(card){
    const ifr=card.querySelector("iframe");if(!ifr||!ifr.contentWindow)return;
    try{
      ifr.contentWindow.postMessage('{"method":"pause"}',"*");
      ifr.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}',"*");
    }catch(e){}
    card.classList.remove("playing");
  }

  cards.forEach(c=>{
    io.observe(c);
    c.addEventListener("pointerenter",()=>{play(c);hoveredCard=c;});
    c.addEventListener("pointerleave",()=>{pause(c);if(hoveredCard===c)hoveredCard=null;});
  });

  // click logic at carousel level (since setPointerCapture redirects events)
  let downX=0,downY=0,downT=0,downCard=null;
  carousel.addEventListener("pointerdown",e=>{
    downX=e.clientX;downY=e.clientY;downT=Date.now();
    downCard=e.target.closest(".dp-card");
  });
  carousel.addEventListener("pointerup",e=>{
    const dx=Math.abs(e.clientX-downX),dy=Math.abs(e.clientY-downY);
    if(dx<6 && dy<6 && Date.now()-downT<350 && downCard){
      window.openModal(downCard.dataset.id,downCard);
    }
    downCard=null;
  });

  // pause auto-scroll while hovering a card (so video can be watched)
  let hoveredCard=null;
  const origTick=tick;
  // Modify autoSpeed via pauseUntil while hovered
  setInterval(()=>{
    if(hoveredCard) pauseUntil=performance.now()+200;
  },150);
}

function renderReelsRail_DEAD(){
  const rail=document.getElementById("reels-rail");if(!rail)return;
  const list=(DATA.projects||[]).filter(p=>p.videoUrl||p.cover);
  if(!list.length){rail.innerHTML="";return;}
  // duplicate 2x for seamless loop
  const items=[...list,...list];
  rail.innerHTML=`<div class="reels-track">${items.map((p,i)=>{
    const embed=toEmbed(p.videoUrl);
    const reelSrc=embed?(embed.includes("vimeo")?embed+"?background=1&autoplay=1&loop=1&muted=1&dnt=1":embed+"?autoplay=1&mute=1&loop=1&playlist="+embed.split("/").pop()+"&controls=0&modestbranding=1&playsinline=1"):"";
    return `<div class="reel-card" data-id="${esc(p.id)}" data-src="${esc(reelSrc)}">
      <div class="reel-poster" style="background-image:url('${esc(p.cover||'')}')"></div>
      ${p.runtime?`<div class="reel-runtime">${esc(p.runtime)}</div>`:""}
      <div class="reel-info"><div class="reel-brand">${esc((p.client||"").toUpperCase())}</div></div>
    </div>`;
  }).join("")}</div>`;
  initReelsRail(rail);
}

function initReelsRail(rail){
  const cards=rail.querySelectorAll(".reel-card");
  // lazy mount iframes via IntersectionObserver
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      const card=e.target;
      if(e.isIntersecting && !card.querySelector("iframe") && card.dataset.src){
        const ifr=document.createElement("iframe");
        ifr.src=card.dataset.src;ifr.allow="autoplay; fullscreen";
        ifr.setAttribute("frameborder","0");ifr.loading="lazy";
        card.appendChild(ifr);
        ifr.addEventListener("load",()=>card.classList.add("loaded"));
      }
    });
  },{rootMargin:"200px"});
  cards.forEach(c=>{
    io.observe(c);
    let downX=0,downT=0;
    c.addEventListener("pointerdown",e=>{downX=e.clientX;downT=Date.now();});
    c.addEventListener("pointerup",e=>{
      if(Math.abs(e.clientX-downX)<8 && Date.now()-downT<400) window.openModal(c.dataset.id);
    });
  });
}

function renderGrid(){
  const grid=document.getElementById("projects");if(!grid)return;
  const list=(DATA.projects||[]).filter(p=>currentCategory==="all"||p.category===currentCategory);
  if(!list.length){grid.innerHTML=`<div style="text-align:center;padding:80px 20px;color:var(--muted);font-size:13px">Нет проектов</div>`;return;}
  const catLabels={commercials:"REKLAMA / COMMERCIAL",stories:"STORY / SHORT FILM",personal:"PERSONAL PROJECT"};
  grid.innerHTML=`
    <div class="proj-list">
      ${list.map((p,i)=>`
        <div class="proj-row" data-id="${esc(p.id)}" data-idx="${i}">
          <div class="proj-row-name">${esc((p.client||gl(p.title)||"Untitled").toUpperCase())}</div>
          <div class="proj-row-type">${esc(catLabels[p.category]||p.category||"")}</div>
          <div class="proj-row-runtime">${esc(p.runtime||"")}</div>
        </div>
      `).join("")}
    </div>
    <div class="proj-preview-stage" id="proj-preview-stage" aria-hidden="true"></div>
  `;
  initProjectList(grid);
}

function initProjectList(container){
  const rows=container.querySelectorAll(".proj-row");
  const stage=container.querySelector("#proj-preview-stage");
  const previewByIdx=new Map();
  // build hidden iframes once (lazy load on hover)
  function getPreview(idx){
    if(previewByIdx.has(idx))return previewByIdx.get(idx);
    const p=(DATA.projects||[]).filter(x=>currentCategory==="all"||x.category===currentCategory)[idx];
    if(!p)return null;
    const wrap=document.createElement("div");wrap.className="proj-preview";
    if(p.cover)wrap.style.backgroundImage=`url('${p.cover}')`;
    const embed=toEmbed(p.videoUrl);
    if(embed){
      const isVimeo=embed.includes("vimeo");
      const src=isVimeo?embed+"?background=1&autoplay=1&loop=1&muted=1&dnt=1":embed+"?autoplay=1&mute=1&loop=1&playlist="+embed.split("/").pop()+"&controls=0&modestbranding=1&playsinline=1";
      const ifr=document.createElement("iframe");
      ifr.allow="autoplay; fullscreen";ifr.setAttribute("frameborder","0");
      ifr.dataset.src=src;
      wrap.appendChild(ifr);
    }
    stage.appendChild(wrap);
    previewByIdx.set(idx,wrap);
    return wrap;
  }
  let active=null,activeIdx=-1;
  function show(idx,row){
    if(activeIdx===idx)return;
    if(active){active.classList.remove("active");const ifr=active.querySelector("iframe");if(ifr){try{ifr.contentWindow.postMessage(JSON.stringify({method:"setVolume",value:0}),"*");}catch(e){}}}
    activeIdx=idx;
    const prev=getPreview(idx);if(!prev){active=null;return;}
    // mount iframe lazily
    const ifr=prev.querySelector("iframe");
    if(ifr && !ifr.src && ifr.dataset.src)ifr.src=ifr.dataset.src;
    prev.classList.add("active");
    active=prev;
    // unmute slightly
    setTimeout(()=>{if(active===prev && ifr){try{ifr.contentWindow.postMessage(JSON.stringify({method:"setVolume",value:0.5}),"*");ifr.contentWindow.postMessage(JSON.stringify({method:"setMuted",value:false}),"*");}catch(e){}}},250);
    // dim other rows
    rows.forEach(r=>r.classList.toggle("dim", r!==row));
  }
  function hide(){
    if(!active)return;
    const ifr=active.querySelector("iframe");
    if(ifr){try{ifr.contentWindow.postMessage(JSON.stringify({method:"setVolume",value:0}),"*");}catch(e){}}
    active.classList.remove("active");active=null;activeIdx=-1;
    rows.forEach(r=>r.classList.remove("dim"));
  }
  rows.forEach(r=>{
    const idx=+r.dataset.idx;
    r.addEventListener("mouseenter",()=>show(idx,r));
    r.addEventListener("mousemove",e=>{if(stage&&active){const rect=stage.getBoundingClientRect();const y=e.clientY-rect.top;active.style.setProperty("--py", y+"px");}});
    r.addEventListener("click",()=>window.openModal(r.dataset.id));
  });
  container.querySelector(".proj-list")?.addEventListener("mouseleave",hide);
}

function renderPricing(){
  const grid=document.getElementById("price-grid");if(!grid)return;
  const section=document.getElementById("pricing");
  const packages=(DATA.pricing&&DATA.pricing.packages)||[];
  if(!packages.length){if(section)section.style.display="none";grid.innerHTML="";return;}
  if(section)section.style.display="";
  const h=document.getElementById("price-headline"),s=document.getElementById("price-sub");
  if(h&&DATA.pricing)h.textContent=gl(DATA.pricing.headline);
  if(s&&DATA.pricing)s.textContent=gl(DATA.pricing.sub);
  grid.innerHTML=(DATA.pricing&&DATA.pricing.packages||[]).map(pkg=>{
    let feats=[];
    if(pkg.features){
      if(Array.isArray(pkg.features))feats=pkg.features;
      else if(typeof pkg.features==="object"){
        feats=pkg.features[currentLang]||pkg.features.en||[];
        if(!feats.length)feats=pkg.features.en||pkg.features.ru||pkg.features.kk||[];
      }
    }
    const s=DATA.site||{};
    const tg=(s.telegram||"").trim();
    const wa=(s.phone||"").replace(/[^+0-9]/g,"");
    let ctaUrl,ctaTarget="";
    if(tg){ctaUrl=tg.startsWith("http")?tg:`https://t.me/${tg.replace(/^@/,"")}`;ctaTarget=' target="_blank" rel="noopener"';}
    else if(wa){ctaUrl=`https://wa.me/${wa.replace(/^\+/,"")}`;ctaTarget=' target="_blank" rel="noopener"';}
    else ctaUrl="mailto:"+(s.email||"");
    return `<div class="price-card${pkg.featured?" featured":""}"><div class="price-name serif">${esc(gl(pkg.name))}</div><p class="price-desc">${esc(gl(pkg.desc))}</p><div class="price-amount"><span class="num">${pkg.price?pkg.price.en:""}</span><span class="cur">${DATA.pricing.currency?DATA.pricing.currency.en:"$"}</span></div><ul class="price-feats">${feats.map(f=>`<li>${esc(f)}</li>`).join("")}</ul><a href="${esc(ctaUrl)}"${ctaTarget} class="price-cta">${(I18N[currentLang]||I18N.en)["price.book"]}</a></div>`;
  }).join("");
}

function renderFooter(){
  const cta=document.getElementById("foot-cta");
  if(cta){
    const raw=(DATA.site&&DATA.site.footerCta&&gl(DATA.site.footerCta))||"Let's work {em}together{/em}";
    cta.innerHTML=raw.replace(/\{em\}(.*?)\{\/em\}/g,"<em>$1</em>")+'<span class="arrow"> ↗</span>';
    cta.href="mailto:"+(DATA.site&&DATA.site.email||"");
  }
  const em=document.getElementById("foot-email"),ph=document.getElementById("foot-phone"),so=document.getElementById("foot-socials");
  if(em&&DATA.site){em.textContent=DATA.site.email||"";em.href="mailto:"+(DATA.site.email||"");}
  if(ph&&DATA.site){
    const tg=(DATA.site.telegram||"").trim();
    const wa=(DATA.site.phone||"").replace(/[^+0-9]/g,"");
    if(tg){
      const url=tg.startsWith("http")?tg:`https://t.me/${tg.replace(/^@/,"")}`;
      ph.textContent="Telegram ↗";ph.href=url;ph.target="_blank";ph.rel="noopener";
    }else if(wa){
      ph.textContent="WhatsApp ↗";ph.href=`https://wa.me/${wa.replace(/^\+/,"")}`;ph.target="_blank";ph.rel="noopener";
    }else{ph.textContent="";ph.removeAttribute("href");}
  }
  if(so&&DATA.site)so.innerHTML=(DATA.site.socials||[]).map(s=>`<a href="${esc(s.url)}" target="_blank">${esc(s.name)} ↗</a>`).join("");
  const yr=document.querySelector("[data-year]");if(yr)yr.textContent=new Date().getFullYear();
  document.querySelectorAll("[data-loc]").forEach(el=>el.textContent=DATA.site&&DATA.site.location?gl(DATA.site.location):"Almaty / Worldwide");
}

let _modalProjectId=null;
window.openModal=function(id,srcEl){
  const p=(DATA.projects||[]).find(x=>x.id===id);if(!p)return;
  _modalProjectId=id;
  const modal=document.getElementById("project-modal"),content=document.getElementById("project-modal-content");
  const container=modal.querySelector(".modal-video-container");
  const embed=toEmbed(p.videoUrl);
  const videoEl = embed
    ? `<iframe src="${embed}?autoplay=1" style="width:100%;height:100%;border:none;display:block" allow="autoplay;fullscreen"></iframe>`
    : `<div style="width:100%;height:100%;background:url('${p.cover}') center/cover"></div>`;
  const catLabels={commercials:{en:"COMMERCIAL",ru:"РЕКЛАМА",kk:"ЖАРНАМА"},stories:{en:"STORY",ru:"ИСТОРИЯ",kk:"ОҚИҒА"},personal:{en:"PERSONAL",ru:"ЛИЧНОЕ",kk:"ЖЕКЕ"}};
  const cat=catLabels[p.category]?gl(catLabels[p.category]):(p.category||"").toUpperCase();
  const title=gl(p.title);
  const summary=gl(p.summary);
  content.innerHTML=`
    <div class="pm-layout">
      <div class="pm-video-side">
        <div class="pm-brand-tag"><span class="dot">●</span>${esc((p.client||"").toUpperCase())}</div>
        <div class="pm-video">${videoEl}</div>
        ${p.runtime?`<div class="pm-runtime-tag">${esc(p.runtime)}</div>`:""}
      </div>
      <div class="pm-info-side">
        <div class="pm-info-top">
          <div class="pm-cat">${esc(cat)}</div>
          ${p.year?`<div class="pm-year">${esc(p.year)}</div>`:""}
        </div>
        <h1 class="pm-title">${esc(title)}</h1>
        ${p.client?`<div class="pm-client">${esc(p.client)}</div>`:""}
        ${summary?`<p class="pm-summary">${esc(summary)}</p>`:""}
        ${(Array.isArray(p.credits)&&p.credits.length)?`<div class="pm-credits">
          ${p.credits.filter(c=>c.role||c.name).map(c=>`<div class="pm-credit-row"><span class="pm-credit-role">${esc(c.role||"")}</span><span class="pm-credit-name">${esc(c.name||"")}</span></div>`).join("")}
        </div>`:""}
      </div>
    </div>
  `;
  const saved=window.scrollY;document.body.classList.add("locked");document.body.dataset.savedScroll=saved;

  // FLIP animation from clicked card
  container.classList.remove("flip-in","flip-out");
  modal.classList.add("show");

  if(srcEl){
    const src=srcEl.getBoundingClientRect();
    requestAnimationFrame(()=>{
      const tgt=container.getBoundingClientRect();
      const dx=(src.left+src.width/2)-(tgt.left+tgt.width/2);
      const dy=(src.top+src.height/2)-(tgt.top+tgt.height/2);
      const sx=Math.max(.05,src.width/tgt.width);
      const sy=Math.max(.05,src.height/tgt.height);
      container.classList.add("flip-start");
      container.style.transform=`translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      container.style.opacity="0";
      container.style.borderRadius="6px";
      requestAnimationFrame(()=>{
        container.classList.remove("flip-start");
        container.classList.add("flip-in");
        container.style.borderRadius="";
      });
    });
  }else{
    container.style.transform="translateY(40px) scale(.96)";
    container.style.opacity="0";
    requestAnimationFrame(()=>{
      container.classList.add("flip-in");
    });
  }
};

function closeModal(){
  document.querySelectorAll(".modal-backdrop.show").forEach(m=>m.classList.remove("show"));
  const proj=document.getElementById("project-modal");
  const container=proj&&proj.querySelector(".modal-video-container");
  if(container){
    container.classList.remove("flip-in");
    container.classList.add("flip-out");
    container.style.transform="translateY(30px) scale(.95)";
    container.style.opacity="0";
  }
  document.body.classList.remove("locked");
  const saved=parseInt(document.body.dataset.savedScroll)||0;
  if(saved)window.scrollTo(0,saved);
  _modalProjectId=null;
  setTimeout(()=>{
    const c=document.getElementById("project-modal-content");if(c)c.innerHTML="";
    if(container){
      container.classList.remove("flip-out","flip-start");
      container.style.cssText="";
    }
  },600);
}

function navModal(dir){
  if(!_modalProjectId)return;
  const list=DATA.projects||[];if(!list.length)return;
  let idx=list.findIndex(p=>p.id===_modalProjectId);if(idx===-1)return;
  idx=(idx+dir+list.length)%list.length;
  const c=document.getElementById("project-modal-content");
  if(c){c.style.transition="opacity .2s ease";c.style.opacity="0";}
  setTimeout(()=>{
    window.openModal(list[idx].id,null);
    if(c){requestAnimationFrame(()=>{c.style.opacity="1";});}
  },180);
}

// ADMIN
function openAdmin(){
  const panel=document.getElementById("admin-panel");if(panel){panel.style.display="flex";setTimeout(()=>panel.classList.add("open"),10);}
  renderAdmin();
}
function closeAdminPanel(){
  const panel=document.getElementById("admin-panel");if(!panel)return;
  panel.classList.remove("open");setTimeout(()=>panel.style.display="none",550);
}

function renderAdmin(){
  const c=document.getElementById("ap-content"),t=document.getElementById("ap-title");if(!c)return;
  const tabs={hero:"Главная",projects:"Проекты",pricing:"Цены",contact:"Контакты",about:"О нас",process:"Процесс",testimonials:"Отзывы",awards:"Награды",site:"Сайт",backend:"Backend"};
  if(t)t.textContent=tabs[adminTab]||adminTab;
  if(adminTab==="projects"){c.innerHTML=editingProjectId?renderProjectEditor():renderProjectsList();if(!editingProjectId)initProjectsDnD();}
  else if(adminTab==="pricing")c.innerHTML=renderPricingAdmin();
  else if(adminTab==="contact")c.innerHTML=renderContactAdmin();
  else if(adminTab==="about")c.innerHTML=renderAboutAdmin();
  else if(adminTab==="intro")c.innerHTML=renderIntroAdmin();
  else if(adminTab==="site"){c.innerHTML=renderSiteAdmin();setTimeout(initMenuDnD,30);}
  else if(adminTab==="backend")c.innerHTML=renderBackendAdmin();
  bindInputs();
  bindFileUploads();
}

function renderHeroAdmin(){
  const opts=(DATA.projects||[]).map(p=>`<option value="${p.id}"${DATA.hero.featuredId===p.id?" selected":""}>${esc(gl(p.title)||p.id)}</option>`).join("");
  return `<div class="ap-section"><h3>Главная страница</h3><p class="muted">Выберите проект для показа на главной.</p><div class="field"><label>Избранный проект</label><select data-bind="hero.featuredId"><option value="">— выберите —</option>${opts}</select></div></div>`;
}

function renderProjectsList(){
  return `<div class="ap-section"><h3>Проекты</h3>
    <p class="muted">Перетаскивай строки чтобы изменить порядок (он же — порядок на главной).</p>
    <div class="ap-projects-list" id="ap-projects-list">
      ${(DATA.projects||[]).map((p,i)=>`<div class="ap-project-row" draggable="true" data-pidx="${i}">
        <div class="drag-handle" title="Перетащить">⋮⋮</div>
        <div class="thumb" style="background-image:url('${esc(p.cover)}')"></div>
        <div><div class="name">${esc(gl(p.title))||"(без названия)"}</div><div class="meta">${esc(p.client)} · ${p.year||""}</div></div>
        <button class="btn" onclick="editProject('${p.id}')">Изменить</button>
      </div>`).join("")}
    </div>
    <button class="btn primary" onclick="editProject('__new__')">+ Новый проект</button>
  </div>`;
}

window.editProject=function(id){editingProjectId=id;renderAdmin();};

function initProjectsDnD(){
  const list=document.getElementById("ap-projects-list");if(!list)return;
  let dragIdx=-1;
  list.querySelectorAll(".ap-project-row").forEach(row=>{
    row.addEventListener("dragstart",e=>{
      dragIdx=+row.dataset.pidx;
      row.classList.add("dragging");
      e.dataTransfer.effectAllowed="move";
      try{e.dataTransfer.setData("text/plain",String(dragIdx));}catch(err){}
    });
    row.addEventListener("dragend",()=>{
      row.classList.remove("dragging");
      list.querySelectorAll(".ap-project-row").forEach(r=>r.classList.remove("drag-over"));
    });
    row.addEventListener("dragover",e=>{
      e.preventDefault();
      e.dataTransfer.dropEffect="move";
      const cur=+row.dataset.pidx;
      if(cur===dragIdx)return;
      list.querySelectorAll(".ap-project-row").forEach(r=>r.classList.remove("drag-over"));
      row.classList.add("drag-over");
    });
    row.addEventListener("drop",e=>{
      e.preventDefault();
      const to=+row.dataset.pidx;
      if(dragIdx<0||dragIdx===to||!DATA.projects)return;
      const moved=DATA.projects.splice(dragIdx,1)[0];
      DATA.projects.splice(to,0,moved);
      saveData();render();renderAdmin();
      showToast("Порядок обновлён");
    });
  });
}

function renderProjectEditor(){
  const isNew=editingProjectId==="__new__";
  let p=isNew?null:(DATA.projects||[]).find(x=>x.id===editingProjectId);
  if(isNew){p={id:uid(),title:{en:"",ru:"",kk:""},summary:{en:"",ru:"",kk:""},client:"",cover:"",videoUrl:"",vertical:false,year:String(new Date().getFullYear()),runtime:"",category:"commercials"};DATA.projects.push(p);editingProjectId=p.id;saveData();}
  if(!p)return renderProjectsList();
  const idx=DATA.projects.findIndex(x=>x.id===p.id);
  return `<div class="ap-section">
    <button class="btn ghost" onclick="editProject(null)">← Назад</button>
    <h3 style="margin-top:14px">${isNew?"Новый проект":esc(p.title&&p.title.ru||gl(p.title))}</h3>

    <div class="group"><h4>Обложка</h4>
      ${imgUploadField("URL или загрузить файл",`projects.${idx}.cover`,p.cover)}
    </div>

    <div class="group"><h4>Бренд / Клиент</h4>
      <div class="field"><label>Название бренда</label><input data-bind="projects.${idx}.client" value="${esc(p.client)}"/></div>
    </div>

    <div class="group"><h4>Описание<button class="btn" style="padding:6px 14px;font-size:10px" onclick="autoTranslate('projects.${idx}.summary',document.querySelector('[data-bind=\\'projects.${idx}.summary.ru\\']').value)">🪄 Перевести</button></h4>
      <div class="field"><label>RU (основной)</label><textarea data-bind="projects.${idx}.summary.ru" placeholder="Введите описание на русском">${esc(p.summary&&p.summary.ru||"")}</textarea></div>
      <div class="field"><label>EN (авто)</label><textarea data-bind="projects.${idx}.summary.en" style="color:var(--ink-2)">${esc(p.summary&&p.summary.en||"")}</textarea></div>
      <div class="field"><label>KK (авто)</label><textarea data-bind="projects.${idx}.summary.kk" style="color:var(--ink-2)">${esc(p.summary&&p.summary.kk||"")}</textarea></div>
    </div>

    <div class="field-row">
      <div class="field"><label>Год</label><input data-bind="projects.${idx}.year" value="${esc(p.year)}"/></div>
      <div class="field"><label>Хронометраж <button class="btn" style="padding:3px 10px;font-size:9px;margin-left:8px" onclick="fetchAndSetDuration(${idx})">⏱ Авто</button></label><input data-bind="projects.${idx}.runtime" value="${esc(p.runtime)}" placeholder="00:02:00"/></div>
      <div class="field"><label>Категория</label><select data-bind="projects.${idx}.category"><option value="commercials"${p.category==="commercials"?" selected":""}>Реклама</option><option value="stories"${p.category==="stories"?" selected":""}>Истории</option><option value="personal"${p.category==="personal"?" selected":""}>Личное</option></select></div>
    </div>

    <div class="group"><h4>Видео</h4>
      <div class="field"><label>Vimeo URL <span style="color:var(--muted);font-weight:normal;text-transform:none;letter-spacing:0">(вертикальное 9:16)</span></label><input data-bind="projects.${idx}.videoUrl" value="${esc(p.videoUrl)}" placeholder="https://vimeo.com/..."/></div>
    </div>

    <div class="group"><h4>Команда (credits)</h4>
      <p class="muted" style="font-size:11px;margin-bottom:10px">Пары «роль — имя». Показывается в модалке проекта.</p>
      ${(()=>{
        if(!Array.isArray(p.credits))p.credits=[];
        return p.credits.map((c,ci)=>`<div class="stat-row">
          <input data-bind="projects.${idx}.credits.${ci}.role" value="${esc(c.role||"")}" placeholder="DOP / Editor / Color"/>
          <input data-bind="projects.${idx}.credits.${ci}.name" value="${esc(c.name||"")}" placeholder="Имя"/>
          <button class="x" onclick="DATA.projects[${idx}].credits.splice(${ci},1);saveData();renderAdmin();render();">×</button>
        </div>`).join("");
      })()}
      <button class="btn" style="margin-top:8px" onclick="DATA.projects[${idx}].credits=DATA.projects[${idx}].credits||[];DATA.projects[${idx}].credits.push({role:'',name:''});saveData();renderAdmin();render();">+ Добавить</button>
    </div>

    <div style="display:flex;gap:10px;margin-top:20px">
      <button class="btn primary" onclick="editProject(null)">← Назад</button>
      <button class="btn danger" style="margin-left:auto" onclick="deleteProject('${p.id}')">Удалить</button>
    </div>
  </div>`;
}

window.deleteProject=function(id){DATA.projects=(DATA.projects||[]).filter(x=>x.id!==id);editingProjectId=null;saveData();render();renderAdmin();render();};

window.recoverAdminPassword=async function(){
  const DEFAULT_HASH="8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";
  // Если Supabase не подключён — даём инструкцию для Table Editor
  if(!Backend.getConfig()){
    alert(
      "Supabase не подключён. Чтобы восстановить пароль:\n\n"+
      "1. Открой Supabase Dashboard → Table Editor\n"+
      "2. Таблица site_data → строка id=1 → колонка data\n"+
      "3. В JSON замени значение adminPasswordHash на:\n"+
      DEFAULT_HASH+"\n\n"+
      "4. Save → перезагрузи сайт\n"+
      "5. Пароль будет: password"
    );
    return;
  }
  // Инициализируем Supabase если ещё нет
  if(!Backend.client){await Backend.init();}
  // Проверяем авторизацию
  if(!Backend.user){
    const email=prompt("Войди в Supabase для сброса пароля.\n\nEmail:");
    if(!email)return;
    const password=prompt("Пароль Supabase:");
    if(!password)return;
    showToast("🔑 Вход в Supabase…");
    const r=await Backend.signIn(email,password);
    if(r.error||!Backend.user){
      showToast("Ошибка: "+(r.error&&r.error.message||"вход не удался"));
      return;
    }
  }
  // Авторизованы — обнуляем хеш
  if(!confirm("Сбросить пароль админки до 'password'?\nПосле входа сразу смени его."))return;
  if(!DATA.site)DATA.site={};
  DATA.site.adminPasswordHash=DEFAULT_HASH;
  // Сохраняем локально + в облако
  localStorage.setItem("frame_data",JSON.stringify(DATA));
  const res=await Backend.save(DATA);
  if(res.ok){
    showToast("✅ Пароль сброшен. Войди с 'password' и сразу смени!");
    const pw=document.getElementById("admin-password");
    if(pw){pw.value="password";pw.focus();}
    // также сбрасываем лимит попыток
    localStorage.removeItem("frame_login_attempts");
    localStorage.removeItem("frame_login_lock");
  } else {
    showToast("Ошибка сохранения: "+res.error);
  }
};

window.changeAdminPassword=async function(){
  const a=document.getElementById("new-admin-pw"),b=document.getElementById("new-admin-pw2");
  if(!a||!b)return;
  const pw=a.value,pw2=b.value;
  if(pw.length<8){showToast("Минимум 8 символов");return;}
  if(pw!==pw2){showToast("Пароли не совпадают");return;}
  if(/^(password|12345678|qwerty|admin)/i.test(pw)){showToast("Слишком простой пароль");return;}
  const h=await sha256(pw);
  if(!DATA.site)DATA.site={};
  DATA.site.adminPasswordHash=h;
  saveData();
  a.value="";b.value="";
  showToast("✅ Пароль обновлён. Скачай data.json.");
};

function validateImport(d){
  if(!d||typeof d!=="object")return "Не объект";
  if(!d.site||typeof d.site!=="object")return "Нет site";
  if(d.projects&&!Array.isArray(d.projects))return "projects не массив";
  if(d.pricing&&typeof d.pricing!=="object")return "pricing не объект";
  return null;
}

function renderPricingAdmin(){
  if(!DATA.pricing)DATA.pricing={};
  const pr=DATA.pricing;
  if(!pr.headline||typeof pr.headline!=="object")pr.headline={en:"",ru:"",kk:""};
  if(!pr.sub||typeof pr.sub!=="object")pr.sub={en:"",ru:"",kk:""};
  if(!pr.currency||typeof pr.currency!=="object")pr.currency={en:"₸"};
  if(!Array.isArray(pr.packages))pr.packages=[];
  pr.packages.forEach(pkg=>{
    ["name","desc"].forEach(k=>{
      if(typeof pkg[k]==="string")pkg[k]={en:pkg[k],ru:"",kk:""};
      if(!pkg[k]||typeof pkg[k]!=="object")pkg[k]={en:"",ru:"",kk:""};
    });
    if(Array.isArray(pkg.features))pkg.features={en:pkg.features,ru:[],kk:[]};
    if(!pkg.features||typeof pkg.features!=="object")pkg.features={en:[],ru:[],kk:[]};
    ["en","ru","kk"].forEach(l=>{if(!Array.isArray(pkg.features[l]))pkg.features[l]=[];});
  });

  let html=`<div class="ap-section"><h3>Цены</h3>

    <div class="group"><h4>Заголовок секции</h4>
      ${ml3Input("pricing.headline",pr.headline,"Стоимость")}
    </div>
    <div class="group"><h4>Подзаголовок</h4>
      ${ml3Input("pricing.sub",pr.sub,"Под ваше видение")}
    </div>
    <div class="group"><h4>Валюта</h4>
      <div class="field"><label>Символ</label><input data-bind="pricing.currency.en" value="${esc(pr.currency.en||"₸")}" style="max-width:120px"/></div>
    </div>

    <h4 style="margin:24px 0 12px">Пакеты</h4>`;
  pr.packages.forEach((pkg,i)=>{
    html+=`<div class="group" style="border-style:dashed">
      <h4>Пакет #${i+1} <button class="btn danger" style="padding:4px 10px;font-size:9px" onclick="DATA.pricing.packages.splice(${i},1);saveData();render();renderAdmin();">Удалить</button></h4>
      <p class="muted" style="font-size:11px;margin-bottom:8px">Название пакета:</p>
      ${ml3Input(`pricing.packages.${i}.name`,pkg.name,"Базовый")}
      <p class="muted" style="font-size:11px;margin:14px 0 8px">Описание:</p>
      ${ml3Textarea(`pricing.packages.${i}.desc`,pkg.desc,2)}
      <div class="field" style="margin-top:14px"><label>Цена (число без валюты)</label><input data-bind="pricing.packages.${i}.price.en" value="${esc(pkg.price&&pkg.price.en||"")}" placeholder="350 000"/></div>
      <p class="muted" style="font-size:11px;margin:14px 0 8px">Особенности пакета (одна в строке):</p>
      ${ml3List(`pricing.packages.${i}.features`,pkg.features,5)}
      <div style="margin-top:18px">
        <label class="toggle-pill ${pkg.featured?'on':''}">
          <input type="checkbox" ${pkg.featured?"checked":""} onchange="DATA.pricing.packages[${i}].featured=this.checked;saveData();render();this.closest('.toggle-pill').classList.toggle('on',this.checked)"/>
          <span class="toggle-dot"></span>
          <span>★ Популярный пакет</span>
        </label>
      </div>
    </div>`;
  });
  html+=`<button class="btn primary" onclick="if(!DATA.pricing.packages)DATA.pricing.packages=[];DATA.pricing.packages.push({name:{en:'',ru:'',kk:''},desc:{en:'',ru:'',kk:''},price:{en:'0'},features:{en:[],ru:[],kk:[]},featured:false});saveData();render();renderAdmin();">+ Добавить пакет</button></div>`;
  return html;
}

function renderContactAdmin(){
  const s=DATA.site||{};
  const fc=s.footerCta||{};
  return `<div class="ap-section"><h3>Контакты</h3>
    <div class="group"><h4>Основное</h4>
      <div class="field"><label>Email</label><input data-bind="site.email" value="${esc(s.email||"")}" placeholder="hello@studio.com"/></div>
      <div class="field"><label>Telegram (@username или ссылка)</label><input data-bind="site.telegram" value="${esc(s.telegram||"")}" placeholder="@frame_studio или https://t.me/frame_studio"/></div>
      <div class="field"><label>WhatsApp (телефон, опционально)</label><input data-bind="site.phone" value="${esc(s.phone||"")}" placeholder="+7 777 123 45 67"/></div>
    </div>
    <div class="group"><h4>Footer CTA (призыв к действию)</h4>
      <p class="muted" style="font-size:11px;margin-bottom:12px">Используй {em}слово{/em} для курсива</p>
      <div class="field"><label>RU</label><input data-bind="site.footerCta.ru" value="${esc(fc.ru||"Давайте работать {em}вместе{/em}")}" placeholder="Давайте работать {em}вместе{/em}"/></div>
      <div class="field"><label>EN</label><input data-bind="site.footerCta.en" value="${esc(fc.en||"Let\'s work {em}together{/em}")}" placeholder="Let\'s work {em}together{/em}"/></div>
      <div class="field"><label>KK</label><input data-bind="site.footerCta.kk" value="${esc(fc.kk||"Бірге {em}жұмыс{/em} істейік")}" placeholder="Бірге {em}жұмыс{/em} істейік"/></div>
    </div>
    <div class="group"><h4>Соцсети</h4>
      ${(s.socials||[]).map((soc,i)=>`<div class="social-row"><input data-bind="site.socials.${i}.name" value="${esc(soc.name)}" placeholder="Название"/><input data-bind="site.socials.${i}.url" value="${esc(soc.url)}" placeholder="URL"/><button class="x" onclick="DATA.site.socials.splice(${i},1);saveData();render();renderAdmin();">×</button></div>`).join("")}
      <button class="btn" style="margin-top:10px" onclick="DATA.site.socials=DATA.site.socials||[];DATA.site.socials.push({name:'',url:'#'});saveData();render();renderAdmin();">+ Добавить</button>
    </div>
  </div>`;
}

function renderAwardsAdmin(){
  if(!DATA.awards)DATA.awards={};
  const a=DATA.awards;
  if(typeof a.tag==="string")a.tag={en:a.tag,ru:"",kk:""};
  if(!a.tag||typeof a.tag!=="object")a.tag={en:"Awards & Press",ru:"Награды и пресса",kk:"Марапаттар"};
  if(!Array.isArray(a.items))a.items=[];
  return `<div class="ap-section">
    <h3>Награды и пресса</h3>
    <p class="muted">Festival selections, publications, mentions. Если список пустой — секция скрывается.</p>

    <div class="group"><h4>Лейбл секции</h4>
      ${ml3Input("awards.tag",a.tag,"Awards & Press")}
    </div>

    <h4 style="margin:24px 0 12px">Записи</h4>
    ${a.items.map((it,i)=>{
      if(typeof it.name==="string")it.name={en:it.name,ru:"",kk:""};
      if(!it.name||typeof it.name!=="object")it.name={en:"",ru:"",kk:""};
      if(typeof it.note==="string")it.note={en:it.note,ru:"",kk:""};
      if(!it.note||typeof it.note!=="object")it.note={en:"",ru:"",kk:""};
      return `<div class="group" style="border-style:dashed">
        <h4>Запись #${i+1} <button class="btn danger" style="padding:4px 10px;font-size:9px" onclick="DATA.awards.items.splice(${i},1);saveData();render();renderAdmin();">Удалить</button></h4>
        <div class="field"><label>Год</label><input data-bind="awards.items.${i}.year" value="${esc(it.year||"")}" placeholder="2025" style="max-width:120px"/></div>
        <p class="muted" style="font-size:11px;margin-bottom:8px">Название (например: Vimeo Staff Pick / The One Show):</p>
        ${ml3Input(`awards.items.${i}.name`,it.name,"Vimeo Staff Pick")}
        <p class="muted" style="font-size:11px;margin:14px 0 8px">Примечание (категория / номинация):</p>
        ${ml3Input(`awards.items.${i}.note`,it.note,"Best Cinematography")}
      </div>`;
    }).join("")}

    <button class="btn primary" onclick="DATA.awards.items=DATA.awards.items||[];DATA.awards.items.push({year:'',name:{en:'',ru:'',kk:''},note:{en:'',ru:'',kk:''}});saveData();render();renderAdmin();">+ Добавить</button>
  </div>`;
}

function renderTestimonialsAdmin(){
  if(!DATA.testimonials)DATA.testimonials={};
  const t=DATA.testimonials;
  if(typeof t.tag==="string")t.tag={en:t.tag,ru:"",kk:""};
  if(!t.tag||typeof t.tag!=="object")t.tag={en:"Reviews",ru:"Отзывы",kk:"Пікірлер"};
  if(typeof t.heading==="string")t.heading={en:t.heading,ru:"",kk:""};
  if(!t.heading||typeof t.heading!=="object")t.heading={en:"What clients say",ru:"Что говорят клиенты",kk:"Клиенттер не дейді"};
  if(!Array.isArray(t.items))t.items=[];
  return `<div class="ap-section">
    <h3>Отзывы клиентов</h3>
    <p class="muted">Если список пустой — секция автоматически скрывается.</p>

    <div class="group"><h4>Заголовок секции</h4>
      <p class="muted" style="font-size:11px;margin-bottom:8px">Лейбл:</p>
      ${ml3Input("testimonials.tag",t.tag,"Reviews")}
      <p class="muted" style="font-size:11px;margin:14px 0 8px">Большой заголовок:</p>
      ${ml3Input("testimonials.heading",t.heading,"What clients say")}
    </div>

    <h4 style="margin:24px 0 12px">Отзывы</h4>
    ${t.items.map((it,i)=>{
      if(typeof it.name==="string")it.name={en:it.name,ru:"",kk:""};
      if(typeof it.role==="string")it.role={en:it.role,ru:"",kk:""};
      if(typeof it.quote==="string")it.quote={en:it.quote,ru:"",kk:""};
      if(!it.name||typeof it.name!=="object")it.name={en:"",ru:"",kk:""};
      if(!it.role||typeof it.role!=="object")it.role={en:"",ru:"",kk:""};
      if(!it.quote||typeof it.quote!=="object")it.quote={en:"",ru:"",kk:""};
      return `<div class="group" style="border-style:dashed">
        <h4>Отзыв #${i+1} <button class="btn danger" style="padding:4px 10px;font-size:9px" onclick="DATA.testimonials.items.splice(${i},1);saveData();render();renderAdmin();">Удалить</button></h4>
        <p class="muted" style="font-size:11px;margin-bottom:8px">Цитата:</p>
        ${ml3Textarea(`testimonials.items.${i}.quote`,it.quote,3)}
        <p class="muted" style="font-size:11px;margin:14px 0 8px">Имя:</p>
        ${ml3Input(`testimonials.items.${i}.name`,it.name,"Имя автора")}
        <p class="muted" style="font-size:11px;margin:14px 0 8px">Роль / Компания:</p>
        ${ml3Input(`testimonials.items.${i}.role`,it.role,"CEO @ Brand")}
        ${imgUploadField("Фото автора (опционально)",`testimonials.items.${i}.photo`,it.photo)}
      </div>`;
    }).join("")}

    <button class="btn primary" onclick="DATA.testimonials.items=DATA.testimonials.items||[];DATA.testimonials.items.push({quote:{en:'',ru:'',kk:''},name:{en:'',ru:'',kk:''},role:{en:'',ru:'',kk:''},photo:''});saveData();render();renderAdmin();">+ Добавить отзыв</button>
  </div>`;
}

function renderProcessAdmin(){
  if(!DATA.process)DATA.process={};
  const p=DATA.process;
  if(typeof p.tag==="string")p.tag={en:p.tag,ru:"",kk:""};
  if(!p.tag||typeof p.tag!=="object")p.tag={en:"Process",ru:"Процесс",kk:"Процесс"};
  if(typeof p.heading==="string")p.heading={en:p.heading,ru:"",kk:""};
  if(!p.heading||typeof p.heading!=="object")p.heading={en:"How we work",ru:"Как мы работаем",kk:"Біз қалай жұмыс істейміз"};
  if(!Array.isArray(p.steps)||!p.steps.length){
    p.steps=[
      {title:{en:"Brief",ru:"Бриф",kk:"Бриф"},desc:{en:"We listen. Goals, constraints, audience, references.",ru:"Слушаем. Цели, ограничения, аудитория, референсы.",kk:"Мақсаттар, шектеулер, аудитория, референстер."}},
      {title:{en:"Pre-production",ru:"Препродакшн",kk:"Препродакшн"},desc:{en:"Concept, script, locations, casting, schedule.",ru:"Концепт, сценарий, локации, кастинг, график.",kk:"Концепт, сценарий, локациялар, кастинг, кесте."}},
      {title:{en:"Shoot",ru:"Съёмка",kk:"Түсірілім"},desc:{en:"Small crew. Big intent. Every frame matters.",ru:"Маленькая команда. Большой замысел. Каждый кадр важен.",kk:"Шағын команда. Үлкен ой. Әр кадр маңызды."}},
      {title:{en:"Post + delivery",ru:"Пост + сдача",kk:"Пост + тапсыру"},desc:{en:"Edit, color, sound, master files in all formats.",ru:"Монтаж, цвет, звук, мастера во всех форматах.",kk:"Монтаж, түс, дыбыс, барлық форматтағы мастерлар."}}
    ];
  }
  return `<div class="ap-section">
    <h3>Процесс работы</h3>
    <p class="muted">Появляется на главной как «How we work». Скрывается если шагов нет.</p>

    <div class="group"><h4>Заголовок секции</h4>
      <p class="muted" style="font-size:11px;margin-bottom:8px">Лейбл (Process):</p>
      ${ml3Input("process.tag",p.tag,"Process")}
      <p class="muted" style="font-size:11px;margin:14px 0 8px">Большой заголовок:</p>
      ${ml3Input("process.heading",p.heading,"How we work")}
    </div>

    <h4 style="margin:24px 0 12px">Шаги</h4>
    ${p.steps.map((st,i)=>`<div class="group" style="border-style:dashed">
      <h4>Шаг #${i+1} <button class="btn danger" style="padding:4px 10px;font-size:9px" onclick="DATA.process.steps.splice(${i},1);saveData();render();renderAdmin();">Удалить</button></h4>
      <p class="muted" style="font-size:11px;margin-bottom:8px">Заголовок шага:</p>
      ${ml3Input(`process.steps.${i}.title`,st.title,"Brief")}
      <p class="muted" style="font-size:11px;margin:14px 0 8px">Описание:</p>
      ${ml3Textarea(`process.steps.${i}.desc`,st.desc,2)}
    </div>`).join("")}

    <button class="btn primary" onclick="DATA.process.steps=DATA.process.steps||[];DATA.process.steps.push({title:{en:'',ru:'',kk:''},desc:{en:'',ru:'',kk:''}});saveData();render();renderAdmin();">+ Добавить шаг</button>
  </div>`;
}

function renderIntroAdmin(){
  if(!DATA.site)DATA.site={};
  if(!DATA.site.intro)DATA.site.intro={};
  const s=DATA.site;
  const it=s.intro;
  if(!it.brand||typeof it.brand!=="object")it.brand={en:"",ru:"",kk:""};
  if(!it.question||typeof it.question!=="object")it.question={en:"",ru:"",kk:""};
  if(!s.location||typeof s.location!=="object")s.location={en:s.location||"",ru:"",kk:""};
  if(!Array.isArray(s.introWords))s.introWords=["Cinematic","Stories","Frame"];
  const allLangs=[{code:"ru",label:"Русский"},{code:"en",label:"English"},{code:"kk",label:"Қазақша"}];
  const enabledLangs=Array.isArray(s.enabledLangs)?s.enabledLangs:["en","ru","kk"];
  return `<div class="ap-section">
    <h3>Интро (стартовый экран с выбором языка)</h3>
    <p class="muted">Это первый экран, который видит посетитель. Здесь он выбирает язык и переходит на главную.</p>

    <div class="group"><h4>Включённые языки сайта</h4>
      <p class="muted" style="font-size:11px;margin-bottom:12px">Выключи лишние языки если не нужны. Если оставить только один — экран выбора языка не покажется при загрузке, и переключатель в шапке скроется.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${allLangs.map(l=>{
          const on=enabledLangs.includes(l.code);
          return `<label class="toggle-pill ${on?'on':''}">
            <input type="checkbox" ${on?'checked':''} onchange="toggleLang('${l.code}',this.checked,this)"/>
            <span class="toggle-dot"></span>
            <span>${esc(l.label)}</span>
          </label>`;
        }).join("")}
      </div>
    </div>

    <div class="group"><h4>Бренд-метка (вверху слева)</h4>
      <p class="muted" style="font-size:11px;margin-bottom:8px">По умолчанию: «FRAME · STUDIO»</p>
      ${ml3Input("site.intro.brand",it.brand,"FRAME · STUDIO")}
    </div>

    <div class="group"><h4>3 анимационных слова (по центру)</h4>
      <p class="muted" style="font-size:11px;margin-bottom:8px">Появляются по очереди с задержкой. Ровно 3 слова — третье будет курсивом.</p>
      <div class="field"><label>Слова (по одному в строке)</label><textarea data-bind-list="site.introWords" rows="4" placeholder="Cinematic&#10;Stories&#10;Frame">${(s.introWords||[]).join("\n")}</textarea></div>
    </div>

    <div class="group"><h4>Вопрос-подзаголовок (над кнопками)</h4>
      <p class="muted" style="font-size:11px;margin-bottom:8px">По умолчанию: «Choose your language» / «Выберите язык» / «Тілді таңдаңыз»</p>
      ${ml3Input("site.intro.question",it.question,"Choose your language")}
    </div>

    <div class="group"><h4>Локация (внизу слева)</h4>
      <p class="muted" style="font-size:11px;margin-bottom:8px">По умолчанию: «Almaty / Worldwide»</p>
      ${ml3Input("site.location",s.location,"Almaty / Worldwide")}
    </div>

    <div class="group" style="border-color:rgba(0,0,0,.15)"><h4>Превью интро</h4>
      <p class="muted" style="font-size:11px;margin-bottom:12px">Чтобы увидеть интро снова, нажми кнопку — оно покажется при следующей загрузке.</p>
      <button class="btn" onclick="sessionStorage.removeItem('frame.skipIntro');showToast('Интро покажется при обновлении страницы')">Показать интро заново</button>
    </div>
  </div>`;
}

function renderAboutAdmin(){
  if(!DATA.about)DATA.about={};
  const ab=DATA.about;
  if(!Array.isArray(ab.facts)||ab.facts.length===0){
    ab.facts=[
      {label:{en:"Approach",ru:"Подход",kk:"Тәсіл"},value:{en:"Cinematic, patient, honest.",ru:"Кинематографично, спокойно, честно.",kk:"Кинематографиялық, шынайы."}},
      {label:{en:"Tools",ru:"Техника",kk:"Техника"},value:{en:"ARRI · RED · Sony FX · DJI",ru:"ARRI · RED · Sony FX · DJI",kk:"ARRI · RED · Sony FX · DJI"}},
      {label:{en:"Languages",ru:"Языки",kk:"Тілдер"},value:{en:"KK · RU · EN",ru:"KK · RU · EN",kk:"KK · RU · EN"}},
      {label:{en:"Reach",ru:"География",kk:"Аймақ"},value:{en:"Almaty / Worldwide",ru:"Алматы / Весь мир",kk:"Алматы / Бүкіл әлем"}}
    ];
  }
  if(!ab.media)ab.media={};
  return `<div class="ap-section">
    <h3>Страница «О нас»</h3>

    <div class="group"><h4>Медиа (фото или видео)</h4>
      <p class="muted" style="font-size:11px;margin-bottom:10px">URL картинки, Vimeo/YouTube или загрузка файла — видео будет проигрываться автоматически</p>
      ${imgUploadField("URL или загрузить",`about.media.url`,ab.media.url)}
    </div>

    <div class="group"><h4>Главный текст (лид)</h4>
      <p class="muted" style="font-size:11px;margin-bottom:10px">Можно использовать &lt;em&gt;курсив&lt;/em&gt;</p>
      <div class="field"><label>RU</label><textarea data-bind="about.lead.ru" rows="3" placeholder="Студия одного человека...">${esc((ab.lead&&ab.lead.ru)||"")}</textarea></div>
      <div class="field"><label>EN</label><textarea data-bind="about.lead.en" rows="3" style="color:var(--ink-2)">${esc((ab.lead&&ab.lead.en)||"")}</textarea></div>
      <div class="field"><label>KK</label><textarea data-bind="about.lead.kk" rows="3" style="color:var(--ink-2)">${esc((ab.lead&&ab.lead.kk)||"")}</textarea></div>
    </div>

    <div class="group"><h4>Абзац 1</h4>
      <div class="field"><label>RU</label><textarea data-bind="about.p1.ru" rows="3">${esc((ab.p1&&ab.p1.ru)||"")}</textarea></div>
      <div class="field"><label>EN</label><textarea data-bind="about.p1.en" rows="3" style="color:var(--ink-2)">${esc((ab.p1&&ab.p1.en)||"")}</textarea></div>
      <div class="field"><label>KK</label><textarea data-bind="about.p1.kk" rows="3" style="color:var(--ink-2)">${esc((ab.p1&&ab.p1.kk)||"")}</textarea></div>
    </div>

    <div class="group"><h4>Абзац 2</h4>
      <div class="field"><label>RU</label><textarea data-bind="about.p2.ru" rows="3">${esc((ab.p2&&ab.p2.ru)||"")}</textarea></div>
      <div class="field"><label>EN</label><textarea data-bind="about.p2.en" rows="3" style="color:var(--ink-2)">${esc((ab.p2&&ab.p2.en)||"")}</textarea></div>
      <div class="field"><label>KK</label><textarea data-bind="about.p2.kk" rows="3" style="color:var(--ink-2)">${esc((ab.p2&&ab.p2.kk)||"")}</textarea></div>
    </div>

    <div class="group"><h4>4 факта внизу</h4>
      ${ab.facts.map((f,i)=>`
        <div style="padding:14px 0;border-bottom:1px solid var(--line)">
          <div class="field-row x2">
            <div class="field"><label>Лейбл RU</label><input data-bind="about.facts.${i}.label.ru" value="${esc((f.label&&f.label.ru)||"")}"/></div>
            <div class="field"><label>Лейбл EN</label><input data-bind="about.facts.${i}.label.en" value="${esc((f.label&&f.label.en)||"")}"/></div>
          </div>
          <div class="field-row x2">
            <div class="field"><label>Значение RU</label><input data-bind="about.facts.${i}.value.ru" value="${esc((f.value&&f.value.ru)||"")}"/></div>
            <div class="field"><label>Значение EN</label><input data-bind="about.facts.${i}.value.en" value="${esc((f.value&&f.value.en)||"")}"/></div>
          </div>
        </div>
      `).join("")}
    </div>
  </div>`;
}

function migrateMl(s){
  // строки → {en,ru,kk}
  ["heroPrefix","heroTagline","studioTag","studioText","clientsLabel"].forEach(k=>{
    if(typeof s[k]==="string")s[k]={en:s[k],ru:"",kk:""};
    if(!s[k]||typeof s[k]!=="object"||Array.isArray(s[k]))s[k]={en:"",ru:"",kk:""};
  });
  // массивы → {en:[],ru:[],kk:[]}
  ["heroWords","marqueeItems"].forEach(k=>{
    if(Array.isArray(s[k]))s[k]={en:s[k],ru:[],kk:[]};
    if(!s[k]||typeof s[k]!=="object"||Array.isArray(s[k]))s[k]={en:[],ru:[],kk:[]};
    ["en","ru","kk"].forEach(l=>{if(!Array.isArray(s[k][l]))s[k][l]=[];});
  });
}
function ml3Input(basePath,val,placeholder){
  const v=val||{};
  return `
    <div class="field"><label>RU</label><input data-bind="${basePath}.ru" value="${esc(v.ru||"")}" placeholder="${esc(placeholder||"")}"/></div>
    <div class="field"><label>EN</label><input data-bind="${basePath}.en" value="${esc(v.en||"")}" style="color:var(--ink-2)"/></div>
    <div class="field"><label>KK</label><input data-bind="${basePath}.kk" value="${esc(v.kk||"")}" style="color:var(--ink-2)"/></div>
  `;
}
function ml3Textarea(basePath,val,rows){
  const v=val||{};const r=rows||3;
  return `
    <div class="field"><label>RU</label><textarea data-bind="${basePath}.ru" rows="${r}">${esc(v.ru||"")}</textarea></div>
    <div class="field"><label>EN</label><textarea data-bind="${basePath}.en" rows="${r}" style="color:var(--ink-2)">${esc(v.en||"")}</textarea></div>
    <div class="field"><label>KK</label><textarea data-bind="${basePath}.kk" rows="${r}" style="color:var(--ink-2)">${esc(v.kk||"")}</textarea></div>
  `;
}
function ml3List(basePath,val,rows){
  const v=val||{};const r=rows||5;
  const join=arr=>(Array.isArray(arr)?arr:[]).join("\n");
  return `
    <div class="field"><label>RU (по строке)</label><textarea data-bind-list="${basePath}.ru" rows="${r}">${esc(join(v.ru))}</textarea></div>
    <div class="field"><label>EN (по строке)</label><textarea data-bind-list="${basePath}.en" rows="${r}" style="color:var(--ink-2)">${esc(join(v.en))}</textarea></div>
    <div class="field"><label>KK (по строке)</label><textarea data-bind-list="${basePath}.kk" rows="${r}" style="color:var(--ink-2)">${esc(join(v.kk))}</textarea></div>
  `;
}

function renderBackendAdmin(){
  const cfg=Backend.getConfig()||{};
  const sql=`-- Запусти в Supabase → SQL Editor → New query
create table if not exists site_data (
  id int primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table site_data enable row level security;
drop policy if exists "Public read" on site_data;
create policy "Public read" on site_data for select using (true);
drop policy if exists "Auth write" on site_data;
create policy "Auth write" on site_data for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
insert into site_data (id, data) values (1, '{}'::jsonb)
  on conflict (id) do nothing;`;
  return `<div class="ap-section">
    <h3>Облачная синхронизация (Supabase)</h3>
    <p class="muted">Сейчас правки живут только в этом браузере. С Supabase правки сохраняются в облаке и появляются на сайте у всех посетителей — никаких Publish/Import.</p>

    <div class="group"><h4>Статус</h4>
      <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
        <span style="font-size:12px;letter-spacing:.06em">
          ${Backend.client?"🟢 Подключено к Supabase":"⚪ Не настроено"}
          ${Backend.user?` · вошёл как <code>${esc(Backend.user.email)}</code>`:Backend.client?" · не авторизован":""}
        </span>
        ${Backend.user?`<button class="btn ghost" onclick="(async()=>{await Backend.signOut();renderAdmin();showToast('Выход выполнен');})()">Выйти</button>`:""}
      </div>
    </div>

    <div class="group"><h4>Шаг 1 — настройка Supabase</h4>
      <p class="muted" style="font-size:12px;margin-bottom:10px">1. Зарегистрируйся на <a href="https://supabase.com" target="_blank" style="color:var(--ink);text-decoration:underline">supabase.com</a> (бесплатно)<br/>2. Create new project, выбери регион поближе<br/>3. В <b>SQL Editor</b> запусти SQL ниже<br/>4. В <b>Authentication → Users → Add user</b> создай аккаунт с email + паролем</p>
      <details><summary style="cursor:pointer;font-size:11px;letter-spacing:.06em;color:var(--ink-2);padding:8px 0">📋 Показать SQL</summary>
        <textarea readonly style="width:100%;font-family:Menlo,monospace;font-size:11px;padding:14px;background:#0f0f0e;color:#e8e8df;border-radius:8px;border:none;min-height:240px;outline:none" onclick="this.select()">${sql}</textarea>
      </details>
    </div>

    <div class="group"><h4>Шаг 2 — подключи проект</h4>
      <p class="muted" style="font-size:11px;margin-bottom:10px">В Supabase: <b>Project Settings → API</b> → скопируй <code>Project URL</code> и <code>anon public key</code></p>
      <div class="field"><label>Supabase URL</label><input id="be-url" value="${esc(cfg.url||"")}" placeholder="https://xxxxx.supabase.co"/></div>
      <div class="field"><label>Anon Public Key</label><input id="be-key" value="${esc(cfg.key||"")}" placeholder="eyJhbGc..." type="password"/></div>
      <button class="btn primary" onclick="(async()=>{const u=document.getElementById('be-url').value.trim();const k=document.getElementById('be-key').value.trim();if(!u||!k){showToast('Заполни оба поля');return;}Backend.setConfig(u,k);const ok=await Backend.init();showToast(ok?'✓ Конфиг сохранён':'Ошибка инициализации');renderAdmin();})()">Сохранить и подключить</button>
      ${cfg.url?`<button class="btn ghost" style="margin-left:10px" onclick="if(confirm('Очистить настройки backend?')){Backend.clearConfig();renderAdmin();showToast('Очищено');}">Очистить</button>`:""}
    </div>

    ${Backend.client&&!Backend.user?`<div class="group"><h4>Шаг 3 — войти</h4>
      <p class="muted" style="font-size:11px;margin-bottom:10px">Используй email/пароль того юзера, которого создал в Supabase Authentication</p>
      <div class="field"><label>Email</label><input id="be-email" type="email" placeholder="you@studio.com"/></div>
      <div class="field"><label>Password</label><input id="be-pass" type="password"/></div>
      <button class="btn primary" onclick="(async()=>{const e=document.getElementById('be-email').value;const p=document.getElementById('be-pass').value;const r=await Backend.signIn(e,p);if(r.error){showToast('Ошибка: '+r.error.message);}else{showToast('✓ Вход выполнен');renderAdmin();}})()">Войти</button>
    </div>`:""}

    ${Backend.user?`<div class="group"><h4>Действия с данными</h4>
      <button class="btn" onclick="(async()=>{const r=await Backend.save(DATA);showToast(r.ok?'☁ Залито в облако':'Ошибка: '+r.error);})()">⬆ Загрузить локальные данные в облако</button>
      <button class="btn" style="margin-left:10px" onclick="(async()=>{const d=await Backend.load();if(d){DATA=d;localStorage.setItem('frame_data',JSON.stringify(d));render();renderAdmin();showToast('⬇ Скачано из облака');}else{showToast('В облаке пусто');}})()">⬇ Скачать из облака</button>
    </div>`:""}
  </div>`;
}

function renderSiteAdmin(){
  if(!DATA.site)DATA.site={};
  const s=DATA.site;
  if(!Array.isArray(s.studioStats))s.studioStats=[{num:"6+",lbl:"Years of work"},{num:"40+",lbl:"Projects completed"},{num:"3",lbl:"Countries"},{num:"∞",lbl:"Stories to tell"}];
  migrateMl(s);
  // дефолты для пустых
  if(!s.heroPrefix.en&&!s.heroPrefix.ru&&!s.heroPrefix.kk){s.heroPrefix={en:"CRAFTING",ru:"СНИМАЕМ",kk:"ТҮСІРЕМІЗ"};}
  if(!s.heroWords.en.length&&!s.heroWords.ru.length){s.heroWords={en:["REELS","STORIES","BRANDS","FILMS"],ru:["РИЛСЫ","ИСТОРИИ","БРЕНДЫ","ФИЛЬМЫ"],kk:["РИЛСТЕР","ОҚИҒАЛАР","БРЕНДТЕР","ФИЛЬМДЕР"]};}
  if(!s.marqueeItems.en.length){s.marqueeItems.en=["BRAND FILMS","WEDDING FILMS","MUSIC VIDEOS","COMMERCIALS","SHORT FILMS","CGI · 3D","COLOR GRADE","SOUND DESIGN"];}
  return `<div class="ap-section">
    <h3>Настройки сайта</h3>

    <div class="group"><h4>Главный экран — заголовок с анимацией</h4>
      <p class="muted" style="font-size:11px;margin-bottom:12px">Префикс (статичная первая строка):</p>
      ${ml3Input("site.heroPrefix",s.heroPrefix,"CRAFTING")}
      <p class="muted" style="font-size:11px;margin:18px 0 8px">Сменяющиеся слова (по циклу каждые 2.4с):</p>
      ${ml3List("site.heroWords",s.heroWords,5)}
      <p class="muted" style="font-size:11px;margin:18px 0 8px">Подзаголовок (тэглайн):</p>
      ${ml3Textarea("site.heroTagline",s.heroTagline,2)}
    </div>

    <div class="group"><h4>Бегущая строка (marquee)</h4>
      <p class="muted" style="font-size:11px;margin-bottom:8px">Услуги/теги:</p>
      ${ml3List("site.marqueeItems",s.marqueeItems,6)}
    </div>

    <div class="group"><h4>Блок «Studio» (с цифрами)</h4>
      <p class="muted" style="font-size:11px;margin-bottom:8px">Лейбл слева:</p>
      ${ml3Input("site.studioTag",s.studioTag,"Studio")}
      <p class="muted" style="font-size:11px;margin:18px 0 8px">Текст (можно использовать &lt;em&gt;курсив&lt;/em&gt;):</p>
      ${ml3Textarea("site.studioText",s.studioText,3)}
      <p class="muted" style="font-size:11px;margin:14px 0 8px">Статистика (4 ячейки):</p>
      ${(s.studioStats||[{num:"",lbl:""},{num:"",lbl:""},{num:"",lbl:""},{num:"",lbl:""}]).slice(0,4).map((st,i)=>`
        <div class="stat-row">
          <input data-bind="site.studioStats.${i}.num" value="${esc(st.num||"")}" placeholder="6+"/>
          <input data-bind="site.studioStats.${i}.lbl" value="${esc(st.lbl||"")}" placeholder="Years of work"/>
        </div>
      `).join("")}
    </div>

    <div class="group"><h4>Студия и Лого</h4>
      <div class="field"><label>Название студии (текстовый логотип)</label><input data-bind="site.name" value="${esc(s.name||"")}" placeholder="FRAME"/></div>
      ${imgUploadField("Лого-картинка (SVG/PNG, заменяет текст)","site.logoUrl",s.logoUrl)}
      <div class="field"><label>Слова интро (по одному в строке)</label><textarea data-bind-list="site.introWords">${(s.introWords||[]).join("\n")}</textarea></div>
      <p class="muted" style="font-size:11px;margin:14px 0 8px">Лейбл секции клиентов:</p>
      ${ml3Input("site.clientsLabel",s.clientsLabel,"Clients")}
    </div>

    <div class="group"><h4>Пункты меню (drag для перестановки)</h4>
      <p class="muted" style="font-size:11px;margin-bottom:10px">Поддерживаются ссылки: <code>#/</code> (главная), <code>#/about</code> (страница О нас), <code>#pricing</code> / <code>#contact</code> (якоря) или внешний URL.</p>
      <div class="ap-menu-list" id="ap-menu-list">
        ${(s.menu||defaultMenu()).map((m,i)=>`<div class="ap-menu-row" draggable="true" data-midx="${i}">
          <div class="drag-handle" title="Перетащить">⋮⋮</div>
          <div class="ap-menu-fields">
            <div class="field"><label>Ссылка (href)</label><input data-bind="site.menu.${i}.href" value="${esc(m.href||"")}" placeholder="#/about"/></div>
            <p class="muted" style="font-size:10px;margin:8px 0 4px">Название по языкам:</p>
            ${ml3Input(`site.menu.${i}.label`,m.label,"Название")}
          </div>
          <button class="x" title="Удалить пункт" onclick="DATA.site.menu.splice(${i},1);saveData();render();renderAdmin();">×</button>
        </div>`).join("")}
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
        <button class="btn" onclick="DATA.site.menu=DATA.site.menu||[];DATA.site.menu.push({href:'#',label:{en:'',ru:'',kk:''}});saveData();render();renderAdmin();">+ Добавить пункт</button>
        <button class="btn ghost" onclick="if(confirm('Восстановить меню по умолчанию?')){DATA.site.menu=defaultMenu();saveData();render();renderAdmin();}">↺ По умолчанию</button>
      </div>
    </div>

    <div class="group"><h4>Сменить пароль админки</h4>
      <p class="muted" style="margin-bottom:12px;font-size:12px">Минимум 8 символов. Хеш SHA-256 запишется в data.json.</p>
      <div class="field"><label>Новый пароль</label><input type="password" id="new-admin-pw" placeholder="••••••••"/></div>
      <div class="field"><label>Повторите</label><input type="password" id="new-admin-pw2" placeholder="••••••••"/></div>
      <button class="btn primary" onclick="changeAdminPassword()">Сохранить пароль</button>
    </div>
    <div class="group" style="border-color:rgba(163,28,28,.3)"><h4>Опасная зона</h4>
      <p class="muted" style="margin-bottom:12px">Удалит все локальные изменения и вернёт сайт к умолчанию.</p>
      <button class="btn danger" onclick="if(confirm('Сбросить все данные?')){localStorage.removeItem('frame_data');location.reload();}">Сбросить данные</button>
    </div>
  </div>`;
}

async function fileToDataURL(file,maxW){
  maxW=maxW||1600;
  return new Promise((resolve,reject)=>{
    const fr=new FileReader();
    fr.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        const r=img.width/img.height;
        const w=Math.min(maxW,img.width);
        const h=Math.round(w/r);
        const c=document.createElement("canvas");c.width=w;c.height=h;
        c.getContext("2d").drawImage(img,0,0,w,h);
        try{resolve(c.toDataURL("image/jpeg",0.85));}catch(err){reject(err);}
      };
      img.onerror=reject;
      img.src=e.target.result;
    };
    fr.onerror=reject;
    fr.readAsDataURL(file);
  });
}

function bindFileUploads(){
  document.querySelectorAll("[data-img-target]").forEach(inp=>{
    if(inp._bound)return;inp._bound=true;
    inp.addEventListener("change",async e=>{
      const f=e.target.files&&e.target.files[0];if(!f)return;
      if(!f.type.startsWith("image/")){showToast("Не картинка");return;}
      if(f.size>8*1024*1024){showToast("Файл больше 8 MB");return;}
      showToast("⏳ Обработка…");
      try{
        const dataURL=await fileToDataURL(f);
        const path=inp.dataset.imgTarget.split(".");
        let t=DATA;for(let i=0;i<path.length-1;i++){if(t[path[i]]===undefined)t[path[i]]={};t=t[path[i]];}
        t[path[path.length-1]]=dataURL;
        saveData();render();renderAdmin();
        const kb=Math.round(dataURL.length/1024);
        showToast(`✅ Загружено (${kb} KB)`);
      }catch(err){showToast("Ошибка загрузки");console.error(err);}
      e.target.value="";
    });
  });
}

function imgUploadField(label,bindPath,currentVal){
  return `<div class="field">
    <label>${esc(label)}</label>
    <input data-bind="${bindPath}" value="${esc(currentVal||"")}" placeholder="URL или загрузить →"/>
    <div style="display:flex;gap:8px;align-items:center;margin-top:6px">
      <label class="btn" style="cursor:pointer;font-size:10px;padding:8px 14px">📷 Загрузить файл<input type="file" accept="image/*" data-img-target="${bindPath}" style="display:none"/></label>
      ${currentVal?`<img src="${esc(currentVal)}" style="max-width:140px;max-height:90px;object-fit:cover;border-radius:6px;border:1px solid var(--line)"/>`:""}
    </div>
  </div>`;
}

let _lastEditPath=null;
function bindInputs(){
  document.querySelectorAll("[data-bind]").forEach(el=>{
    el.oninput=()=>{_lastEditPath=el.dataset.bind;const path=el.dataset.bind.split(".");let t=DATA;for(let i=0;i<path.length-1;i++){if(t[path[i]]===undefined)t[path[i]]={};t=t[path[i]];}t[path[path.length-1]]=el.value;saveData();render();};
  });
  document.querySelectorAll("[data-bind-list]").forEach(el=>{
    el.oninput=()=>{_lastEditPath=el.dataset.bindList;const path=el.dataset.bindList.split(".");let t=DATA;for(let i=0;i<path.length-1;i++){if(t[path[i]]===undefined)t[path[i]]={};t=t[path[i]];}t[path[path.length-1]]=el.value.split("\n").filter(x=>x.trim());saveData();};
  });
  document.querySelectorAll("[data-bind-bool]").forEach(el=>{
    el.onchange=()=>{_lastEditPath=el.dataset.bindBool;const path=el.dataset.bindBool.split(".");let t=DATA;for(let i=0;i<path.length-1;i++){if(t[path[i]]===undefined)t[path[i]]={};t=t[path[i]];}t[path[path.length-1]]=el.checked;saveData();render();};
  });
}

function computePreviewTarget(){
  const p=_lastEditPath;
  if(p){
    if(p.startsWith("projects.")){
      const idx=parseInt(p.split(".")[1]);
      const project=(DATA.projects||[])[idx];
      if(project)return{kind:"project",id:project.id};
    }
    if(p.startsWith("pricing."))return{kind:"scroll",sel:"#pricing"};
    if(p.startsWith("about."))return{kind:"route",hash:"#/about"};
    if(p.startsWith("site.heroPrefix")||p.startsWith("site.heroWords")||p.startsWith("site.heroTagline")||p.startsWith("site.name")||p.startsWith("site.introWords"))return{kind:"scroll",sel:"#hero"};
    if(p.startsWith("site.marqueeItems"))return{kind:"scroll",sel:".marquee-strip"};
    if(p.startsWith("site.studio")||p.startsWith("site.studioTag")||p.startsWith("site.studioText")||p.startsWith("site.studioStats"))return{kind:"scroll",sel:"#studio-strip"};
    if(p.startsWith("site.clientsLabel"))return{kind:"scroll",sel:".clients-section"};
    if(p.startsWith("site.email")||p.startsWith("site.telegram")||p.startsWith("site.phone")||p.startsWith("site.socials")||p.startsWith("site.footerCta"))return{kind:"scroll",sel:"#contact"};
  }
  // fallback by tab
  const map={projects:{kind:"scroll",sel:"#hero"},pricing:{kind:"scroll",sel:"#pricing"},contact:{kind:"scroll",sel:"#contact"},about:{kind:"route",hash:"#/about"},site:{kind:"scroll",sel:"#hero"}};
  return map[adminTab]||null;
}

function navigateToPreview(target){
  if(!target){window.scrollTo({top:0,behavior:"smooth"});return;}
  if(target.kind==="route"){
    if(location.hash!==target.hash){location.hash=target.hash;setTimeout(()=>window.scrollTo({top:0,behavior:"smooth"}),100);}
    showToast("📍 Страница «О нас»");
    return;
  }
  // ensure on home for #scroll targets
  if(location.hash.startsWith("#/about")){
    location.hash="#/";
    setTimeout(()=>navigateToPreview(target),250);return;
  }
  if(target.kind==="project"){
    const card=document.querySelector(`.dp-card[data-id="${target.id}"]`);
    if(card){
      card.scrollIntoView({behavior:"smooth",block:"center"});
      setTimeout(()=>{if(window.openModal)window.openModal(target.id,card);},650);
      showToast("📍 Открываю проект");
    }else{window.scrollTo({top:0,behavior:"smooth"});}
    return;
  }
  if(target.kind==="scroll"){
    const el=document.querySelector(target.sel);
    if(el){
      const top=el.getBoundingClientRect().top+window.scrollY-60;
      window.scrollTo({top,behavior:"smooth"});
      // мягкий highlight
      el.classList.add("preview-highlight");
      setTimeout(()=>el.classList.remove("preview-highlight"),1800);
      showToast("📍 Ваши изменения");
    }
  }
}

function showToast(msg){const t=document.getElementById("toast");if(!t)return;t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400);}

// EVENTS
document.addEventListener("click",e=>{
  // lang buttons
  const lb=e.target.closest("[data-lang]");
  if(lb){
    const lang=lb.dataset.lang;
    const intro=document.getElementById("intro");
    const isFromIntro=lb.closest("#intro");
    if(isFromIntro){
      // с интро — просто скрываем его
      applyLang(lang);
      if(intro){intro.classList.add("hide");setTimeout(()=>intro.style.display="none",1100);}
      document.body.classList.remove("locked");
      sessionStorage.setItem("frame.skipIntro","1");
    } else {
      // со страницы — плавный переход
      const mask=document.getElementById("mask");
      if(mask){
        mask.classList.add("in");
        setTimeout(()=>{
          applyLang(lang);
          mask.classList.remove("in");
          mask.classList.add("out");
          setTimeout(()=>mask.classList.remove("out"),550);
        },320);
      } else {
        applyLang(lang);
      }
    }
    return;
  }
  // category filter
  if(e.target.dataset.cat){
    currentCategory=e.target.dataset.cat;
    document.querySelectorAll("#filters button").forEach(b=>b.classList.toggle("on",b.dataset.cat===currentCategory));
    renderGrid();return;
  }
  // admin tabs
  if(e.target.closest("[data-ap]")){
    const btn=e.target.closest("[data-ap]");
    adminTab=btn.dataset.ap;editingProjectId=null;
    document.querySelectorAll("[data-ap]").forEach(b=>b.classList.toggle("active",b.dataset.ap===adminTab));
    renderAdmin();return;
  }
  // close modal — click OR pointerup для тач-устройств
  if(e.target.dataset.closeModal!==undefined||e.target.closest("[data-close-modal]")){e.preventDefault();closeModal();return;}
  // hero click → open modal
  if(e.target.closest(".hero")&&!e.target.closest("button")){
    const p=DATA.projects&&DATA.projects.find(x=>x.id===DATA.hero.featuredId)||DATA.projects&&DATA.projects[0];
    if(p)openModal(p.id);return;
  }
  // admin trigger
  if(e.target.id==="admin-trigger"){
    const lm=document.getElementById("login-modal");if(lm)lm.classList.add("show");return;
  }
  // forgot password recovery
  if(e.target.id==="forgot-pw-link"){
    e.preventDefault();
    recoverAdminPassword();
    return;
  }
  // login submit
  if(e.target.id==="admin-login-btn"){
    const lockUntil=parseInt(localStorage.getItem("frame_login_lock")||"0");
    if(Date.now()<lockUntil){
      const sec=Math.ceil((lockUntil-Date.now())/1000);
      showToast(`Заблокировано на ${sec}с`);return;
    }
    const pw=document.getElementById("admin-password");
    sha256(pw.value).then(h=>{
      if(h===DATA.site.adminPasswordHash){
        localStorage.removeItem("frame_login_attempts");
        localStorage.removeItem("frame_login_lock");
        const lm=document.getElementById("login-modal");if(lm)lm.classList.remove("show");
        if(DATA.site.adminPasswordHash===CORRECT_HASH){
          showToast("⚠ Поменяйте пароль (Сайт → Опасная зона)");
        }
        openAdmin();
      }else{
        const n=(parseInt(localStorage.getItem("frame_login_attempts")||"0"))+1;
        localStorage.setItem("frame_login_attempts",String(n));
        if(n>=3){
          localStorage.setItem("frame_login_lock",String(Date.now()+60000));
          localStorage.setItem("frame_login_attempts","0");
          showToast("Слишком много попыток. Блок 60с.");
        }else{
          showToast(`Неверный пароль (${n}/3)`);
        }
        if(pw)pw.value="";
      }
    });return;
  }
  // close admin
  if(e.target.id==="btn-close-admin"){closeAdminPanel();return;}
  // translate all
  if(e.target.id==="btn-translate-all"){translateAllOnTab();return;}
  // preview — открывает сайт на месте последнего изменения
  if(e.target.id==="btn-preview"){
    const target=computePreviewTarget();
    closeAdminPanel();
    setTimeout(()=>navigateToPreview(target),600);
    return;
  }
  // publish
  if(e.target.id==="btn-publish"){
    const blob=new Blob([JSON.stringify(DATA,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="data.json";a.click();
    showToast("data.json скачан");return;
  }
  // import
  if(e.target.id==="btn-import"){document.getElementById("import-file").click();return;}
  // burger
  if(e.target.closest("#burger")){
    const mm=document.getElementById("mobile-menu"),bg=document.getElementById("burger"),nav=document.getElementById("nav");
    mm.classList.toggle("open");bg.classList.toggle("active");nav.classList.toggle("menu-open");return;
  }
  // mobile menu links
  if(e.target.closest(".mobile-menu a")){
    const mm=document.getElementById("mobile-menu"),bg=document.getElementById("burger"),nav=document.getElementById("nav");
    mm.classList.remove("open");bg.classList.remove("active");nav.classList.remove("menu-open");
  }
});

// Smooth anchor scroll (with cross-route + same-hash support)
document.addEventListener("click",e=>{
  const a=e.target.closest('a[href^="#"]');if(!a)return;
  const href=a.getAttribute("href");
  if(href==="#")return;
  // hash-routes (#/, #/about) — handled by hashchange; добавим скролл если hash уже такой же
  if(href.startsWith("#/")){
    if(location.hash===href||(href==="#/"&&(!location.hash||location.hash==="#"))){
      e.preventDefault();
      // already on this route — just scroll to top of view
      if(document.body.dataset.route==="about"){
        const v=document.getElementById("view-about");
        if(v)v.scrollIntoView({behavior:"smooth",block:"start"});
      } else {
        window.scrollTo({top:0,behavior:"smooth"});
      }
    }
    return;
  }
  e.preventDefault();
  const goScroll=()=>{
    const target=document.querySelector(href);
    if(target)target.scrollIntoView({behavior:"smooth",block:"start"});
  };
  if(document.body.dataset.route==="about"){
    location.hash="#/";
    setTimeout(goScroll,150);
  } else {
    goScroll();
  }
});

document.getElementById("import-file")&&document.getElementById("import-file").addEventListener("change",e=>{
  const f=e.target.files[0];if(!f)return;
  if(f.size>5*1024*1024){showToast("Файл слишком большой (>5MB)");return;}
  const r=new FileReader();r.onload=ev=>{
    try{
      const parsed=JSON.parse(ev.target.result);
      const err=validateImport(parsed);
      if(err){showToast("Ошибка: "+err);return;}
      if(!confirm("Заменить все данные импортируемыми?"))return;
      DATA=parsed;saveData();render();renderAdmin();showToast("✅ Импортировано");
    }catch(err){showToast("Невалидный JSON");}
  };r.readAsText(f);
});

async function sha256(str){const buf=new TextEncoder().encode(str);const h=await crypto.subtle.digest("SHA-256",buf);return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,"0")).join("");}

// NAV scroll solid
window.addEventListener("scroll",()=>{
  applySolidNav();
  const sp=document.getElementById("scroll-progress");
  const btt=document.getElementById("back-to-top");
  const max=document.documentElement.scrollHeight-window.innerHeight;
  const pct=max>0?(window.scrollY/max)*100:0;
  if(sp)sp.style.width=pct+"%";
  if(btt)btt.classList.toggle("show",window.scrollY>window.innerHeight*0.6);
},{passive:true});

document.addEventListener("click",e=>{
  if(e.target.closest("#back-to-top")){window.scrollTo({top:0,behavior:"smooth"});}
});


// clock — обновляет ВСЕ элементы с data-clock (интро + навбар)
function tickClocks(){
  const clocks=document.querySelectorAll("[data-clock]");
  if(!clocks.length)return;
  const n=new Date();
  const time=[n.getHours(),n.getMinutes(),n.getSeconds()].map(x=>String(x).padStart(2,"0")).join(":");
  clocks.forEach(c=>{c.textContent=time;});
}
tickClocks();
setInterval(tickClocks,1000);

// reveal
const ro=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("in");}),{threshold:.15});
document.querySelectorAll(".reveal").forEach(el=>ro.observe(el));

// ──── PREMIUM CURSOR ────
(function(){
  const dot=document.querySelector(".cursor-dot"),ring=document.querySelector(".cursor-ring");
  if(!dot||!ring)return;
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener("mousemove",e=>{mx=e.clientX;my=e.clientY;dot.style.left=mx+"px";dot.style.top=my+"px";});
  (function loop(){rx+=(mx-rx)*.12;ry+=(my-ry)*.12;ring.style.left=rx+"px";ring.style.top=ry+"px";requestAnimationFrame(loop);})();
  document.addEventListener("mousedown",()=>{ring.style.transform="translate(-50%,-50%) scale(.85)";});
  document.addEventListener("mouseup",()=>{ring.style.transform="translate(-50%,-50%) scale(1)";});
  document.addEventListener("mouseover",e=>{
    const t=e.target;
    if(t.closest("a,button,.proj,.price-cta,.lang-btn")){dot.classList.add("hover");ring.classList.add("hover");}
    if(t.closest(".proj")){ring.classList.add("label");ring.textContent="View";}
    if(t.closest(".hero")){ring.classList.add("label");ring.textContent="Play";}
  });
  document.addEventListener("mouseout",e=>{
    const t=e.target;
    if(t.closest("a,button,.proj,.price-cta,.lang-btn,.hero")){dot.classList.remove("hover");ring.classList.remove("hover","label");ring.textContent="";}
  });
})();

// ──── AUTO DURATION FROM VIDEO URL ────
async function fetchDuration(url){
  if(!url)return "";
  try{
    // YouTube oEmbed
    if(url.includes("youtube.com")||url.includes("youtu.be")){
      let vid="";
      if(url.includes("v="))vid=url.split("v=")[1].split("&")[0];else vid=url.split("/").pop();
      // Use noembed.com for duration (no API key needed)
      const r=await fetch("https://noembed.com/embed?url=https://www.youtube.com/watch?v="+vid);
      const d=await r.json();
      if(d.title)return ""; // noembed doesn't provide duration; set placeholder
    }
    // Vimeo oEmbed
    if(url.includes("vimeo.com")){
      const vid=url.split("/").pop().split("?")[0];
      const r=await fetch("https://vimeo.com/api/v2/video/"+vid+".json");
      const d=await r.json();
      if(d[0]&&d[0].duration){
        const sec=d[0].duration;
        const m=Math.floor(sec/60),s=sec%60;
        return String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
      }
    }
  }catch(e){console.warn("Duration fetch error:",e);}
  return "";
}
window.fetchAndSetDuration=async function(idx){
  const url=DATA.projects[idx]&&DATA.projects[idx].videoUrl;
  if(!url){showToast("Сначала введите URL видео");return;}
  showToast("🔄 Получаю длительность...");
  const dur=await fetchDuration(url);
  if(dur){DATA.projects[idx].runtime=dur;saveData();render();renderAdmin();render();showToast("✅ "+dur);}
  else{showToast("Не удалось определить (введите вручную)");}
};

// INIT
const CORRECT_HASH="8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";
(async function(){
  DATA=await loadData();
  // migrate old plain-text password
  if(DATA.site&&DATA.site.adminPassword&&!DATA.site.adminPasswordHash){
    DATA.site.adminPasswordHash=await sha256(DATA.site.adminPassword);
    delete DATA.site.adminPassword;
    saveData();
  }
  // set default hash if missing or stale (from old build)
  if(!DATA.site||!DATA.site.adminPasswordHash){
    if(!DATA.site)DATA.site={};
    DATA.site.adminPasswordHash=CORRECT_HASH;
    saveData();
  }
  applyLang(currentLang);
  applyEnabledLangs();
  route();
  // если включён только один язык — пропускаем интро автоматически
  const enabled=getEnabledLangs();
  if(enabled.length<=1){
    currentLang=enabled[0]||"en";
    localStorage.setItem("frame_lang",currentLang);
    sessionStorage.setItem("frame.skipIntro","1");
    const i=document.getElementById("intro");if(i)i.style.display="none";
    document.body.classList.remove("locked");
    applyLang(currentLang);
  } else if(sessionStorage.getItem("frame.skipIntro")==="1"){
    const i=document.getElementById("intro");if(i)i.style.display="none";document.body.classList.remove("locked");
  }
  // mark page ready — fades in views and hides boot loader
  requestAnimationFrame(()=>{
    document.body.classList.add("data-ready");
    setTimeout(()=>{const bl=document.getElementById("boot-loader");if(bl)bl.remove();},600);
  });
})();
