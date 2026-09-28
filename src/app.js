import { calculate } from './calc.js';

const config = await (await fetch('config.json')).json();
const $ = (id) => document.getElementById(id);
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const m = (x) => usd.format(x);
const pct = (x) => `${+(x * 100).toFixed(2)}%`;

$('term').innerHTML = Object.keys(config.trustline.terms)
  .map((d) => `<option value="${d}"${d === '360' ? ' selected' : ''}>${d} days</option>`).join('');
$('years').innerHTML = Object.keys(config.vidantaRates)
  .map((y) => `<option value="${y}"${y === '5' ? ' selected' : ''}>${y} year${y === '1' ? '' : 's'} (${y * 12} months)</option>`).join('');

const rows = (pairs) => `<dl>${pairs.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;

function render() {
  const sale = parseFloat($('sale').value), cc = parseFloat($('cc').value);
  const err = !(sale > 0) ? 'Enter a positive sale amount.' : !(cc >= 7 && cc <= 10) ? 'Client CC % must be between 7% and 10%.' : '';
  $('err').textContent = err;
  if (err) { $('res').innerHTML = ''; return; }
  const r = calculate({ sale, dp: +$('dp').value, cc: cc / 100, termDays: +$('term').value, years: +$('years').value }, config);
  const range = (p) => (p.from === p.to ? `Month ${p.from}` : `Months ${p.from}–${p.to}`);
  $('res').innerHTML = `
    <div class="hero">
      <div><small>Due today</small><b>${m(r.dueToday)}</b></div>
      <div><small>Monthly payment (${range(r.phase1).toLowerCase()})</small><b>${m(r.phase1.amount)}</b></div>
    </div>
    <div class="sections">
      <div class="card"><h2>Down payment</h2>${rows([
        ['Total', m(r.downPayment)], [`Credit card (${pct(r.ccAmount / sale)})`, m(r.ccAmount)],
        [`Trustline advance (${pct(r.trustlinePct)})`, m(r.advance)]])}</div>
      <div class="card"><h2>Trustline</h2>${rows([
        ['Term', `${$('term').value} days`], [`Closing fee (${pct(r.closingFeePct)})`, m(r.closingFee)],
        ['Processing fee', m(r.processingFee)], ['Cost of advance', m(r.costOfAdvance)],
        ['Monthly payment', m(r.trustlineMonthly)], ['Number of payments', r.payments]])}</div>
      <div class="card"><h2>Vidanta financing</h2>${rows([
        ['Financed balance', m(r.balance)], ['Term', `${r.months} months`],
        ['Interest rate', pct(r.rate)], ['Monthly payment', m(r.vidantaMonthly)]])}</div>
      <div class="card"><h2>Client monthly payment</h2>${rows([
        [`${range(r.phase1)} (Trustline + Vidanta)`, m(r.phase1.amount)],
        ...(r.phase2 ? [[`${range(r.phase2)} (Vidanta only)`, m(r.phase2.amount)]] : [])])}</div>
    </div>`;
}

$('f').addEventListener('input', render);
render();
