/* lunarranutrition · motor de cálculo: nutrición (Mifflin-St Jeor), recetas escaladas y programación de entrenamiento */
(function(){
"use strict";
const F = window.LN_FOODS, EX = window.LN_EXERCISES;
const NUTR = ["kcal","p","c","f","fib","ca","fe","mg","k","vc"];
const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));
const r1 = v=>Math.round(v*10)/10;

function food(k){const a=F[k];return {key:k,name:a[0],kcal:a[1],p:a[2],c:a[3],f:a[4],fib:a[5],ca:a[6],fe:a[7],mg:a[8],k:a[9],vc:a[10],flags:a[11]};}
function sumIngr(ings){const t={};NUTR.forEach(n=>t[n]=0);ings.forEach(i=>{const fd=food(i.key);NUTR.forEach(n=>t[n]+=fd[n]*i.g/100);});return t;}

/* ---------- Recetas ---------- */
const FISH = ["salmon","merluza","dorada","bacalao","atun","sardinas","gambas","calamar","mejillones"];
const RECIPES = window.LN_RECIPES_RAW.map((r,i)=>{
  const ings = r[2].split(",").map(p=>{const [k,g]=p.split(":");return {key:k,g:+g};});
  const flags = ings.map(x=>F[x.key][11]).join("");
  const meat = flags.includes("m"), egg = flags.includes("h"), dairy = flags.includes("d"), honey = flags.includes("n");
  const vegan = !meat && !egg && !dairy && !honey, veg = !meat;
  const tot = sumIngr(ings);
  const tags = [];
  if (vegan) tags.push("vegano"); else if (veg) tags.push("vegetariano");
  if (!flags.includes("g")) tags.push("sin gluten");
  if (!dairy) tags.push("sin lactosa");
  if (tot.p >= 30) tags.push("alto en proteína");
  if (tot.fib >= 8) tags.push("alto en fibra");
  if (flags.includes("f")) tags.push("contiene frutos secos");
  return {id:"r"+(i+1), name:r[0], cat:r[1], ings, method:r[3], tags, tot, vegan, veg, gluten:flags.includes("g"), dairy, nuts:flags.includes("f"), soy:flags.includes("s"), fish:ings.some(x=>FISH.includes(x.key))};
});
const CAT = {d:"Desayuno", s:"Snack · pre/post", c:"Comida", n:"Cena"};

function fitsPrefs(r,p){
  p = p || {};
  if (p.dieta==="vegano" && !r.vegan) return false;
  if (p.dieta==="vegetariano" && !r.veg) return false;
  if (p.dieta==="pescetariano" && !r.veg && !r.fish) return false;
  if (p.sg && r.gluten) return false;
  if (p.sl && r.dairy) return false;
  if (p.sf && r.nuts) return false;
  if (p.ss && r.soy) return false;
  return true;
}

/* Escalado en dos grupos: fuentes de proteína (factor a) y resto energético (factor b).
   Las verduras se mantienen para conservar volumen y micronutrientes. Resuelve a·Pa+b·Pb=Pt y a·Ka+b·Kb=Kt. */
function scaleRecipe(r, t){
  let Ka=0,Pa=0,Kb=0,Pb=0,Kc=0,Pc=0;
  const g = r.ings.map(i=>{
    const fd = food(i.key);
    const isP = fd.p>=8 && fd.p*4 >= 0.35*fd.kcal;
    const isV = !isP && fd.kcal < 45;
    const kc = fd.kcal*i.g/100, pr = fd.p*i.g/100;
    const grp = isP?"A":isV?"C":"B";
    if (grp==="A"){Ka+=kc;Pa+=pr;} else if (grp==="B"){Kb+=kc;Pb+=pr;} else {Kc+=kc;Pc+=pr;}
    return {key:i.key,g:i.g,grp};
  });
  const Kt = Math.max(t.kcal-Kc, t.kcal*0.4), Pt = Math.max(t.p-Pc, 1);
  let a=1,b=1;
  const det = Pa*Kb - Pb*Ka;
  if (Ka>0 && Kb>0 && Math.abs(det)>1e-6){
    a = clamp((Pt*Kb - Pb*Kt)/det, 0.5, 3);
    b = clamp((Kt - a*Ka)/Kb, 0.3, 3);
  } else {
    const s = clamp(Kt/((Ka+Kb)||1), 0.4, 3); a=b=s;
  }
  const ings = g.map(i=>{
    const f = i.grp==="A"?a:i.grp==="B"?b:1;
    let v = i.g*f;
    if (i.key==="aceite") v = Math.max(3, Math.round(Math.min(v, Math.max(i.g*1.5, 10))));
    else if (i.key==="especias") v = i.g;
    else if (v<20) v = Math.max(1, Math.round(v));
    else v = Math.round(v/5)*5;
    return {key:i.key, g:v};
  });
  return {ings, tot:sumIngr(ings), a, b};
}

function unitHint(key,g){
  if (key==="huevo") return " (≈ "+Math.max(1,Math.round(g/60))+" ud.)";
  if (key==="claras") return " (≈ "+Math.max(1,Math.round(g/33))+" claras)";
  if (key==="aceite") return " (≈ "+r1(g/10)+" cdas.)";
  if (key==="platano") return " (≈ "+r1(g/120)+" ud.)";
  return "";
}

/* ---------- Nutrición: Mifflin-St Jeor ---------- */
const ACT = [[1.2,"Sedentario: trabajo sentado y poco ejercicio"],[1.375,"Ligero: 1-3 entrenamientos/semana"],[1.55,"Moderado: 3-5 entrenamientos/semana"],[1.725,"Alto: 6-7 entrenamientos/semana"],[1.9,"Muy alto: doble sesión o trabajo físico"]];
const GOALS = {
  perdida:{name:"Pérdida de grasa",adj:-0.20,p:2.2,txt:"Déficit del 20 %: pérdida estimada de 0,5-1 % del peso por semana."},
  recomposicion:{name:"Recomposición corporal",adj:-0.10,p:2.2,txt:"Déficit ligero del 10 % con proteína alta para ganar músculo mientras se pierde grasa."},
  mantenimiento:{name:"Mantenimiento y salud",adj:0,p:1.8,txt:"Calorías de mantenimiento para consolidar hábitos."},
  hipertrofia:{name:"Ganancia muscular",adj:0.10,p:2.0,txt:"Superávit del 10 %: ganancia de 0,25-0,5 % del peso por semana."},
  rendimiento:{name:"Rendimiento deportivo",adj:0.05,p:1.8,txt:"Ligero superávit y prioridad a los carbohidratos para sostener el volumen."}
};
function mifflin(c){ return 10*c.peso + 6.25*c.altura - 5*c.edad + (c.sexo==="h"?5:-161); }

function calcNutrition(c){
  const bmr = mifflin(c), tdee = bmr*c.actividad, g = GOALS[c.objetivo]||GOALS.mantenimiento;
  const hm = c.altura/100, imc = c.peso/(hm*hm), ideal = 25*hm*hm;
  const refW = imc>25 ? ideal + 0.4*(c.peso-ideal) : c.peso;
  const warnings = [];
  let kcal = Math.round(tdee*(1+g.adj)/10)*10;
  const floor = c.sexo==="h"?1500:1200;
  if (kcal<floor){ kcal=floor; warnings.push("Se ha aplicado el mínimo de seguridad de "+floor+" kcal para "+(c.sexo==="h"?"hombres":"mujeres")+"."); }
  if (kcal<bmr) warnings.push("Las calorías objetivo quedan por debajo del metabolismo basal. Revisar energía, sueño y rendimiento en 2-3 semanas.");
  const p = Math.round(g.p*refW);
  const fgk = c.sexo==="m"?0.9:0.8;
  let f = Math.round(Math.min(Math.max(fgk*refW, kcal*0.25/9), kcal*0.35/9));
  let carb = Math.round((kcal - p*4 - f*9)/4);
  if (carb<100){ f = Math.round(Math.max(0.6*refW, kcal*0.2/9)); carb = Math.round((kcal-p*4-f*9)/4); warnings.push("Hidratos bajos para el gasto: se ha reducido la grasa al mínimo recomendable."); }
  let katch=null, ea=null, lbm=null;
  if (c.grasa>0){
    lbm = c.peso*(1-c.grasa/100);
    katch = 370 + 21.6*lbm;
    const eee = Math.max(0, tdee - bmr*1.2);
    ea = (kcal - eee)/lbm;
    if (ea<30) warnings.push("Disponibilidad energética estimada de "+Math.round(ea)+" kcal/kg de masa libre de grasa (< 30). Riesgo de déficit energético relativo (RED-S)"+(c.sexo==="m"?", especialmente relevante en mujeres: vigilar ciclo menstrual, energía y rendimiento.":"."));
  }
  return {bmr, tdee, kcal, p, c:carb, f, fib:Math.round(kcal/1000*14), agua:r1(c.peso*0.035), refW, imc, ideal, warnings, katch, ea, lbm, goal:g,
    pct:{p:Math.round(p*4/kcal*100), c:Math.round(carb*4/kcal*100), f:Math.round(f*9/kcal*100)}};
}

const SPLITS = {
  3:[["Desayuno","d",.30],["Comida","c",.40],["Cena","n",.30]],
  4:[["Desayuno","d",.25],["Comida","c",.35],["Merienda","s",.15],["Cena","n",.25]],
  5:[["Desayuno","d",.20],["Media mañana","s",.10],["Comida","c",.30],["Merienda / pre-entreno","s",.15],["Cena","n",.25]]
};
const DAYS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
function hash(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let s=seed||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}

function buildMealPlan(t, n, prefs, seed){
  const split = SPLITS[n]||SPLITS[4], R = rng(hash(seed)), used = {};
  const days = DAYS.map(day=>{
    const meals = split.map(([label,cat,frac])=>{
      const mt = {kcal:t.kcal*frac, p:t.p*frac, c:t.c*frac, f:t.f*frac};
      let cands = RECIPES.filter(r=>r.cat===cat && fitsPrefs(r,prefs));
      if (cands.length<4){
        const alt = cat==="n"?["n","c"]:cat==="c"?["c","n"]:["s","d"];
        cands = RECIPES.filter(r=>alt.includes(r.cat) && fitsPrefs(r,prefs));
      }
      if (!cands.length) cands = RECIPES.filter(r=>fitsPrefs(r,prefs));
      if (!cands.length) cands = RECIPES;
      let best=null, bestS=1e9;
      cands.forEach(r=>{
        const s = scaleRecipe(r, mt), x = s.tot;
        const err = Math.abs(x.kcal-mt.kcal)/mt.kcal + Math.abs(x.p-mt.p)/mt.p + .5*Math.abs(x.c-mt.c)/(mt.c+10) + .5*Math.abs(x.f-mt.f)/(mt.f+5) + (used[r.id]||0)*.7 + R()*.18;
        if (err<bestS){bestS=err;best={r,s};}
      });
      used[best.r.id]=(used[best.r.id]||0)+1;
      return {label, cat, target:mt, recipe:best.r.id, ings:best.s.ings, tot:best.s.tot};
    });
    const tot={};NUTR.forEach(k=>tot[k]=meals.reduce((a,m)=>a+m.tot[k],0));
    return {day, meals, tot};
  });
  return {n, days, unique:Object.keys(used).length};
}

/* ---------- Entrenamiento ---------- */
const COMPOUND = ["sq","fsq","hsq","lp","bss","lun","dl","sdl","rdl","ht","bp","ibp","ohp","pu","row","dip","pause_sq","cgbp","def_dl","pc","sn","thr"];
const DISC = {gimnasio:"Gimnasio · hipertrofia", powerlifting:"Powerlifting", crossfit:"CrossFit", hyrox:"Hyrox"};
const LEVEL = {principiante:"Principiante", intermedio:"Intermedio", avanzado:"Avanzado"};
const RPE_TABLE = [["10","0","Máximo: no podrías hacer otra repetición"],["9,5","0-1","Quizá una más"],["9","1","Una repetición en reserva"],["8,5","1-2","Una, quizá dos"],["8","2","Dos en reserva"],["7","3","Tres en reserva: velocidad aún alta"],["6","4","Calentamiento pesado / técnica"],["5","5+","Descarga o recuperación"]];

function exItem(ex, sets, reps, intensity, extra){
  const e = EX[ex]||[ex,"","","",""];
  const comp = COMPOUND.includes(ex);
  return Object.assign({ex, name:e[0], sets, reps, int:intensity, rest:comp?"2-3 min":"60-90 s", perfil:e[3], cue:e[4], musc:e[2]}, extra||{});
}
const round25 = v=>Math.round(v/2.5)*2.5;

const GYM = {
  FA:["Full body A",[["sq",3,"6-8"],["bp",3,"6-8"],["row",3,"8-10"],["rdl",3,"8-10"],["lr",2,"12-15"],["plk",3,"30-45 s"]]],
  FB:["Full body B",[["dl",3,"5"],["ohp",3,"6-8"],["pu",3,"6-10"],["bss",3,"8-10"],["fly",2,"12-15"],["bc",2,"10-12"]]],
  FC:["Full body C",[["fsq",3,"8"],["ibp",3,"8-10"],["crow",3,"10-12"],["ht",3,"8-10"],["lc",3,"10-12"],["tpd",2,"12"]]],
  UA:["Torso A",[["bp",4,"6-8"],["row",4,"8"],["ohp",3,"8-10"],["lpd",3,"10-12"],["lr",3,"12-15"],["bc",2,"10-12"],["tpd",2,"10-12"]]],
  LA:["Pierna A",[["sq",4,"6-8"],["rdl",3,"8-10"],["lp",3,"10-12"],["lc",3,"10-12"],["cr",4,"10-15"],["plk",3,"45 s"]]],
  UB:["Torso B",[["ibp",4,"8-10"],["pu",4,"6-10"],["dbr",3,"10"],["dip",3,"8-12"],["fp",3,"15"],["bc",3,"12"],["tpd",3,"12"]]],
  LB:["Pierna B",[["dl",3,"5"],["bss",3,"8-10"],["ht",4,"8-10"],["le",3,"12-15"],["slc",3,"10-12"],["cr",4,"12"],["pal",3,"12"]]],
  PU:["Empuje",[["bp",4,"6-8"],["ibp",3,"8-10"],["ohp",3,"8-10"],["lr",4,"12-15"],["dip",3,"10"],["tpd",3,"12"]]],
  PL:["Tirón",[["pu",4,"6-10"],["row",4,"8"],["crow",3,"10-12"],["fp",3,"15"],["bc",3,"10-12"]]],
  LG:["Pierna",[["sq",4,"6-8"],["rdl",3,"8-10"],["lp",3,"10-12"],["lc",3,"10-12"],["le",3,"12-15"],["cr",4,"12"]]]
};
const GYM_DAYS = {2:["FA","FB"],3:["FA","FB","FC"],4:["UA","LA","UB","LB"],5:["UA","LA","PU","PL","LG"],6:["PU","PL","LG","PU","PL","LG"]};

function phaseOf(w,N){
  const deload = N>=4 && w===N;
  const trainW = deload?N-1:N;
  const frac = trainW>1 ? (w-1)/(trainW-1) : 0;
  return {deload, frac};
}

function genGym(o){
  const weeks=[];
  for (let w=1; w<=o.semanas; w++){
    const {deload,frac} = phaseOf(w,o.semanas);
    let rir = deload?4:Math.round(3-2*frac);
    if (o.nivel==="principiante" && !deload) rir+=1;
    const extraSet = !deload && frac>0.5 ? 1 : 0;
    const fase = deload?"Descarga":frac<0.34?"Adaptación y técnica":frac<0.67?"Acumulación":"Intensificación";
    const sessions = (GYM_DAYS[o.dias]||GYM_DAYS[4]).map((k,i)=>{
      const [name,items] = GYM[k];
      return {name:"Día "+(i+1)+" · "+name, focus:"Hipertrofia", items:items.map(([ex,s,reps])=>{
        let sets = s + extraSet;
        if (o.nivel==="principiante") sets=Math.max(2,sets-1);
        if (o.nivel==="avanzado" && COMPOUND.includes(ex) && !deload) sets+=1;
        if (deload) sets=Math.max(2,Math.ceil(s*0.6));
        const myRir = COMPOUND.includes(ex)? rir : Math.max(0,rir-1);
        return exItem(ex,sets,reps,"RIR "+myRir);
      })};
    });
    weeks.push({n:w, fase, nota: deload?"Reduce series un 40 % y mantén las cargas: consolidar adaptaciones.":"Cuando completes el rango alto de repeticiones con el RIR indicado, sube la carga un 2,5-5 %.", sessions});
  }
  return weeks;
}

function genPL(o){
  const rm = o.rm||{};
  const kg = (lift,pct)=> rm[lift]>0 ? " · "+round25(rm[lift]*pct/100)+" kg" : "";
  const weeks=[];
  for (let w=1; w<=o.semanas; w++){
    const {deload,frac} = phaseOf(w,o.semanas);
    const pct = deload?60:round25(70+frac*22);
    const reps = frac<0.4?6:frac<0.75?4:2;
    const sets = frac<0.75?4:3;
    const rpe = Math.round((7+frac*2)*2)/2;
    const fase = deload?"Descarga / test":frac<0.4?"Acumulación":frac<0.75?"Intensificación":"Realización";
    const main = (ex,lift)=> deload ? exItem(ex,3,"3","60 % · RPE 5-6"+kg(lift,60)) : exItem(ex,sets,String(reps),pct+" % · RPE "+String(rpe).replace(".",",")+kg(lift,pct),{rest:"3-5 min"});
    const light = (ex,lift)=> exItem(ex,3,String(reps+2),(pct-15)+" % · RPE 6-7"+kg(lift,pct-15));
    const acc = (ex,s,r,i)=>exItem(ex,deload?2:s,r,i||"RIR 2");
    const D = {
      A:{name:"Sentadilla pesada",items:[main("sq","sq"),light("bp","bp"),acc("rdl",3,"8"),acc("plk",3,"45 s","—")]},
      B:{name:"Press banca pesado",items:[main("bp","bp"),acc("ohp",3,"8","RPE 7"),acc("row",4,"8"),acc("tpd",3,"12")]},
      C:{name:"Peso muerto pesado",items:[main("dl","dl"),exItem("pause_sq",3,"4",(pct-10)+" % · RPE 7"+kg("sq",pct-10)),acc("lb",3,"10"),acc("pal",3,"12","—")]},
      D:{name:"Variantes y espalda",items:[exItem("cgbp",4,"6","RPE 7-8"+kg("bp",pct-12)),acc("pu",4,"6-8"),acc("dbr",3,"10"),acc("fp",3,"15"),acc("bc",3,"12")]},
      E:{name:"Volumen",items:[exItem("fsq",3,"5","RPE 7"),exItem("bp",4,"8",(pct-17.5)+" % · RPE 7"+kg("bp",pct-17.5)),acc("def_dl",3,"4","RPE 7"),acc("cr",3,"12")]},
      BD:{name:"Banca + peso muerto",items:[main("bp","bp"),main("dl","dl"),acc("row",4,"8"),acc("fp",3,"15")]},
      SL:{name:"Técnica y volumen",items:[exItem("pause_sq",3,"4",(pct-10)+" % · RPE 7"+kg("sq",pct-10)),exItem("cgbp",3,"6","RPE 7"),acc("lb",3,"10"),acc("lr",3,"15")]}
    };
    const order = {3:["A","BD","SL"],4:["A","B","C","D"],5:["A","B","C","D","E"],6:["A","B","C","D","E"],2:["A","BD"]}[o.dias]||["A","B","C","D"];
    weeks.push({n:w, fase, nota: deload?"Semana de descarga o test de 1RM. Si testeas, calienta progresivamente hasta un RPE 9-9,5.":"Las cargas en kg se calculan desde tu 1RM. Ajusta si el RPE real se desvía más de 1 punto.",
      sessions:order.map((k,i)=>({name:"Día "+(i+1)+" · "+D[k].name, focus:"Fuerza", items:D[k].items}))});
  }
  return weeks;
}

const METCONS = [
  {name:"21-15-9",fmt:"Por tiempo (time cap 10 min)",items:[["thr","21-15-9","43/30 kg"],["pu","21-15-9","Dominadas"]]},
  {name:"AMRAP 12",fmt:"Máximas rondas en 12 min",items:[["wb","10","9/6 kg"],["kbs","10","24/16 kg"],["run","200 m",""]]},
  {name:"EMOM 16",fmt:"Cada minuto, 4 rondas",items:[["bike","12/9 cal","Min 1"],["t2b","10","Min 2"],["pc","6","Min 3 · 60/40 kg"],["du","40","Min 4"]]},
  {name:"5 rondas",fmt:"Por tiempo (time cap 20 min)",items:[["run","400 m",""],["kbs","15","24/16 kg"],["bbj","10","Burpees"]]},
  {name:"Chipper",fmt:"Por tiempo (time cap 18 min)",items:[["du","50",""],["wb","40","9/6 kg"],["kbs","30","24/16 kg"],["t2b","20",""],["pc","10","60/40 kg"]]},
  {name:"Intervalos 4 × 3 min",fmt:"3 min trabajo / 1 min descanso",items:[["rw","250 m",""],["sn","5","40/30 kg"],["bmu","Máx. repeticiones","Resto del minuto"]]},
  {name:"AMRAP 20 aeróbico",fmt:"Ritmo constante, RPE 7",items:[["ski","15 cal",""],["lun","20","Zancadas"],["hspu","5","Escalar con pica"],["run","200 m",""]]},
  {name:"Couplet pesado",fmt:"Por tiempo (time cap 8 min)",items:[["dl","5-10-15","100/70 kg"],["bbj","15-10-5","Burpees sobre la barra"]]}
];
function genCF(o){
  const strength=[["sq","sq"],["dl","dl"],["ohp","ohp"],["pc",null],["fsq","sq"],["sn",null]];
  const skills=["du","t2b","hspu","bmu","pu"];
  const weeks=[];
  for (let w=1; w<=o.semanas; w++){
    const {deload,frac}=phaseOf(w,o.semanas);
    const pct = deload?60:round25(65+frac*20);
    const reps = frac<0.5?5:3;
    const fase = deload?"Descarga":frac<0.34?"Base":frac<0.67?"Construcción":"Pico";
    const sessions=[];
    for (let d=0; d<o.dias; d++){
      const [sx] = strength[(d+w)%strength.length];
      const oly = sx==="pc"||sx==="sn";
      const st = oly ? exItem(sx,deload?6:10,"EMOM · 2 reps",(deload?"RPE 6":"RPE "+(7+Math.round(frac*2)))) : exItem(sx,deload?3:5,String(reps),pct+" % · RPE "+(deload?"6":7+Math.round(frac*2)));
      const sk = exItem(skills[(d+w*2)%skills.length],10,"EMOM · técnica","Calidad, sin fatiga",{rest:"—"});
      const m = METCONS[(w*o.dias+d)%METCONS.length];
      const metItems = m.items.map(([ex,reps,note])=>exItem(ex,1,reps,note||"—",{rest:"—"}));
      sessions.push({name:"Día "+(d+1)+" · "+(EX[sx]?EX[sx][0]:"Fuerza")+" + "+m.name, focus:"CrossFit",
        items:[st, sk].concat(metItems),
        metcon: deload ? "Metcon suave: "+m.fmt+" al 60-70 % del esfuerzo" : m.fmt+" · objetivo RPE "+(frac<0.5?"7-8":"8-9")+". Escala cargas un 30 % o sustituye gimnásticos si es necesario."});
    }
    weeks.push({n:w, fase, nota: deload?"Reduce intensidad y volumen; prioriza movilidad y técnica.":"Fuerza en porcentaje de 1RM, habilidad gimnástica y metcon. Registra tiempos para comparar.", sessions});
  }
  return weeks;
}

function genHyrox(o){
  const H = window.LN_HYROX[(o.hyroxCat||"open")+"_"+(o.sexo==="m"?"m":"h")];
  const weeks=[];
  for (let w=1; w<=o.semanas; w++){
    const {deload,frac}=phaseOf(w,o.semanas);
    const vol = deload?0.6:1;
    const ints = deload?3:4+Math.round(frac*4);
    const z2 = Math.round((40+frac*30)*vol);
    const rounds = deload?2:3+Math.round(frac*3);
    const fase = deload?"Descarga":frac<0.34?"Base aeróbica y fuerza":frac<0.67?"Específico":"Simulación";
    const S = {
      F:{name:"Fuerza + estaciones",items:[exItem("sq",deload?2:4,"6","RPE "+(deload?6:7+Math.round(frac))),exItem("rdl",3,"8","RIR 2"),
        exItem("sp",4,"25 m","Carga "+H.sp+(deload?"":" +10-20 %"),{rest:"90 s"}),exItem("spl",4,"25 m","Carga "+H.spl,{rest:"90 s"}),
        exItem("cc",4,"50 m",H.cc,{rest:"60 s"}),exItem("wb",3,"20","Balón "+H.wb,{rest:"60 s"})]},
      I:{name:"Intervalos de carrera",items:[exItem("run",ints,"1 km","Ritmo objetivo de competición · RPE 8",{rest:"90 s"}),exItem("ski",3,"250 m","RPE 8",{rest:"60 s"})]},
      C:{name:"Carrera comprometida",items:[exItem("run",rounds,"1 km","Ritmo de carrera tras estación",{rest:"—"}),exItem("ski",1,"500 m","Alterna estación en cada ronda",{rest:"—"}),exItem("wb",1,"30","Balón "+H.wb,{rest:"—"}),exItem("bbj",1,"40 m","Burpee broad jump",{rest:"—"}),exItem("rw",1,"500 m","Remo",{rest:"—"})]},
      Z:{name:"Zona 2",items:[exItem("run",1,z2+" min","Zona 2 · puedes mantener una conversación",{rest:"—"})]},
      F2:{name:"Fuerza B + motor",items:[exItem("fsq",deload?2:3,"6","RPE 7"),exItem("ht",3,"10","RIR 2"),exItem("pu",3,"8","RIR 2"),exItem("sbl",3,"20 m","Saco "+H.sbl,{rest:"90 s"}),exItem("ski",5,"1 min","RPE 8 · 1 min descanso",{rest:"60 s"})]},
      SIM:{name:frac>0.85?"Simulación completa":"Media simulación",items:(frac>0.85?[["ski","1000 m"],["sp","50 m"],["spl","50 m"],["bbj","80 m"],["rw","1000 m"],["cc","200 m"],["sbl","100 m"],["wb","100 reps"]]:[["ski","1000 m"],["sp","50 m"],["bbj","80 m"],["wb","50 reps"]])
        .map(([ex,d])=>exItem(ex,1,"1 km carrera + "+d,"Ritmo de competición",{rest:"—"}))}
    };
    const base = {2:["F","I"],3:["F","I","C"],4:["F","I","Z","C"],5:["F","I","Z","F2","C"],6:["F","I","Z","F2","C","Z"]}[o.dias]||["F","I","Z","C"];
    const order = base.slice();
    if (!deload && frac>=0.6) order[order.length-1]="SIM";
    weeks.push({n:w, fase, nota:"Pesos de la categoría "+(o.hyroxCat==="pro"?"Pro":"Open")+" "+(o.sexo==="m"?"femenina":"masculina")+". Recorrido oficial: 8 × 1 km + SkiErg 1000 m, empuje 50 m, arrastre 50 m, burpee broad jump 80 m, remo 1000 m, granjero 200 m, zancadas 100 m y 100 wall balls.",
      sessions:order.map((k,i)=>({name:"Día "+(i+1)+" · "+S[k].name, focus:"Hyrox", items:S[k].items}))});
  }
  return weeks;
}

function genTraining(o){
  o = Object.assign({disciplina:"gimnasio",nivel:"intermedio",dias:4,semanas:6,sexo:"h",hyroxCat:"open",rm:{}},o);
  o.dias=+o.dias; o.semanas=+o.semanas;
  const fn = {gimnasio:genGym, powerlifting:genPL, crossfit:genCF, hyrox:genHyrox}[o.disciplina]||genGym;
  return {params:o, title:DISC[o.disciplina]+" · "+o.dias+" días · "+o.semanas+" semanas", weeks:fn(o), created:new Date().toISOString().slice(0,10)};
}

window.LN = {food, sumIngr, RECIPES, CAT, fitsPrefs, scaleRecipe, unitHint, ACT, GOALS, mifflin, calcNutrition, SPLITS, DAYS, buildMealPlan, genTraining, DISC, LEVEL, RPE_TABLE, NUTR, r1};
})();
