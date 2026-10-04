/* lunarranutrition · web pública: programas, pago, FAQ, contacto, legal y cookies */
(function(){
"use strict";

/* ====== CONFIGURACIÓN: edita aquí tus datos ====== */
window.LN_CONFIG = {
  brand:"lunarranutrition",
  titular:"Luis Parra Navarro",
  nif:"",                                   /* añade tu NIF/DNI: lo exige la LSSI-CE en el aviso legal */
  email:"lunarranutrition@gmail.com",
  tel:"+34 658 408 486", telRaw:"34658408486",
  web:"lunarranutrition.com",
  actividad:"Servicios de nutrición y entrenamiento deportivo online",
  periodo:"mes",
  /* Enlaces de pago de Stripe (Stripe > Payment Links). Pega aquí cada URL https://buy.stripe.com/... */
  stripe:{ nutricion:"", entrenamiento:"", completo:"" }
};
const C = window.LN_CONFIG;

const PLANS = [
  {id:"nutricion", name:"Nutrición", price:99, intro:"Tu alimentación calculada, planificada y ajustada cada semana.",
   inc:["Valoración inicial y ficha completa","Calorías y macros con Mifflin-St Jeor","Plan de 3, 4 o 5 comidas al día","+100 recetas escaladas a tus macros","Adaptado a intolerancias y preferencias","Suplementación según tu objetivo","Check-in semanal y ajustes","Informe PDF y portal del cliente"],
   off:["Programa de entrenamiento","Readaptación de lesiones"]},
  {id:"entrenamiento", name:"Entrenamiento", price:99, intro:"Programación por disciplina con progresión real semana a semana.",
   inc:["Valoración inicial y ficha biomecánica","Hyrox, CrossFit, gimnasio o powerlifting","Series, repeticiones, RIR/RPE y descansos","Perfil de resistencia de cada ejercicio","Progresión y descargas planificadas","Protocolos de readaptación de lesiones","Check-in semanal y ajustes","Informe PDF y portal del cliente"],
   off:["Plan nutricional y recetas"]},
  {id:"completo", name:"Nutrición + Entrenamiento", price:149, featured:true, intro:"El método completo: comer y entrenar con el mismo objetivo.",
   inc:["Todo lo incluido en Nutrición","Todo lo incluido en Entrenamiento","Nutrición coordinada con tu carga de entrenamiento","Suplementación ajustada a tu disciplina","Seguimiento de evolución corporal completo","Respuesta prioritaria en 24 h laborables"],
   off:[], save:"Ahorras 49 € frente a contratarlos por separado"}
];
window.LN_PLANS = PLANS;

const $ = (s,el=document)=>el.querySelector(s);
const $$ = (s,el=document)=>[...el.querySelectorAll(s)];
const esc = s=>String(s==null?"":s).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
window.LN_UTIL = {$, $$, esc};

function toast(msg){
  const t=document.createElement("div");t.className="toast";t.textContent=msg;document.body.appendChild(t);
  setTimeout(()=>t.remove(),2600);
}
async function copy(text){
  try{ await navigator.clipboard.writeText(text); toast("Copiado: "+text); }
  catch(e){ toast("Selecciona y copia: "+text); }
}
window.LN_UTIL.toast = toast; window.LN_UTIL.copy = copy;

function openModal(html, wide){
  const root=$("#modalRoot");
  root.innerHTML='<div class="overlay" role="dialog" aria-modal="true"><div class="modal'+(wide?" wide":"")+'"><button class="btn btn-sm x" data-close aria-label="Cerrar">Cerrar</button>'+html+'</div></div>';
  const ov=root.firstElementChild;
  ov.addEventListener("click",e=>{ if(e.target===ov||e.target.closest("[data-close]")) closeModal(); });
  document.addEventListener("keydown",escClose);
  return ov.querySelector(".modal");
}
function escClose(e){ if(e.key==="Escape") closeModal(); }
function closeModal(){ $("#modalRoot").innerHTML=""; document.removeEventListener("keydown",escClose); }
window.LN_UTIL.openModal=openModal; window.LN_UTIL.closeModal=closeModal;

/* ====== Programas ====== */
function renderPlans(){
  $("#plans").innerHTML = PLANS.map(p=>`
    <article class="plan p-${p.id}${p.featured?" featured":""}">
      ${p.featured?'<span class="tag">Más completo</span>':""}
      <h3>${p.name}</h3>
      <p class="muted" style="font-size:.9rem">${p.intro}</p>
      <div class="price"><b>${p.price} €</b><span>/ ${C.periodo}</span></div>
      ${p.save?`<p style="font-size:.82rem;color:var(--accent)">${p.save}</p>`:""}
      <ul class="ticks">${p.inc.map(i=>`<li>${i}</li>`).join("")}${p.off.map(i=>`<li class="off">${i}</li>`).join("")}</ul>
      <button class="btn ${p.featured?"btn-primary":""}" data-buy="${p.id}">Empezar con ${p.name}</button>
    </article>`).join("");
}

/* ====== Pago ====== */
function checkout(planId){
  const p = PLANS.find(x=>x.id===planId);
  const m = openModal(`
    <p class="eyebrow">Contratar programa</p>
    <h2>${p.name} · ${p.price} €<span class="muted" style="font-size:.5em"> / ${C.periodo}</span></h2>
    <form class="form" id="coForm" novalidate>
      <div class="grid3">
        <label class="f">Nombre y apellidos<input id="co_name" autocomplete="name" required></label>
        <label class="f">Email<input id="co_email" type="email" autocomplete="email" required></label>
        <label class="f">Teléfono<input id="co_tel" type="tel" autocomplete="tel"></label>
      </div>
      <div>
        <p class="eyebrow" style="margin-bottom:8px">Método de pago</p>
        <div class="seg" role="group" aria-label="Método de pago">
          <button type="button" data-m="tarjeta" aria-pressed="true">Tarjeta · Stripe</button>
          <button type="button" data-m="transferencia" aria-pressed="false">Transferencia</button>
          <button type="button" data-m="bizum" aria-pressed="false">Bizum</button>
        </div>
      </div>
      <label class="check"><input type="checkbox" id="co_c1"><span>Acepto las <button type="button" class="btn-link" data-legal="condiciones">condiciones de contratación</button> y la <button type="button" class="btn-link" data-legal="privacidad">política de privacidad</button>.</span></label>
      <label class="check"><input type="checkbox" id="co_c2"><span>Doy mi consentimiento explícito para el tratamiento de mis datos de salud (peso, medidas, lesiones, patologías) con la única finalidad de elaborar y seguir mi plan (art. 9.2.a RGPD).</span></label>
      <label class="check"><input type="checkbox" id="co_c3"><span>Solicito que el servicio empiece de inmediato y entiendo que pierdo el derecho de desistimiento una vez entregado el plan (art. 103 TRLGDCU).</span></label>
      <p id="co_err" class="note warn" hidden></p>
      <button class="btn btn-primary" type="submit">Continuar con el pago</button>
      <div id="co_out"></div>
    </form>`);
  let method="tarjeta";
  $$(".seg button",m).forEach(b=>b.addEventListener("click",()=>{method=b.dataset.m;$$(".seg button",m).forEach(x=>x.setAttribute("aria-pressed",x===b));$("#co_out",m).innerHTML="";}));
  $("#coForm",m).addEventListener("submit",e=>{
    e.preventDefault();
    const name=$("#co_name",m).value.trim(), email=$("#co_email",m).value.trim(), tel=$("#co_tel",m).value.trim();
    const err=$("#co_err",m);
    if(!name||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){err.hidden=false;err.textContent="Escribe tu nombre y un email válido para enviarte el acceso a tu portal.";return;}
    if(!$("#co_c1",m).checked||!$("#co_c2",m).checked||!$("#co_c3",m).checked){err.hidden=false;err.textContent="Para continuar marca las tres casillas: condiciones, datos de salud e inicio inmediato del servicio.";return;}
    err.hidden=true;
    const ref = "LN-"+p.id.slice(0,5).toUpperCase()+"-"+name.split(" ")[0].toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    const out=$("#co_out",m);
    if(method==="tarjeta"){
      const link=C.stripe[p.id];
      out.innerHTML = link ? `<div class="paybox"><span class="big">Pago con tarjeta</span><p class="muted">Se abrirá la pasarela segura de Stripe en una pestaña nueva. Al completar el pago recibirás un email de confirmación y, en 24-48 h, el acceso a tu portal y el cuestionario inicial.</p><a class="btn btn-primary" href="${esc(link)}?prefilled_email=${encodeURIComponent(email)}&client_reference_id=${encodeURIComponent(ref)}" target="_blank" rel="noopener">Pagar ${p.price} € con Stripe</a></div>`
        : `<div class="paybox"><span class="big">Pago con tarjeta</span><p class="muted">El pago con tarjeta estará disponible muy pronto. Mientras tanto puedes pagar por transferencia o Bizum, o escribir a <b>${C.email}</b> y te envío un enlace de pago seguro de Stripe.</p></div>`;
    } else if(method==="transferencia"){
      const body=`Hola Luis, quiero contratar el programa ${p.name} (${p.price} €) y pagar por transferencia bancaria.\n\nNombre: ${name}\nEmail: ${email}\nTeléfono: ${tel||"-"}\nReferencia: ${ref}`;
      out.innerHTML=`<div class="paybox"><span class="big">Transferencia bancaria</span>
        <p class="muted">Envía este mensaje a <b>${C.email}</b> y te responderé con el número de cuenta y los pasos para completar la transferencia. Indica la referencia <b class="mono">${ref}</b> en el concepto.</p>
        <textarea id="co_mail" readonly style="min-height:120px">${esc(body)}</textarea>
        <div class="row"><button type="button" class="btn btn-primary btn-sm" id="co_copy">Copiar mensaje</button><button type="button" class="btn btn-sm" data-copy="${C.email}">Copiar email</button><a class="btn btn-sm" href="mailto:${C.email}?subject=${encodeURIComponent("Contratar "+p.name+" · "+ref)}&body=${encodeURIComponent(body)}">Abrir en mi correo</a></div></div>`;
      $("#co_copy",m).addEventListener("click",()=>copy(body));
    } else {
      const wa=`Hola Luis, he enviado ${p.price} € por Bizum para el programa ${p.name}. Referencia ${ref}. Nombre: ${name}. Email: ${email}.`;
      out.innerHTML=`<div class="paybox"><span class="big">Bizum</span>
        <div class="copyrow"><span>Importe</span><code>${p.price} €</code></div>
        <div class="copyrow"><span>Enviar a</span><code>${C.tel}</code><button type="button" class="btn btn-sm" data-copy="${C.telRaw.slice(2)}">Copiar</button></div>
        <div class="copyrow"><span>Concepto</span><code>${ref}</code><button type="button" class="btn btn-sm" data-copy="${ref}">Copiar</button></div>
        <p class="muted">Después envía el justificante por WhatsApp o a ${C.email}. Recibirás el acceso a tu portal y el cuestionario inicial en 24-48 h.</p>
        <a class="btn btn-primary btn-sm" href="https://wa.me/${C.telRaw}?text=${encodeURIComponent(wa)}" target="_blank" rel="noopener">Enviar justificante por WhatsApp</a></div>`;
    }
  });
}

/* ====== FAQ ====== */
const FAQ = [
  ["¿Cómo funciona una vez que pago?","<p>Recibes un email con el acceso a tu portal de cliente y el cuestionario inicial: datos, objetivos, historial de lesiones, horarios, preferencias y medidas. Con esa información hago tu valoración y en 48-72 horas tienes tu plan disponible en el portal y en PDF.</p>"],
  ["¿Qué diferencia hay entre los tres programas?","<p><b>Nutrición (99 €)</b> incluye el plan de alimentación con tus calorías, macros y recetas. <b>Entrenamiento (99 €)</b> incluye la programación por disciplina y la readaptación de lesiones. <b>Nutrición + Entrenamiento (149 €)</b> incluye ambos coordinados: la alimentación se ajusta a tu carga de entrenamiento y ahorras 49 €.</p>"],
  ["¿El pago es mensual? ¿Hay permanencia?","<p>Cada programa se paga por "+"mes"+" y no hay permanencia. Puedes renovar o dejarlo cuando quieras avisando antes del siguiente ciclo. Lo habitual es que los resultados sólidos lleguen a partir del tercer mes.</p>"],
  ["¿Cómo calculas mis calorías?","<p>Uso la ecuación de Mifflin-St Jeor, que es la más precisa en población general y es distinta para hombres y mujeres. A ese metabolismo basal le aplico tu factor de actividad y el ajuste según tu objetivo. Si conozco tu porcentaje de grasa, lo contrasto con Katch-McArdle y reviso la disponibilidad energética.</p><p>En personas con sobrepeso calculo la proteína sobre un peso de referencia ajustado para no sobrestimarla.</p>"],
  ["¿Tengo que pesar la comida?","<p>Al principio es lo más preciso: las recetas vienen en gramos exactos para tus macros. Con el tiempo aprenderás a estimar raciones y podremos pasar a medidas caseras si lo prefieres.</p>"],
  ["¿Y si soy vegetariano, vegano o tengo intolerancias?","<p>El plan se adapta a dietas omnívora, pescetariana, vegetariana y vegana, y puede excluir gluten, lactosa, frutos secos o soja. Las recetas se filtran automáticamente y se escalan igualmente a tus macros.</p>"],
  ["¿Puedo comer fuera o tener comidas libres?","<p>Sí. Te enseño a encajar comidas fuera dentro de tus macros semanales. Un plan que no puedes mantener no sirve.</p>"],
  ["¿Necesito ir a un gimnasio?","<p>Para gimnasio, powerlifting, CrossFit y Hyrox lo ideal es tener acceso a material. Si entrenas en casa o con poco equipamiento, adapto los ejercicios manteniendo el estímulo.</p>"],
  ["¿Qué significan RIR y RPE?","<p><b>RIR</b> son las repeticiones que te quedan en reserva al terminar una serie (RIR 2 = podrías hacer 2 más). <b>RPE</b> es el esfuerzo percibido de 1 a 10 (RPE 8 ≈ RIR 2). Así la intensidad se ajusta a cómo estás ese día.</p>"],
  ["¿Puedo seguir el programa si tengo una lesión?","<p>Sí. Registro tu historial biomecánico y, si hay una lesión frecuente en deportes de fuerza y resistencia (tendinopatías, lumbalgia, hombro, tobillo, isquios…), aplico un protocolo por fases con criterios para avanzar. No sustituye el diagnóstico de un fisioterapeuta o médico: si lo tienes, trabajo coordinado con ellos.</p>"],
  ["¿Trabajas con patologías como diabetes o hipotiroidismo?","<p>Sí, siempre con el diagnóstico y seguimiento de tu médico. Adapto la alimentación y el entrenamiento a sus indicaciones; no modifico tratamientos.</p>"],
  ["¿Necesito tomar suplementos?","<p>No son obligatorios. Solo recomiendo suplementos con evidencia sólida (creatina, cafeína, proteína, beta-alanina, entre otros) cuando aportan algo a tu objetivo, con la dosis calculada según tu peso y preferiblemente con certificado antidopaje.</p>"],
  ["¿Cada cuánto se revisa el plan?","<p>Cada semana haces un check-in en tu portal (peso, medidas, adherencia, sueño y energía). Con esos datos ajusto calorías, macros, volumen o intensidad cuando hace falta.</p>"],
  ["¿Qué métodos de pago aceptáis?","<p>Tarjeta de crédito o débito a través de Stripe, transferencia bancaria (te envío los datos por email) y Bizum al "+"+34 658 408 486"+".</p>"],
  ["¿Puedo cancelar y recuperar el dinero?","<p>Tienes 14 días de desistimiento, pero al tratarse de un servicio personalizado, si solicitas que empiece de inmediato el derecho se pierde una vez entregado el plan. Si cancelas antes de recibirlo, se devuelve el importe.</p>"],
  ["¿Mis datos de salud están protegidos?","<p>Sí. Solo se usan para elaborar y seguir tu plan, con tu consentimiento explícito. No se ceden a terceros y puedes pedir su acceso o supresión cuando quieras escribiendo a lunarranutrition@gmail.com.</p>"]
];
function renderFAQ(){
  const half=Math.ceil(FAQ.length/2);
  const col=a=>"<div>"+a.map(([q,a])=>`<details><summary>${q}</summary><div class="ans">${a}</div></details>`).join("")+"</div>";
  $("#faqList").innerHTML = col(FAQ.slice(0,half))+col(FAQ.slice(half));
}

/* ====== Textos legales ====== */
function legalHTML(k){
  const id = `<p><b>Titular:</b> ${C.titular}<br><b>NIF:</b> ${C.nif||"[pendiente de añadir]"}<br><b>Email:</b> ${C.email}<br><b>Teléfono:</b> ${C.tel}<br><b>Actividad:</b> ${C.actividad}<br><b>Sitio web:</b> ${C.web}</p>`;
  const L = {
  aviso:["Aviso legal",`
    <h3>1. Datos identificativos</h3><p>En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los datos del titular de este sitio web:</p>${id}
    <h3>2. Objeto</h3><p>Este sitio web ofrece información y contratación de servicios online de nutrición y entrenamiento deportivo, así como un área privada para clientes. El acceso implica la aceptación de este aviso legal.</p>
    <h3>3. Condiciones de uso</h3><p>El usuario se compromete a hacer un uso adecuado de los contenidos y a no emplearlos para actividades ilícitas. Las credenciales de acceso al área de clientes son personales e intransferibles.</p>
    <h3>4. Naturaleza de la información</h3><p>Los contenidos, planes y recomendaciones tienen carácter de educación nutricional y entrenamiento deportivo. No constituyen diagnóstico ni tratamiento médico y no sustituyen la consulta con profesionales sanitarios. Si tienes una patología, estás embarazada o tomas medicación, consulta con tu médico antes de empezar.</p>
    <h3>5. Propiedad intelectual e industrial</h3><p>La marca lunarranutrition, su logotipo, textos, recetas, programas, informes y diseño de la web son propiedad de ${C.titular} o se usan con autorización. Queda prohibida su reproducción, distribución o transformación sin autorización expresa.</p>
    <h3>6. Responsabilidad</h3><p>El titular no se responsabiliza del mal uso de los contenidos, de interrupciones técnicas ajenas ni de los contenidos de sitios enlazados de terceros.</p>
    <h3>7. Legislación aplicable</h3><p>Este aviso legal se rige por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales que correspondan conforme a la normativa de consumidores y usuarios.</p>`],
  privacidad:["Política de privacidad",`
    <h3>1. Responsable del tratamiento</h3>${id}
    <h3>2. Datos que tratamos</h3><p>Datos identificativos y de contacto; datos antropométricos y de salud (peso, medidas, composición corporal, lesiones, patologías, alergias, historial biomecánico); fotografías de progreso si decides aportarlas; datos de entrenamiento; datos de facturación. Los datos de tarjeta los gestiona directamente Stripe y no se almacenan en esta web.</p>
    <h3>3. Finalidades y base jurídica</h3>
    <table><tr><th>Finalidad</th><th>Base jurídica</th></tr>
    <tr><td>Responder a consultas de contacto</td><td>Consentimiento (art. 6.1.a RGPD)</td></tr>
    <tr><td>Prestar el servicio contratado: valoración, planes, seguimiento y portal de cliente</td><td>Ejecución del contrato (art. 6.1.b RGPD)</td></tr>
    <tr><td>Tratar datos de salud para elaborar el plan</td><td>Consentimiento explícito (art. 9.2.a RGPD)</td></tr>
    <tr><td>Facturación y obligaciones fiscales</td><td>Obligación legal (art. 6.1.c RGPD)</td></tr></table>
    <h3>4. Conservación</h3><p>Mientras dure la relación de servicio. Después, los datos de facturación se conservan durante los plazos legales (6 años, art. 30 del Código de Comercio). Los datos de salud se conservan hasta 12 meses tras finalizar el servicio para facilitar una posible reincorporación, salvo que solicites antes su supresión.</p>
    <h3>5. Destinatarios</h3><p>No se ceden datos a terceros salvo obligación legal. Proveedores que actúan como encargados del tratamiento: Stripe (pagos), proveedor de alojamiento web y proveedor de correo electrónico (Google). Algunos pueden realizar transferencias internacionales amparadas en el Marco de Privacidad de Datos UE-EE. UU. o en cláusulas contractuales tipo.</p>
    <h3>6. Derechos</h3><p>Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación, portabilidad y retirar tu consentimiento en cualquier momento escribiendo a ${C.email} con el asunto «Protección de datos». Si consideras que no se han atendido, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).</p>
    <h3>7. Menores</h3><p>Los servicios están dirigidos a mayores de 18 años. Personas de 14 a 17 años solo podrán contratar con autorización de sus padres o tutores.</p>
    <h3>8. Seguridad</h3><p>Se aplican medidas técnicas y organizativas adecuadas para proteger tus datos, especialmente los datos de salud: acceso restringido mediante credenciales personales y cifrado en tránsito.</p>`],
  cookies:["Política de cookies",`
    <h3>¿Qué son las cookies?</h3><p>Son pequeños archivos o mecanismos de almacenamiento que guarda tu navegador para recordar información sobre tu visita.</p>
    <h3>Cookies que usa esta web</h3>
    <table><tr><th>Nombre</th><th>Tipo</th><th>Finalidad</th><th>Duración</th></tr>
    <tr><td>ln_cookie_consent</td><td>Técnica, propia</td><td>Recordar tu elección sobre cookies</td><td>12 meses</td></tr>
    <tr><td>ln_session</td><td>Técnica, propia</td><td>Mantener la sesión en el área de clientes</td><td>Sesión</td></tr>
    <tr><td>ln_state</td><td>Técnica, propia</td><td>Guardar preferencias del portal</td><td>Persistente</td></tr></table>
    <p>Las cookies técnicas son necesarias y están exentas de consentimiento (art. 22.2 LSSI-CE). Actualmente no se usan cookies analíticas ni publicitarias. Si se incorporan en el futuro, solo se activarán con tu consentimiento previo.</p>
    <p>Al pagar con tarjeta, Stripe puede instalar sus propias cookies en su pasarela para prevenir el fraude, según su política de privacidad.</p>
    <h3>Cómo gestionarlas</h3><p>Puedes cambiar tu elección en «Configurar cookies» al pie de la web o eliminar las cookies desde la configuración de tu navegador.</p>`],
  condiciones:["Condiciones de contratación",`
    <h3>1. Prestador</h3>${id}
    <h3>2. Servicios y precios</h3><p>Nutrición: 99 € / ${C.periodo}. Entrenamiento: 99 € / ${C.periodo}. Nutrición + Entrenamiento: 149 € / ${C.periodo}. Los precios mostrados son el importe final a pagar.</p>
    <h3>3. Pago</h3><p>Tarjeta de crédito o débito mediante Stripe, transferencia bancaria (los datos se facilitan por email) o Bizum. El servicio se activa al confirmarse el pago.</p>
    <h3>4. Entrega</h3><p>El plan se entrega en el portal de cliente y en PDF en un plazo de 48-72 horas laborables desde la recepción del cuestionario inicial completo.</p>
    <h3>5. Duración y renovación</h3><p>Cada pago cubre un ciclo de un ${C.periodo}. No hay permanencia: la renovación es voluntaria y puedes dejar de renovar en cualquier momento.</p>
    <h3>6. Desistimiento</h3><p>Dispones de 14 días naturales para desistir. Si solicitas expresamente el inicio inmediato del servicio, perderás este derecho una vez entregado el plan personalizado (art. 103.a del Real Decreto Legislativo 1/2007, TRLGDCU). Si desistes antes de la entrega, se reembolsa el importe íntegro en un máximo de 14 días.</p>
    <h3>7. Obligaciones del cliente</h3><p>Facilitar información veraz sobre su estado de salud, lesiones y medicación, e informar de cualquier cambio. Se recomienda un reconocimiento médico antes de iniciar un programa de ejercicio.</p>
    <h3>8. Limitación</h3><p>Los resultados dependen de la adherencia y de factores individuales; no se garantiza un resultado concreto. El servicio no es un tratamiento sanitario.</p>`]
  };
  return L[k];
}
function openLegal(k){ const [t,h]=legalHTML(k); openModal(`<p class="eyebrow">Legal</p><h2>${t}</h2><div class="legal-text">${h}</div>`,true); }
window.LN_UTIL.openLegal = openLegal;

/* ====== Cookies ====== */
function store(k,v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } }
window.LN_UTIL.store = store;
function cookieBanner(force){
  if(!force && store("ln_cookie_consent")) return;
  const d=document.createElement("div"); d.className="cookie"; d.setAttribute("role","dialog"); d.setAttribute("aria-label","Aviso de cookies");
  d.innerHTML=`<b>Cookies</b><p class="muted">Usamos solo cookies técnicas necesarias para que la web y el área de clientes funcionen. No usamos cookies de análisis ni de publicidad. <button class="btn-link" data-legal="cookies">Más información</button></p>
    <div class="row"><button class="btn btn-primary btn-sm" data-ck="all">Aceptar</button><button class="btn btn-sm" data-ck="tech">Rechazar las no necesarias</button><button class="btn btn-sm" data-legal="cookies">Configurar</button></div>`;
  document.body.appendChild(d);
  d.addEventListener("click",e=>{const b=e.target.closest("[data-ck]"); if(!b) return; store("ln_cookie_consent",b.dataset.ck+"|"+new Date().toISOString().slice(0,10)); d.remove(); toast("Preferencias de cookies guardadas");});
}

/* ====== Contacto ====== */
function contact(){
  $("#contactForm").addEventListener("submit",e=>{
    e.preventDefault();
    const n=$("#cf_name").value.trim(), em=$("#cf_email").value.trim(), pl=$("#cf_plan").value, msg=$("#cf_msg").value.trim(), out=$("#cf_out");
    if(!n||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){out.innerHTML='<p class="note warn">Escribe tu nombre y un email válido.</p>';return;}
    if(!$("#cf_ok").checked){out.innerHTML='<p class="note warn">Acepta la política de privacidad para continuar.</p>';return;}
    const body=`Nombre: ${n}\nEmail: ${em}\nPrograma: ${pl}\n\n${msg}`;
    out.innerHTML=`<div class="paybox"><p>Tu mensaje está listo. Envíalo a <b>${C.email}</b> o por WhatsApp:</p><div class="row"><a class="btn btn-primary btn-sm" href="mailto:${C.email}?subject=${encodeURIComponent("Consulta · "+pl)}&body=${encodeURIComponent(body)}">Abrir en mi correo</a><a class="btn btn-sm" href="https://wa.me/${C.telRaw}?text=${encodeURIComponent(body)}" target="_blank" rel="noopener">Enviar por WhatsApp</a><button type="button" class="btn btn-sm" id="cf_copy">Copiar mensaje</button></div></div>`;
    $("#cf_copy").addEventListener("click",()=>copy(body));
  });
}

/* ====== Eventos globales ====== */
document.addEventListener("click",e=>{
  const t=e.target;
  const buy=t.closest("[data-buy]"); if(buy){ checkout(buy.dataset.buy); return; }
  const lg=t.closest("[data-legal]"); if(lg){ e.preventDefault(); openLegal(lg.dataset.legal); return; }
  const cp=t.closest("[data-copy]"); if(cp){ copy(cp.dataset.copy); return; }
  const lo=t.closest("[data-open-login]"); if(lo){ e.preventDefault(); $("#nav").classList.remove("open"); window.LN_APP && window.LN_APP.openLogin(); return; }
  if(t.closest("#nav a")) $("#nav").classList.remove("open");
});
$("#menuBtn").addEventListener("click",()=>{const n=$("#nav");n.classList.toggle("open");$("#menuBtn").setAttribute("aria-expanded",n.classList.contains("open"));});
$("#cookieSettings").addEventListener("click",()=>{ $$(".cookie").forEach(x=>x.remove()); cookieBanner(true); });
$("#yr").textContent = new Date().getFullYear();
renderPlans(); renderFAQ(); contact(); cookieBanner();
})();
