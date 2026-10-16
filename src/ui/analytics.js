import { readLifeMetrics, formatSigned } from '../analysis/life-stats.js';

const $ = id => document.getElementById(id);
const num = n => n === null || n === undefined ? '—' : n.toLocaleString('ja-JP');
const percent = n => n === null ? '—' : `${n}%`;
const cell = (name, value, foot = '') => {
  const item = document.createElement('div'); item.className = 'metric';
  const title = document.createElement('span'); title.className = 'metric-label'; title.textContent = name;
  const amount = document.createElement('strong'); amount.className = 'metric-value'; amount.textContent = String(value);
  item.append(title, amount);
  if (foot) { const small = document.createElement('small'); small.textContent = foot; item.append(small); }
  return item;
};
export function renderAnalytics(state) {
  const m = readLifeMetrics(state);
  if (!m) return;
  const main = $('life-metrics');
  main.replaceChildren(
    cell('戦闘評価 OVR', m.ovr, m.ovrGrowth === null ? '記録開始前' : `出生時から ${formatSigned(m.ovrGrowth)}`),
    cell('生涯最高 OVR', num(m.peakOvr), m.peakAge === null ? '推移未記録' : `${m.peakAge}歳時点`),
    cell('通算戦闘', num(m.battles), `${m.wins}勝 / ${m.losses}敗`),
    cell('戦闘勝率', percent(m.winRate), `最多 ${m.bestStreak}連勝`),
    cell('戦功', num(m.merit), `名声 ${m.fame}`),
    cell('階級', m.rank, `${m.careerYears}年の職歴`)
  );
  const details = $('detail-metrics');
  details.replaceChildren(
    cell('戦時任務', `${m.warBattles}戦`, `${m.warVictories}勝`),
    cell('任務の種類', `${m.missionVariety}種`),
    cell('重傷・後遺症', `${m.seriousInjuries}件`, `全負傷 ${m.injuryCount}件`),
    cell('階級昇進', `${m.promotionCount}回`),
    cell('学院平均評点', m.educationAverage === null ? '—' : `${m.educationAverage}点`, m.educationHigh === null ? '記録なし' : `最高 ${m.educationHigh}点`),
    cell('重要な出来事', `${m.majorEvents}件`),
    cell('存命の縁', `${m.livingContacts}人`, `失った縁 ${m.lostContacts}人`),
    cell('現在の連勝', `${m.currentStreak}連勝`)
  );
  const tough = $('toughest-victory');
  if (m.toughestVictory && m.toughestVictory.detail.winChance < .5) {
    const e = m.toughestVictory;
    tough.hidden = false;
    tough.textContent = `番狂わせの勝利：${e.age}歳「${e.detail.mission}」勝算${Math.round(e.detail.winChance*100)}%を覆した。`;
  } else { tough.hidden = true; tough.textContent = ''; }
  drawTrend(m.snapshots, $('trend-select').value);
}

const svgElement = name => document.createElementNS('http://www.w3.org/2000/svg', name);
function drawTrend(snapshots, field) {
  const plot = $('trend-svg'); plot.replaceChildren();
  const help = $('trend-caption');
  const readable = {ovr:'戦闘評価',health:'健康',merit:'累計戦功',fame:'名声'};
  if (!snapshots.length) {
    help.textContent = 'この記録には過去年の推移がありません。以後の進行分から記録します。'; return;
  }
  if (snapshots.length === 1) {
    help.textContent = `${snapshots[0].age}歳時点の${readable[field]}：${snapshots[0][field]}。年を進めると推移が見られます。`;return;
  }
  const values = snapshots.map(s => Number(s[field]) || 0);
  const low = field === 'health' || field === 'ovr' ? 0 : Math.min(0,...values);
  const high = Math.max(field === 'health' || field === 'ovr' ? 100 : 1,...values);
  const span = Math.max(1, high - low);
  const minAge = snapshots[0].age, maxAge = snapshots.at(-1).age;
  const x = age => 40 + ((age - minAge) / Math.max(1,maxAge-minAge)) * 610;
  const y = value => 150 - ((value - low) / span) * 122;
  for (let n = 0; n <= 2; n++) {
    const yy = 150 - n * 61;
    const line = svgElement('line'); line.setAttribute('x1','40');line.setAttribute('y1',String(yy));line.setAttribute('x2','650');line.setAttribute('y2',String(yy));line.setAttribute('class','trend-gridline');plot.append(line);
    const label = svgElement('text');label.setAttribute('x','32');label.setAttribute('y',String(yy+4));label.setAttribute('text-anchor','end');label.setAttribute('class','trend-axis');label.textContent=String(Math.round(low+n*span/2));plot.append(label);
  }
  const polyline=svgElement('polyline');polyline.setAttribute('points',snapshots.map((s,i)=>`${x(s.age).toFixed(1)},${y(values[i]).toFixed(1)}`).join(' '));polyline.setAttribute('class','trend-line');plot.append(polyline);
  const last=snapshots.at(-1);const dot=svgElement('circle');dot.setAttribute('cx',String(x(last.age)));dot.setAttribute('cy',String(y(values.at(-1))));dot.setAttribute('r','4');dot.setAttribute('class','trend-dot');plot.append(dot);
  const labels=[snapshots[0],last];
  for (const s of labels) {
    const text=svgElement('text');text.setAttribute('x',String(x(s.age)));text.setAttribute('y','176');text.setAttribute('text-anchor',s===labels[0]?'start':'end');text.setAttribute('class','trend-axis');text.textContent=`${s.age}歳`;plot.append(text);
  }
  const start=values[0],end=values.at(-1);
  help.textContent = `${readable[field]}：${start} → ${end}（${formatSigned(end-start)}）｜${snapshots.length}年分の記録`;
}
