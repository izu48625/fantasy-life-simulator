import { CAREERS } from '../data/careers.js';
import { STATS } from '../data/races.js';
import { readLifeMetrics } from '../analysis/life-stats.js';



const $ = id => document.getElementById(id);
export function renderProfile(state) {
  const p = state.person;
  if (!p) return;
  $('hero-name').textContent = p.name;
  $('brief-character').textContent = `${p.name} · ${p.age}歳 · ${p.occupation?.careerName || p.education?.institutionName || '幼少期'}`;
  $('hero-summary').textContent = `${p.age}歳 · ${p.raceName} · ${p.nationName}`;
  $('hero-origin').textContent = `${p.familyName} / 潜在 ${p.potential} / ${p.growthType}`;
  const career = CAREERS.find(c => c.id === p.occupation?.careerId);
  $('hero-career').textContent = career ? `${career.name} · ${career.ranks[p.rankIndex]}` :
    p.education ? `${p.education.institutionName}${p.education.graduated ? '（卒業）' : '（在学）'}` : '幼少期';
  $('health-value').textContent = `${p.health}/100`;
  $('health-bar').value = p.health;
  $('hero-stats').replaceChildren(...STATS.map(key => {
    const line = document.createElement('div'); line.className = 'stat-line';
    const a = document.createElement('span'); a.textContent = key;
    const b = document.createElement('strong'); b.textContent = Math.round(p.attributes[key]);
    line.append(a, b); return line;
  }));
  $('world-status').textContent = state.world.wars[p.nationId] ? '国境は戦時下' : '国家は概ね平時';
  const friends = (p.contacts || []).filter(c => c.alive).map(c => `${c.role}：${c.name}`).slice(0, 3).join('、');
  const edu=p.education;
  const metrics = readLifeMetrics(state);
  $('combat-status').textContent = `${p.battles}戦 / ${p.wins}勝（勝率${metrics.winRate ?? '—'}%）/ 戦功${p.merit}` +
    (edu ? `｜学歴：${edu.institutionName}${edu.ranking ? '・'+edu.ranking : edu.grades?.length?'・'+edu.grades.length+'年次':''}${edu.scholarship?'（奨学）':''}` : '') +
    (p.convalescentYears ? `｜療養中（残${p.convalescentYears}年）` : '') +
    (friends ? `｜縁：${friends}` : '') +
    (p.occupation?.assignmentName ? `｜任務：${p.occupation.assignmentName}` : '') +
    (metrics.transferCount ? `｜転職${metrics.transferCount}回` : '');
}

