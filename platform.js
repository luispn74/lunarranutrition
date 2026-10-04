/* lunarranutrition · plataforma: acceso entrenador/dietista y cliente */
(function(){
"use strict";
const {$,$$,esc,toast,copy,openModal,closeModal,store} = window.LN_UTIL;
const L = window.LN, C = window.LN_CONFIG, EX = window.LN_EXERCISES, INJ = window.LN_INJURIES, SUP = window.LN_SUPPS;
const fmt = (n,d=0)=> (n==null||isNaN(n)) ? "—" : Number(n).toLocaleString("es-ES",{minimumFractionDigits:d,maximumFractionDigits:d});
const today = ()=> new Date().toISOString().slice(0,10);
const daysAgo = n=>{const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10);};
const fdate = s=> s ? s.split("-").reverse().join("/") : "—";
const OBJ = Object.fromEntries(Object.entries(L.GOALS).map(([k,v])=>[k,v.name]));
const PROG = {nutricion:"Nutrición", entrenamiento:"Entrenamiento", completo:"Nutrición + Entrenamiento"};
const PRICE = {nutricion:99, entrenamiento:99, completo:149};
const DIETA = {omnivoro:"Omnívora", pescetariano:"Pescetariana", vegetariano:"Vegetariana", vegano:"Vegana"};
const hasNutri = c=> c.programa!=="entrenamiento";
const hasTrain = c=> c.programa!=="nutricion";

/* ================= Estado ================= */
const KEY = "ln_state_v1";
let S = load();
let session = null;
try{ session = JSON.parse(sessionStorage.getItem("ln_session")||"null"); }catch(e){}
let view = "dashboard", cid = null, tab = "resumen", toolId = null, week = 1, day = 0, recipeFilter = {q:"",cat:"",dieta:"",sg:false,sl:false,sf:false,scale:"",open:null};
const scratch = {id:"scratch",nombre:"Cálculo rápido",sexo:"h",edad:30,altura:175,peso:75,grasa:0,actividad:1.55,objetivo:"mantenimiento",comidas:4,dieta:"omnivoro",restr:{},disciplina:"gimnasio",nivel:"intermedio",dias:4,semanas:6,hyroxCat:"open",rm:{},programa:"completo"};

function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
function load(){ try{ const s=JSON.parse(localStorage.getItem(KEY)); if(s&&Array.isArray(s.clients)) return s; }catch(e){} return seed(); }
function setSession(s){ session=s; try{ sessionStorage.setItem("ln_session", JSON.stringify(s)); }catch(e){} }
const client = id => S.clients.find(c=>c.id===id);
function code(){ return "LN-"+Math.floor(1000+Math.random()*9000); }

function makeClient(o){
  return Object.assign({id:"c"+Date.now().toString(36)+Math.floor(Math.random()*99), ejemplo:false, nombre:"", email:"", telefono:"", codigo:code(), sexo:"h", edad:30, altura:175, peso:75, grasa:0,
    actividad:1.55, objetivo:"perdida", disciplina:"gimnasio", nivel:"intermedio", dias:4, semanas:6, comidas:4, dieta:"omnivoro", restr:{}, hyroxCat:"open", rm:{},
    programa:"completo", pago:{metodo:"tarjeta", estado:"pendiente", fecha:today()}, alta:today(), alergias:"", patologias:"", notas:"",
    bio:{hist:[]}, evol:[], checkins:[], nutri:null, train:null, trainLog:{}, lesion:null, supps:[]}, o);
}
function genNutri(c, seed){
  const t = L.calcNutrition(c);
  return {targets:{kcal:t.kcal,p:t.p,c:t.c,f:t.f,fib:t.fib}, plan:L.buildMealPlan(t, +c.comidas, {dieta:c.dieta, ...c.restr}, seed||c.id), date:today()};
}
function genTrain(c){ return L.genTraining({disciplina:c.disciplina, nivel:c.nivel, dias:c.dias, semanas:c.semanas, sexo:c.sexo, hyroxCat:c.hyroxCat, rm:c.rm}); }

function seed(){
  const ev=(arr)=>arr.map((r,i)=>({fecha:daysAgo((arr.length-1-i)*14), peso:r[0], grasa:r[1], cintura:r[2], cadera:r[3], brazo:r[4], muslo:r[5]}));
  const marta = makeClient({id:"c1",ejemplo:true,nombre:"Marta Gómez",email:"marta@ejemplo.com",telefono:"600 000 001",codigo:"LN-4821",sexo:"m",edad:34,altura:165,peso:78,grasa:34,actividad:1.55,objetivo:"perdida",disciplina:"gimnasio",nivel:"principiante",dias:4,semanas:6,comidas:4,restr:{sl:true},programa:"completo",
    pago:{metodo:"bizum",estado:"pagado",fecha:daysAgo(4)},alta:daysAgo(112),patologias:"Hipotiroidismo tratado y controlado por su médico.",alergias:"Intolerancia a la lactosa",
    bio:{dorsi_d:9,dorsi_i:6,slr_d:70,slr_i:72,rih_d:32,rih_i:30,reh_d:85,reh_i:88,ohs:1,hinge:2,stepdown:"valgo_i",postura:"Ligera anteversión pélvica.",lesiones:"Esguince de tobillo izquierdo en 2019, sin secuelas funcionales.",dolor_zona:"",dolor_eva:0,
      hist:[{fecha:daysAgo(112),nota:"Valoración inicial. Dorsiflexión izquierda limitada (6 cm) y valgo dinámico izquierdo en step-down."},{fecha:daysAgo(56),nota:"Mejora de dorsiflexión izquierda de 4 a 6 cm tras movilidad diaria."}]},
    evol:ev([[86.5,39,98,112,33,62],[85,38.3,96.5,111,33,61.5],[83.6,37.6,95,110,32.5,61],[82.4,36.8,94,109,32,60],[81.1,36,92.5,108,32,59.5],[80.2,35.4,91.5,107,31.5,59],[79.1,34.6,90,106.5,31.5,58.5],[78,34,89,106,31,58]]),
    checkins:[{fecha:daysAgo(13),peso:78.6,adh_d:90,adh_e:100,sueno:7,energia:4,estres:3,notas:"Bien, algo de hambre por la tarde.",rev:true},{fecha:daysAgo(6),peso:78.2,adh_d:85,adh_e:75,sueno:6.5,energia:3,estres:4,notas:"Semana de mucho trabajo, falté un entreno.",rev:true},{fecha:daysAgo(1),peso:78,adh_d:95,adh_e:100,sueno:7.5,energia:4,estres:2,notas:"Muy bien, más fuerza en sentadilla.",rev:false}],
    supps:["creatina","proteina","vitd"]});
  const javier = makeClient({id:"c2",ejemplo:true,nombre:"Javier Ruiz",email:"javier@ejemplo.com",telefono:"600 000 002",codigo:"LN-7305",sexo:"h",edad:29,altura:180,peso:84,grasa:15,actividad:1.725,objetivo:"rendimiento",disciplina:"hyrox",nivel:"intermedio",dias:5,semanas:8,comidas:5,programa:"completo",hyroxCat:"open",
    pago:{metodo:"tarjeta",estado:"pagado",fecha:daysAgo(9)},alta:daysAgo(70),
    bio:{dorsi_d:12,dorsi_i:11,slr_d:78,slr_i:80,rih_d:38,rih_i:36,reh_d:92,reh_i:90,ohs:2,hinge:3,stepdown:"correcto",postura:"",lesiones:"Tendinopatía aquílea derecha en fase de readaptación.",dolor_zona:"Tendón de Aquiles derecho",dolor_eva:3,hist:[{fecha:daysAgo(30),nota:"Dolor aquíleo derecho tras aumentar el volumen de carrera. Inicio protocolo HSR."}]},
    evol:ev([[85.2,17,84,98,36,60],[84.9,16.5,83.5,98,36,60],[84.6,16,83,97.5,36.5,60.5],[84.3,15.6,82.5,97.5,36.5,60.5],[84.2,15.3,82,97,37,61],[84,15,82,97,37,61]]),
    checkins:[{fecha:daysAgo(7),peso:84.1,adh_d:90,adh_e:95,sueno:7,energia:4,estres:2,notas:"Aquiles 3/10 por la mañana, mejor que la semana pasada.",rev:true},{fecha:daysAgo(0),peso:84,adh_d:85,adh_e:90,sueno:7.5,energia:5,estres:2,notas:"Primera semana con intervalos completos sin dolor.",rev:false}],
    lesion:{id:"aquilea",fase:1}, supps:["creatina","cafeina","betaalanina","carbs","electrolitos"]});
  const sara = makeClient({id:"c3",ejemplo:true,nombre:"Sara López",email:"sara@ejemplo.com",telefono:"600 000 003",codigo:"LN-2194",sexo:"m",edad:41,altura:160,peso:62,grasa:27,actividad:1.55,objetivo:"recomposicion",disciplina:"crossfit",nivel:"intermedio",dias:3,semanas:6,comidas:4,programa:"entrenamiento",
    pago:{metodo:"transferencia",estado:"pendiente",fecha:daysAgo(2)},alta:daysAgo(2),
    bio:{dorsi_d:10,dorsi_i:10,slr_d:75,slr_i:74,rih_d:35,rih_i:35,reh_d:80,reh_i:70,ohs:2,hinge:2,stepdown:"correcto",postura:"",lesiones:"Molestia en tendón rotuliano izquierdo con saltos.",dolor_zona:"Rodilla izquierda",dolor_eva:4,hist:[{fecha:daysAgo(2),nota:"Valoración inicial. Rotación externa de hombro izquierdo reducida (70°)."}]},
    evol:ev([[62,27,74,96,28,55]]), lesion:{id:"rotuliana",fase:0}, supps:["creatina","proteina"]});
  const daniel = makeClient({id:"c4",ejemplo:true,nombre:"Daniel Ortega",email:"daniel@ejemplo.com",telefono:"600 000 004",codigo:"LN-6640",sexo:"h",edad:36,altura:175,peso:92,grasa:24,actividad:1.55,objetivo:"recomposicion",disciplina:"powerlifting",nivel:"avanzado",dias:4,semanas:8,comidas:4,programa:"completo",rm:{sq:170,bp:120,dl:210},
    pago:{metodo:"tarjeta",estado:"pagado",fecha:daysAgo(20)},alta:daysAgo(48),
    bio:{dorsi_d:8,dorsi_i:8,slr_d:65,slr_i:66,rih_d:28,rih_i:30,reh_d:84,reh_i:86,ohs:1,hinge:3,stepdown:"correcto",postura:"Hipercifosis torácica leve.",lesiones:"Lumbalgia inespecífica hace 2 años.",dolor_zona:"",dolor_eva:0,hist:[]},
    evol:ev([[95,26,101,106,40,64],[94.1,25.4,100,105.5,40,64],[93.2,24.8,99,105,40.5,64.5],[92,24,98,105,40.5,64.5]]),
    checkins:[{fecha:daysAgo(3),peso:92,adh_d:80,adh_e:100,sueno:6.5,energia:4,estres:3,notas:"Sentadilla 150x4 a RPE 8.",rev:true}], supps:["creatina","cafeina","proteina","omega3"]});
  const s = {clients:[marta,javier,sara,daniel], v:1};
  s.clients.forEach(c=>{ if(hasNutri(c)) c.nutri=genNutri(c); if(hasTrain(c)) c.train=genTrain(c); });
  marta.trainLog={w1d0:daysAgo(30),w1d1:daysAgo(29),w1d2:daysAgo(27),w1d3:daysAgo(26)};
  return s;
}

/* ================= Navegación ================= */
const COACH_NAV = [
  ["Gestión",[["dashboard","Panel"],["clientes","Clientes"],["pagos","Pagos"]]],
  ["Nutrición",[["nutricion","Calculadora y planes"],["recetas","Recetas"]]],
  ["Entrenamiento",[["entrenamiento","Generador de programas"],["ejercicios","Ejercicios"],["lesiones","Lesiones"]]],
  ["Más",[["suplementos","Suplementación"],["informes","Informes PDF"]]]
];
function clientNav(c){
  const items=[["inicio","Mi resumen"]];
  if(hasNutri(c)) items.push(["dieta","Mi dieta"],["recetas","Recetas"]);
  if(hasTrain(c)) items.push(["entreno","Mi entrenamiento"]);
  items.push(["evolucion","Evolución y check-in"]);
  if(c.lesion) items.push(["lesion","Mi readaptación"]);
  if(c.supps&&c.supps.length) items.push(["suplementos","Suplementación"]);
  items.push(["informe","Descargar informe"],["contacto","Contacto"]);
  return [["Mi portal",items]];
}
const me = ()=> session && session.role==="client" ? client(session.id) : null;

function openLogin(){
  $("#site").hidden=true; const root=$("#appRoot"); root.hidden=false; window.scrollTo(0,0);
  if(session && (session.role==="coach" || me())){ renderApp(); return; }
  let role="client";
  root.innerHTML = `<div class="login">
    <div class="art"><span class="logo logo-full" style="width:min(380px,80%)"></span></div>
    <div class="formside"><div class="card">
      <p class="eyebrow">Área privada</p><h1 style="font-size:2.6rem">Acceso</h1>
      <div class="seg" role="group" aria-label="Tipo de acceso"><button type="button" data-role="client" aria-pressed="true">Cliente</button><button type="button" data-role="coach" aria-pressed="false">Entrenador / dietista</button></div>
      <form class="form" id="loginForm" novalidate>
        <label class="f">Email<input id="lg_email" type="email" autocomplete="username"></label>
        <label class="f"><span id="lg_lbl">Código de acceso</span><input id="lg_pass" type="password" autocomplete="current-password"></label>
        <p id="lg_err" class="note warn" hidden></p>
        <button class="btn btn-primary" type="submit">Entrar</button>
      </form>
      <div class="demo"><b style="color:var(--ink)">Modo demostración</b><span>Los clientes de ejemplo y los datos se guardan solo en este navegador.</span>
        <div class="row"><button class="btn btn-sm" data-demo="coach">Entrar como entrenador</button><button class="btn btn-sm" data-demo="client">Entrar como cliente</button></div>
        <span>Entrenador: ${C.email} · contraseña <code class="mono">lunarra</code><br>Cliente: marta@ejemplo.com · código <code class="mono">LN-4821</code></span></div>
      <button class="btn-link muted" data-act="site" style="justify-self:start">Volver a la web</button>
    </div></div></div>`;
  $$("[data-role]",root).forEach(b=>b.addEventListener("click",()=>{role=b.dataset.role;$$("[data-role]",root).forEach(x=>x.setAttribute("aria-pressed",x===b));$("#lg_lbl").textContent=role==="coach"?"Contraseña":"Código de acceso";}));
  $("#loginForm").addEventListener("submit",e=>{
    e.preventDefault();
    const em=$("#lg_email").value.trim().toLowerCase(), pw=$("#lg_pass").value.trim(), err=$("#lg_err");
    if(role==="coach"){
      if(em===C.email && pw===(S.coachPass||"lunarra")){ setSession({role:"coach"}); view="dashboard"; renderApp(); }
      else { err.hidden=false; err.textContent="Email o contraseña incorrectos."; }
    } else {
      const c=S.clients.find(x=>x.email.toLowerCase()===em && x.codigo.toUpperCase()===pw.toUpperCase());
      if(c){ setSession({role:"client",id:c.id}); view="inicio"; renderApp(); }
      else { err.hidden=false; err.textContent="No encontramos ese email con ese código. Tu código de acceso está en el email de bienvenida; si no lo tienes, escribe a "+C.email+"."; }
    }
  });
  $$("[data-demo]",root).forEach(b=>b.addEventListener("click",()=>{
    if(b.dataset.demo==="coach"){ setSession({role:"coach"}); view="dashboard"; } else { setSession({role:"client",id:(S.clients[0]||{}).id}); view="inicio"; }
    renderApp();
  }));
}
function backToSite(){ $("#appRoot").hidden=true; $("#appRoot").innerHTML=""; $("#site").hidden=false; window.scrollTo(0,0); }
function logout(){ setSession(null); try{sessionStorage.removeItem("ln_session");}catch(e){} backToSite(); toast("Sesión cerrada"); }

function renderApp(){
  const root=$("#appRoot"); $("#site").hidden=true; root.hidden=false;
  const isCoach = session.role==="coach", c = me();
  if(!isCoach && !c){ logout(); return; }
  const nav = isCoach ? COACH_NAV : clientNav(c);
  const flat = nav.flatMap(g=>g[1]);
  if(!flat.some(x=>x[0]===view) && view!=="ficha") view = flat[0][0];
  const cur = view==="ficha" ? "clientes" : view;
  root.innerHTML = `
    <div class="mobile-nav"><span class="logo logo-mark" style="width:30px;flex:none"></span>
      <select id="mnav" aria-label="Sección">${flat.map(([k,l])=>`<option value="${k}"${k===cur?" selected":""}>${l}</option>`).join("")}</select>
      <button class="btn btn-sm" data-act="logout">Salir</button></div>
    <div class="app">
      <aside class="side">
        <div class="brand"><span class="logo logo-mark"></span><b>lunarranutrition</b></div>
        <nav class="snav">${nav.map(([g,items])=>`<div class="grp">${g}</div>`+items.map(([k,l])=>`<button data-nav="${k}"${k===cur?' aria-current="page"':""}>${l}</button>`).join("")).join("")}</nav>
        <div class="who-am" style="margin-top:auto">
          <span>${isCoach?"Entrenador / dietista":"Cliente"}</span>
          <b style="color:var(--ink)">${esc(isCoach?C.titular:c.nombre)}</b>
          <div class="row"><button class="btn btn-sm" data-act="site">Ver web</button><button class="btn btn-sm" data-act="logout">Salir</button></div>
        </div>
      </aside>
      <main class="main" id="main"></main>
    </div>`;
  $("#mnav").addEventListener("change",e=>go(e.target.value));
  renderView();
}
function go(v,opts){ view=v; if(opts){ if(opts.cid) cid=opts.cid; if(opts.tab) tab=opts.tab; } week=1; day=0; renderApp(); window.scrollTo(0,0); }

function renderView(){
  const main=$("#main"); if(!main) return;
  const fn = VIEWS[view] || VIEWS.dashboard;
  main.innerHTML = fn();
  const b = BINDS[view]; if(b) b(main);
}
function head(title, sub, actions){ return `<div class="topbar"><div><p class="eyebrow">${sub||""}</p><h1>${title}</h1></div>${actions?`<div class="row">${actions}</div>`:""}</div>`; }

/* Objetivo de edición: cliente de la ficha, cliente elegido en una herramienta o cálculo rápido */
function target(){
  if(session.role==="client") return me();
  if(view==="ficha") return client(cid);
  if(toolId==="scratch") return scratch;
  return client(toolId) || S.clients[0] || scratch;
}
function picker(){
  const t=target();
  return `<label class="f" style="min-width:min(320px,100%)">Cliente<select id="toolPick">${S.clients.map(c=>`<option value="${c.id}"${t&&t.id===c.id?" selected":""}>${esc(c.nombre)}${c.ejemplo?" (ejemplo)":""}</option>`).join("")}<option value="scratch"${t===scratch?" selected":""}>Cálculo rápido sin cliente</option></select></label>`;
}

/* ================= Campos editables ================= */
function getPath(o,p){ return p.split(".").reduce((a,k)=>a==null?a:a[k],o); }
function setPath(o,p,v){ const ks=p.split("."); let x=o; ks.slice(0,-1).forEach(k=>{ if(x[k]==null||typeof x[k]!=="object") x[k]={}; x=x[k]; }); x[ks[ks.length-1]]=v; }
function fIn(o,p,label,type="text",attrs=""){
  const v=getPath(o,p); const ro=session.role==="client";
  if(type==="area") return `<label class="f">${label}<textarea data-f="${p}"${ro?" readonly":""}>${esc(v||"")}</textarea></label>`;
  return `<label class="f">${label}<input data-f="${p}" ${type==="number"?'type="number" inputmode="decimal" step="any" data-t="num"':'type="'+type+'"'} value="${esc(v==null?"":v)}" ${attrs}${ro?" readonly":""}></label>`;
}
function fSel(o,p,label,opts,num){
  const v=getPath(o,p); const ro=session.role==="client";
  return `<label class="f">${label}<select data-f="${p}"${num?' data-t="num"':""}${ro?" disabled":""}>${opts.map(([k,l])=>`<option value="${k}"${String(v)===String(k)?" selected":""}>${l}</option>`).join("")}</select></label>`;
}
function fChk(o,p,label){ const ro=session.role==="client"; return `<label class="check"><input type="checkbox" data-f="${p}" data-t="bool"${getPath(o,p)?" checked":""}${ro?" disabled":""}> <span>${label}</span></label>`; }
function onFieldChange(e){
  const el=e.target.closest("[data-f]"); if(!el || session.role==="client") return;
  const t=target(); if(!t) return;
  let v = el.dataset.t==="bool" ? el.checked : el.dataset.t==="num" ? (el.value===""?null:parseFloat(el.value)) : el.value;
  setPath(t, el.dataset.f, v);
  if(t!==scratch) save();
  if(el.dataset.rerender!=="no") renderView();
}

/* ================= Gráfica de evolución ================= */
function lineChart(pts, unit, label){
  pts = pts.filter(p=>p.y!=null && !isNaN(p.y));
  if(pts.length<2) return `<div class="empty">Añade al menos dos mediciones para ver la gráfica de ${label.toLowerCase()}.</div>`;
  const W=560,H=200,pl=44,pr=16,pt=16,pb=28;
  let mn=Math.min(...pts.map(p=>p.y)), mx=Math.max(...pts.map(p=>p.y));
  const pad=Math.max((mx-mn)*0.15,0.5); mn-=pad; mx+=pad;
  const step=niceStep((mx-mn)/4); mn=Math.floor(mn/step)*step; mx=Math.ceil(mx/step)*step;
  const x=i=>pl+i*(W-pl-pr)/(pts.length-1), y=v=>pt+(mx-v)*(H-pt-pb)/(mx-mn);
  let grid=""; for(let v=mn; v<=mx+1e-9; v+=step){ grid+=`<line x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pl-8}" y="${y(v)+3}" text-anchor="end">${fmt(v,step<1?1:0)}</text>`; }
  const line=pts.map((p,i)=>`${x(i)},${y(p.y)}`).join(" ");
  const area=`M${x(0)},${y(pts[0].y)} `+pts.map((p,i)=>`L${x(i)},${y(p.y)}`).join(" ")+` L${x(pts.length-1)},${H-pb} L${x(0)},${H-pb} Z`;
  const idx=[0,Math.floor((pts.length-1)/2),pts.length-1].filter((v,i,a)=>a.indexOf(v)===i);
  const xl=idx.map(i=>`<text x="${x(i)}" y="${H-8}" text-anchor="${i===0?"start":i===pts.length-1?"end":"middle"}">${fdate(pts[i].x).slice(0,5)}</text>`).join("");
  const last=pts[pts.length-1], first=pts[0], diff=last.y-first.y;
  return `<div class="chart"><div class="row between" style="margin-bottom:6px"><span class="eyebrow">${label}</span><span class="mono" style="font-size:.85rem">${fmt(last.y,1)} ${unit} <span class="muted">(${diff>0?"+":""}${fmt(diff,1)})</span></span></div>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}: de ${fmt(first.y,1)} a ${fmt(last.y,1)} ${unit}">${grid}<path d="${area}" fill="var(--chart)" opacity=".1"/><polyline points="${line}" fill="none" stroke="var(--chart)" stroke-width="2"/>
    ${pts.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.y)}" r="${i===pts.length-1?4.5:2.5}" fill="${i===pts.length-1?"var(--chart)":"var(--surface)"}" stroke="var(--chart)" stroke-width="1.5"><title>${fdate(p.x)}: ${fmt(p.y,1)} ${unit}</title></circle>`).join("")}${xl}</svg></div>`;
}
function niceStep(r){ const p=Math.pow(10,Math.floor(Math.log10(r||1))); const n=r/p; return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p; }

/* ================= Componentes de nutrición ================= */
function mifflinCard(c){
  const n=L.calcNutrition(c);
  const sx = c.sexo==="h" ? "+ 5" : "− 161";
  return `<div class="panel">
    <h3>Mifflin-St Jeor · ${c.sexo==="h"?"hombre":"mujer"}</h3>
    <p class="mono" style="font-size:.8rem;color:var(--muted);overflow-wrap:anywhere">TMB = 10 × ${fmt(c.peso,1)} + 6,25 × ${fmt(c.altura)} − 5 × ${fmt(c.edad)} ${sx} = <b style="color:var(--ink)">${fmt(n.bmr)} kcal</b></p>
    <div class="statgrid">
      <div class="stat"><span class="l">Metabolismo basal</span><span class="v">${fmt(n.bmr)}</span></div>
      <div class="stat"><span class="l">Gasto total (×${String(c.actividad).replace(".",",")})</span><span class="v">${fmt(n.tdee)}</span></div>
      <div class="stat"><span class="l">Objetivo diario</span><span class="v" style="color:var(--accent)">${fmt(n.kcal)} kcal</span></div>
      <div class="stat"><span class="l">Ajuste</span><span class="v">${n.goal.adj>0?"+":""}${Math.round(n.goal.adj*100)} %</span></div>
    </div>
    <p class="note">${n.goal.txt}</p>
    <div class="tbl-wrap"><table class="t"><thead><tr><th>Macro</th><th class="n">g/día</th><th class="n">g/kg ref.</th><th class="n">% kcal</th></tr></thead><tbody>
      <tr><td>Proteína</td><td class="n">${n.p}</td><td class="n">${fmt(n.p/n.refW,1)}</td><td class="n">${n.pct.p} %</td></tr>
      <tr><td>Hidratos de carbono</td><td class="n">${n.c}</td><td class="n">${fmt(n.c/n.refW,1)}</td><td class="n">${n.pct.c} %</td></tr>
      <tr><td>Grasas</td><td class="n">${n.f}</td><td class="n">${fmt(n.f/n.refW,1)}</td><td class="n">${n.pct.f} %</td></tr>
      <tr><td>Fibra</td><td class="n">${n.fib}</td><td class="n">—</td><td class="n">—</td></tr>
    </tbody></table></div>
    <div class="macro-bar" aria-hidden="true"><i class="mP" style="width:${n.pct.p}%"></i><i class="mC" style="width:${n.pct.c}%"></i><i class="mF" style="width:${n.pct.f}%"></i></div>
    <div class="legend"><span><i class="mP"></i>Proteína</span><span><i class="mC"></i>Hidratos</span><span><i class="mF"></i>Grasas</span><span>Agua: ${fmt(n.agua,1)} L + 0,5-0,75 L por hora de entreno</span></div>
    <div class="statgrid">
      <div class="stat"><span class="l">IMC</span><span class="v">${fmt(n.imc,1)}</span></div>
      <div class="stat"><span class="l">Peso de referencia</span><span class="v">${fmt(n.refW,1)} kg</span></div>
      ${n.katch?`<div class="stat"><span class="l">Katch-McArdle</span><span class="v">${fmt(n.katch)}</span></div><div class="stat"><span class="l">Disp. energética</span><span class="v">${fmt(n.ea)} <small class="muted">kcal/kg MLG</small></span></div>`:""}
    </div>
    ${n.refW!==c.peso?`<p class="note">IMC superior a 25: la proteína y la grasa se calculan sobre el peso ajustado (peso con IMC 25 + 40 % del exceso) para no sobrestimarlas.</p>`:""}
    <p class="note">${c.sexo==="m"?"Mujer: grasa mínima de 0,8-0,9 g/kg para la salud hormonal y mínimo de seguridad de 1200 kcal. Vigilar hierro, calcio y ciclo menstrual.":"Hombre: grasa mínima de 0,8 g/kg y mínimo de seguridad de 1500 kcal."}</p>
    ${n.warnings.map(w=>`<p class="note warn">${w}</p>`).join("")}
  </div>`;
}
function nutriParams(c){
  return `<div class="panel"><h3>Datos para el cálculo</h3>
    <div class="grid3">
      ${fSel(c,"sexo","Sexo",[["h","Hombre"],["m","Mujer"]])}
      ${fIn(c,"edad","Edad (años)","number")}
      ${fIn(c,"altura","Altura (cm)","number")}
      ${fIn(c,"peso","Peso (kg)","number")}
      ${fIn(c,"grasa","% grasa (opcional)","number")}
      ${fSel(c,"comidas","Comidas al día",[[3,"3 comidas"],[4,"4 comidas"],[5,"5 comidas"]],true)}
    </div>
    ${fSel(c,"actividad","Nivel de actividad",L.ACT.map(([v,l])=>[v,l+" (×"+String(v).replace(".",",")+")"]),true)}
    <div class="grid2">${fSel(c,"objetivo","Objetivo",Object.entries(OBJ))}${fSel(c,"dieta","Tipo de dieta",Object.entries(DIETA))}</div>
    <div class="row">${fChk(c,"restr.sg","Sin gluten")}${fChk(c,"restr.sl","Sin lactosa")}${fChk(c,"restr.sf","Sin frutos secos")}${fChk(c,"restr.ss","Sin soja")}</div>
  </div>`;
}
function mealPlanView(c, opts){
  opts=opts||{};
  if(!c.nutri) return `<div class="empty"><p>Todavía no hay plan semanal${session.role==="client"?". Lo verás aquí en cuanto esté listo.":"."}</p>${session.role==="coach"?'<button class="btn btn-primary btn-sm" data-act="genNutri">Generar plan semanal</button>':""}</div>`;
  const {plan,targets}=c.nutri; const d=plan.days[day]||plan.days[0];
  const dev=(v,t)=>{const p=(v-t)/t*100;return `<span class="${Math.abs(p)>10?"sym":"muted"}">${p>0?"+":""}${fmt(p)} %</span>`;};
  return `<div class="stack">
    <div class="row between"><div class="days" role="group" aria-label="Día">${plan.days.map((x,i)=>`<button data-day="${i}" aria-pressed="${i===day}">${x.day.slice(0,3)}</button>`).join("")}</div>
      <span class="muted" style="font-size:.82rem">${plan.n} comidas · ${plan.unique} recetas distintas · generado el ${fdate(c.nutri.date)}</span></div>
    <div class="kpis">
      <div class="kpi"><span class="l">Energía</span><span class="v">${fmt(d.tot.kcal)}</span><span class="s">objetivo ${fmt(targets.kcal)} · ${dev(d.tot.kcal,targets.kcal)}</span></div>
      <div class="kpi"><span class="l">Proteína</span><span class="v">${fmt(d.tot.p)} g</span><span class="s">objetivo ${targets.p} g · ${dev(d.tot.p,targets.p)}</span></div>
      <div class="kpi"><span class="l">Hidratos</span><span class="v">${fmt(d.tot.c)} g</span><span class="s">objetivo ${targets.c} g · ${dev(d.tot.c,targets.c)}</span></div>
      <div class="kpi"><span class="l">Grasas</span><span class="v">${fmt(d.tot.f)} g</span><span class="s">objetivo ${targets.f} g · ${dev(d.tot.f,targets.f)}</span></div>
    </div>
    ${microRow(d.tot,"Micronutrientes del día (% de la ingesta de referencia)")}
    <div class="cols">${d.meals.map(m=>mealCard(m)).join("")}</div>
    <details><summary>Lista de la compra de la semana</summary><div class="ans">${shoppingList(plan)}</div></details>
  </div>`;
}
function mealCard(m){
  const r=L.RECIPES.find(x=>x.id===m.recipe);
  return `<div class="meal"><div class="mh"><span class="eyebrow">${m.label}</span><span class="mono" style="font-size:.78rem">${fmt(m.tot.kcal)} kcal · P ${fmt(m.tot.p)} · H ${fmt(m.tot.c)} · G ${fmt(m.tot.f)}</span></div>
    <b>${esc(r.name)}</b>
    <ul>${m.ings.filter(i=>i.key!=="especias").map(i=>`<li>${fmt(i.g)} g ${esc(L.food(i.key).name.toLowerCase())}${L.unitHint(i.key,i.g)}</li>`).join("")}${m.ings.some(i=>i.key==="especias")?"<li>Especias y hierbas al gusto</li>":""}</ul>
    <details><summary style="font-size:.82rem;font-weight:500">Preparación</summary><p class="muted" style="font-size:.85rem;padding-top:6px">${esc(r.method)}</p></details>
    <div>${r.tags.map(t=>`<span class="chip">${t}</span>`).join("")}</div></div>`;
}
function microRow(t,title){
  const V=window.LN_VRN, it=[["Fibra","fib","g"],["Calcio","ca","mg"],["Hierro","fe","mg"],["Magnesio","mg","mg"],["Potasio","k","mg"],["Vitamina C","vc","mg"]];
  return `<div class="panel"><h3>${title}</h3><div class="statgrid">${it.map(([l,k,u])=>`<div class="stat"><span class="l">${l}</span><span class="v">${fmt(t[k]/V[k]*100)} %</span><span class="muted" style="font-size:.75rem">${fmt(t[k],k==="fe"?1:0)} ${u}</span></div>`).join("")}</div></div>`;
}
function shoppingList(plan){
  const tot={}; plan.days.forEach(d=>d.meals.forEach(m=>m.ings.forEach(i=>{ if(i.key!=="especias") tot[i.key]=(tot[i.key]||0)+i.g; })));
  const rows=Object.entries(tot).sort((a,b)=>b[1]-a[1]);
  return `<div class="tbl-wrap"><table class="t"><thead><tr><th>Alimento</th><th class="n">Total semana</th></tr></thead><tbody>${rows.map(([k,g])=>`<tr><td>${esc(L.food(k).name)}</td><td class="n">${g>=1000?fmt(g/1000,2)+" kg":fmt(g)+" g"}</td></tr>`).join("")}</tbody></table></div>`;
}

/* ================= Componentes de entrenamiento ================= */
function trainParams(c){
  return `<div class="panel"><h3>Parámetros del programa</h3>
    <div class="grid3">
      ${fSel(c,"disciplina","Disciplina",Object.entries(L.DISC))}
      ${fSel(c,"nivel","Nivel",Object.entries(L.LEVEL))}
      ${fSel(c,"sexo","Sexo",[["h","Hombre"],["m","Mujer"]])}
      ${fSel(c,"dias","Días por semana",[2,3,4,5,6].map(v=>[v,v+" días"]),true)}
      ${fSel(c,"semanas","Duración del bloque",[[4,"4 semanas"],[6,"6 semanas"],[8,"8 semanas"]],true)}
      ${c.disciplina==="hyrox"?fSel(c,"hyroxCat","Categoría Hyrox",[["open","Open"],["pro","Pro"]]):""}
    </div>
    ${c.disciplina==="powerlifting"?`<div class="grid3">${fIn(c,"rm.sq","1RM sentadilla (kg)","number")}${fIn(c,"rm.bp","1RM press banca (kg)","number")}${fIn(c,"rm.dl","1RM peso muerto (kg)","number")}</div>`:""}
  </div>`;
}
function trainView(c){
  if(!c.train) return `<div class="empty"><p>Todavía no hay programa de entrenamiento${session.role==="client"?". Lo verás aquí en cuanto esté listo.":"."}</p>${session.role==="coach"?'<button class="btn btn-primary btn-sm" data-act="genTrain">Generar programa</button>':""}</div>`;
  const t=c.train, w=t.weeks[week-1]||t.weeks[0];
  const isClient=session.role==="client";
  return `<div class="stack">
    <div class="row between"><div><b style="font-family:var(--display);font-size:1.3rem;font-weight:500">${esc(t.title)}</b><p class="muted" style="font-size:.82rem">Creado el ${fdate(t.created)} · nivel ${L.LEVEL[t.params.nivel].toLowerCase()}</p></div>
      <div class="days" role="group" aria-label="Semana">${t.weeks.map(x=>`<button data-week="${x.n}" aria-pressed="${x.n===w.n}">S${x.n}</button>`).join("")}</div></div>
    <div class="panel"><div class="row between"><span class="eyebrow">Semana ${w.n} · ${w.fase}</span><span class="pill ${w.fase.startsWith("Descarga")?"neutral":"ok"}">${w.fase}</span></div><p class="note">${w.nota}</p></div>
    ${w.sessions.map((s,i)=>{ const k="w"+w.n+"d"+i, done=(c.trainLog||{})[k];
      return `<div class="session"><div class="sh"><b>${esc(s.name)}</b>${isClient?`<label class="check"><input type="checkbox" data-done="${k}"${done?" checked":""}> <span>${done?"Hecho el "+fdate(done):"Marcar como hecho"}</span></label>`:(done?`<span class="pill ok">Hecho ${fdate(done)}</span>`:`<span class="pill neutral">Pendiente</span>`)}</div>
      <div style="overflow-x:auto"><table class="t"><thead><tr><th>Ejercicio</th><th class="n">Series × reps</th><th>Intensidad</th><th>Descanso</th><th>Perfil de resistencia</th></tr></thead><tbody>
      ${s.items.map(it=>`<tr><td><b style="font-weight:600">${esc(it.name)}</b><div class="muted" style="font-size:.76rem;max-width:42ch">${esc(it.cue||"")}</div></td><td class="n">${it.sets>1?it.sets+" × ":""}${esc(it.reps)}</td><td>${esc(it.int)}</td><td>${esc(it.rest)}</td><td style="font-size:.8rem">${esc(it.perfil||"—")}</td></tr>`).join("")}
      </tbody></table></div>${s.metcon?`<p class="note" style="margin:10px 14px 14px">${esc(s.metcon)}</p>`:""}</div>`;}).join("")}
    <details><summary>Tabla RPE / RIR</summary><div class="ans"><div class="tbl-wrap"><table class="t"><thead><tr><th class="n">RPE</th><th class="n">RIR</th><th>Sensación</th></tr></thead><tbody>${L.RPE_TABLE.map(r=>`<tr><td class="n">${r[0]}</td><td class="n">${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</tbody></table></div></div></details>
  </div>`;
}

/* ================= Lesiones y suplementos ================= */
function injuryView(inj, current){
  return `<div class="stack"><div class="panel"><div class="row between"><b style="font-family:var(--display);font-size:1.4rem;font-weight:500">${inj.name}</b><span class="chip">${inj.zona}</span></div>
    <p class="note">Evidencia: ${inj.ref}</p></div>
    ${inj.phases.map((p,i)=>`<div class="phase${current===i?" current":""}"><div class="ph"><b>${p[0]}</b><span class="mono muted" style="font-size:.8rem">${p[1]}${current===i?" · fase actual":""}</span></div>
      <dl><dt>Objetivo</dt><dd>${p[2]}</dd><dt>Ejercicios</dt><dd>${p[3]}</dd><dt>Para avanzar</dt><dd>${p[4]}</dd></dl></div>`).join("")}
    <p class="note warn">Acude a un profesional sanitario si hay dolor nocturno o en reposo intenso, inflamación importante, pérdida de fuerza, hormigueo o si el dolor empeora pese a reducir la carga. Estos protocolos no sustituyen el diagnóstico de un fisioterapeuta o médico.</p></div>`;
}
function suppRows(list,w){
  return `<div class="tbl-wrap"><table class="t"><thead><tr><th>Suplemento</th><th>Evidencia</th><th>Dosis para ${fmt(w,1)} kg</th><th>Notas</th></tr></thead><tbody>
    ${list.map(s=>`<tr><td><b style="font-weight:600">${s.name}</b></td><td><span class="pill ${s.ev==="A"?"ok":"warn"}">${s.ev==="A"?"Grupo A · fuerte":"Grupo B · moderada"}</span></td><td>${s.dose(w)}</td><td class="muted" style="font-size:.82rem">${s.note}</td></tr>`).join("")}
  </tbody></table></div><p class="note">Elige productos con certificación antidopaje de terceros (por ejemplo, Informed Sport) si compites. Consulta con tu médico si tomas medicación, estás embarazada o tienes alguna patología.</p>`;
}
function suppRecommended(c){ return SUP.filter(s=>s.goals.includes(c.objetivo==="hipertrofia"?"hipertrofia":c.objetivo==="perdida"?"perdida":c.objetivo==="rendimiento"?"rendimiento":"salud")||s.goals.includes(c.disciplina)).map(s=>s.id); }

/* ================= Vistas del entrenador ================= */
const VIEWS = {}, BINDS = {};

VIEWS.dashboard = ()=>{
  const cl=S.clients, paid=cl.filter(c=>c.pago.estado==="pagado"), pend=cl.filter(c=>c.pago.estado!=="pagado");
  const ingresos=paid.reduce((a,c)=>a+PRICE[c.programa],0);
  const checks=cl.flatMap(c=>c.checkins.map(k=>({...k,c}))).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  const unrev=checks.filter(k=>!k.rev);
  return head("Panel","Hola, Luis",`<button class="btn btn-primary btn-sm" data-act="newClient">Nuevo cliente</button>`)+`
  <div class="stack">
    <div class="kpis">
      <div class="kpi"><span class="l">Clientes</span><span class="v">${cl.length}</span><span class="s">${cl.filter(c=>c.programa==="completo").length} con programa completo</span></div>
      <div class="kpi"><span class="l">Ingresos cobrados</span><span class="v">${fmt(ingresos)} €</span><span class="s">pagos confirmados este ciclo</span></div>
      <div class="kpi"><span class="l">Pagos pendientes</span><span class="v" style="color:${pend.length?"var(--warn)":"inherit"}">${pend.length}</span><span class="s">${fmt(pend.reduce((a,c)=>a+PRICE[c.programa],0))} € por confirmar</span></div>
      <div class="kpi"><span class="l">Check-ins sin revisar</span><span class="v" style="color:${unrev.length?"var(--warn)":"inherit"}">${unrev.length}</span><span class="s">de ${checks.length} recibidos</span></div>
    </div>
    <div class="cols-31">
      <div class="panel"><h3>Clientes</h3>${clientTable(cl)}</div>
      <div class="panel"><h3>Últimos check-ins</h3>${checks.slice(0,6).map(k=>`<div style="border-bottom:1px solid var(--line);padding-bottom:10px;display:grid;gap:4px">
        <div class="row between"><button class="btn-link" data-open="${k.c.id}" data-tab="evolucion">${esc(k.c.nombre)}</button><span class="pill ${k.rev?"neutral":"warn"}">${k.rev?"Revisado":"Nuevo"}</span></div>
        <span class="mono muted" style="font-size:.78rem">${fdate(k.fecha)} · ${fmt(k.peso,1)} kg · dieta ${k.adh_d} % · entreno ${k.adh_e} %</span>
        <span style="font-size:.85rem">${esc(k.notas)}</span></div>`).join("")||'<p class="muted">Aún no hay check-ins.</p>'}</div>
    </div>
  </div>`;
};
function clientTable(cl){
  return `<div class="tbl-wrap"><table class="t"><thead><tr><th>Cliente</th><th>Programa</th><th>Objetivo</th><th class="n">Peso</th><th class="n">Cambio</th><th>Pago</th></tr></thead><tbody>
  ${cl.map(c=>{const e=c.evol, d=e.length>1?e[e.length-1].peso-e[0].peso:0;
    return `<tr class="click" data-open="${c.id}"><td><b style="font-weight:600">${esc(c.nombre)}</b>${c.ejemplo?' <span class="chip">ejemplo</span>':""}<div class="muted" style="font-size:.76rem">${L.DISC[c.disciplina]}</div></td><td>${PROG[c.programa]}</td><td>${OBJ[c.objetivo]}</td><td class="n">${fmt(c.peso,1)} kg</td><td class="n">${d?(d>0?"+":"")+fmt(d,1)+" kg":"—"}</td><td><span class="pill ${c.pago.estado==="pagado"?"ok":"warn"}">${c.pago.estado==="pagado"?"Pagado":"Pendiente"}</span></td></tr>`;}).join("")}
  </tbody></table></div>`;
}
VIEWS.clientes = ()=> head("Clientes",S.clients.length+" fichas",`<button class="btn btn-primary btn-sm" data-act="newClient">Nuevo cliente</button>`)+`<input id="clientSearch" placeholder="Buscar por nombre, email o disciplina" style="margin-bottom:14px"><div id="clientList">${clientTable(S.clients)}</div>`;
BINDS.clientes = m=>{ $("#clientSearch",m).addEventListener("input",e=>{const q=e.target.value.toLowerCase();$("#clientList",m).innerHTML=clientTable(S.clients.filter(c=>(c.nombre+c.email+c.disciplina+c.objetivo).toLowerCase().includes(q)));}); };

const TABS = [["resumen","Resumen"],["datos","Datos"],["biomecanica","Biomecánica"],["evolucion","Evolución"],["nutricion","Nutrición"],["entrenamiento","Entrenamiento"],["lesiones","Lesiones"],["suplementos","Suplementos"],["informe","Informe PDF"]];
VIEWS.ficha = ()=>{
  const c=client(cid); if(!c) return VIEWS.clientes();
  return head(esc(c.nombre), PROG[c.programa]+" · alta el "+fdate(c.alta), `<button class="btn btn-sm" data-nav="clientes">Todos los clientes</button><button class="btn btn-primary btn-sm" data-act="pdf">Informe PDF</button>`)+
   `<div class="tabs" role="tablist">${TABS.map(([k,l])=>`<button role="tab" data-tab="${k}" aria-selected="${k===tab}">${l}</button>`).join("")}</div>`+(FICHA[tab]||FICHA.resumen)(c);
};
const FICHA = {};
FICHA.resumen = c=>{
  const n=L.calcNutrition(c), e=c.evol, f=e[0], l=e[e.length-1];
  const inj=c.lesion?INJ.find(i=>i.id===c.lesion.id):null;
  return `<div class="stack"><div class="kpis">
    <div class="kpi"><span class="l">Peso actual</span><span class="v">${fmt(c.peso,1)} kg</span><span class="s">${f&&l&&e.length>1?(l.peso-f.peso>0?"+":"")+fmt(l.peso-f.peso,1)+" kg desde el inicio":"medición inicial"}</span></div>
    <div class="kpi"><span class="l">% grasa</span><span class="v">${c.grasa?fmt(c.grasa,1)+" %":"—"}</span><span class="s">${f&&l&&f.grasa&&e.length>1?(l.grasa-f.grasa>0?"+":"")+fmt(l.grasa-f.grasa,1)+" puntos":""}</span></div>
    <div class="kpi"><span class="l">Calorías objetivo</span><span class="v">${fmt(n.kcal)}</span><span class="s">P ${n.p} · H ${n.c} · G ${n.f} g</span></div>
    <div class="kpi"><span class="l">Acceso al portal</span><span class="v" style="font-size:1.2rem">${esc(c.codigo)}</span><span class="s">${esc(c.email)}</span></div>
  </div>
  <div class="cols-2">
    <div class="panel"><h3>Perfil</h3><div class="statgrid">
      <div class="stat"><span class="l">Objetivo</span><span>${OBJ[c.objetivo]}</span></div><div class="stat"><span class="l">Disciplina</span><span>${L.DISC[c.disciplina]}</span></div>
      <div class="stat"><span class="l">Nivel</span><span>${L.LEVEL[c.nivel]}</span></div><div class="stat"><span class="l">Dieta</span><span>${DIETA[c.dieta]}</span></div>
      <div class="stat"><span class="l">Edad · altura</span><span>${c.edad} años · ${c.altura} cm</span></div><div class="stat"><span class="l">Pago</span><span class="pill ${c.pago.estado==="pagado"?"ok":"warn"}">${c.pago.estado==="pagado"?"Pagado":"Pendiente"} · ${c.pago.metodo}</span></div>
    </div>
    ${c.patologias?`<p class="note warn">Patologías: ${esc(c.patologias)}</p>`:""}${c.alergias?`<p class="note warn">Alergias / intolerancias: ${esc(c.alergias)}</p>`:""}
    ${inj?`<p class="note">Readaptación: ${inj.name}, ${inj.phases[c.lesion.fase][0].toLowerCase()}</p>`:""}</div>
    <div class="panel">${lineChart(c.evol.map(x=>({x:x.fecha,y:x.peso})),"kg","Peso corporal")}</div>
  </div></div>`;
};
FICHA.datos = c=>`<div class="stack">
  <div class="panel"><h3>Datos personales y acceso</h3><div class="grid3">${fIn(c,"nombre","Nombre y apellidos")}${fIn(c,"email","Email","email")}${fIn(c,"telefono","Teléfono","tel")}</div>
    <div class="row"><span class="muted" style="font-size:.85rem">Código de acceso al portal:</span><code class="mono">${esc(c.codigo)}</code><button class="btn btn-sm" data-copy="${esc(c.codigo)}">Copiar</button><button class="btn btn-sm" data-act="newCode">Generar código nuevo</button><button class="btn btn-sm" data-act="welcome">Preparar email de bienvenida</button></div></div>
  <div class="panel"><h3>Programa y pago</h3><div class="grid4">${fSel(c,"programa","Programa",Object.entries(PROG).map(([k,v])=>[k,v+" · "+PRICE[k]+" €"]))}${fSel(c,"pago.metodo","Método de pago",[["tarjeta","Tarjeta (Stripe)"],["transferencia","Transferencia"],["bizum","Bizum"]])}${fSel(c,"pago.estado","Estado",[["pendiente","Pendiente"],["pagado","Pagado"]])}${fIn(c,"pago.fecha","Fecha de pago","date")}</div></div>
  <div class="panel"><h3>Datos físicos y objetivo</h3><div class="grid4">${fSel(c,"sexo","Sexo",[["h","Hombre"],["m","Mujer"]])}${fIn(c,"edad","Edad","number")}${fIn(c,"altura","Altura (cm)","number")}${fIn(c,"peso","Peso (kg)","number")}${fIn(c,"grasa","% grasa","number")}${fSel(c,"objetivo","Objetivo",Object.entries(OBJ))}${fSel(c,"disciplina","Disciplina",Object.entries(L.DISC))}${fSel(c,"nivel","Nivel",Object.entries(L.LEVEL))}</div></div>
  <div class="panel"><h3>Salud</h3><div class="grid2">${fIn(c,"patologias","Patologías y medicación","area")}${fIn(c,"alergias","Alergias e intolerancias","area")}</div>${fIn(c,"notas","Notas internas","area")}</div>
  <div class="row"><button class="btn btn-sm" data-act="delClient" style="color:var(--bad);border-color:var(--bad)">Eliminar cliente</button></div>
</div>`;
FICHA.biomecanica = c=>{
  const b=c.bio||{};
  const bil=(k,l,u,ref)=>{const d=b[k+"_d"],i=b[k+"_i"];const asym=d!=null&&i!=null&&Math.abs(d-i)>Math.max(2,0.1*Math.max(d,i));
    return `<tr><td>${l}<div class="muted" style="font-size:.74rem">Ref. ${ref}</div></td><td><input data-f="bio.${k}_d" data-t="num" type="number" step="any" value="${d??""}" aria-label="${l} derecha" style="max-width:100px"></td><td><input data-f="bio.${k}_i" data-t="num" type="number" step="any" value="${i??""}" aria-label="${l} izquierda" style="max-width:100px"></td><td>${u}</td><td>${asym?'<span class="pill warn">Asimetría</span>':d!=null&&i!=null?'<span class="pill ok">Simétrico</span>':""}</td></tr>`;};
  return `<div class="stack"><div class="panel"><h3>Tests de movilidad</h3><div class="tbl-wrap"><table class="t"><thead><tr><th>Test</th><th>Derecha</th><th>Izquierda</th><th>Unidad</th><th>Estado</th></tr></thead><tbody>
    ${bil("dorsi","Dorsiflexión de tobillo (rodilla a la pared)","cm","≥ 10 cm")}${bil("slr","Elevación de pierna recta","°","≥ 70°")}${bil("rih","Rotación interna de cadera","°","35-45°")}${bil("reh","Rotación externa de hombro","°","≈ 90°")}
    </tbody></table></div><p class="note">Se marca asimetría cuando la diferencia supera el 10 % o 2 unidades.</p></div>
    <div class="panel"><h3>Patrones de movimiento</h3><div class="grid3">
      ${fSel(c,"bio.ohs","Sentadilla overhead",[[0,"0 · dolor"],[1,"1 · no completa"],[2,"2 · con compensaciones"],[3,"3 · correcta"]],true)}
      ${fSel(c,"bio.hinge","Bisagra de cadera",[[0,"0 · dolor"],[1,"1 · flexión lumbar"],[2,"2 · aceptable"],[3,"3 · correcta"]],true)}
      ${fSel(c,"bio.stepdown","Step-down / valgo dinámico",[["correcto","Correcto"],["valgo_d","Valgo derecho"],["valgo_i","Valgo izquierdo"],["valgo_b","Valgo bilateral"]])}
    </div><div class="grid3">${fIn(c,"bio.postura","Observaciones posturales")}${fIn(c,"bio.dolor_zona","Dolor actual · zona")}${fIn(c,"bio.dolor_eva","Dolor actual · EVA 0-10","number")}</div>
    ${fIn(c,"bio.lesiones","Lesiones previas y cirugías","area")}</div>
    <div class="panel"><h3>Historial biomecánico</h3>
      ${(b.hist||[]).slice().reverse().map(h=>`<div style="display:grid;grid-template-columns:96px 1fr;gap:12px;border-bottom:1px solid var(--line);padding-bottom:8px"><span class="mono muted" style="font-size:.8rem">${fdate(h.fecha)}</span><span style="font-size:.9rem">${esc(h.nota)}</span></div>`).join("")||'<p class="muted">Sin entradas todavía.</p>'}
      <div class="row"><input id="bioNote" placeholder="Nueva observación: test, evolución, molestia…" style="flex:1"><button class="btn btn-sm" data-act="bioNote">Añadir</button></div></div></div>`;
};
FICHA.evolucion = c=>`<div class="stack">${evolBlock(c)}${checkinList(c)}</div>`;
function evolBlock(c){
  const isCoach=session.role==="coach";
  return `<div class="cols-2"><div class="panel">${lineChart(c.evol.map(x=>({x:x.fecha,y:x.peso})),"kg","Peso corporal")}</div><div class="panel">${lineChart(c.evol.map(x=>({x:x.fecha,y:x.grasa})),"%","Porcentaje de grasa")}</div></div>
  <div class="cols-2"><div class="panel">${lineChart(c.evol.map(x=>({x:x.fecha,y:x.cintura})),"cm","Perímetro de cintura")}</div>
  <div class="panel"><h3>Nueva medición</h3><div class="grid3">
    <label class="f">Fecha<input id="ev_fecha" type="date" value="${today()}"></label><label class="f">Peso (kg)<input id="ev_peso" type="number" step="0.1"></label><label class="f">% grasa<input id="ev_grasa" type="number" step="0.1"></label>
    <label class="f">Cintura (cm)<input id="ev_cintura" type="number" step="0.5"></label><label class="f">Cadera (cm)<input id="ev_cadera" type="number" step="0.5"></label><label class="f">Brazo (cm)<input id="ev_brazo" type="number" step="0.5"></label></div>
    <div class="row"><label class="f" style="flex:1">Muslo (cm)<input id="ev_muslo" type="number" step="0.5"></label><button class="btn btn-primary btn-sm" data-act="addEvol" style="align-self:end">Guardar medición</button></div></div></div>
  <div class="panel"><h3>Historial de medidas</h3><div class="tbl-wrap"><table class="t"><thead><tr><th>Fecha</th><th class="n">Peso</th><th class="n">% grasa</th><th class="n">Cintura</th><th class="n">Cadera</th><th class="n">Brazo</th><th class="n">Muslo</th>${isCoach?"<th></th>":""}</tr></thead><tbody>
  ${c.evol.slice().reverse().map((e)=>`<tr><td>${fdate(e.fecha)}</td><td class="n">${fmt(e.peso,1)}</td><td class="n">${fmt(e.grasa,1)}</td><td class="n">${fmt(e.cintura,1)}</td><td class="n">${fmt(e.cadera,1)}</td><td class="n">${fmt(e.brazo,1)}</td><td class="n">${fmt(e.muslo,1)}</td>${isCoach?`<td><button class="btn btn-sm" data-delevol="${c.evol.indexOf(e)}">Quitar</button></td>`:""}</tr>`).join("")||`<tr><td colspan="8" class="muted">Sin mediciones todavía.</td></tr>`}
  </tbody></table></div></div>`;
}
function checkinList(c){
  return `<div class="panel"><h3>Check-ins semanales</h3><div class="tbl-wrap"><table class="t"><thead><tr><th>Fecha</th><th class="n">Peso</th><th class="n">Dieta</th><th class="n">Entreno</th><th class="n">Sueño</th><th class="n">Energía</th><th class="n">Estrés</th><th>Notas</th><th>Estado</th></tr></thead><tbody>
  ${c.checkins.slice().reverse().map(k=>{const i=c.checkins.indexOf(k);return `<tr><td>${fdate(k.fecha)}</td><td class="n">${fmt(k.peso,1)}</td><td class="n">${k.adh_d} %</td><td class="n">${k.adh_e} %</td><td class="n">${fmt(k.sueno,1)} h</td><td class="n">${k.energia}/5</td><td class="n">${k.estres}/5</td><td style="font-size:.84rem">${esc(k.notas)}</td><td>${session.role==="coach"?`<button class="btn btn-sm" data-rev="${i}">${k.rev?"Revisado":"Marcar revisado"}</button>`:`<span class="pill ${k.rev?"ok":"neutral"}">${k.rev?"Revisado":"Enviado"}</span>`}</td></tr>`;}).join("")||`<tr><td colspan="9" class="muted">Sin check-ins todavía.</td></tr>`}
  </tbody></table></div></div>`;
}
FICHA.nutricion = c=>{
  if(!hasNutri(c)) return `<div class="empty"><p>${esc(c.nombre)} tiene contratado solo Entrenamiento.</p><p class="muted" style="font-size:.85rem">Cambia el programa en la pestaña Datos para activar la nutrición.</p></div>`;
  return nutriTool(c);
};
function nutriTool(c){
  return `<div class="stack"><div class="cols-2">${nutriParams(c)}${mifflinCard(c)}</div>
    <div class="row between"><h2 style="font-size:1.8rem">Plan semanal</h2><div class="row">${c!==scratch||true?`<button class="btn btn-primary btn-sm" data-act="genNutri">${c.nutri?"Regenerar con los datos actuales":"Generar plan semanal"}</button>`:""}${c.nutri&&c!==scratch?`<button class="btn btn-sm" data-act="pdf">Informe PDF</button>`:""}</div></div>
    ${mealPlanView(c)}</div>`;
}
FICHA.entrenamiento = c=>{
  if(!hasTrain(c)) return `<div class="empty"><p>${esc(c.nombre)} tiene contratada solo Nutrición.</p></div>`;
  return trainTool(c);
};
function trainTool(c){
  return `<div class="stack">${trainParams(c)}<div class="row"><button class="btn btn-primary btn-sm" data-act="genTrain">${c.train?"Regenerar programa":"Generar programa"}</button>${c.train&&c!==scratch?'<button class="btn btn-sm" data-act="pdf">Informe PDF</button>':""}</div>${trainView(c)}</div>`;
}
FICHA.lesiones = c=>{
  const cur=c.lesion; const inj=cur?INJ.find(i=>i.id===cur.id):null;
  return `<div class="stack"><div class="panel"><h3>Lesión en readaptación</h3><div class="grid2">
    <label class="f">Protocolo<select id="injPick"><option value="">Ninguna</option>${INJ.map(i=>`<option value="${i.id}"${cur&&cur.id===i.id?" selected":""}>${i.name}</option>`).join("")}</select></label>
    ${inj?`<label class="f">Fase actual<select id="injPhase">${inj.phases.map((p,i)=>`<option value="${i}"${cur.fase===i?" selected":""}>${p[0]}</option>`).join("")}</select></label>`:""}</div></div>
    ${inj?injuryView(inj,cur.fase):'<p class="muted">Sin lesión activa. Elige un protocolo si el cliente está en readaptación.</p>'}</div>`;
};
FICHA.suplementos = c=>{
  const rec=suppRecommended(c);
  return `<div class="stack"><div class="panel"><h3>Pauta asignada</h3><p class="muted" style="font-size:.86rem">Recomendados para ${OBJ[c.objetivo].toLowerCase()} y ${L.DISC[c.disciplina].toLowerCase()}: ${rec.map(id=>SUP.find(s=>s.id===id).name).join(", ")}.</p>
    <div class="grid3">${SUP.map(s=>`<label class="check"><input type="checkbox" data-supp="${s.id}"${c.supps.includes(s.id)?" checked":""}> <span>${s.name}${rec.includes(s.id)?' <span class="chip">recomendado</span>':""}</span></label>`).join("")}</div></div>
    ${c.supps.length?suppRows(SUP.filter(s=>c.supps.includes(s.id)),c.peso):""}</div>`;
};
FICHA.informe = c=>reportPanel(c);
function reportPanel(c){
  const isCoach=session.role==="coach";
  return `<div class="panel" style="max-width:720px"><h3>Informe profesional en PDF</h3>
    <p class="muted" style="font-size:.9rem">Incluye portada con el logo, datos y objetivos, cálculo Mifflin-St Jeor, plan nutricional semanal, recetas con cantidades, lista de la compra, programa de entrenamiento, evolución corporal${isCoach?", readaptación de lesiones y suplementación":" y tu pauta"}.</p>
    <div class="grid2">
      <label class="check"><input type="checkbox" id="pdf_n" checked${!hasNutri(c)?" disabled":""}> <span>Nutrición y recetas</span></label>
      <label class="check"><input type="checkbox" id="pdf_t" checked${!hasTrain(c)?" disabled":""}> <span>Entrenamiento</span></label>
      <label class="check"><input type="checkbox" id="pdf_e" checked> <span>Evolución corporal</span></label>
      <label class="check"><input type="checkbox" id="pdf_x" checked> <span>Lesiones y suplementación</span></label>
    </div>
    <div class="row"><button class="btn btn-primary" data-act="pdfGo">Descargar PDF</button><span id="pdfMsg" class="muted" style="font-size:.85rem"></span></div></div>`;
}
BINDS.ficha = m=>{
  const c=client(cid); if(!c) return;
  const ip=$("#injPick",m); if(ip) ip.addEventListener("change",()=>{ c.lesion = ip.value?{id:ip.value,fase:0}:null; save(); renderView(); });
  const ph=$("#injPhase",m); if(ph) ph.addEventListener("change",()=>{ c.lesion.fase=+ph.value; save(); renderView(); });
  $$("[data-supp]",m).forEach(x=>x.addEventListener("change",()=>{ const id=x.dataset.supp; c.supps = x.checked ? [...new Set([...c.supps,id])] : c.supps.filter(s=>s!==id); save(); renderView(); }));
};

/* Herramientas independientes */
VIEWS.nutricion = ()=>{ const c=target(); return head("Calculadora y planes","Nutrición automática",picker())+ (hasNutri(c)||c===scratch ? nutriTool(c) : `<div class="empty">${esc(c.nombre)} tiene contratado solo Entrenamiento.</div>`); };
VIEWS.entrenamiento = ()=>{ const c=target(); return head("Generador de programas","Entrenamiento por disciplinas",picker())+ (hasTrain(c)||c===scratch ? trainTool(c) : `<div class="empty">${esc(c.nombre)} tiene contratada solo Nutrición.</div>`); };
VIEWS.informes = ()=>{ const c=target()===scratch?S.clients[0]:target(); if(!c) return head("Informes PDF","")+'<div class="empty">Crea un cliente primero.</div>'; toolId=c.id; return head("Informes PDF","Con tu marca",picker().replace(/<option value="scratch"[^>]*>.*?<\/option>/,""))+reportPanel(c); };
["nutricion","entrenamiento","informes"].forEach(v=>BINDS[v]=m=>{ const p=$("#toolPick",m); if(p) p.addEventListener("change",()=>{ toolId=p.value; day=0; week=1; renderView(); }); });

VIEWS.pagos = ()=>{
  const rows=S.clients.slice().sort((a,b)=>(a.pago.estado>b.pago.estado?1:-1));
  const tot=k=>S.clients.filter(c=>c.pago.estado===k).reduce((a,c)=>a+PRICE[c.programa],0);
  return head("Pagos","Stripe · transferencia · Bizum")+`<div class="stack"><div class="kpis">
    <div class="kpi"><span class="l">Cobrado</span><span class="v">${fmt(tot("pagado"))} €</span></div>
    <div class="kpi"><span class="l">Pendiente</span><span class="v" style="color:var(--warn)">${fmt(tot("pendiente"))} €</span></div>
    ${["tarjeta","transferencia","bizum"].map(mm=>`<div class="kpi"><span class="l">${mm==="tarjeta"?"Tarjeta (Stripe)":mm[0].toUpperCase()+mm.slice(1)}</span><span class="v">${S.clients.filter(c=>c.pago.metodo===mm).length}</span><span class="s">clientes</span></div>`).join("")}
  </div>
  <div class="tbl-wrap"><table class="t"><thead><tr><th>Cliente</th><th>Programa</th><th class="n">Importe</th><th>Método</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>
  ${rows.map(c=>`<tr><td><button class="btn-link" data-open="${c.id}" data-tab="datos">${esc(c.nombre)}</button></td><td>${PROG[c.programa]}</td><td class="n">${PRICE[c.programa]} €</td><td>${c.pago.metodo}</td><td>${fdate(c.pago.fecha)}</td>
  <td><button class="btn btn-sm" data-paytoggle="${c.id}">${c.pago.estado==="pagado"?"Pagado · marcar pendiente":"Pendiente · confirmar pago"}</button></td></tr>`).join("")}
  </tbody></table></div>
  <div class="panel"><h3>Cómo funciona cada método</h3><p class="note"><b>Tarjeta:</b> enlaces de pago de Stripe configurados en la web. Stripe te envía un email con cada cobro; confírmalo aquí.</p><p class="note"><b>Transferencia:</b> el cliente te escribe a ${C.email}, le respondes con el número de cuenta y confirmas cuando llegue el ingreso.</p><p class="note"><b>Bizum:</b> el cliente envía el importe al ${C.tel} con su referencia y te manda el justificante por WhatsApp.</p></div></div>`;
};

VIEWS.recetas = ()=>{
  const isClient=session.role==="client", c=isClient?me():null;
  const f=recipeFilter;
  let list=L.RECIPES.filter(r=>(!f.cat||r.cat===f.cat)&&(!f.q||r.name.toLowerCase().includes(f.q.toLowerCase())||r.ings.some(i=>L.food(i.key).name.toLowerCase().includes(f.q.toLowerCase()))));
  list=list.filter(r=>L.fitsPrefs(r,{dieta:f.dieta,sg:f.sg,sl:f.sl,sf:f.sf}));
  if(isClient) list=list.filter(r=>L.fitsPrefs(r,{dieta:c.dieta,...c.restr}));
  const scaleC = isClient ? c : (f.scale?client(f.scale):null);
  const targetFor = r=>{ if(!scaleC) return null; const n=L.calcNutrition(scaleC); const split=L.SPLITS[scaleC.comidas]||L.SPLITS[4]; const m=split.find(s=>s[1]===r.cat)||split.find(s=>s[1]==="s")||split[0]; const fr=m[2]; return {kcal:n.kcal*fr,p:n.p*fr,label:m[0],fr}; };
  return head("Recetas", L.RECIPES.length+" recetas equilibradas")+`
  <div class="panel" style="margin-bottom:18px"><div class="grid4">
    <label class="f">Buscar<input id="rf_q" value="${esc(f.q)}" placeholder="Receta o ingrediente"></label>
    <label class="f">Momento<select id="rf_cat"><option value="">Todos</option>${Object.entries(L.CAT).map(([k,v])=>`<option value="${k}"${f.cat===k?" selected":""}>${v}</option>`).join("")}</select></label>
    ${isClient?"":`<label class="f">Dieta<select id="rf_dieta"><option value="">Todas</option>${Object.entries(DIETA).filter(([k])=>k!=="omnivoro").map(([k,v])=>`<option value="${k}"${f.dieta===k?" selected":""}>${v}</option>`).join("")}</select></label>
    <label class="f">Escalar a los macros de<select id="rf_scale"><option value="">Receta base</option>${S.clients.filter(hasNutri).map(x=>`<option value="${x.id}"${f.scale===x.id?" selected":""}>${esc(x.nombre)}</option>`).join("")}</select></label>`}
  </div>${isClient?`<p class="note">Las cantidades ya están escaladas a tus macros según el momento del día. Solo ves recetas compatibles con tu dieta.</p>`:`<div class="row">${["sg","sl","sf"].map(k=>`<label class="check"><input type="checkbox" id="rf_${k}"${f[k]?" checked":""}> <span>${{sg:"Sin gluten",sl:"Sin lactosa",sf:"Sin frutos secos"}[k]}</span></label>`).join("")}</div>`}</div>
  <p class="muted" style="font-size:.85rem;margin-bottom:12px">${list.length} recetas</p>
  <div class="rgrid">${list.map(r=>{ const t=targetFor(r); const s=t?L.scaleRecipe(r,t):{ings:r.ings,tot:r.tot}; const tot=s.tot; const open=f.open===r.id; const V=window.LN_VRN;
    return `<article class="rcard"><div class="row between"><span class="eyebrow">${L.CAT[r.cat]}</span>${t?`<span class="chip">${t.label} · ${Math.round(t.fr*100)} %</span>`:""}</div><h4>${esc(r.name)}</h4>
    <div class="mm"><div>${fmt(tot.kcal)}<small>kcal</small></div><div>${fmt(tot.p)}<small>prot</small></div><div>${fmt(tot.c)}<small>hc</small></div><div>${fmt(tot.f)}<small>grasa</small></div></div>
    <div class="micro"><span>Fibra <b>${fmt(tot.fib,1)} g</b></span><span>Ca <b>${fmt(tot.ca/V.ca*100)} %</b></span><span>Fe <b>${fmt(tot.fe/V.fe*100)} %</b></span><span>Mg <b>${fmt(tot.mg/V.mg*100)} %</b></span><span>K <b>${fmt(tot.k/V.k*100)} %</b></span><span>Vit C <b>${fmt(tot.vc/V.vc*100)} %</b></span></div>
    <div>${r.tags.map(x=>`<span class="chip">${x}</span>`).join("")}</div>
    <button class="btn btn-sm" data-ropen="${r.id}" aria-expanded="${open}">${open?"Ocultar receta":"Ver ingredientes"}</button>
    ${open?`<ul style="margin:0;padding-left:18px;font-size:.86rem">${s.ings.filter(i=>i.key!=="especias").map(i=>`<li>${fmt(i.g)} g ${esc(L.food(i.key).name.toLowerCase())}${L.unitHint(i.key,i.g)}</li>`).join("")}</ul><p class="muted" style="font-size:.86rem">${esc(r.method)}</p>`:""}
    </article>`;}).join("")}</div>`;
};
BINDS.recetas = m=>{
  const f=recipeFilter, re=()=>{renderView();};
  const q=$("#rf_q",m); q.addEventListener("change",()=>{f.q=q.value;re();}); q.addEventListener("keydown",e=>{if(e.key==="Enter"){f.q=q.value;re();}});
  $("#rf_cat",m).addEventListener("change",e=>{f.cat=e.target.value;re();});
  const d=$("#rf_dieta",m); if(d) d.addEventListener("change",e=>{f.dieta=e.target.value;re();});
  const s=$("#rf_scale",m); if(s) s.addEventListener("change",e=>{f.scale=e.target.value;re();});
  ["sg","sl","sf"].forEach(k=>{const x=$("#rf_"+k,m); if(x) x.addEventListener("change",()=>{f[k]=x.checked;re();});});
};

VIEWS.ejercicios = ()=>{
  const pats=[...new Set(Object.values(EX).map(e=>e[1]))];
  return head("Ejercicios", Object.keys(EX).length+" ejercicios con biomecánica")+`<div class="row" style="margin-bottom:14px"><select id="exPat" style="max-width:280px"><option value="">Todos los patrones</option>${pats.map(p=>`<option>${p}</option>`).join("")}</select></div>
  <div class="tbl-wrap"><table class="t" id="exTbl"><thead><tr><th>Ejercicio</th><th>Patrón</th><th>Músculos</th><th>Perfil de resistencia</th><th>Claves biomecánicas</th></tr></thead><tbody>
  ${Object.values(EX).map(e=>`<tr data-pat="${esc(e[1])}"><td><b style="font-weight:600">${e[0]}</b></td><td>${e[1]}</td><td>${e[2]}</td><td>${e[3]}</td><td style="font-size:.84rem;min-width:260px">${e[4]}</td></tr>`).join("")}</tbody></table></div>
  <div class="panel" style="margin-top:18px"><h3>Perfiles de resistencia</h3><p class="note"><b>Ascendente:</b> la máxima demanda está en la posición acortada (hip thrust, remo). <b>Descendente:</b> la máxima demanda está en el estiramiento (peso muerto rumano, press banca). <b>Campana:</b> máximo en el punto medio (sentadilla, curl). <b>Plano:</b> tensión constante, típico de poleas. Combinar perfiles distintos para un mismo músculo cubre todo su rango de fuerza.</p></div>`;
};
BINDS.ejercicios = m=>{ $("#exPat",m).addEventListener("change",e=>{ $$("#exTbl tbody tr",m).forEach(tr=>tr.hidden = !!e.target.value && tr.dataset.pat!==e.target.value); }); };

let injSel = INJ[0].id;
VIEWS.lesiones = ()=>head("Gestión de lesiones","Protocolos por fases basados en evidencia")+`<div class="days" style="margin-bottom:18px">${INJ.map(i=>`<button data-inj="${i.id}" aria-pressed="${i.id===injSel}">${i.name}</button>`).join("")}</div>${injuryView(INJ.find(i=>i.id===injSel))}`;

let suppGoal="perdida", suppDisc="gimnasio", suppW=75;
VIEWS.suplementos = ()=>{
  if(session.role==="client"){ const c=me(); return head("Suplementación","Tu pauta")+suppRows(SUP.filter(s=>c.supps.includes(s.id)),c.peso); }
  const list=SUP.filter(s=>s.goals.includes(suppGoal)||s.goals.includes(suppDisc));
  return head("Suplementación","Adaptada a cada objetivo")+`<div class="panel" style="margin-bottom:18px"><div class="grid3">
    <label class="f">Objetivo<select id="sp_g">${[["perdida","Pérdida de grasa"],["hipertrofia","Ganancia muscular"],["fuerza","Fuerza"],["rendimiento","Rendimiento"],["salud","Salud"]].map(([k,v])=>`<option value="${k}"${k===suppGoal?" selected":""}>${v}</option>`).join("")}</select></label>
    <label class="f">Disciplina<select id="sp_d">${Object.entries(L.DISC).map(([k,v])=>`<option value="${k}"${k===suppDisc?" selected":""}>${v}</option>`).join("")}</select></label>
    <label class="f">Peso (kg)<input id="sp_w" type="number" value="${suppW}"></label></div></div>${suppRows(list,suppW)}`;
};
BINDS.suplementos = m=>{ const g=$("#sp_g",m); if(!g) return; g.addEventListener("change",e=>{suppGoal=e.target.value;renderView();}); $("#sp_d",m).addEventListener("change",e=>{suppDisc=e.target.value;renderView();}); $("#sp_w",m).addEventListener("change",e=>{suppW=+e.target.value||75;renderView();}); };

/* ================= Vistas del cliente ================= */
VIEWS.inicio = ()=>{
  const c=me(), n=L.calcNutrition(c), e=c.evol, f=e[0], l=e[e.length-1];
  const tw=c.train?c.train.weeks.length*c.train.weeks[0].sessions.length:0, done=Object.keys(c.trainLog||{}).length;
  return head("Hola, "+esc(c.nombre.split(" ")[0]), PROG[c.programa])+`<div class="stack">
    <div class="kpis">
      <div class="kpi"><span class="l">Peso actual</span><span class="v">${fmt(l?l.peso:c.peso,1)} kg</span><span class="s">${f&&e.length>1?(l.peso-f.peso>0?"+":"")+fmt(l.peso-f.peso,1)+" kg desde el inicio":"Primera medición"}</span></div>
      ${hasNutri(c)?`<div class="kpi"><span class="l">Tus calorías</span><span class="v">${fmt(n.kcal)}</span><span class="s">P ${n.p} g · H ${n.c} g · G ${n.f} g</span></div>`:""}
      ${hasTrain(c)?`<div class="kpi"><span class="l">Sesiones hechas</span><span class="v">${done}/${tw}</span><span class="s">${c.train?esc(c.train.title):""}</span></div>`:""}
      <div class="kpi"><span class="l">Último check-in</span><span class="v" style="font-size:1.2rem">${c.checkins.length?fdate(c.checkins[c.checkins.length-1].fecha):"Pendiente"}</span><span class="s">Hazlo una vez por semana</span></div>
    </div>
    <div class="cols-2"><div class="panel">${lineChart(c.evol.map(x=>({x:x.fecha,y:x.peso})),"kg","Tu peso")}</div>
      <div class="panel"><h3>Hoy</h3>${hasNutri(c)&&c.nutri?(()=>{const d=c.nutri.plan.days[(new Date().getDay()+6)%7];return `<p class="eyebrow">${d.day}</p>`+d.meals.map(m=>`<div class="row between" style="border-bottom:1px solid var(--line);padding-bottom:6px"><span>${m.label}<br><b style="font-family:var(--display);font-weight:500">${esc(L.RECIPES.find(r=>r.id===m.recipe).name)}</b></span><span class="mono muted" style="font-size:.78rem">${fmt(m.tot.kcal)} kcal</span></div>`).join("")})():'<p class="muted">Tu plan aparecerá aquí.</p>'}
      <div class="row"><button class="btn btn-sm" data-nav="${hasNutri(c)?"dieta":"entreno"}">Ver plan completo</button><button class="btn btn-primary btn-sm" data-nav="evolucion">Hacer check-in</button></div></div></div>
  </div>`;
};
VIEWS.dieta = ()=>{ const c=me(); return head("Mi dieta", c.nutri?fmt(c.nutri.targets.kcal)+" kcal · "+c.comidas+" comidas al día":"")+mealPlanView(c); };
VIEWS.entreno = ()=>{ const c=me(); return head("Mi entrenamiento", L.DISC[c.disciplina])+trainView(c); };
VIEWS.evolucion = ()=>{
  const c=me();
  return head("Evolución y check-in","Tu progreso")+`<div class="stack">
  <div class="panel"><h3>Check-in semanal</h3><div class="grid4">
    <label class="f">Peso (kg)<input id="ck_peso" type="number" step="0.1"></label><label class="f">Cintura (cm, opcional)<input id="ck_cint" type="number" step="0.5"></label>
    <label class="f">Cumplimiento dieta (%)<input id="ck_d" type="number" min="0" max="100" value="90"></label><label class="f">Cumplimiento entreno (%)<input id="ck_e" type="number" min="0" max="100" value="100"></label>
    <label class="f">Sueño medio (h)<input id="ck_s" type="number" step="0.5" value="7"></label><label class="f">Energía (1-5)<input id="ck_en" type="number" min="1" max="5" value="4"></label><label class="f">Estrés (1-5)<input id="ck_es" type="number" min="1" max="5" value="3"></label></div>
    <label class="f">¿Cómo ha ido la semana?<textarea id="ck_n" placeholder="Hambre, digestiones, molestias, cambios de horario…"></textarea></label>
    <p id="ck_err" class="note warn" hidden></p><button class="btn btn-primary" data-act="checkin" style="justify-self:start">Enviar check-in</button></div>
  ${evolBlock(c)}${checkinList(c)}</div>`;
};
VIEWS.lesion = ()=>{ const c=me(), inj=INJ.find(i=>i.id===c.lesion.id); return head("Mi readaptación",inj.zona)+injuryView(inj,c.lesion.fase); };
VIEWS.informe = ()=>head("Descargar informe","PDF")+reportPanel(me());
VIEWS.contacto = ()=>head("Contacto","Estoy para ayudarte")+`<div class="panel" style="max-width:640px">
  <div class="cline"><div><div class="eyebrow">Email</div><div class="v" style="font-family:var(--display);font-size:1.4rem">${C.email}</div></div><button class="btn btn-sm" data-copy="${C.email}">Copiar</button></div>
  <div class="cline"><div><div class="eyebrow">Teléfono y WhatsApp</div><div class="v" style="font-family:var(--display);font-size:1.4rem">${C.tel}</div></div><a class="btn btn-sm" href="https://wa.me/${C.telRaw}" target="_blank" rel="noopener">WhatsApp</a></div>
  <p class="note">Respuesta en 24-48 h laborables (24 h en el programa completo).</p></div>`;

/* ================= Acciones ================= */
function newClientModal(){
  const m=openModal(`<p class="eyebrow">Nuevo cliente</p><h2>Alta de cliente</h2><form class="form" id="ncForm" novalidate>
    <div class="grid3"><label class="f">Nombre<input id="nc_n" required></label><label class="f">Email<input id="nc_e" type="email" required></label><label class="f">Teléfono<input id="nc_t"></label></div>
    <div class="grid4"><label class="f">Sexo<select id="nc_s"><option value="h">Hombre</option><option value="m">Mujer</option></select></label><label class="f">Edad<input id="nc_a" type="number" value="30"></label><label class="f">Altura (cm)<input id="nc_h" type="number" value="170"></label><label class="f">Peso (kg)<input id="nc_w" type="number" value="75" step="0.1"></label></div>
    <div class="grid3"><label class="f">Programa<select id="nc_p">${Object.entries(PROG).map(([k,v])=>`<option value="${k}"${k==="completo"?" selected":""}>${v}</option>`).join("")}</select></label>
    <label class="f">Objetivo<select id="nc_o">${Object.entries(OBJ).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select></label>
    <label class="f">Disciplina<select id="nc_d">${Object.entries(L.DISC).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select></label></div>
    <p id="nc_err" class="note warn" hidden></p><button class="btn btn-primary" type="submit">Crear ficha</button></form>`);
  $("#ncForm",m).addEventListener("submit",e=>{
    e.preventDefault();
    const n=$("#nc_n",m).value.trim(), em=$("#nc_e",m).value.trim();
    if(!n||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){const x=$("#nc_err",m);x.hidden=false;x.textContent="Escribe el nombre y un email válido.";return;}
    if(S.clients.some(c=>c.email.toLowerCase()===em.toLowerCase())){const x=$("#nc_err",m);x.hidden=false;x.textContent="Ya existe un cliente con ese email.";return;}
    const c=makeClient({nombre:n,email:em,telefono:$("#nc_t",m).value.trim(),sexo:$("#nc_s",m).value,edad:+$("#nc_a",m).value,altura:+$("#nc_h",m).value,peso:+$("#nc_w",m).value,programa:$("#nc_p",m).value,objetivo:$("#nc_o",m).value,disciplina:$("#nc_d",m).value});
    c.evol=[{fecha:today(),peso:c.peso}];
    S.clients.push(c); save(); closeModal(); go("ficha",{cid:c.id,tab:"datos"}); toast("Ficha creada · código "+c.codigo);
  });
}
function welcomeModal(c){
  const body=`Hola ${c.nombre.split(" ")[0]},\n\n¡Bienvenido/a a lunarranutrition! Ya tienes acceso a tu portal de cliente.\n\nEmail: ${c.email}\nCódigo de acceso: ${c.codigo}\n\nEn el portal encontrarás tu plan, tus recetas, tu entrenamiento y el check-in semanal. Cualquier duda, escríbeme a ${C.email} o al ${C.tel}.\n\nUn abrazo,\nLuis Parra`;
  const m=openModal(`<p class="eyebrow">Email de bienvenida</p><h2>${esc(c.nombre)}</h2><textarea readonly style="min-height:240px">${esc(body)}</textarea><div class="row"><button class="btn btn-primary btn-sm" id="wcCopy">Copiar texto</button><a class="btn btn-sm" href="mailto:${esc(c.email)}?subject=${encodeURIComponent("Tu acceso a lunarranutrition")}&body=${encodeURIComponent(body)}">Abrir en mi correo</a></div>`);
  $("#wcCopy",m).addEventListener("click",()=>copy(body));
}
function delClientModal(c){
  const m=openModal(`<h2>¿Eliminar a ${esc(c.nombre)}?</h2><p class="muted">Se borrarán su ficha, mediciones, check-ins y planes. No se puede deshacer.</p><div class="row"><button class="btn" data-close>Cancelar</button><button class="btn btn-primary" id="delOk" style="background:var(--bad);border-color:var(--bad)">Eliminar definitivamente</button></div>`);
  $("#delOk",m).addEventListener("click",()=>{ S.clients=S.clients.filter(x=>x!==c); save(); closeModal(); go("clientes"); toast("Cliente eliminado"); });
}

document.addEventListener("change",e=>{ if(!$("#appRoot").hidden && e.target.closest("#main")){
  const dn=e.target.closest("[data-done]");
  if(dn){ const c=me(); c.trainLog=c.trainLog||{}; if(dn.checked) c.trainLog[dn.dataset.done]=today(); else delete c.trainLog[dn.dataset.done]; save(); renderView(); return; }
  onFieldChange(e);
}});
document.addEventListener("click",e=>{
  if($("#appRoot").hidden) return;
  const t=e.target;
  const nav=t.closest("[data-nav]"); if(nav){ go(nav.dataset.nav); return; }
  const op=t.closest("[data-open]"); if(op){ go("ficha",{cid:op.dataset.open,tab:op.dataset.tab||"resumen"}); return; }
  const tb=t.closest("[data-tab]"); if(tb && view==="ficha"){ tab=tb.dataset.tab; day=0; week=1; renderView(); return; }
  const dy=t.closest("[data-day]"); if(dy){ day=+dy.dataset.day; renderView(); return; }
  const wk=t.closest("[data-week]"); if(wk){ week=+wk.dataset.week; renderView(); return; }
  const ro=t.closest("[data-ropen]"); if(ro){ recipeFilter.open = recipeFilter.open===ro.dataset.ropen?null:ro.dataset.ropen; renderView(); return; }
  const ij=t.closest("[data-inj]"); if(ij){ injSel=ij.dataset.inj; renderView(); return; }
  const rv=t.closest("[data-rev]"); if(rv){ const c=client(cid); const k=c.checkins[+rv.dataset.rev]; k.rev=!k.rev; save(); renderView(); return; }
  const de=t.closest("[data-delevol]"); if(de){ const c=target(); c.evol.splice(+de.dataset.delevol,1); save(); renderView(); return; }
  const pt=t.closest("[data-paytoggle]"); if(pt){ const c=client(pt.dataset.paytoggle); c.pago.estado=c.pago.estado==="pagado"?"pendiente":"pagado"; if(c.pago.estado==="pagado") c.pago.fecha=today(); save(); renderView(); toast(c.nombre+": "+(c.pago.estado==="pagado"?"pago confirmado":"pago pendiente")); return; }
  const a=t.closest("[data-act]"); if(!a) return;
  const act=a.dataset.act, c=target();
  if(act==="logout") logout();
  else if(act==="site") backToSite();
  else if(act==="newClient") newClientModal();
  else if(act==="genNutri"){ c.nutri=genNutri(c, c.id+Date.now()); if(c!==scratch) save(); day=0; renderView(); toast("Plan semanal generado: "+c.nutri.plan.unique+" recetas distintas"); }
  else if(act==="genTrain"){ c.train=genTrain(c); if(c!==scratch) save(); week=1; renderView(); toast("Programa generado"); }
  else if(act==="newCode"){ c.codigo=code(); save(); renderView(); toast("Nuevo código: "+c.codigo); }
  else if(act==="welcome") welcomeModal(c);
  else if(act==="delClient") delClientModal(c);
  else if(act==="bioNote"){ const v=$("#bioNote").value.trim(); if(!v) return; c.bio.hist=c.bio.hist||[]; c.bio.hist.push({fecha:today(),nota:v}); save(); renderView(); }
  else if(act==="addEvol"){
    const g=id=>{const v=$("#"+id).value;return v===""?null:parseFloat(v);};
    const rec={fecha:$("#ev_fecha").value||today(),peso:g("ev_peso"),grasa:g("ev_grasa"),cintura:g("ev_cintura"),cadera:g("ev_cadera"),brazo:g("ev_brazo"),muslo:g("ev_muslo")};
    if(rec.peso==null){ toast("Indica al menos el peso"); return; }
    c.evol.push(rec); c.evol.sort((x,y)=>x.fecha.localeCompare(y.fecha)); const last=c.evol[c.evol.length-1]; c.peso=last.peso; if(last.grasa) c.grasa=last.grasa; save(); renderView(); toast("Medición guardada");
  }
  else if(act==="checkin"){
    const v=id=>parseFloat($("#"+id).value);
    const peso=v("ck_peso"); if(!(peso>0)){ const x=$("#ck_err"); x.hidden=false; x.textContent="Indica tu peso de esta semana."; return; }
    const k={fecha:today(),peso,adh_d:v("ck_d")||0,adh_e:v("ck_e")||0,sueno:v("ck_s")||0,energia:v("ck_en")||0,estres:v("ck_es")||0,notas:$("#ck_n").value.trim(),rev:false};
    c.checkins.push(k); const cint=v("ck_cint"); c.evol.push({fecha:today(),peso,cintura:isNaN(cint)?null:cint}); c.peso=peso; save(); renderView(); toast("Check-in enviado a Luis");
  }
  else if(act==="pdf"){ if(view==="ficha"){ tab="informe"; renderView(); } else go(session.role==="client"?"informe":"informes"); }
  else if(act==="pdfGo"){
    const cc = session.role==="client"?me():(view==="ficha"?client(cid):client(toolId)||S.clients[0]);
    const opts={n:$("#pdf_n").checked&&hasNutri(cc), t:$("#pdf_t").checked&&hasTrain(cc), e:$("#pdf_e").checked, x:$("#pdf_x").checked};
    const msg=$("#pdfMsg"); msg.textContent="Generando informe…";
    window.LN_PDF.report(cc,opts).then(r=>{ msg.textContent=r; }).catch(err=>{ msg.textContent="No se pudo generar el PDF: "+(err&&err.message||err); });
  }
});

window.LN_APP = {openLogin};
window.LN_STATE = ()=>S;
window.LN_ME = {OBJ, PROG, PRICE, DIETA, fmt, fdate, hasNutri, hasTrain};
if(session) { /* sesión previa en esta pestaña: mantener la web pública hasta que se pulse Acceso */ }
})();
