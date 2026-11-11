/* Shared page interactions: language, module selection and figure enlargement. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const setText = (id, value) => { const element = $(id); if (element) element.textContent = value; };
  const setHTML = (id, value) => { const element = $(id); if (element) element.innerHTML = value; };
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const colors = {analytics:'#294d6b',retrieval:'#446d68',court:'#a38349',exams:'#7e3043',knowledge:'#66587b'};
  const extra = {
    en:{foundation:'Shared database',platform:'Big-data teaching platform',heroCaption:'Five teaching capabilities, supported by one shared foundation.',question:'THE DESIGN QUESTION',role:'MY CONTRIBUTION',lab:'SPATIAL ORGANISATION / CONCEPT',architecture:'PLATFORM DESIGN',module:'MODULE STRUCTURE',journey:'TEACHING & ASSESSMENT',focus:'DESIGN FOCUS',connections:'CONNECTIONS',enlarge:'Enlarge figure',close:'Close figure',zoomIn:'Zoom in',zoomOut:'Zoom out',reset:'Reset zoom',footer:'Visual portfolio concept · based on the project description',modules:'Module designs',skip:'Skip to the solution',pageNav:'Page navigation',labLabels:['Analysis studio','Business-process studio','Mock-court space','Shared learning infrastructure'],labSubs:['Visual exploration & analytical methods','Request preparation & procedural practice','Case selection, roles & simulated hearings','Shared database + teaching platform'],labTags:['INFORMATION TECHNOLOGY','REGULATORY / COMPLIANCE','LAW-RELATED TEACHING','COMMON FOUNDATION'],labSmall:['Workstations & discussion','Documents · procedure · handoff','Case-based role participation','Interactive exams span the learning activities'],figureConcept:'Schematic only · room dimensions and equipment quantities are not specified',moduleCaption:'Activity structure / design explanation'},
    fr:{foundation:'Base de données commune',platform:'Plateforme pédagogique de données',heroCaption:'Cinq capacités pédagogiques sur un socle commun.',question:'LA QUESTION DE CONCEPTION',role:'MA CONTRIBUTION',lab:'ORGANISATION DES ESPACES / CONCEPT',architecture:'CONCEPTION DE LA PLATEFORME',module:'STRUCTURE DU MODULE',journey:'APPRENTISSAGE ET ÉVALUATION',focus:'OBJECTIF DE CONCEPTION',connections:'LIENS',enlarge:'Agrandir le schéma',close:'Fermer le schéma',zoomIn:'Agrandir',zoomOut:'Réduire',reset:'Réinitialiser le zoom',footer:'Concept de portfolio visuel · fondé sur la description du projet',modules:'Conception des modules',skip:'Aller à la solution',pageNav:'Navigation de la page',labLabels:['Atelier d’analyse','Atelier des procédures métier','Espace de procès simulé','Infrastructure pédagogique commune'],labSubs:['Exploration visuelle et méthodes d’analyse','Préparation des demandes et pratique des procédures','Sélection des cas, rôles et audiences simulées','Base de données et plateforme pédagogique'],labTags:['TECHNOLOGIES DE L’INFORMATION','RÉGULATION / CONFORMITÉ','ENSEIGNEMENT JURIDIQUE','SOCLE COMMUN'],labSmall:['Postes de travail et échanges','Documents · procédure · transmission','Participation par rôles autour d’un cas','Les examens interactifs accompagnent les activités'],figureConcept:'Schéma de principe · dimensions et quantités d’équipements non précisées',moduleCaption:'Structure de l’activité / explication de la conception'},
    zh:{foundation:'共用数据库',platform:'大数据信息化教学平台',heroCaption:'五个教学模块，依托同一套数据与平台底座。',question:'方案设计的出发点',role:'我的项目职责',lab:'空间组织 / 概念示意',architecture:'平台总体设计',module:'模块内部结构',journey:'教学与考核关系',focus:'设计重点',connections:'与其他模块的衔接',enlarge:'放大查看',close:'关闭图示',zoomIn:'放大',zoomOut:'缩小',reset:'重置缩放',footer:'图解式作品集概念稿 · 基于项目描述整理',modules:'模块设计',skip:'跳转至方案正文',pageNav:'页面导航',labLabels:['可视化分析教学区','业务流程实训区','模拟法庭教学区','共用教学基础设施'],labSubs:['可视化探索与分析方法训练','调取材料准备与流程操作训练','案例选择、角色分配与庭审模拟','共用数据库与大数据信息化教学平台'],labTags:['信息技术专业','监管 / 合规业务场景','政法专业','共同底座'],labSmall:['分析工位与交流讨论','材料 · 流程 · 数据衔接','围绕案例的角色参与','动态交互考试贯穿相关教学活动'],figureConcept:'概念分区示意 · 未指定真实空间尺寸与设备数量',moduleCaption:'教学活动结构 / 设计说明'}
  };
  let language = window.SOLUTION_NAVIGATION.language, selected = 'retrieval', figure = null, zoom = 1, trigger = null, svgSerial = 0;
  const copy = () => window.SOLUTION_COPY[language];
  const caseStudy = () => window.SOLUTION_CASE_STUDY[language];
  const text = () => extra[language];
  const uid = prefix => `${prefix}-${++svgSerial}`;
  function lines(x,y,values,klass='',lineHeight=21){return `<text x="${x}" y="${y}" class="${klass}">${values.map((value,i)=>`<tspan x="${x}" dy="${i?lineHeight:0}">${escape(value)}</tspan>`).join('')}</text>`;}
  function wrap(value,limit){
    const words = language==='zh'?Array.from(value):value.split(/\s+/), result=[];let line='';
    for(const word of words){const next=line+(line&&language!=='zh'?' ':'')+word;if(next.length>limit&&line){result.push(line);line=word;}else line=next;}
    if(line)result.push(line);return result;
  }
  function desk(x,y,tint){
    return `<g transform="translate(${x} ${y})" class="lab-furniture"><rect x="3" y="9" width="100" height="47" rx="8" fill="#d8e2e5"/><rect width="100" height="47" rx="8" fill="#fffefa"/><rect x="30" y="-12" width="40" height="28" rx="3" fill="#344c60" stroke="#344c60"/><rect x="34" y="-8" width="32" height="20" rx="1" fill="${tint}" stroke="none"/><path d="M40 2h8v6h12M39-2h17" stroke="#fff" stroke-width="1.4" opacity=".8" fill="none"/><path d="M50 16v7M40 23h20"/><rect x="30" y="31" width="40" height="8" rx="2" fill="#e5ebe9"/><rect x="33" y="61" width="34" height="28" rx="9" fill="#a9b9c6"/><path d="M34 72h32" stroke="#879cae"/></g>`;
  }
  function laboratory(){
    const t=text(),id=uid('lab-title'),description=uid('lab-description');
    return `<svg viewBox="0 0 1120 620" role="img" aria-labelledby="${id} ${description}" xmlns="http://www.w3.org/2000/svg"><title id="${id}">${escape(copy().labTitle)}</title><desc id="${description}">${escape(copy().labCaption)}</desc>
      <path d="M47 113 82 75H1035l39 38v424l-39 35H82l-35-35Z" fill="#e0e7df"/>
      <path d="M47 101 82 63H1035l39 38v424l-39 35H82l-35-35Z" fill="#f2f4ed" stroke="#c9d5ca" stroke-width="2"/>
      <path d="M75 96H1045M75 528H1045" stroke="#c9d5ca"/>
      <rect x="82" y="99" width="445" height="233" rx="15" fill="#e8eef9" stroke="#b6c9e6"/>
      <rect x="548" y="99" width="489" height="233" rx="15" fill="#e4f1e9" stroke="#a9cfba"/>
      <rect x="548" y="352" width="489" height="176" rx="15" fill="#f6efde" stroke="#d8c69f"/>
      <rect x="82" y="352" width="445" height="176" rx="15" fill="#e9e5f0" stroke="#c4b7d8"/>
      ${lines(102,124,[t.labTags[0]],'lab-tag')} ${lines(102,151,[t.labLabels[0]],'lab-title')} ${lines(102,173,[t.labSubs[0]],'lab-sub')}
      ${desk(120,210,'#7ca6df')}${desk(260,210,'#7ca6df')}
      <g transform="translate(417 252)" stroke="#a5b8cc"><circle r="32" fill="#fffefa"/><circle cx="-38" cy="-3" r="9" fill="#9db3d0"/><circle cx="37" cy="-3" r="9" fill="#9db3d0"/><circle cy="39" r="9" fill="#9db3d0"/><rect x="-13" y="-8" width="27" height="17" rx="3" fill="#d7e4f5"/></g>
      ${lines(105,315,[t.labSmall[0]],'lab-small')}
      ${lines(568,124,[t.labTags[1]],'lab-tag')} ${lines(568,151,[t.labLabels[1]],'lab-title')} ${lines(568,173,[t.labSubs[1]],'lab-sub')}
      <g transform="translate(588 213)" stroke="#8eb8a4" stroke-width="1.3"><rect x="0" y="7" width="126" height="70" rx="9" fill="#cbded1"/><rect width="126" height="70" rx="9" fill="#fffefa"/><rect x="20" y="13" width="33" height="43" rx="3" fill="#e6efe6"/><path d="M27 24h18M27 30h15M27 36h18M27 42h12"/><rect x="71" y="20" width="37" height="27" rx="4" fill="#c7e0d2"/><path d="m81 33 6 6 12-14" stroke="#328866" stroke-width="2" fill="none"/></g>
      <path d="M744 245h36" stroke="#71a28a" stroke-width="2"/><path d="m772 240 8 5-8 5" fill="none" stroke="#71a28a" stroke-width="2"/>
      ${desk(825,216,'#70b69b')}
      ${lines(568,315,[t.labSmall[1]],'lab-small')}
      ${lines(568,379,[t.labTags[2]],'lab-tag')} ${lines(568,406,[t.labLabels[2]],'lab-title')}
      ${lines(568,427,[t.labSubs[2]],'lab-sub')}
      <g transform="translate(792 453)" stroke="#c0a367" stroke-width="1.3"><rect x="-50" width="100" height="24" rx="4" fill="#e8d3a5"/><rect x="-17" y="-15" width="34" height="13" rx="4" fill="#bda472"/><rect x="-103" y="35" width="72" height="20" rx="5" fill="#fffefa"/><rect x="31" y="35" width="72" height="20" rx="5" fill="#fffefa"/><path d="M0 28v31" stroke-dasharray="4 4"/><circle cx="-67" cy="66" r="7" fill="#c9b98f"/><circle cx="67" cy="66" r="7" fill="#c9b98f"/></g>
      ${lines(102,379,[t.labTags[3]],'lab-tag')} ${lines(102,406,[t.labLabels[3]],'lab-title')}
      ${lines(102,428,[t.labSubs[3]],'lab-sub')}
      <g transform="translate(111 453)"><rect width="72" height="46" rx="8" fill="#54486e"/><ellipse cx="36" cy="11" rx="22" ry="6" fill="none" stroke="#c1b1db"/><path d="M14 11v22c0 8 44 8 44 0V11M14 22c0 8 44 8 44 0" fill="none" stroke="#c1b1db"/><path d="M86 22h35" stroke="#b09cc9" stroke-width="2"/><rect x="132" y="2" width="231" height="42" rx="9" fill="#f8f5fc" stroke="#c5b7d7"/></g>
      ${lines(258,480,wrap(t.labSmall[3],language==='zh'?17:31),'lab-small',14)}
      <path d="M528 214h19M528 436h19" stroke="#98b6a5" stroke-width="3"/>
      ${lines(80,592,[t.figureConcept],'lab-small')}
    </svg>`;
  }
  function moduleFigure(){
    return window.SOLUTION_MODULE_MAP.svg(copy().modules.find(item=>item.id===selected),language);
  }
  function moduleMap(){
    return window.SOLUTION_MODULE_MAP.html(copy().modules.find(item=>item.id===selected),language);
  }
  function sourceDrawing(kind){
    if(kind==='hardware')return `assets/source/hardware-overview-${language==='zh'?'zh.png':language+'.svg'}`;
    const filename=kind==='lab'?'floor-plan':'hardware-topology';
    return `assets/source/${filename}${language==='zh'?'.png':'-'+language+'.svg'}`;
  }
  function diagram(kind){
    if(kind==='lab')return `<img src="${sourceDrawing('lab')}" alt="${escape(caseStudy().hardware.planTitle)}">`;
    if(kind==='sourceTopology')return `<img src="${sourceDrawing('sourceTopology')}" alt="${escape(caseStudy().hardware.originalImageLabel)}">`;
    if(kind==='hardware')return `<img src="${sourceDrawing('hardware')}" alt="${escape(caseStudy().hardware.hardwareFigureLabel)}">`;
    if(kind==='module')return moduleFigure();
    return window.SOLUTION_DIAGRAMS[kind](language,kind==='architecture'||kind==='workflow'?'':selected);
  }
  function renderCaseStudy(){
    const k=caseStudy();
    document.querySelectorAll('[data-case]').forEach(element=>{const value=element.dataset.case.split('.').reduce((current,key)=>current?.[key],k);if(typeof value==='string')element.textContent=value;});
    const contributionTitle=document.querySelector('[data-case="contribution.title"]');
    const contributionIntro=document.querySelector('[data-case="contribution.intro"]');
    if(contributionIntro)contributionIntro.hidden=true;
    if(contributionTitle)contributionTitle.innerHTML=`${escape(language==='zh'?k.contribution.title:k.contribution.title.trimEnd())}${language==='zh'?'':' '}<strong>${escape(k.contribution.intro)}</strong>`;
    setHTML('background-drivers',k.background.drivers.map(item=>`<article class="background-driver"><h4>${escape(item.title)}</h4><p>${escape(item.text)}</p></article>`).join(''));
    setHTML('benefit-grid',k.benefits.items.map(item=>`<article class="benefit-item"><p class="benefit-label">${escape(item.label)}</p><h4>${escape(item.title)}</h4><p>${escape(item.text)}</p><p class="benefit-status">${escape(item.status)}</p></article>`).join(''));
    setHTML('value-chain',k.benefits.logic.map(item=>`<li>${escape(item)}</li>`).join(''));
    setHTML('research-metrics',k.contribution.researchMetrics.map(item=>`<div class="research-stat"><strong>${escape(item.value)}</strong><span>${escape(item.label)}</span></div>`).join(''));
    setHTML('contribution-work',k.contribution.work.map(item=>`<article class="work-item"><div><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p><p class="work-deliverable">${escape(item.deliverable)}</p></div></article>`).join(''));
    setText('result-status',k.outcome.status);setText('result-amount',k.outcome.amount);setText('result-basis',`${k.outcome.basisLabel}: ${k.outcome.basis}`);
    const statusBreak={zh:'，',en:', ',fr:', '}[language];
    setHTML('result-status',escape(k.outcome.status).replace(statusBreak,statusBreak.trim()+'<br>'));
    const outcomeNote=document.querySelector('[data-case="outcome.note"]');
    if(outcomeNote)outcomeNote.hidden=!k.outcome.note;
    const benefitsNote=document.querySelector('[data-case="benefits.note"]');
    if(benefitsNote)benefitsNote.hidden=!k.benefits.note;
    const exchangeElement=$('result-exchange'),exchange=k.outcome.exchange;
    if(exchangeElement){
      exchangeElement.hidden=!exchange;
      const basisElement=$('result-basis');
      if(basisElement)basisElement.hidden=Boolean(exchange);
      if(exchange){
        const cad=exchange.amountCny*exchange.cadPerCny,usd=cad/exchange.cadPerUsd;
        const amount=value=>value.toLocaleString(language==='fr'?'fr-CA':'en-CA',{minimumFractionDigits:2,maximumFractionDigits:2});
        const approximate={en:' (approx.)',fr:' (env.)',zh:'（约）'}[language];
        exchangeElement.innerHTML=`<div><dt>CAD${approximate}</dt><dd>${amount(cad)}</dd><dd class="result-currency-note"><a href="${escape(exchange.source)}" target="_blank" rel="noopener noreferrer">${escape(exchange.label)}</a></dd></div><div><dt>USD${approximate}</dt><dd>${amount(usd)}</dd><dd class="result-currency-note">${escape(exchange.detail)}</dd></div>`;
      }else exchangeElement.innerHTML='';
    }
    setHTML('equipment-head',k.hardware.tableHeaders.map(label=>`<th scope="col">${escape(label)}</th>`).join(''));
    setHTML('equipment-body',window.SOLUTION_INFRA.inventory(language).map(row=>`<tr><th scope="row">${escape(row.item)}</th><td>${escape(row.quantity)}</td><td>${escape(row.spec)}</td><td>${escape(row.source)}</td></tr>`).join(''));
    if($('hardware-diagram'))setHTML('hardware-diagram',diagram('hardware'));
    const reference={
      en:{short:'',credits:'Network topology: the supplied diagram. Equipment: original technical proposal and project updates. Original floor plans: technical-parameter response. Background, responsibilities and contract: project account and résumé.',footer:'Delivered and accepted project · solution design case study'},
      fr:{short:'',credits:'Topologie : schéma fourni. Matériel : proposition technique d’origine et mises à jour du projet. Plans d’origine : réponse aux paramètres techniques. Contexte, responsabilités et contrat : récit du projet et CV.',footer:'Projet livré et accepté · étude de conception de solution'},
      zh:{short:'',credits:'网络拓扑：本次提供的图示。设备配置：原技术方案与项目补充。原始平面图：技术参数方案回复。建设背景、个人职责及合同金额：项目经历与简历。',footer:'已交付并验收项目 · 解决方案设计案例'}
    }[language];
    setText('hardware-note',reference.short);setText('source-credits',reference.credits);setText('footer-note',reference.footer);
    const hardwareNote=$('hardware-note');
    if(hardwareNote)hardwareNote.hidden=!reference.short;
    $('floorplan-image')?.setAttribute('alt',k.hardware.planTitle);$('floorplan-image')?.setAttribute('src',sourceDrawing('lab'));
    const topologyImage=document.querySelector('.source-topology-image');
    topologyImage?.setAttribute('alt',k.hardware.originalImageLabel);topologyImage?.setAttribute('src',sourceDrawing('sourceTopology'));
  }
  function renderModule(){
    if(!$('module-tabs'))return;
    const c=copy(),m=c.modules.find(item=>item.id===selected);
    $('module-tabs').innerHTML=c.modules.map(item=>`<button class="module-tab" id="tab-${item.id}" type="button" role="tab" aria-selected="${item.id===selected}" aria-controls="module-panel" tabindex="${item.id===selected?0:-1}" data-module="${item.id}" style="--module-color:${colors[item.id]}"><span class="tab-number">${item.number}</span><span class="tab-title">${escape(item.label)}</span></button>`).join('');
    $('module-panel').setAttribute('aria-labelledby',`tab-${m.id}`);$('module-panel').style.setProperty('--module-color',colors[m.id]);
    $('module-number').textContent=m.number;$('module-label').textContent=m.label;$('module-title').textContent=m.title;$('module-summary').textContent=m.summary;
    $('module-label').hidden=m.label===m.title;
    $('module-diagram').innerHTML=moduleMap();$('module-focus').textContent=m.designFocus;$('module-connections').innerHTML=m.links.map(value=>`<li>${escape(value)}</li>`).join('');
    if(figure)renderOpenFigure();
  }
  function renderLanguage(){
    const c=copy(),t=text();document.documentElement.lang=language==='zh'?'zh-CN':language;document.title=c.title+' · Logan Jiang';document.querySelector('meta[name="description"]').setAttribute('content',c.description);
    document.querySelectorAll('[data-copy]').forEach(element=>{const value=element.dataset.copy.split('.').reduce((current,key)=>current?.[key],c);if(typeof value==='string')element.textContent=value;});
    const architectureCaption=document.querySelector('[data-copy="architectureCaption"]');
    if(architectureCaption)architectureCaption.hidden=!c.architectureCaption;
    const journeyCaption=document.querySelector('[data-copy="journeyCaption"]');
    if(journeyCaption)journeyCaption.hidden=!c.journeyCaption;
    document.querySelectorAll('[data-language]').forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.language===language));button.setAttribute('aria-label',({en:'English',fr:'Français',zh:'中文'})[button.dataset.language]);});
    document.querySelector('.language-switch').setAttribute('aria-label',c.languageLabel);document.querySelector('.skip-link').textContent=t.skip;document.querySelector('nav').setAttribute('aria-label',t.pageNav);
    const railNotes={en:[],fr:[],zh:[]};
    $('rail-note').innerHTML=railNotes[language].map(escape).join('<br>');
    for(const[id,key]of Object.entries({'architecture-figure-label':'architecture','module-figure-label':'module','journey-figure-label':'journey','focus-label':'focus','connections-label':'connections'}))setText(id,t[key]);
    document.querySelectorAll('.expand-text').forEach(element=>element.textContent=t.enlarge);$('close-dialog').setAttribute('aria-label',t.close);$('zoom-in').setAttribute('aria-label',t.zoomIn);$('zoom-out').setAttribute('aria-label',t.zoomOut);$('zoom-reset').setAttribute('aria-label',t.reset);$('module-tabs')?.setAttribute('aria-label',t.modules);
    renderCaseStudy();
    renderModule();
    if($('architecture-diagram'))setHTML('architecture-diagram',diagram('architecture'));
    if($('workflow-diagram'))setHTML('workflow-diagram',diagram('workflow'));
    if($('home-architecture-diagram'))setHTML('home-architecture-diagram',window.SOLUTION_HOME_ARCHITECTURE.html(c,language));
    if(figure)renderOpenFigure();
    window.SOLUTION_NAVIGATION.render(language);
  }
  function selectModule(id,focus=false){
    if(!copy().modules.some(module=>module.id===id))return;selected=id;renderModule();if(focus)$(`tab-${id}`).focus();
  }
  function renderOpenFigure(){
    if(!figure)return;const c=copy(),k=caseStudy(),titles={lab:k.hardware.planTitle,hardware:k.hardware.hardwareFigureLabel,sourceTopology:k.hardware.originalImageLabel,architecture:c.architectureTitle,module:c.modules.find(item=>item.id===selected).label,workflow:c.journeyTitle};
    $('dialog-title').textContent=titles[figure];$('dialog-figure').innerHTML=diagram(figure);updateZoom();
  }
  function updateZoom(){
    const available=document.querySelector('.dialog-viewport').clientWidth||760,baseline=Math.max(760,available-36);
    $('dialog-figure').style.setProperty('--figure-width',`${Math.round(baseline*zoom)}px`);$('zoom-reset').textContent=`${Math.round(zoom*100)}%`;$('zoom-out').disabled=zoom<=.75;$('zoom-in').disabled=zoom>=2;
  }
  function openFigure(kind,button){
    figure=kind;zoom=1;trigger=button;renderOpenFigure();const dialog=$('figure-dialog');if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');document.body.classList.add('dialog-open');updateZoom();$('close-dialog').focus();
  }
  function closeFigure(){
    const dialog=$('figure-dialog');if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');figure=null;document.body.classList.remove('dialog-open');if(trigger?.isConnected)trigger.focus();trigger=null;
  }
  document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>{language=button.dataset.language;renderLanguage();}));
  $('module-tabs')?.addEventListener('click',event=>{const button=event.target.closest('[data-module]');if(button)selectModule(button.dataset.module,true);});
  $('module-tabs')?.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;event.preventDefault();const modules=copy().modules,index=modules.findIndex(item=>item.id===selected);const next=event.key==='Home'?0:event.key==='End'?modules.length-1:(index+(['ArrowRight','ArrowDown'].includes(event.key)?1:-1)+modules.length)%modules.length;selectModule(modules[next].id,true);
  });
  document.querySelectorAll('[data-expand]').forEach(button=>button.addEventListener('click',()=>openFigure(button.dataset.expand,button)));
  $('close-dialog').addEventListener('click',closeFigure);$('figure-dialog').addEventListener('cancel',event=>{event.preventDefault();closeFigure();});
  $('figure-dialog').addEventListener('click',event=>{if(event.target===$('figure-dialog')){const rect=$('figure-dialog').getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeFigure();}});
  $('zoom-in').addEventListener('click',()=>{zoom=Math.min(2,zoom+.25);updateZoom();});$('zoom-out').addEventListener('click',()=>{zoom=Math.max(.75,zoom-.25);updateZoom();});$('zoom-reset').addEventListener('click',()=>{zoom=1;updateZoom();});
  window.addEventListener('resize',()=>{if(figure)updateZoom();});
  renderLanguage();
})();
