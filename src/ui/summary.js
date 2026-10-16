import { CAREERS } from '../data/careers.js';

export function renderSummary(state) {
  const panel = document.getElementById('summary-panel');
  panel.replaceChildren(); panel.hidden = state.phase !== 'completed';
  if (panel.hidden) return;
  const p = state.person;
  const career = CAREERS.find(c => c.id === p.occupation?.careerId);
  const heading = document.createElement('h2'); heading.textContent = '一生の記録';
  const result = document.createElement('p'); result.textContent = `${p.name}｜享年${p.deathAge}｜${state.endReason}`;
  const stat = document.createElement('p');
  stat.textContent = `${p.raceName}・${p.familyName}｜${career ? `${career.name} / ${career.ranks[p.rankIndex]}` : '職歴なし'}｜${p.battles}戦${p.wins}勝｜戦功${p.merit}`;
  const connections = document.createElement('p'); connections.textContent = `印象に残る人物：${(p.contacts || []).map(c => c.name + '（' + c.role + (c.alive ? '' : '・故人') + '）').join('、') || '記録なし'}`;
  const title = document.createElement('p'); title.className='status-pill';
  const endedYoung = p.deathAge < 35;
  const careerTitle = !career ? '戦わなかった人生' : p.rankIndex===3 ? `歴戦の${career.ranks[3]}` :
    p.battles>=50 && p.wins>=35 ? '百戦の古参兵' : state.endReason==='戦死'&&endedYoung ? '戦場に散った若き戦士' :
    p.rankIndex>=2 ? `信頼された${career.ranks[p.rankIndex]}` : p.battles>=20 ? '実直な歴戦兵' : '無名の戦士';
  title.textContent = `生涯の称号：${careerTitle}`;
  const education = document.createElement('p');
  education.textContent = `学歴：${p.education?.institutionName || 'なし'}${p.education?.ranking ? ' / '+p.education.ranking : ''}｜人生イベント：${state.timeline.filter(e=>e.kind==='story').length}件｜重大負傷：${p.injuries.filter(i=>i.kind!=='軽傷').length}件`;
  const subtitle = document.createElement('p'); subtitle.className = 'muted';
  subtitle.textContent = '称号は実際の経歴から判定。出生・育成・戦場の出来事は保存済み年表から振り返れます。';
  panel.append(heading, result, title, stat, education, connections, subtitle);
}

