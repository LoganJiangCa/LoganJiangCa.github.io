/* Static interface. Files and results stay in memory; no APIs, storage or CDN. */
(function () {
  "use strict";
  const A = window.AML, B = window.AML_BUNDLE, config = B.config, I = window.AML_I18N;
  const L = (zh,en) => I.choose(zh,en), T = text => I.t(text);
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const shortNames = new Proxy({}, {get:(_,id)=>I.modelName(id,true)});
  const tableNames = {transactions:"交易流水",accounts:"账户资料",balances:"日终余额",fx_rates:"用户指定当日汇率",events:"外部监测事件"};
  const words = {I:"本方收入",O:"本方支出",individual:"个人",company:"公司",debit_card:"借记卡",abnormal:"经营异常",counterparty_name:"交易对手名称",remark:"备注",le:"小于等于（≤）",ge:"大于等于（≥）",large_transaction:"外部大额交易监测事件"};
  const operators = {AND:"AND · 且",OR:"OR · 或",SINGLE:"单条规则",UNKNOWN:"组关系待确认"};
  const state = {data:null,result:null,account:null,model:"UB01",view:"overview",previousView:"overview",parameterModel:"UB01",showcaseModel:"UB01",evidence:null,evidencePage:0,source:"demo",settings:null};

  function riskClass(level){return level===A.HIGH?"high":level===A.ATTENTION?"attention":level===A.INSUFFICIENT?"insufficient":"clear";}
  function riskBadge(level){const label=I.language!=='zh'?I.level(level):level===A.HIGH?"高危 · 优先核查":level===A.ATTENTION?"关注 · 补充核查":level;return `<span class="risk-badge ${riskClass(level)}">${esc(label)}</span>`;}
  function ruleState(status){return `<span class="state ${status===A.HIT?"hit":status===A.MISS?"miss":"unknown"}">${esc(T(status))}</span>`;}
  function showError(id,message){$(id).hidden=!message;$(id).dataset.sourceMessage=message||"";$(id).textContent=I.message(message||"");}
  function currentModelIds(){return [...document.querySelectorAll('#model-checkboxes input:checked')].map(i=>i.value);}
  function ownConclusion(){return state.result.conclusions.find(r=>A.key(r.bank,r.account_id)===state.account);}
  function openDialog(id){const dialog=$(id);if(!dialog.open)dialog.showModal();document.documentElement.style.overflow="hidden";dialog.querySelector(".close-dialog")?.focus();}
  function download(text,name){const type=name.endsWith('.json')?'application/json;charset=utf-8':'text/csv;charset=utf-8',url=URL.createObjectURL(new Blob([text],{type})),link=document.createElement("a");link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  function dirty(){state.dirty=true;if(state.result)$('analysis-context').textContent=L("分析设置已更改。点击“运行分析”后更新结果；当前下方仍为上一次成功分析。","Settings changed. Run the analysis to update the results; the last successful analysis is still shown below.");}
  function accountDetails(c){return state.result.details.filter(r=>r.bank===c.bank&&r.account_id===c.account_id);}

  function renderSummary(){
    const rows=state.result.conclusions,high=rows.filter(r=>r.is_high_risk).length,attention=rows.filter(r=>r.risk_level===A.ATTENTION).length,insufficient=rows.filter(r=>r.risk_level===A.INSUFFICIENT).length;
    const cards=[{label:"高危账户",value:high,kind:"high",note:"建议优先人工核查"},{label:"关注账户",value:attention,kind:"attention",note:"建议补充核查"},{label:"资料不足",value:insufficient,kind:"insufficient",note:"保留未知，继续核对"},{label:"分析账户",value:rows.length,kind:"",note:"按银行与账号识别"}];
    $('summary-grid').innerHTML=cards.map(c=>`<article class="summary-card ${c.kind}"><span class="summary-label"><i class="summary-dot"></i>${esc(T(c.label))}</span><b>${c.value}</b><small>${esc(T(c.note))}</small></article>`).join("");
    const s=state.settings,n=state.data.transactions.length,duplicates=state.data.deduplicated.transactions;
    $('analysis-context').textContent=L(`${s.start} — ${s.end} · 基准日 ${s.reference} · ${s.models.length}个模型 · ${n.toLocaleString("zh-CN")}条唯一流水 · 已去除${duplicates}条重复流水`,`${s.start} — ${s.end} · Reference ${s.reference} · ${s.models.length} models · ${n.toLocaleString('en-US')} unique transactions · ${duplicates} duplicates removed`);
    $('data-title').textContent=state.source==="demo"?T("合成演示数据"):L("已导入本地CSV","Local CSV loaded");
    $('data-description').textContent=state.source==="demo"?L(`固定种子 · ${rows.length}个账户`,`Fixed seed · ${rows.length} accounts`):L(`浏览器本地 · ${rows.length}个账户`,`In browser · ${rows.length} accounts`);
    $('dataset-badge').textContent=state.source==="demo"?T("合成数据演示"):L("本地CSV分析","Local CSV analysis");
  }
  function renderOverview(){
    $('conclusions-table').innerHTML=state.result.conclusions.map((r,i)=>{
      const signals=JSON.parse(r.signal_details),first=signals[0]?I.signal(signals[0],accountDetails(r)):(r.risk_level===A.INSUFFICIENT?L("部分资料或规则口径待补齐，暂不能排除风险","Supporting data or business definitions are incomplete; risk cannot be excluded."):L("当前未发现已确认异常行为","No confirmed unusual behavior observed."));
      return `<tr data-account-index="${i}" class="${state.account===A.key(r.bank,r.account_id)?"selected":""}"><td><button class="row-select" data-account-index="${i}" aria-label="${esc(L(`查看${r.account_id}账户详情`,`Review account ${r.account_id}`))}"><b class="account-number">${esc(r.account_id)}</b><small class="account-bank">${esc(r.bank)}</small></button></td><td>${riskBadge(r.risk_level)}</td><td>${r.confirmed_behavior_types}<span class="muted"> ${L('类','types')}</span></td><td class="observation">${esc(first)}</td><td class="row-arrow">↗</td></tr>`;
    }).join("");
  }
  function renderScores(){
    const rows=state.result.accounts.filter(r=>r.model_id===state.model);
    $('scores-table').innerHTML=rows.map(r=>{
      const index=state.result.conclusions.findIndex(c=>c.bank===r.bank&&c.account_id===r.account_id);
      return `<tr data-account-index="${index}" class="${state.account===A.key(r.bank,r.account_id)?"selected":""}"><td><button class="row-select" data-account-index="${index}"><b class="account-number">${esc(r.account_id)}</b><small class="account-bank">${esc(r.bank)}</small></button></td><td><b>${r.score}</b> / ${r.model_total}</td><td>${r.hit_groups}</td><td>${r.evaluated_rules}</td><td>${r.unknown_rules}</td><td>${r.unresolved_points}${L('分',' pts')}</td></tr>`;
    }).join("");
  }
  function setView(view){const changed=state.view!==view;if(view==='rules'&&changed)state.previousView=state.view;state.view=view;for(const name of["overview","scores","rules"]){$(name+"-view").hidden=name!==view;$(name+"-tab").setAttribute("aria-selected",String(name===view));}for(const id of['summary-grid','analysis-context','account-detail'])$(id).hidden=view==='rules';if(view==='rules'){renderShowcase();if(changed)requestAnimationFrame(()=>$('rules-view').scrollIntoView({behavior:'instant',block:'start'}));}}
  function formatActual(detail){
    const metrics=JSON.parse(detail.actual),items=[];
    for(const[k,v]of Object.entries(metrics)){
      if(k==="配对")continue;
      let value=typeof v==="object"&&v!==null?L(`已记录${Object.keys(v).length}项`,`${Object.keys(v).length} entries recorded`):k.endsWith("_分")?I.money(String(v)):I.message(T(words[String(v)]||String(v)));
      items.push(`${I.language!=='zh'?T(k):k.replace(/_分$/,"")}：${value}`);
    }
    return items.length?items.join(L("；","; ")):L("暂无可计算指标","No computable metric is available.");
  }
  function renderDetails(){
    const c=ownConclusion();if(!c)return;
    $('detail-title').textContent=L(`账户 ${c.account_id}`,`Account ${c.account_id}`);$('detail-risk-badge').innerHTML=riskBadge(c.risk_level);
    const signals=JSON.parse(c.signal_details);
    $('conclusion-card').innerHTML=`<article class="conclusion-box ${riskClass(c.risk_level)}"><div class="conclusion-main"><p class="conclusion-eyebrow">${esc(c.bank)} / ${L('大白话结论','PLAIN-LANGUAGE CONCLUSION')}</p><p class="conclusion-text">${esc(I.conclusion(c))}</p>${signals.length?`<ul class="reason-list">${signals.map(s=>`<li>${esc(I.signal(s,accountDetails(c)))}</li>`).join("")}</ul>`:""}<p class="scope-line">${esc(L(`结论范围：${c.screening_models} · ${c.screening_policy} · ${c.screening_evaluated_groups}组已评价，${c.screening_unknown_groups}组无法评价`,`Scope: ${c.screening_models} · ${c.screening_policy} · ${c.screening_evaluated_groups} evaluated groups, ${c.screening_unknown_groups} unavailable`))}</p></div><div class="action-line"><b>${L('建议怎么做','Suggested action')}</b>${esc(I.action(c))}</div></article>`;
    const scores=state.result.accounts.filter(r=>r.bank===c.bank&&r.account_id===c.account_id);
    $('model-score-cards').innerHTML=scores.map(r=>`<button class="model-score-card ${r.model_id===state.model?"active":""}" data-detail-model="${r.model_id}"><span>${esc(shortNames[r.model_id])}</span><b>${r.score}<small> / ${r.model_total}</small></b><em>${L(`${r.unknown_rules}条子规则无法评价`,`${r.unknown_rules} unavailable sub-rules`)}</em></button>`).join("");
    const rows=state.result.details.filter(r=>r.bank===c.bank&&r.account_id===c.account_id&&r.model_id===state.model),groups=[...new Map(rows.map(r=>[r.group_id,r])).values()];
    $('rule-groups').innerHTML=groups.map((g,index)=>`<details class="group-card" data-group-id="${g.group_id}" ${index===0?"open":""}><summary><span class="group-name"><span class="group-code">${esc(g.group_id)}</span>${esc(T(g.group_name))}</span><span class="group-status">${ruleState(g.group_status)}<span class="group-points">${g.awarded_points} / ${g.group_points}${L('分',' pts')}</span><span class="row-arrow">⌄</span></span></summary><div class="group-inner"><p class="source-ref">${L('组关系','Group logic')}: ${esc(T(operators[g.operator]))} · ${L('共享分值来源','Shared-points source')}: ${esc(g.points_cell)}</p>${g.group_note?`<p class="group-note">${esc(I.message(g.group_note))}</p>`:""}${rows.filter(r=>r.group_id===g.group_id).map(r=>`<article class="subrule"><div class="subrule-top"><h4><span class="group-code">${esc(r.rule_id)}</span>${esc(T(r.rule_name))}</h4>${ruleState(r.status)}</div><p class="rule-threshold">${esc(T(r.threshold))}</p><p class="source-ref">${L('F列原始阈值','Original threshold · column F')} · ${esc(r.threshold_cell)}</p><div class="rule-actual">${esc(formatActual(r))}</div>${r.reason?`<p class="group-note">${esc(I.message(r.reason))}</p>`:""}<button class="evidence-button" data-rule-id="${esc(r.rule_id)}">${L('查看指标与证据 ↗','Inspect metrics and evidence ↗')}</button></article>`).join("")}</div></details>`).join("");
    $('evidence-panel').hidden=true;state.evidence=null;
  }
  function refreshModelSelectors(){
    const ids=state.settings.models;if(!ids.includes(state.model))state.model=ids[0];
    for(const id of["ranking-model","detail-model"]){$(id).innerHTML=ids.map(m=>`<option value="${m}">${m} ${shortNames[m]}</option>`).join("");$(id).value=state.model;}
  }
  function renderAll(){renderSummary();refreshModelSelectors();renderOverview();renderScores();renderDetails();setView(state.view);I.apply();}
  async function runAnalysis(nextData=null,source=null){
    $('analyze-button').disabled=true;$('analyze-button').textContent=L("正在分析…","Analyzing…");$('results-panel').setAttribute("aria-busy","true");showError("error-message","");
    await new Promise(resolve=>setTimeout(resolve,15));
    try{
      const settings={start:$('start-date').value,end:$('end-date').value,reference:$('reference-date').value,models:currentModelIds()},data=nextData||state.data;
      const result=A.analyze(data,settings.start,settings.end,settings.reference,settings.models,config);
      state.data=data;state.result=result;state.settings=settings;state.dirty=false;if(source)state.source=source;
      if(!result.conclusions.some(r=>A.key(r.bank,r.account_id)===state.account))state.account=A.key(result.conclusions[0].bank,result.conclusions[0].account_id);
      renderAll();document.body.dataset.ready="true";return true;
    }catch(e){showError("error-message",e.message);return false;}
    finally{$('analyze-button').disabled=false;$('analyze-button').innerHTML=T('运行分析')+'<span aria-hidden="true">↗</span>';$('results-panel').setAttribute("aria-busy","false");}
  }
  function selectAccount(index){const c=state.result.conclusions[index];if(!c)return;state.account=A.key(c.bank,c.account_id);renderOverview();renderScores();renderDetails();$('account-detail').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?"instant":"smooth",block:"start"});}
  function selectModel(id){state.model=id;$('ranking-model').value=id;$('detail-model').value=id;renderScores();renderDetails();}

  const parameterNames={minimum_cny_cents:"单笔金额下限",seconds:"最大配对间隔",difference_ratio:"最大金额差异比例",count_gt:"配对次数必须大于",balance_cny_cents:"日终余额上限",ratio_ge:"占比下限",lower_cny_cents:"金额区间下限",upper_cny_cents:"金额区间上限",direction:"收支方向",numerator_direction:"比例分子",denominator_direction:"比例分母",threshold:"比例阈值",comparison:"比较关系",years_le:"年数上限",equals:"目标资料值",days_le:"天数上限",keywords:"匹配关键词",amount_gt_cny_cents:"交易金额必须大于",gap_seconds_ge:"沉默间隔下限",amount_cny_cents_le:"测试交易金额上限",exclude_keyword:"排除关键词",run_ge:"连续笔数下限",ratio_threshold:"交易日占比阈值",field:"匹配字段",amount_ge_cny_cents:"累计金额下限",start_time:"日间开始",end_time:"日间结束",count_ge:"名下卡数下限",min_count:"非沉默日笔数下限",average_gt_cny_cents:"日均金额必须大于",min_daily_cny_cents:"非沉默日金额下限",average_gt:"日均笔数必须大于",event_type:"外部事件类型"};
  function parameterValue(k,v){if(v===null)return L("不限收支方向","Both directions");if(Array.isArray(v))return v.join("、");if(k.includes("cny_cents"))return L((Number(v)/100).toLocaleString("en-US",{maximumFractionDigits:2})+"元人民币",'CNY '+(Number(v)/100).toLocaleString('en-US',{maximumFractionDigits:2}));if(k.includes("ratio")||k==="threshold")return(Number(v)*100).toLocaleString("en-US",{maximumFractionDigits:4})+"%";if(k==="seconds"||k==="gap_seconds_ge")return L(`${v}秒（${v/60}分钟）`,`${v} seconds (${v/60} minutes)`);if(k==="years_le")return L(`${v}年`,`${v} years`);if(k==="days_le")return L(`${v}天`,`${v} days`);return T(words[String(v)]||String(v));}
  function previewHTML(model){
    const total=model.groups.reduce((s,g)=>s+g.points,0),all=model.groups.flatMap(g=>g.rules.map(r=>({r,g}))),selected=B.showcase[model.id].map(id=>all.find(x=>x.r.id===id)),omitted=all.length-selected.length;
    return `<p class="model-metadata"><b>${esc(I.modelName(model.id))}</b><br>${L(`原始总分 ${total}分 · ${model.groups.length}个规则组 · ${all.length}条子规则`,`Original total ${total} points · ${model.groups.length} groups · ${all.length} sub-rules`)}<br>${L('精选复杂规则用于阅读展示；分析仍使用全部规则，同组只共享一份C列分值。','The preview highlights complex rules; analysis still uses every rule, with one shared C-column score per group.')}</p><div class="showcase-rule-list">`+selected.map(({r,g},index)=>{
      const pending=r.evaluator.kind==='pending',chips=Object.entries(r.evaluator.params||{}).map(([k,v])=>`<span class="param-chip">${esc(T(k==='years_le'?(r.evaluator.kind==='age'?'年龄上限':'开户年限上限'):(parameterNames[k]||k)))}<b>${esc(parameterValue(k,v))}</b></span>`).join('');
      return `<article class="param-rule" data-original-rule="${r.id}"><div class="param-rule-head"><span><span class="preview-number">${String(index+1).padStart(2,'0')}</span><span class="group-code">${esc(r.id)}</span>${esc(T(r.name))}</span><span class="${pending?'state unknown':'readonly-tag'}">${T(pending?'待确认':'已实现 · 只读')}</span></div><div class="param-body"><div class="param-label">${L('F列 · 原始业务阈值','COLUMN F · SOURCE THRESHOLD')}</div><p class="param-threshold">${esc(T(r.threshold_raw))}</p><div class="preview-group-meta"><span>${L('共享组分值','Shared group points')}: <b>${g.points}</b></span><span>${L('组关系','Group logic')}: ${esc(T(operators[g.operator]))}</span><span>${esc(g.id)}</span></div><p class="source-ref">${esc(r.threshold_cell)} · ${esc(g.points_cell)}<br>${L('H列原文','Column H, source text')}: ${esc(r.relation_raw.trim()||T('原表空白'))} · ${esc(r.relation_cell)}</p>${chips?`<div class="param-chips">${chips}</div>`:''}${pending?`<p class="group-note">${esc(I.message(r.evaluator.reason))}</p>`:''}${g.operator_note?`<p class="group-note">${esc(I.message(g.operator_note))}</p>`:''}${I.language!=='zh'?`<details class="param-suggestion"><summary>${L('原始文本（中文）','Original source text (Chinese)')}</summary><p data-keep-source>${esc(r.threshold_raw)}</p></details>`:''}${r.suggestion_raw.trim()?`<details class="param-suggestion"><summary>${L('G列建议 · 仅供参阅，不替换F列阈值','Column G suggestion (original source) · never replaces F')}</summary><p data-keep-source>${esc(r.suggestion_raw)}<br>${esc(r.suggestion_cell)}</p></details>`:''}</div></article>`;
    }).join('')+`</div><div class="omitted-rules" data-omitted-count="${omitted}"><span class="ellipsis" aria-hidden="true">···</span><b>${L(`另有 ${omitted} 条规则未展开`,`Another ${omitted} rules are not expanded`)}</b><p>${L(`本页展示 ${selected.length} / ${all.length} 条子规则。完整双语清单包含全部规则、原始阈值和单元格出处。`,`Showing ${selected.length} of ${all.length} sub-rules. Download the complete bilingual catalog for every rule, source threshold and cell reference.`)}</p><a href="downloads/rules-complete.csv" download="rules-complete.csv">${L('下载完整规则（双语CSV） ↗','Download all rules · bilingual CSV ↗')}</a></div>`;
  }
  function renderShowcase(){
    $('showcase-tabs').innerHTML=config.models.map(m=>`<button role="tab" aria-selected="${state.showcaseModel===m.id}" aria-controls="showcase-content" data-showcase-model="${m.id}">${esc(shortNames[m.id])}</button>`).join('');
    $('showcase-content').innerHTML=previewHTML(config.models.find(m=>m.id===state.showcaseModel));
  }
  function renderParameters(){
    $('parameter-tabs').innerHTML=config.models.map(m=>`<button role="tab" aria-selected="${state.parameterModel===m.id}" aria-controls="parameter-content" data-parameter-model="${m.id}">${shortNames[m.id]}</button>`).join("");
    $('parameter-content').innerHTML=previewHTML(config.models.find(m=>m.id===state.parameterModel));
  }
  function setupParameterDialog(){
    const stats=[['5','原始模型'],['42','共享计分组'],['68','原始子规则'],['只读','无参数修改入口']];
    $('parameter-stats').innerHTML=stats.map(([n,l])=>`<div class="dialog-stat"><b>${esc(T(n))}</b><span>${esc(T(l))}</span></div>`).join("");
    const policy=L(config.screening.description,`At least ${config.screening.high_risk_min_categories} distinct confirmed behavior types, including at least one priority type, are required for high-risk screening. The same behavior across models counts once. Unavailable groups do not support escalation. Model scores are never added or normalized.`);
    $('parameter-policy').innerHTML=`<p>${esc(policy)}</p><p>${L('口径版本','Policy version')}: ${esc(config.screening.version)}</p><div class="table-wrap"><table><thead><tr><th>${L('行为类别','Behavior type')}</th><th>${L('重点行为','Priority type')}</th><th>${L('来源规则组','Source groups')}</th></tr></thead><tbody>${Object.values(config.screening.signals).map(s=>`<tr><td>${esc(T(s.name))}</td><td>${L(s.priority?'是':'否',s.priority?'Yes':'No')}</td><td>${esc(s.groups.join('、'))}</td></tr>`).join('')}</tbody></table></div>`;
    $('parameter-conventions').innerHTML=Object.entries(config.conventions).map(([k,v])=>`<p>${esc(I.language!=='zh'?L(v,B.display_en.conventions[k]):v)}</p>`).join('')+`<p>${L('原始文件','Source file')}: <span data-keep-source>${esc(config.source_file)}</span></p><p class="source-ref">SHA-256: ${esc(config.source_sha256)}<br>${L('网页规则快照指纹','Web rule snapshot fingerprint')}: ${esc(B.config_sha256)}</p>`;
    $('screening-description').textContent=policy;
  }

  const evidenceLabels={transaction_id:"交易ID",timestamp:"时间",direction:"方向",amount:"原币金额",currency:"币种",counterparty_bank:"对手银行",counterparty_account_id:"对手账号",counterparty_name:"对手名称",remark:"备注",bank:"银行",account_id:"账号",balance:"日终余额",date:"日期",cny_per_unit:"人民币/原币",event_id:"事件ID",event_type:"事件类型"};
  function smallTable(rows,fields){return !rows.length?`<p class="muted">${L('未提供对应数据。','No supporting data supplied.')}</p>`:`<div class="table-wrap"><table><thead><tr>${fields.map(f=>`<th>${esc(T(evidenceLabels[f]||f))}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${fields.map(f=>`<td data-keep-source>${esc(T(words[r[f]]||r[f]||"—"))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;}
  function localizedMetrics(value){if(I.language==='zh')return value;if(Array.isArray(value))return value.map(localizedMetrics);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[T(k),localizedMetrics(v)]));return typeof value==='string'?I.message(T(words[value]||value)):value;}
  function renderEvidence(){
    const r=state.evidence;if(!r)return;const ids=new Set(JSON.parse(r.transaction_ids)),rows=state.data.transactions.filter(t=>t.bank===r.bank&&t.account_id===r.account_id&&ids.has(t.transaction_id));
    const pageSize=20,totalPages=Math.max(1,Math.ceil(rows.length/pageSize));state.evidencePage=Math.max(0,Math.min(state.evidencePage,totalPages-1));const page=rows.slice(state.evidencePage*pageSize,(state.evidencePage+1)*pageSize);
    const balances=state.data.balances.filter(t=>t.bank===r.bank&&t.account_id===r.account_id),accounts=state.data.accounts.filter(t=>t.bank===r.bank&&t.account_id===r.account_id),events=state.data.events.filter(t=>t.bank===r.bank&&t.account_id===r.account_id);
    $('evidence-panel').innerHTML=`<div class="section-heading"><div><p class="eyebrow dark">RULE EVIDENCE</p><h4>${esc(r.rule_id)} · ${esc(T(r.rule_name))}</h4></div><button class="icon-button" id="close-evidence" aria-label="${L('关闭证据面板','Close evidence panel')}">×</button></div><p class="rule-threshold">${esc(T(r.threshold))}</p><p class="source-ref">${esc(r.threshold_cell)} · ${L('子规则','Sub-rule')}: ${esc(T(r.status))} · ${L('组状态','Group')}: ${esc(T(r.group_status))}</p>${r.reason?`<p class="group-note">${esc(I.message(r.reason))}</p>`:""}<div class="rule-actual">${esc(formatActual(r))}</div><details class="policy-note"><summary>${L('查看完整实际指标','Full observed metrics')}</summary><pre class="field-format">${esc(JSON.stringify(localizedMetrics(JSON.parse(r.actual)),null,2))}</pre></details><h4>${L('证据流水','Evidence transactions')}</h4><p class="muted">${L('完整保留交易ID；首次异常和沉默间隔可能使用分析期间以外的历史。','Transaction IDs are preserved. First-abnormal and inactivity rules may reference history outside the analysis period.')}</p>${smallTable(page,["transaction_id","timestamp","direction","amount","currency","counterparty_account_id","counterparty_name","remark"])}<div class="evidence-toolbar"><span>${L(`共${rows.length}条证据 · 第${state.evidencePage+1}/${totalPages}页 · 每页20条`,`${rows.length} evidence rows · Page ${state.evidencePage+1}/${totalPages} · 20 per page`)}</span><div><button class="button subtle" id="evidence-prev" ${state.evidencePage===0?"disabled":""}>${L('上一页','Previous')}</button> <button class="button subtle" id="evidence-next" ${state.evidencePage>=totalPages-1?"disabled":""}>${L('下一页','Next')}</button></div></div><details class="policy-note"><summary>${L('辅助表依据及用户提供的汇率','Supporting tables and user-supplied FX')}</summary><p class="evidence-refs">${esc(JSON.parse(r.auxiliary_refs).join('; ')||L('本条规则无已使用的辅助表引用','No auxiliary references used by this rule.'))}</p><h4>${T('账户资料')}</h4>${smallTable(accounts,B.contract.schemas.accounts)}<h4>${T('日终余额')}</h4>${smallTable(balances,B.contract.schemas.balances)}<h4>${L('监测事件','Monitoring events')}</h4>${smallTable(events,B.contract.schemas.events)}<h4>${L('用户指定汇率','User-supplied FX rates')}</h4>${smallTable(state.data.fx_rates,B.contract.schemas.fx_rates)}</details>`;
    $('evidence-panel').hidden=false;
  }

  function setupImport(){
    if(!$('file-inputs').children.length)$('file-inputs').innerHTML=Object.entries(tableNames).map(([name,label])=>`<div class="file-input-row"><label for="file-${name}"></label><input id="file-${name}" type="file" accept=".csv,text/csv" ${name==='transactions'?'required':''}></div>`).join('');
    for(const[name,label]of Object.entries(tableNames))document.querySelector(`label[for=file-${name}]`).innerHTML=`${esc(T(label))}<small>${name}.csv · ${L(name==='transactions'?'必需':'可选',name==='transactions'?'required':'optional')}</small>`;
    $('import-dictionary').innerHTML=Object.entries(B.contract.schemas).map(([name,fields])=>`<h4>${T(tableNames[name])} / ${name}.csv</h4><code class="field-format">${esc(fields.join(','))}</code>`).join('')+L(`<p>时间格式：YYYY-MM-DD HH:MM:SS；日期格式：YYYY-MM-DD。I为本方收入，O为本方支出。金额非负，最多两位小数；空金额或币种保持未知。</p><p>客户类型为individual/company；卡类型为debit_card/credit_card/corporate_account/other；经营状态normal/abnormal。资料以分析基准日有效信息为准，不根据姓名或交易自行推断。</p><p>history_complete为1表示已提供从开户开始的完整历史，coverage_start/end注明真实覆盖范围。缺少这些依据时不猜测“首次异常”。</p><p>日终余额必须是真实快照，不能用交易后余额代替。汇率为当日每单位原币兑人民币的明确参数，不使用原表历史汇率。不提供工作日日历、金额浮动公式或多次监测阈值时，相关规则继续显示无法评价。</p>`,`<p>Timestamp: YYYY-MM-DD HH:MM:SS. Date: YYYY-MM-DD. I is incoming, O is outgoing from the account's perspective. Amounts are nonnegative with up to two decimal places; missing amounts or currencies remain unknown.</p><p>Customer type: individual/company. Account type: debit_card/credit_card/corporate_account/other. Business status: normal/abnormal. Profiles must be valid at the reference date; do not infer them from names or transactions.</p><p>history_complete=1 declares full history from opening; coverage_start/end define the actual coverage. Without this evidence the first abnormal transaction remains unavailable.</p><p>Balances must be genuine closing snapshots, not post-transaction balances. FX rates must be explicitly supplied per date in CNY per currency unit; historical workbook rates are not used. Unspecified calendars, fluctuation formulas and repeated-alert cutoffs remain unresolved.</p>`);
  }
  async function importFiles(event){
    event.preventDefault();showError("import-error","");const button=$('import-form').querySelector('button[type=submit]');button.disabled=true;
    try{
      const sources={};for(const name of Object.keys(tableNames)){const file=$('file-'+name).files[0];if(file)sources[name]=new TextDecoder("utf-8",{fatal:true}).decode(await file.arrayBuffer());}
      const data=A.prepareDataset(sources,B.contract);if(!data.transactions.length)throw new A.DataError("交易表为空，请提供至少一条流水");
      const days=data.transactions.map(r=>r.day).sort();$('start-date').value=days[0];$('end-date').value=days[days.length-1];$('reference-date').value=days[days.length-1];
      if(await runAnalysis(data,"uploaded"))$('import-dialog').close();else showError("import-error",$('error-message').dataset.sourceMessage);
    }catch(e){showError("import-error",e.message);}finally{button.disabled=false;}
  }
  async function loadDemo(){
    const m=B.manifest;$('start-date').value=m.start;$('end-date').value=m.end;$('reference-date').value=m.reference_date;
    for(const input of document.querySelectorAll('#model-checkboxes input'))input.checked=true;
    await runAnalysis(A.prepareDataset(B.demo,B.contract),"demo");
  }
  function tabKeyboard(container,selector){container.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;const buttons=[...container.querySelectorAll(selector)],index=buttons.indexOf(document.activeElement);if(index<0)return;e.preventDefault();let next=e.key==="Home"?0:e.key==="End"?buttons.length-1:(index+(e.key==="ArrowRight"?1:buttons.length-1))%buttons.length;buttons[next].click();buttons[next].focus();});}

  function accountExport(){
    if(I.language==='zh')return state.result.accounts;
    return state.result.accounts.map(r=>{const c=state.result.conclusions.find(c=>c.bank===r.bank&&c.account_id===r.account_id),detail=accountDetails(c),groups=[...new Map(detail.filter(d=>d.model_id===r.model_id&&d.group_status===A.HIT).map(d=>[d.group_id,d])).values()];return {...r,model_name:I.modelName(r.model_id),risk_level:I.level(r.risk_level),risk_reasons:JSON.parse(c.signal_details).map(s=>I.signal(s,detail)).join('; '),plain_conclusion:I.conclusion(c),suggested_action:I.action(c),hit_reasons:groups.map(g=>`${g.group_id} ${T(g.group_name)} (+${g.group_points})`).join('; ')};});
  }
  function detailExport(){if(I.language==='zh')return state.result.details;return state.result.details.map(r=>({...r,model_name:I.modelName(r.model_id),group_name:T(r.group_name),group_status:T(r.group_status),group_note:I.message(r.group_note),rule_name:T(r.rule_name),status:T(r.status),actual:JSON.stringify(localizedMetrics(JSON.parse(r.actual))),threshold:T(r.threshold),threshold_source_zh:r.threshold,reason:I.message(r.reason)}));}
  function switchLanguage(){
    for(const label of document.querySelectorAll('[data-model-label]'))label.textContent=I.modelName(label.dataset.modelLabel,true);
    const evidence=state.evidence,page=state.evidencePage,openGroups=[...document.querySelectorAll('#rule-groups > details[open]')].map(e=>e.dataset.groupId);
    if(state.result){renderAll();if(state.dirty)dirty();}
    setupParameterDialog();setupImport();if($('parameters-dialog').open)renderParameters();
    for(const group of document.querySelectorAll('#rule-groups > details'))group.open=openGroups.includes(group.dataset.groupId);
    if(evidence){state.evidence=evidence;state.evidencePage=page;renderEvidence();}
    for(const id of['error-message','import-error'])if($(id).dataset.sourceMessage)$(id).textContent=I.message($(id).dataset.sourceMessage);
    I.apply();
  }

  function bind(){
    $('model-checkboxes').innerHTML=config.models.map(m=>`<label><input type="checkbox" value="${m.id}" checked><span data-model-label="${m.id}">${shortNames[m.id]}</span><small>${m.id}</small></label>`).join("");
    $('analysis-form').addEventListener("submit",e=>{e.preventDefault();runAnalysis();});$('analysis-form').addEventListener("change",dirty);
    $('demo-button').addEventListener("click",loadDemo);$('import-button').addEventListener("click",()=>openDialog("import-dialog"));$('dictionary-button').addEventListener("click",()=>{openDialog("import-dialog");$('import-dictionary').parentElement.open=true;});
    $('import-form').addEventListener("submit",importFiles);$('sample-button').addEventListener("click",()=>download(B.demo.transactions,"transactions.csv"));
    for(const id of["about-button","footer-about"])$(id).addEventListener("click",()=>openDialog("about-dialog"));
    $('parameters-button').addEventListener("click",()=>{renderParameters();openDialog("parameters-dialog");});
    $('language-select').addEventListener('change',event=>I.setLanguage(event.target.value));document.addEventListener('aml-language-change',switchLanguage);
    $('back-to-analysis').addEventListener('click',()=>setView(state.previousView));
    $('export-accounts').addEventListener("click",()=>{if(state.result)download(A.csvText(accountExport()),"account_results.csv");});$('export-evaluation-details').addEventListener("click",()=>{if(state.result)download(A.csvText(detailExport()),"rule_details.csv");});
    for(const id of["ranking-model","detail-model"])$(id).addEventListener("change",e=>selectModel(e.target.value));
    document.addEventListener("click",e=>{
      if(e.target.closest('#download-rules-json')){e.preventDefault();download(JSON.stringify(config,null,2)+'\n','rules-config.json');return;}
      const close=e.target.closest(".close-dialog");if(close){close.closest("dialog").close();return;}
      const account=e.target.closest("[data-account-index]");if(account){selectAccount(Number(account.dataset.accountIndex));return;}
      const model=e.target.closest("[data-detail-model]");if(model){selectModel(model.dataset.detailModel);return;}
      const parameter=e.target.closest("[data-parameter-model]");if(parameter){state.parameterModel=parameter.dataset.parameterModel;renderParameters();return;}
      const showcase=e.target.closest('[data-showcase-model]');if(showcase){state.showcaseModel=showcase.dataset.showcaseModel;renderShowcase();return;}
      const view=e.target.closest("[data-view]");if(view){setView(view.dataset.view);return;}
      const rule=e.target.closest("[data-rule-id]");if(rule){const c=ownConclusion();state.evidence=state.result.details.find(r=>r.bank===c.bank&&r.account_id===c.account_id&&r.rule_id===rule.dataset.ruleId);state.evidencePage=0;renderEvidence();$('evidence-panel').scrollIntoView({behavior:"smooth",block:"start"});return;}
      if(e.target.closest("#close-evidence")){$('evidence-panel').hidden=true;state.evidence=null;return;}
      if(e.target.closest("#evidence-prev")){state.evidencePage--;renderEvidence();}if(e.target.closest("#evidence-next")){state.evidencePage++;renderEvidence();}
    });
    for(const dialog of document.querySelectorAll("dialog")){dialog.addEventListener("close",()=>{document.documentElement.style.overflow="";});dialog.addEventListener("click",e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});}
    tabKeyboard(document.querySelector('.tabs'),'[role=tab]');tabKeyboard($('parameter-tabs'),'[role=tab]');tabKeyboard($('showcase-tabs'),'[role=tab]');
  }
  try{bind();setupParameterDialog();setupImport();I.apply();loadDemo();}catch(e){showError("error-message",e.message);document.body.dataset.ready="error";}
})();
