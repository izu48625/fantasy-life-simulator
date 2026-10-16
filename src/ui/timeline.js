import { yearDelta, formatSigned } from '../analysis/life-stats.js';

const $ = id => document.getElementById(id);
const KIND = {
  birth:['出生','✦'],training:['訓練・学業','✎'],admission:['入学試験','⌂'],graduation:['卒業','✧'],
  career:['配属','⚑'],battle:['戦闘','⚔'],promotion:['昇進','★'],
  transfer:['転職・転属','⇄'],recovery:['負傷後の決断','✚'],review:['昇進・採用審査','◇'],assignment:['新任務','♜'],
  retirement:['引退','☼'],death:['終章','✝'],story:['人生の出来事','◆']};
const PHASE = {childhood:'幼少期',academy:'学院生活',awaiting_career:'進路選択',career:'戦闘キャリア',retired:'引退生活',deceased:'生涯の終章'};
const strongKinds = new Set(['birth','admission','graduation','career','promotion','transfer','assignment','recovery','retirement','death']);
function includeEntry(entry, filter) {
  if (filter==='all') return true;
  if (filter==='turning') return strongKinds.has(entry.kind) || (entry.kind==='story'&&entry.importance==='major');
  if (filter==='career') return ['career','promotion','review','assignment','transfer','recovery','retirement'].includes(entry.kind);
  if (filter==='battle') return ['battle','promotion','review','assignment','transfer'].includes(entry.kind);
  if (filter==='school') return ['admission','graduation','training'].includes(entry.kind);
  if (filter==='people') return entry.kind==='story';
  return true;
}
function el(name,cls='',value) {
  const node=document.createElement(name);if(cls)node.className=cls;if(value!==undefined)node.textContent=String(value);return node;
}
function eventCard(entry) {
  const article=el('article',`chronicle-event kind-${entry.kind}${strongKinds.has(entry.kind)?' milestone':''}`);
  article.dataset.eventId=String(entry.id);
  const head=el('div','chronicle-event-head');
  const label=el('span','event-type',`${KIND[entry.kind]?.[1] || '•'} ${KIND[entry.kind]?.[0] || '記録'}`);
  head.append(label);
  if (entry.kind==='battle' && entry.detail) {
    head.append(el('strong',entry.detail.win?'battle-win':'battle-loss',entry.detail.win?'勝利':'敗北'));
  } else if (strongKinds.has(entry.kind)) head.append(el('span','milestone-tag','転機'));
  const p=el('p','event-narrative',entry.text);
  article.append(head,p);
  if (entry.kind==='battle' && entry.detail) {
    const d=entry.detail, facts=el('div','battle-facts');
    const items=[`勝算 ${Math.round(d.winChance*100)}%`,`敵戦力 ${d.opponent}`,`戦功 ${d.win?(d.war?'+3':'+1'):'+0'}`];
    if(d.injury)items.push(`負傷 ${d.injury}`);
    for(const item of items)facts.append(el('span','fact-chip',item));
    article.append(facts);
  }
  return article;
}
function chapterFor(age, group, records, filter) {
  const section=el('section','year-chapter');
  const heading=el('div','year-header');
  const ageBadge=el('span','year-age',`${age}歳`);
  const period=el('div','year-heading-main');
  period.append(el('strong','year-phase',PHASE[group.record?.stage]||'人生の記録'));
  const year=group.record?.year??group.entries[0]?.year;
  period.append(el('span','year-calendar',`王暦 ${year}年`));
  heading.append(ageBadge,period);section.append(heading);
  section.dataset.age=String(age);
  // Multiple events in a year also show the newest entry first.
  for(const entry of [...group.entries].reverse())section.append(eventCard(entry));
  if(group.record&&filter==='all') {
    const delta=yearDelta(records,age);
    const bottom=el('div','year-report');
    const ovr=delta ? `OVR ${group.record.ovr} (${formatSigned(delta.ovr)})` : `OVR ${group.record.ovr}`;
    bottom.append(el('span','year-number',ovr));
    if(delta&&delta.battles>0)bottom.append(el('span','year-number',`今年 ${delta.battles}戦 ${delta.wins}勝`));
    if(delta&&delta.merit>0)bottom.append(el('span','year-number',`戦功 ${formatSigned(delta.merit)}`));
    bottom.append(el('span','year-number',`健康 ${Math.round(group.record.health)}`));
    if(group.entries.length===0)bottom.insertBefore(el('span','quiet-year','大きな出来事の記録なし'),bottom.firstChild);
    section.append(bottom);
  }
  return section;
}
export function renderTimeline(state) {
  const view = $('timeline');
  const filter=view.dataset.filter || 'all';
  const records=Array.isArray(state.annualRecords)?state.annualRecords:[];
  const renderKey=`${state.seed}/${state.timeline.at(-1)?.id||0}/${records.length}/${filter}`;
  if (view.dataset.renderKey===renderKey) return;
  const filterChanged=view.dataset.lastFilter!==filter;
  const nearTop=view.scrollTop<70;
  // Remember the first visible old card. Restoring it avoids moving the page
  // when the player is reading history while new chapters appear above it.
  const visible=[...view.querySelectorAll('.chronicle-event, .quiet-years-title, .year-header')]
    .find(node=>node.getBoundingClientRect().bottom>view.getBoundingClientRect().top+2);
  const anchor=visible && (visible.closest('[data-event-id]')?.dataset.eventId
    ? {kind:'event',id:visible.closest('[data-event-id]').dataset.eventId,top:visible.getBoundingClientRect().top}
    : visible.closest('[data-age]')?.dataset.age
      ? {kind:'age',id:visible.closest('[data-age]').dataset.age,top:visible.getBoundingClientRect().top}
      : null);
  const previousY=view.scrollTop;
  const previousHeight=view.scrollHeight;
  const map=new Map();
  if(filter==='all')for(const row of records)map.set(row.age,{record:row,entries:[]});
  for(const entry of state.timeline) {
    if(!includeEntry(entry,filter))continue;
    if(!map.has(entry.age))map.set(entry.age,{record:records.find(v=>v.age===entry.age)??null,entries:[]});
    map.get(entry.age).entries.push(entry);
  }
  const fragment=document.createDocumentFragment();
  const sorted=[...map.entries()].sort((a,b)=>b[0]-a[0]);
  let quiet=[];
  function flushQuiet() {
    if(!quiet.length)return;
    if(quiet.length===1)fragment.append(chapterFor(quiet[0][0],quiet[0][1],records,filter));
    else {
      const first=quiet[0],last=quiet.at(-1);
      const fold=el('details','quiet-years-fold');
      const summary=el('summary','quiet-years-title',`${last[0]}〜${first[0]}歳｜${quiet.length}年間の積み重ね · OVR ${last[1].record.ovr} → ${first[1].record.ovr}`);
      fold.append(summary);
      const content=el('div','quiet-years-content');
      for(const [age,group] of quiet)content.append(chapterFor(age,group,records,filter));
      fold.append(content);fragment.append(fold);
    }
    quiet=[];
  }
  for(const [age,group] of sorted) {
    if(filter==='all' && !group.entries.length && group.record) {
      if(quiet.length && quiet.at(-1)[0]-1!==age)flushQuiet();
      quiet.push([age,group]);continue;
    }
    flushQuiet();fragment.append(chapterFor(age,group,records,filter));
  }
  flushQuiet();
  if(!map.size)fragment.append(el('p','muted','該当する出来事は、まだありません。'));
  // Keep fold expansion and scroll position stable between ticks.
  const openRanges=new Set([...view.querySelectorAll('.quiet-years-fold[open]')].map(node=>node.querySelector('summary')?.textContent));
  for(const node of fragment.querySelectorAll('.quiet-years-fold'))if(openRanges.has(node.querySelector('summary')?.textContent))node.open=true;
  view.replaceChildren(fragment);
  view.dataset.renderKey=renderKey;
  view.dataset.lastFilter=filter;
  if(filterChanged || nearTop) view.scrollTop=0;
  else if(anchor){
    const selector=anchor.kind==='event' ? `.chronicle-event[data-event-id="${anchor.id}"]` : `.year-chapter[data-age="${anchor.id}"] .year-header`;
    const replacement=view.querySelector(selector);
    if(replacement) view.scrollTop=previousY+replacement.getBoundingClientRect().top-anchor.top;
    else view.scrollTop=previousY+view.scrollHeight-previousHeight;
  } else view.scrollTop=previousY+view.scrollHeight-previousHeight;
  for(const btn of document.querySelectorAll('[data-chronicle-filter]')){
    const selected=btn.dataset.chronicleFilter===filter;
    btn.setAttribute('aria-pressed',String(selected));
    btn.classList.toggle('active',selected);
  }
}

