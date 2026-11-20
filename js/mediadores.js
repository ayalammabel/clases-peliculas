(() => {
  const rootId = 'mediadores-content';
  const state = {exercise:'recorrido', mode:'Trayectoria', stage:0, finding:0, quote:0};
  const phases = ['Antes','Primer contacto','Durante','Inmediatamente después','Tiempo después'];
  const stages = {Trayectoria:['Punto de partida','Descubrimientos','Lo que moviliza','Lo que transforma','Lo que permanece'], Proyección:['Mantener','Transformar','Explorar']};
  let recorrido=[], trayectoria=[], loaded=false;
  const safe = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const root = () => document.getElementById(rootId);
  async function load(){
    if(loaded) return;
    try {
      const [a,b]=await Promise.all(['data/mediadores-recorrido.json','data/mediadores-trayectoria.json'].map(async u=>{const r=await fetch(u);if(!r.ok)throw Error(u);return r.json()}));
      recorrido=a; trayectoria=b; loaded=true; render();
    } catch(e){root().innerHTML='<p class="medi-error">No se pudieron cargar los resultados de Mediadores. Comprueba que los archivos JSON estén en la carpeta data.</p>'; console.error(e)}
  }
  function records(){
    if(state.exercise==='recorrido')return recorrido.filter(x=>x.submomento===phases[state.stage]);
    return trayectoria.filter(x=>x.tipo===state.mode&&x.componente===stages[state.mode][state.stage]);
  }
  function selectStage(i){state.stage=i;state.finding=0;state.quote=0;render()}
  function selectFinding(i){state.finding=i;state.quote=0;render()}
  function render(){
    const el=root(); if(!el||!loaded)return;
    const isRec=state.exercise==='recorrido';
    const names=isRec?phases:stages[state.mode];
    state.stage=Math.min(state.stage,names.length-1);
    const items=records();state.finding=Math.min(state.finding,Math.max(0,items.length-1));
    const selected=items[state.finding];
    const quotes=selected?.testimonios||[];
    state.quote=Math.min(state.quote,Math.max(0,quotes.length-1));
    const q=quotes[state.quote];
    const count= isRec ? (selected?.frecuencia ?? quotes.length) : (selected?.frecuenciaAportes ?? quotes.length);
    const title=x=>isRec?x.tema:x.hallazgo;
    const reading=x=>isRec?x.lectura:x.lecturaInterpretativa;
    const detail=selected?`<p class="medi-kicker">${isRec?'CATEGORÍA':'HALLAZGO'}</p>
       <h3>${safe(title(selected))}</h3><p class="medi-reading">${safe(reading(selected))}</p>
       <p class="medi-frequency">${safe(count)} ${isRec?'asociaciones de segmentos':'aportes'}${isRec&&selected.numeroMediadores!=null?' · '+safe(selected.numeroMediadores)+' mediadores distintos':''}</p>
       <p class="medi-quote-label">${isRec?'TESTIMONIOS DE MEDIADORES':'APORTES ORIGINALES DE LOS MAPAS'}</p>
       ${q?`<blockquote class="medi-quote"><p>“${safe(q.texto)}”</p><cite>${isRec?'Mediador '+safe(q.idMediador)+' · '+safe(q.idSegmento):'Mapa '+safe(q.mapa)+(q.idMediador?' · Mediador '+safe(q.idMediador):' · Aporte sin identificación individual')}</cite></blockquote>
       <div class="medi-carousel"><button type="button" data-medi-prev ${state.quote===0?'disabled':''}>← Anterior</button><span>${state.quote+1} de ${quotes.length}</span><button type="button" data-medi-next ${state.quote===quotes.length-1?'disabled':''}>Siguiente →</button></div>
       ${isRec&&q.textoOriginalCompleto?`<details class="medi-full"><summary>Ver transcripción original completa</summary><p>${safe(q.textoOriginalCompleto)}</p></details>`:''}
       `:'<p>No hay aportes registrados para este hallazgo.</p>'}`:'<p>Sin hallazgos para este componente.</p>';
    el.innerHTML=`<div class="medi-intro"><p class="section-label">${isRec?'Momento 1':'Momento 2'}</p><h2>${isRec?'Cartografía de la mediación':'Mapa de trayectoria'}</h2><p>${isRec?'Cinco momentos del encuentro, con categorías y testimonios de mediadores.':'Explora los aprendizajes de la trayectoria y las propuestas para fortalecer la experiencia.'}</p></div>
       ${!isRec?`<div class="medi-modes"><button type="button" data-medi-mode="Trayectoria" class="${state.mode==='Trayectoria'?'is-active':''}">Trayectoria</button><button type="button" data-medi-mode="Proyección" class="${state.mode==='Proyección'?'is-active':''}">Proyección</button></div>`:''}
       <div class="medi-route" aria-label="Componentes del ${isRec?'recorrido':'mapa'}"><div class="medi-route-line"></div>${names.map((n,i)=>`<button type="button" class="medi-stop ${i===state.stage?'is-active':''}" data-medi-stage="${i}" aria-pressed="${i===state.stage}"><span class="medi-pin"><span></span></span><span>${safe(n)}</span></button>`).join('')}</div>
       <div class="medi-explorer"><aside class="medi-sidebar"><p class="medi-kicker">${isRec?'CATEGORÍAS':'HALLAZGOS'}</p><h3>${safe(names[state.stage])}</h3><p>${items.length} ${isRec?'categorías':'hallazgos'} identificados</p><div class="medi-finding-list">${items.map((x,i)=>`<button type="button" data-medi-finding="${i}" class="${i===state.finding?'is-active':''}" aria-pressed="${i===state.finding}">${safe(title(x))}</button>`).join('')}</div></aside><article class="medi-detail">${detail}</article></div>`;
    el.querySelectorAll('[data-medi-stage]').forEach(b=>b.addEventListener('click',()=>selectStage(+b.dataset.mediStage)));
    el.querySelectorAll('[data-medi-finding]').forEach(b=>b.addEventListener('click',()=>selectFinding(+b.dataset.mediFinding)));
    el.querySelectorAll('[data-medi-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mediMode;selectStage(0)}));
    el.querySelector('[data-medi-prev]')?.addEventListener('click',()=>{state.quote--;render()});
    el.querySelector('[data-medi-next]')?.addEventListener('click',()=>{state.quote++;render()});
  }
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[data-medi-exercise]').forEach(b=>b.addEventListener('click',()=>{
      state.exercise=b.dataset.mediExercise;state.stage=0;state.finding=0;state.quote=0;
      document.querySelectorAll('[data-medi-exercise]').forEach(t=>{const a=t===b;t.classList.toggle('is-active',a);t.setAttribute('aria-selected',a)});
      render();
    }));
    document.querySelector('[data-view="mediadores"].view-link')?.addEventListener('click',load);
    if(location.hash==='#mediadores')load();
  });
})();
