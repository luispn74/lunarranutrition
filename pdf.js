/* lunarranutrition · informes PDF con marca (jsPDF + AutoTable) */
(function(){
"use strict";
const L=window.LN, C=window.LN_CONFIG, INJ=window.LN_INJURIES, SUP=window.LN_SUPPS;
const {fmt,fdate,OBJ,PROG,DIETA,hasNutri,hasTrain}=window.LN_ME;
const clean=s=>String(s==null?"":s).replace(/≈/g,"aprox.").replace(/≤/g,"<=").replace(/≥/g,">=").replace(/−/g,"-").replace(/→/g,"->").replace(/[  ]/g," ");
const INK=[17,17,19], GREY=[105,105,114], ACC=[200,16,46], ORA=[17,17,19], LINE=[217,216,211], ZEBRA=[245,245,243];
const M=16, W=210, H=297;

async function dataURL(path){
  try{ const r=await fetch(path); if(!r.ok) return null; const b=await r.blob();
    return await new Promise(res=>{const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=()=>res(null); fr.readAsDataURL(b);}); }catch(e){ return null; }
}

async function report(c, opts){
  if(!window.jspdf) throw new Error("no se ha cargado la librería de PDF; revisa tu conexión");
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({unit:"mm",format:"a4"});
  const [logoW, markB]=await Promise.all([dataURL("assets/logo-full-white.png"), dataURL("assets/mark-black.png")]);
  let y=0;

  /* Portada */
  doc.setFillColor(10,10,10); doc.rect(0,0,W,H,"F"); doc.setFillColor(200,16,46); doc.rect(0,0,W,4,"F"); doc.rect(0,H-4,W,4,"F");
  if(logoW) doc.addImage(logoW,"PNG",45,62,120,120*579/900);
  else { doc.setTextColor(255); doc.setFont("times","normal"); doc.setFontSize(34); doc.text("lunarranutrition",W/2,120,{align:"center"}); }
  doc.setFillColor(...ACC); doc.rect(70,163,23,1.2,"F"); doc.setFillColor(245,245,245); doc.rect(93.5,163,23,1.2,"F"); doc.setFillColor(...ACC); doc.rect(117,163,23,1.2,"F");
  doc.setTextColor(227,18,31); doc.setFont("helvetica","normal"); doc.setFontSize(9);
  doc.text("I N F O R M E   P E R S O N A L I Z A D O",W/2,172,{align:"center"});
  doc.setTextColor(255); doc.setFont("times","normal"); doc.setFontSize(28); doc.text(clean(c.nombre),W/2,188,{align:"center"});
  doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(190);
  doc.text(clean(PROG[c.programa]+"  ·  "+OBJ[c.objetivo]+"  ·  "+L.DISC[c.disciplina]),W/2,198,{align:"center"});
  doc.text("Fecha del informe: "+fdate(new Date().toISOString().slice(0,10)),W/2,205,{align:"center"});
  doc.setFontSize(8.5); doc.setTextColor(150);
  doc.text(clean(C.titular+"  ·  Dietista - Entrenador personal"),W/2,272,{align:"center"});
  doc.text(C.email+"  ·  "+C.tel+"  ·  "+C.web,W/2,278,{align:"center"});

  const page=()=>{ doc.addPage(); y=30; };
  const need=h=>{ if(y+h>H-22) page(); };
  const title=(t,sub)=>{ need(28); doc.setFont("times","normal"); doc.setFontSize(19); doc.setTextColor(...INK); doc.text(clean(t),M,y); y+=3;
    doc.setDrawColor(...ACC); doc.setLineWidth(0.6); doc.line(M,y,W-M,y); y+=6;
    if(sub){ doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(...GREY); const l=doc.splitTextToSize(clean(sub),W-2*M); doc.text(l,M,y); y+=l.length*4+3; } };
  const sub=t=>{ need(14); doc.setFont("helvetica","bold"); doc.setFontSize(10.5); doc.setTextColor(...ACC); doc.text(clean(t),M,y); y+=5; };
  const para=(t,color)=>{ doc.setFont("helvetica","normal"); doc.setFontSize(8.8); doc.setTextColor(...(color||GREY)); const l=doc.splitTextToSize(clean(t),W-2*M); need(l.length*4.1+2); doc.text(l,M,y); y+=l.length*4.1+2; };
  const table=(head,body,extra)=>{
    doc.autoTable(Object.assign({startY:y,head:head?[head.map(clean)]:undefined,body:body.map(r=>r.map(v=>typeof v==="object"&&v!==null?Object.assign({},v,{content:clean(v.content)}):clean(v))),
      margin:{left:M,right:M,top:28,bottom:22},theme:"plain",
      styles:{font:"helvetica",fontSize:8.3,cellPadding:{top:1.8,bottom:1.8,left:2.2,right:2.2},textColor:INK,lineColor:LINE,lineWidth:{bottom:0.2},valign:"top"},
      headStyles:{fillColor:ACC,textColor:255,fontStyle:"bold",fontSize:7.8},alternateRowStyles:{fillColor:ZEBRA}},extra||{}));
    y=doc.lastAutoTable.finalY+7;
  };

  /* 1. Datos */
  page();
  title("Datos y objetivos","Ficha del cliente a fecha de este informe.");
  const r=c.restr||{}; const rs=[r.sg&&"sin gluten",r.sl&&"sin lactosa",r.sf&&"sin frutos secos",r.ss&&"sin soja"].filter(Boolean).join(", ")||"ninguna";
  table(null,[["Nombre",c.nombre],["Programa",PROG[c.programa]],["Objetivo",OBJ[c.objetivo]],["Disciplina y nivel",L.DISC[c.disciplina]+" · "+L.LEVEL[c.nivel]],
    ["Sexo y edad",(c.sexo==="h"?"Hombre":"Mujer")+" · "+c.edad+" años"],["Altura y peso",c.altura+" cm · "+fmt(c.peso,1)+" kg"+(c.grasa?" · "+fmt(c.grasa,1)+" % grasa":"")],
    ["Dieta",DIETA[c.dieta]+" · restricciones: "+rs],["Alergias e intolerancias",c.alergias||"Ninguna indicada"],["Patologías",c.patologias||"Ninguna indicada"]],
    {columnStyles:{0:{fontStyle:"bold",cellWidth:52}}});

  /* 2. Nutrición */
  if(opts.n){
    const n=L.calcNutrition(c);
    title("Plan nutricional","Calorías calculadas con la ecuación de Mifflin-St Jeor, específica para "+(c.sexo==="h"?"hombres":"mujeres")+", con factor de actividad y ajuste por objetivo.");
    para("TMB = 10 x "+fmt(c.peso,1)+" + 6,25 x "+c.altura+" - 5 x "+c.edad+(c.sexo==="h"?" + 5":" - 161")+" = "+fmt(n.bmr)+" kcal",INK);
    table(["Concepto","Valor"],[["Metabolismo basal (TMB)",fmt(n.bmr)+" kcal"],["Gasto energético total (TMB x "+String(c.actividad).replace(".",",")+")",fmt(n.tdee)+" kcal"],
      ["Ajuste por objetivo ("+OBJ[c.objetivo]+")",(n.goal.adj>0?"+":"")+Math.round(n.goal.adj*100)+" %"],[{content:"Calorías objetivo",styles:{fontStyle:"bold"}},{content:fmt(n.kcal)+" kcal/día",styles:{fontStyle:"bold"}}],
      ["Proteína",n.p+" g ("+fmt(n.p/n.refW,1)+" g/kg · "+n.pct.p+" %)"],["Hidratos de carbono",n.c+" g ("+fmt(n.c/n.refW,1)+" g/kg · "+n.pct.c+" %)"],["Grasas",n.f+" g ("+fmt(n.f/n.refW,1)+" g/kg · "+n.pct.f+" %)"],
      ["Fibra",n.fib+" g"],["Agua",fmt(n.agua,1)+" L + 0,5-0,75 L por hora de entrenamiento"]],{columnStyles:{0:{cellWidth:95}}});
    n.warnings.forEach(w=>para("Nota: "+w,ACC));
    if(c.nutri){
      const {plan,targets}=c.nutri;
      title("Plan semanal ("+plan.n+" comidas al día)","Cantidades escaladas a tus macros. Objetivo diario: "+fmt(targets.kcal)+" kcal · P "+targets.p+" g · H "+targets.c+" g · G "+targets.f+" g.");
      const body=[];
      plan.days.forEach(d=>{
        d.meals.forEach((m,i)=>body.push([i===0?{content:d.day,styles:{fontStyle:"bold"}}:"",m.label,L.RECIPES.find(x=>x.id===m.recipe).name,fmt(m.tot.kcal),fmt(m.tot.p),fmt(m.tot.c),fmt(m.tot.f)]));
        body.push([{content:"",styles:{fillColor:[246,228,230]}},{content:"Total "+d.day.toLowerCase(),colSpan:2,styles:{fontStyle:"bold",fillColor:[246,228,230]}},...["kcal","p","c","f"].map(k=>({content:fmt(d.tot[k]),styles:{fontStyle:"bold",fillColor:[246,228,230]}}))]);
      });
      table(["Día","Comida","Receta","kcal","Prot.","HC","Grasa"],body,{columnStyles:{0:{cellWidth:20},1:{cellWidth:32},3:{halign:"right",cellWidth:14},4:{halign:"right",cellWidth:13},5:{halign:"right",cellWidth:13},6:{halign:"right",cellWidth:13}}});
      title("Recetas del plan","Cada receta con las cantidades de su primera aparición en la semana.");
      const seen=new Set();
      plan.days.forEach(d=>d.meals.forEach(m=>{
        if(seen.has(m.recipe)) return; seen.add(m.recipe);
        const rr=L.RECIPES.find(x=>x.id===m.recipe);
        const ings=m.ings.filter(i=>i.key!=="especias").map(i=>"- "+fmt(i.g)+" g "+L.food(i.key).name.toLowerCase()+L.unitHint(i.key,i.g));
        if(m.ings.some(i=>i.key==="especias")) ings.push("- Especias y hierbas al gusto");
        const ml=doc.splitTextToSize(clean(rr.method),W-2*M);
        need(14+ings.length*4+ml.length*4);
        doc.setFont("times","normal"); doc.setFontSize(12.5); doc.setTextColor(...INK); doc.text(clean(rr.name),M,y); y+=4.5;
        doc.setFont("helvetica","normal"); doc.setFontSize(7.8); doc.setTextColor(...ACC);
        doc.text(clean(m.label+"  ·  "+fmt(m.tot.kcal)+" kcal  ·  P "+fmt(m.tot.p)+" g  ·  HC "+fmt(m.tot.c)+" g  ·  G "+fmt(m.tot.f)+" g  ·  "+rr.tags.join(", ")),M,y); y+=4.5;
        doc.setFontSize(8.5); doc.setTextColor(...INK); ings.forEach(t=>{ doc.text(clean(t),M+2,y); y+=3.9; });
        doc.setTextColor(...GREY); doc.text(ml,M,y+1); y+=ml.length*3.9+5;
        doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(M,y-2.5,W-M,y-2.5); y+=1.5;
      }));
      title("Lista de la compra semanal");
      const tot={}; plan.days.forEach(d=>d.meals.forEach(m=>m.ings.forEach(i=>{ if(i.key!=="especias") tot[i.key]=(tot[i.key]||0)+i.g; })));
      const rows=Object.entries(tot).sort((a,b)=>b[1]-a[1]).map(([k,g])=>[L.food(k).name,g>=1000?fmt(g/1000,2)+" kg":fmt(g)+" g"]);
      const half=Math.ceil(rows.length/2), two=[]; for(let i=0;i<half;i++) two.push([...(rows[i]||["",""]),...(rows[i+half]||["",""])]);
      table(["Alimento","Cantidad","Alimento","Cantidad"],two,{columnStyles:{1:{halign:"right"},3:{halign:"right"}}});
    }
  }

  /* 3. Entrenamiento */
  if(opts.t && c.train){
    const t=c.train;
    title("Programa de entrenamiento",t.title+". Nivel "+L.LEVEL[t.params.nivel].toLowerCase()+". RIR = repeticiones en reserva; RPE = esfuerzo percibido de 1 a 10.");
    table(["RPE","RIR","Sensación"],L.RPE_TABLE.map(r=>[r[0],r[1],r[2]]),{columnStyles:{0:{cellWidth:16},1:{cellWidth:16}}});
    t.weeks.forEach(w=>{
      sub("Semana "+w.n+" · "+w.fase); para(w.nota);
      w.sessions.forEach(s=>{
        need(30);
        table(null,[[{content:s.name,colSpan:5,styles:{fillColor:ORA,textColor:255,fontStyle:"bold"}}],
          [{content:"Ejercicio",styles:{fontStyle:"bold",fillColor:[246,228,230]}},{content:"Series x reps",styles:{fontStyle:"bold",fillColor:[246,228,230]}},{content:"Intensidad",styles:{fontStyle:"bold",fillColor:[246,228,230]}},{content:"Descanso",styles:{fontStyle:"bold",fillColor:[246,228,230]}},{content:"Perfil de resistencia",styles:{fontStyle:"bold",fillColor:[246,228,230]}}],
          ...s.items.map(it=>[it.name,(it.sets>1?it.sets+" x ":"")+it.reps,it.int,it.rest,it.perfil||"-"])].concat(s.metcon?[[{content:s.metcon,colSpan:5,styles:{textColor:ACC,fontStyle:"italic"}}]]:[]),
          {columnStyles:{0:{cellWidth:52},1:{cellWidth:28},3:{cellWidth:20}},alternateRowStyles:{}});
      });
    });
  }

  /* 4. Evolución */
  if(opts.e && c.evol.length){
    title("Evolución corporal","Mediciones registradas desde el inicio del programa.");
    const pts=c.evol.filter(e=>e.peso!=null);
    if(pts.length>1){
      need(70); const x0=M+12,x1=W-M,y0=y+4,y1=y+52;
      let mn=Math.min(...pts.map(p=>p.peso)),mx=Math.max(...pts.map(p=>p.peso)); const pad=Math.max((mx-mn)*0.15,0.5); mn-=pad; mx+=pad;
      const X=i=>x0+i*(x1-x0)/(pts.length-1), Y=v=>y0+(mx-v)*(y1-y0)/(mx-mn);
      doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.setFontSize(7); doc.setTextColor(...GREY);
      [mn,(mn+mx)/2,mx].forEach(v=>{ doc.line(x0,Y(v),x1,Y(v)); doc.text(fmt(v,1),M,Y(v)+1); });
      doc.setDrawColor(...ACC); doc.setLineWidth(0.7);
      for(let i=1;i<pts.length;i++) doc.line(X(i-1),Y(pts[i-1].peso),X(i),Y(pts[i].peso));
      doc.setFillColor(...ACC); pts.forEach((p,i)=>doc.circle(X(i),Y(p.peso),i===pts.length-1?1.3:0.7,"F"));
      doc.text(fdate(pts[0].fecha),x0,y1+5); doc.text(fdate(pts[pts.length-1].fecha),x1,y1+5,{align:"right"});
      doc.setFontSize(8.5); doc.setTextColor(...INK); const d=pts[pts.length-1].peso-pts[0].peso;
      doc.text(clean("Peso: "+fmt(pts[0].peso,1)+" kg -> "+fmt(pts[pts.length-1].peso,1)+" kg ("+(d>0?"+":"")+fmt(d,1)+" kg)"),x0,y-1);
      y=y1+11;
    }
    table(["Fecha","Peso","% grasa","Cintura","Cadera","Brazo","Muslo"],c.evol.map(e=>[fdate(e.fecha),fmt(e.peso,1),fmt(e.grasa,1),fmt(e.cintura,1),fmt(e.cadera,1),fmt(e.brazo,1),fmt(e.muslo,1)]),
      {columnStyles:{1:{halign:"right"},2:{halign:"right"},3:{halign:"right"},4:{halign:"right"},5:{halign:"right"},6:{halign:"right"}}});
  }

  /* 5. Lesiones y suplementación */
  if(opts.x){
    if(c.lesion){
      const inj=INJ.find(i=>i.id===c.lesion.id);
      title("Readaptación: "+inj.name,"Fase actual: "+inj.phases[c.lesion.fase][0]+". Evidencia: "+inj.ref+".");
      table(["Fase","Duración","Objetivo","Ejercicios","Para avanzar"],inj.phases.map((p,i)=>[i===c.lesion.fase?{content:p[0]+" (actual)",styles:{fontStyle:"bold",textColor:ACC}}:p[0],p[1],p[2],p[3],p[4]]),{columnStyles:{0:{cellWidth:28},1:{cellWidth:20}}});
      para("Acude a un profesional sanitario si aparece dolor nocturno o en reposo intenso, inflamación importante, pérdida de fuerza u hormigueo.");
    }
    if(c.supps&&c.supps.length){
      title("Suplementación","Solo suplementos con evidencia científica (AIS, ISSN). Dosis calculadas para "+fmt(c.peso,1)+" kg.");
      table(["Suplemento","Evidencia","Dosis","Notas"],SUP.filter(s=>c.supps.includes(s.id)).map(s=>[s.name,s.ev==="A"?"Grupo A":"Grupo B",s.dose(c.peso),s.note]),{columnStyles:{0:{cellWidth:38},1:{cellWidth:20}}});
    }
  }
  need(24); y+=2;
  para("Este informe es personal e intransferible y forma parte del servicio de "+C.brand+". Su contenido es educativo y deportivo y no sustituye el consejo de profesionales sanitarios. Ante cualquier cambio en tu salud, avisa antes de continuar.");

  /* Cabecera y pie */
  const N=doc.getNumberOfPages();
  for(let p=2;p<=N;p++){
    doc.setPage(p);
    if(markB) doc.addImage(markB,"PNG",M,10,9,9*219/240);
    doc.setFont("times","normal"); doc.setFontSize(12); doc.setTextColor(...INK); doc.text("lunarranutrition",M+12,16.5);
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...GREY); doc.text(clean(c.nombre),W-M,16.5,{align:"right"});
    doc.setDrawColor(...ACC); doc.setLineWidth(0.5); doc.line(M,21,W-M,21);
    doc.setDrawColor(...LINE); doc.line(M,H-14,W-M,H-14);
    doc.text(C.email+"  ·  "+C.tel,M,H-9); doc.text("Página "+p+" de "+N,W-M,H-9,{align:"right"});
  }

  const filename="lunarranutrition-"+c.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-")+"-"+new Date().toISOString().slice(0,10)+".pdf";
  const blob=doc.output("blob");
  if(window.claude && typeof window.claude.use==="function"){
    const dl=await window.claude.use("downloads").catch(()=>null);
    if(!dl) return "La descarga no está disponible en esta vista.";
    try{ await dl.save({filename,data:blob}); return "Informe listo: "+filename+" ("+N+" páginas)."; }
    catch(e){ return e&&e.code==="declined" ? "Descarga cancelada." : "No se pudo guardar el archivo ("+(e&&e.code||"error")+")."; }
  }
  doc.save(filename);
  return "Informe descargado: "+filename+" ("+N+" páginas).";
}
window.LN_PDF={report};
})();
