// ── Constants ──────────────────────────────────────────────
const ICONS  = { bank: 'B', wallet: 'W', crypto: 'C' };
const COLS   = {
  bank:   { bg: '#E6F1FB', bar: '#378ADD' },
  wallet: { bg: '#E1F5EE', bar: '#1D9E75' },
  crypto: { bg: '#EEEDFE', bar: '#7F77DD' },
};
const EMOJIS = {
  Food: '🛒', Transport: '⛽', Entertainment: '🎬',
  Health: '💊', Income: '💼', Crypto: '₿',
  Rent: '🏠', Utilities: '💡', Other: '💸',
};

// ── State ──────────────────────────────────────────────────
let currency = 'ARS';
let usdRate  = 1200;

let accounts = [
  { id: 1, name: 'Mercado Pago', type: 'wallet', balance: 125430, change:  3.2, budget: 60000  },
  { id: 2, name: 'Banco Nación', type: 'bank',   balance: 487200, change: -1.1, budget: 300000 },
  { id: 3, name: 'Binance',      type: 'crypto', balance: 213860, change:  8.7, budget: 0      },
  { id: 4, name: 'Cuenta BBVA',  type: 'bank',   balance:  99500, change:  0.5, budget: 80000  },
  { id: 5, name: 'PayPal',       type: 'wallet', balance:  34200, change:  1.3, budget: 40000  },
];

let transactions = [
  { id:  1, accId: 1, name: 'Supermercado Dia',  cat: 'Food',          type: 'expense', amount:   4800, date: '2025-04-06' },
  { id:  2, accId: 2, name: 'Sueldo',             cat: 'Income',        type: 'income',  amount: 185000, date: '2025-04-05' },
  { id:  3, accId: 3, name: 'Bitcoin purchase',   cat: 'Crypto',        type: 'expense', amount:  32000, date: '2025-04-05' },
  { id:  4, accId: 1, name: 'Netflix',             cat: 'Entertainment', type: 'expense', amount:   3200, date: '2025-04-04' },
  { id:  5, accId: 2, name: 'Alquiler recibido',  cat: 'Rent',          type: 'income',  amount:  75000, date: '2025-04-03' },
  { id:  6, accId: 4, name: 'Combustible',         cat: 'Transport',     type: 'expense', amount:  12000, date: '2025-04-03' },
  { id:  7, accId: 5, name: 'Freelance payment',  cat: 'Income',        type: 'income',  amount:  45000, date: '2025-04-02' },
  { id:  8, accId: 1, name: 'UberEats',            cat: 'Food',          type: 'expense', amount:   2100, date: '2025-04-01' },
  { id:  9, accId: 2, name: 'Gym',                 cat: 'Health',        type: 'expense', amount:   5500, date: '2025-04-01' },
  { id: 10, accId: 3, name: 'Crypto sell',         cat: 'Crypto',        type: 'income',  amount:  28000, date: '2025-03-31' },
];

let budgets = [
  { id: 1, cat: 'Food',          limit: 30000 },
  { id: 2, cat: 'Transport',     limit: 20000 },
  { id: 3, cat: 'Entertainment', limit: 15000 },
];

let nextAccId = accounts.length + 1;
let nextTxId  = transactions.length + 1;
let nextBudId = budgets.length + 1;
let txFilter  = 'all';
let chartInst = null;

// ── Formatting ─────────────────────────────────────────────
function conv(ars) { return currency === 'USD' ? ars / usdRate : ars; }

function fmt(ars) {
  const v = conv(ars);
  return currency === 'USD'
    ? '$' + v.toFixed(2)
    : '$' + Math.round(v).toLocaleString('es-AR');
}

// ── Currency toggle ────────────────────────────────────────
function setCurrency(c) {
  currency = c;
  document.getElementById('togARS').classList.toggle('active', c === 'ARS');
  document.getElementById('togUSD').classList.toggle('active', c === 'USD');
  renderAll();
}

// ── Tab navigation ─────────────────────────────────────────
function showTab(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const v = document.getElementById('view-' + name);
  const t = document.getElementById('tab-' + name);
  if (v) v.classList.add('active');
  if (t) t.classList.add('active');
  if (name === 'dashboard') renderChart();
}

// ── Metrics ────────────────────────────────────────────────
function renderMetrics() {
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const inc   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const exp   = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  document.getElementById('metricsRow').innerHTML = `
    <div class="mc">
      <div class="mc-label">Total balance</div>
      <div class="mc-value">${fmt(total)}</div>
      <div class="mc-sub" style="color:var(--text-secondary)">${accounts.length} accounts</div>
    </div>
    <div class="mc">
      <div class="mc-label">Total income</div>
      <div class="mc-value up">${fmt(inc)}</div>
      <div class="mc-sub up">This period</div>
    </div>
    <div class="mc">
      <div class="mc-label">Total expenses</div>
      <div class="mc-value down">${fmt(exp)}</div>
      <div class="mc-sub down">This period</div>
    </div>
    <div class="mc">
      <div class="mc-label">Net flow</div>
      <div class="mc-value ${inc - exp >= 0 ? 'up' : 'down'}">${fmt(inc - exp)}</div>
      <div class="mc-sub" style="color:var(--text-secondary)">Income − expenses</div>
    </div>`;
}

// ── Budget alerts ──────────────────────────────────────────
function renderAlerts() {
  let html = '';
  budgets.forEach(b => {
    const spent = transactions
      .filter(t => t.type === 'expense' && t.cat === b.cat)
      .reduce((s, t) => s + t.amount, 0);
    const pct = spent / b.limit * 100;
    if (pct >= 80) {
      html += `<div class="alert-box">
        <span class="alert-icon">⚠</span>
        <span><strong>${b.cat}</strong> budget ${pct >= 100 ? 'exceeded' : 'at ' + Math.round(pct) + '%'}
        — spent ${fmt(spent)} of ${fmt(b.limit)}</span>
      </div>`;
    }
  });
  document.getElementById('alertsBox').innerHTML = html;
}

// ── Account cards ──────────────────────────────────────────
function renderAccounts(gridId = 'accountsGrid') {
  const grid   = document.getElementById(gridId);
  const isMain = gridId === 'accountsGrid';

  let html = accounts.map(a => {
    const spent = transactions
      .filter(t => t.accId === a.id && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const bPct  = a.budget > 0 ? Math.min(100, Math.round(spent / a.budget * 100)) : 0;
    const bColor = bPct >= 100 ? '#E24B4A' : bPct >= 80 ? '#EF9F27' : '#1D9E75';

    return `<div class="acc-card">
      <span class="badge b-${a.type}">${a.type === 'bank' ? 'Bank' : a.type === 'wallet' ? 'Wallet' : 'Crypto'}</span>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div class="acc-icon" style="background:${COLS[a.type].bg};color:${COLS[a.type].bar}">${ICONS[a.type]}</div>
        <div>
          <div class="acc-name">${a.name}</div>
          <div class="acc-type-lbl">${a.type === 'bank' ? 'Cuenta bancaria' : a.type === 'wallet' ? 'Billetera' : 'Cripto'}</div>
        </div>
      </div>
      <div class="acc-bal">${fmt(a.balance)}</div>
      <div class="acc-chg ${a.change >= 0 ? 'up' : 'down'}">${a.change >= 0 ? '↑' : '↓'} ${Math.abs(a.change)}% este mes</div>
      ${a.budget > 0 ? `<div class="budget-bar-bg"><div class="budget-bar" style="width:${bPct}%;background:${bColor}"></div></div>` : ''}
    </div>`;
  }).join('');

  if (isMain) html += `<div class="acc-card add-card" onclick="showTab('accounts')">+ Add account</div>`;
  grid.innerHTML = html;
}

// ── Transactions ───────────────────────────────────────────
function renderTxns(listId = 'txnListDash') {
  const isFull = listId === 'txnListFull';
  const search = (document.getElementById('txnSearch') || { value: '' }).value.toLowerCase();
  const accF   = (document.getElementById('filterAcc')  || { value: '' }).value;
  const catF   = (document.getElementById('filterCat')  || { value: '' }).value;

  let list = transactions.filter(t => {
    if (txFilter !== 'all' && t.type !== txFilter) return false;
    if (accF && String(t.accId) !== accF) return false;
    if (catF && t.cat !== catF) return false;
    if (search && !t.name.toLowerCase().includes(search) && !t.cat.toLowerCase().includes(search)) return false;
    return true;
  });

  if (!isFull) list = list.slice(0, 8);

  const el = document.getElementById(listId);
  if (!el) return;

  if (!list.length) { el.innerHTML = '<div class="empty">No transactions found</div>'; return; }

  el.innerHTML = list.map(t => {
    const acc  = accounts.find(a => a.id === t.accId);
    const icon = EMOJIS[t.cat] || '💸';
    const disp = t.type === 'income' ? fmt(t.amount) : '-' + fmt(t.amount);
    return `<div class="txn-item">
      <div class="txn-icon" style="background:${t.type === 'income' ? '#E1F5EE' : '#FAECE7'}">${icon}</div>
      <div class="txn-info">
        <div class="txn-name">${t.name}</div>
        <div class="txn-meta">${t.date} · ${acc ? acc.name : ''} · ${t.cat}</div>
      </div>
      <div class="txn-amt ${t.type === 'income' ? 'up' : 'down'}">${disp}</div>
    </div>`;
  }).join('');
}

function setFilter(f, btn) {
  txFilter = f;
  document.querySelectorAll('.fpill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTxns('txnListFull');
}

// ── Populate filter dropdowns ──────────────────────────────
function populateFilters() {
  const sel = document.getElementById('filterAcc');
  if (sel) sel.innerHTML = '<option value="">All accounts</option>' +
    accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');

  const cats   = [...new Set(transactions.map(t => t.cat))];
  const catSel = document.getElementById('filterCat');
  if (catSel) catSel.innerHTML = '<option value="">All categories</option>' +
    cats.map(c => `<option value="${c}">${c}</option>`).join('');

  const txAccSel = document.getElementById('txAcc');
  if (txAccSel) txAccSel.innerHTML = accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
}

// ── Distribution bars ──────────────────────────────────────
function renderDist() {
  const total = accounts.reduce((s, a) => s + a.balance, 0) || 1;
  document.getElementById('distRows').innerHTML = accounts.map(a => {
    const pct = Math.round(a.balance / total * 100);
    return `<div class="dist-row">
      <div class="dist-lbl">${a.name}</div>
      <div class="dist-bg"><div class="dist-fill" style="width:${pct}%;background:${COLS[a.type].bar}"></div></div>
      <div class="dist-v">${pct}%</div>
    </div>`;
  }).join('');
}

// ── Budgets ────────────────────────────────────────────────
function renderBudgets() {
  const bl = document.getElementById('budgetList');
  if (!bl) return;
  bl.innerHTML = budgets.map(b => {
    const spent = transactions
      .filter(t => t.type === 'expense' && t.cat === b.cat)
      .reduce((s, t) => s + t.amount, 0);
    const pct   = Math.min(100, Math.round(spent / b.limit * 100));
    const color = pct >= 100 ? '#E24B4A' : pct >= 80 ? '#EF9F27' : '#1D9E75';
    return `<div class="budget-item">
      <div class="budget-header">
        <span class="budget-name">${b.cat}</span>
        <span class="budget-nums">${fmt(spent)} / ${fmt(b.limit)}</span>
      </div>
      <div class="bbar-bg"><div class="bbar" style="width:${pct}%;background:${color}"></div></div>
      <div style="font-size:11px;color:var(--text-secondary);margin-top:4px">${pct}% used${pct >= 100 ? ' — over budget' : ''}</div>
    </div>`;
  }).join('');
}

function addBudget() {
  const cat   = document.getElementById('bCat').value.trim();
  const limit = parseFloat(document.getElementById('bLimit').value) || 0;
  if (!cat || !limit) return;
  budgets.push({ id: nextBudId++, cat, limit });
  document.getElementById('bCat').value   = '';
  document.getElementById('bLimit').value = '';
  renderAll();
}

// ── Add account ────────────────────────────────────────────
function addAccount() {
  const name    = document.getElementById('accName').value.trim();
  const type    = document.getElementById('accType').value;
  const balance = parseFloat(document.getElementById('accBal').value) || 0;
  const budget  = parseFloat(document.getElementById('accBudget').value) || 0;
  if (!name) return;
  accounts.push({ id: nextAccId++, name, type, balance, change: 0, budget });
  document.getElementById('accName').value   = '';
  document.getElementById('accBal').value    = '';
  document.getElementById('accBudget').value = '';
  renderAll();
}

// ── Log transaction ────────────────────────────────────────
function addTxn() {
  const name   = document.getElementById('txDesc').value.trim();
  const amount = parseFloat(document.getElementById('txAmt').value) || 0;
  const type   = document.getElementById('txType').value;
  const accId  = parseInt(document.getElementById('txAcc').value);
  const cat    = document.getElementById('txCat').value.trim() || 'Other';
  const date   = document.getElementById('txDate').value || new Date().toISOString().slice(0, 10);
  if (!name || !amount || !accId) return;

  transactions.unshift({ id: nextTxId++, accId, name, cat, type, amount, date });
  const acc = accounts.find(a => a.id === accId);
  if (acc) acc.balance += type === 'income' ? amount : -amount;

  document.getElementById('txDesc').value = '';
  document.getElementById('txAmt').value  = '';
  document.getElementById('txCat').value  = '';
  renderAll();
  showTab('transactions');
}

// ── Export CSV ─────────────────────────────────────────────
function exportCSV() {
  const rows = [['Date', 'Account', 'Description', 'Category', 'Type', 'Amount (ARS)', 'Amount (USD)']];
  transactions.forEach(t => {
    const acc = accounts.find(a => a.id === t.accId);
    rows.push([
      t.date,
      acc ? acc.name : '',
      t.name,
      t.cat,
      t.type,
      t.amount,
      (t.amount / usdRate).toFixed(2),
    ]);
  });
  const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'finance_export.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ── Chart ──────────────────────────────────────────────────
function renderChart() {
  const ctx = document.getElementById('mc');
  if (!ctx) return;
  const total  = accounts.reduce((s, a) => s + a.balance, 0);
  const labels = ['Mar 1', 'Mar 8', 'Mar 15', 'Mar 22', 'Mar 29', 'Apr 5', 'Apr 7'];
  const raw    = [total * .72, total * .78, total * .74, total * .81, total * .88, total * .95, total];
  const data   = raw.map(v => currency === 'USD' ? parseFloat((v / usdRate).toFixed(2)) : Math.round(v));

  if (chartInst) chartInst.destroy();
  chartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: '#378ADD',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        backgroundColor: 'rgba(55,138,221,0.07)',
        tension: 0.4,
      }],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: c => currency === 'USD' ? '$' + c.raw.toFixed(2) : '$' + c.raw.toLocaleString('es-AR') },
          backgroundColor: 'rgba(0,0,0,0.75)',
          titleFont: { size: 10 },
          bodyFont:  { size: 10 },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: '#888' },
        },
        y: {
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            font: { size: 10 }, color: '#888',
            callback: v => currency === 'USD' ? '$' + v.toFixed(0) : '$' + (v / 1000).toFixed(0) + 'k',
          },
        },
      },
    },
  });
}

// ── Set today's date on log form ───────────────────────────
function setTxDate() {
  const d = document.getElementById('txDate');
  if (d && !d.value) d.value = new Date().toISOString().slice(0, 10);
}

// ── Render everything ──────────────────────────────────────
function renderAll() {
  renderMetrics();
  renderAlerts();
  renderAccounts('accountsGrid');
  renderAccounts('accountsGridFull');
  renderTxns('txnListDash');
  renderTxns('txnListFull');
  renderDist();
  renderBudgets();
  populateFilters();
  renderChart();
  setTxDate();
}

// ── Init ───────────────────────────────────────────────────
renderAll();
