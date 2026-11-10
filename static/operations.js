import { api } from './api.js?v=20261110-improvements';
import { t } from './i18n.js?v=20261110-improvements';
import { escapeHtml } from './markdown.js?v=20261110-improvements';
import { openTaskDrawer } from './drawer.js?v=20261110-improvements';
import { state, toast } from './state.js?v=20261110-improvements';

function panel() { return document.getElementById('opsPanel'); }
function toggleButton() { return document.getElementById('opsToggleBtn'); }
const PAGE_SIZE = 5;
const pages = { blocked: 0, failures: 0 };
let pagingBoard = null;

function pageItems(items, key) {
  const lastPage = Math.max(0, Math.ceil(items.length / PAGE_SIZE) - 1);
  pages[key] = Math.min(pages[key], lastPage);
  const start = pages[key] * PAGE_SIZE;
  return { items: items.slice(start, start + PAGE_SIZE), start, total: items.length, page: pages[key], lastPage };
}

function pagination(key, page, title) {
  if (page.total <= PAGE_SIZE) return '';
  const range = t('opsPageRange').replace('{start}', page.start + 1).replace('{end}', Math.min(page.start + PAGE_SIZE, page.total)).replace('{total}', page.total);
  return `<nav class="ops-pagination" aria-label="${escapeHtml(title)}">
    <span aria-live="polite">${escapeHtml(range)}</span>
    <div><button class="button ghost" type="button" data-ops-page="${key}" data-direction="-1" ${page.page === 0 ? 'disabled' : ''}>${escapeHtml(t('previous'))}</button>
    <button class="button ghost" type="button" data-ops-page="${key}" data-direction="1" ${page.page === page.lastPage ? 'disabled' : ''}>${escapeHtml(t('next'))}</button></div>
  </nav>`;
}

function setPanelOpen(open) {
  state.opsOpen = Boolean(open);
  localStorage.setItem('kanbanOpsPanelOpen', state.opsOpen ? '1' : '0');
  const el = panel();
  if (el) el.hidden = !state.opsOpen;
  const btn = toggleButton();
  if (btn) btn.setAttribute('aria-expanded', state.opsOpen ? 'true' : 'false');
}

export function setupOperationsPanel() {
  const btn = toggleButton();
  const el = panel();
  if (!btn || !el) return;
  setPanelOpen(state.opsOpen);
  btn.addEventListener('click', async () => {
    setPanelOpen(!state.opsOpen);
    if (state.opsOpen) await refreshOperationsPanel();
  });
  el.addEventListener('click', ev => {
    const pageButton = ev.target.closest('[data-ops-page]');
    if (pageButton && !pageButton.disabled) {
      const key = pageButton.dataset.opsPage;
      if (!Object.hasOwn(pages, key)) return;
      pages[key] = Math.max(0, pages[key] + Number(pageButton.dataset.direction));
      renderOperationsPanel(state.opsData);
      const nextButton = el.querySelector(`[data-ops-page="${key}"][data-direction="${pageButton.dataset.direction}"]:not(:disabled)`)
        || el.querySelector(`[data-ops-page="${key}"]:not(:disabled)`);
      nextButton?.focus();
      return;
    }
    if (ev.target.closest('details')) return;
    const target = ev.target.closest('[data-ops-task-id]');
    if (!target) return;
    const taskId = target.dataset.opsTaskId;
    if (taskId) openTaskDrawer(taskId, { section: target.dataset.opsView }).catch(err => toast(err.message || String(err), 'error'));
  });
}

export async function refreshOperationsPanel() {
  const el = panel();
  if (!el) return;
  if (!state.opsOpen) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  el.innerHTML = `<div class="ops-header"><strong>${t('operations')}</strong><span class="muted">${t('loading')}</span></div>`;
  try {
    state.opsData = await api.opsSummary(state.board);
    renderOperationsPanel(state.opsData);
  } catch (err) {
    const message = err.message || String(err);
    el.innerHTML = `<div class="ops-error">${escapeHtml(message)}</div>`;
    toast(message, 'error');
  }
}

export function renderOperationsPanel(data) {
  const el = panel();
  if (!el) return;
  if (pagingBoard !== state.board) {
    pages.blocked = 0;
    pages.failures = 0;
    pagingBoard = state.board;
  }
  const summary = data?.summary || {};
  el.innerHTML = `
    <div class="ops-header">
      <div>
        <h2>${t('opsOverview')}</h2>
        <p class="muted">${escapeHtml(t('opsEstimatedBackoffAdvisory'))}</p>
      </div>
      <span class="ops-chip">${formatTimestamp(data?.now)}</span>
    </div>
    ${renderSummaryCards(summary)}
    <div class="ops-sections">
      ${renderRunningTable(data?.running || [])}
      ${renderRetryTable(data?.retry_queue || [])}
      ${renderBlockedAfterRetries(data?.blocked_after_retries || [])}
      ${renderRecentFailures(data?.recent_failures || [])}
    </div>`;
}

function renderSummaryCards(summary) {
  const cards = [
    [t('opsRunning'), summary.running || 0, ''],
    [t('opsHeartbeatOverdue'), summary.heartbeat_overdue || 0, 'warning'],
    [t('opsRetryQueue'), summary.retry_candidates || 0, 'warning'],
    [t('opsBlockedAfterRetries'), summary.blocked_after_retries || 0, 'danger'],
    [t('unassigned'), summary.ready_unassigned || 0, ''],
  ];
  return `<div class="ops-grid">${cards.map(([label, value, tone]) => `
    <div class="ops-card">
      <small>${escapeHtml(label)}</small>
      <strong>${escapeHtml(String(value))}</strong>
      ${tone && Number(value) > 0 ? `<span class="ops-chip ${tone}">${escapeHtml(tone)}</span>` : ''}
    </div>`).join('')}</div>`;
}

function renderRunningTable(items) {
  const rows = items.map(item => {
    const task = item.task || {};
    return `<tr data-ops-task-id="${escapeHtml(task.id || '')}">
      <td>${taskLink(task)}</td>
      <td>${escapeHtml(task.assignee || t('unassigned'))}</td>
      <td>${formatDuration(item.worker?.elapsed_seconds)}</td>
      <td>${formatDuration(item.heartbeat?.age_seconds)} ${item.heartbeat?.overdue ? `<span class="ops-chip warning">${t('opsHeartbeatOverdue')}</span>` : ''}</td>
      <td>${formatDuration(item.claim?.expires_in_seconds)}</td>
      <td><code>${escapeHtml(String(item.worker?.pid || '—'))}</code></td>
      <td>${escapeHtml(item.last_event?.kind || '—')}</td>
    </tr>`;
  }).join('');
  return section(t('opsRunning'), items.length ? table(['Task', t('assignee'), 'Elapsed', 'Heartbeat', 'Claim', 'PID', t('events')], rows) : empty(t('opsNoRunning')));
}

function renderRetryTable(items) {
  const rows = items.map(item => {
    const task = item.task || {};
    const stateLabel = item.state === 'eligible' ? t('opsEligibleNow') : `${t('opsEstimatedWait')} ${formatDuration(item.eligible_in_seconds)}`;
    return `<tr data-ops-task-id="${escapeHtml(task.id || '')}">
      <td>${taskLink(task)}</td>
      <td>${escapeHtml(task.assignee || t('unassigned'))}</td>
      <td>${escapeHtml(String(item.attempt || 0))}/${escapeHtml(String(item.max_retries || 0))}</td>
      <td>${escapeHtml(item.last_failure_kind || '—')}</td>
      <td>${errorDetails(item)}</td>
      <td><span class="ops-chip warning">${formatDuration(item.estimated_backoff_seconds)}</span> ${escapeHtml(stateLabel)}</td>
      <td>${logButton(task.id)}</td>
    </tr>`;
  }).join('');
  return section(t('opsRetryQueue'), items.length ? table(['Task', t('assignee'), t('opsAttempt'), 'Kind', t('opsLastError'), 'Estimated backoff', ''], rows) : empty(t('opsNoRetry')));
}

function renderBlockedAfterRetries(items) {
  const page = pageItems(items, 'blocked');
  const rows = page.items.map(item => {
    const task = item.task || {};
    return `<tr data-ops-task-id="${escapeHtml(task.id || '')}">
      <td>${taskLink(task)}</td>
      <td>${escapeHtml(String(item.attempt || 0))}/${escapeHtml(String(item.max_retries || 0))}</td>
      <td>${escapeHtml(item.last_failure_kind || '—')}</td>
      <td>${errorDetails(item)}</td>
      <td><button class="button ghost" type="button" data-ops-task-id="${escapeHtml(task.id || '')}">${t('opsOpenTask')}</button> ${logButton(task.id)}</td>
    </tr>`;
  }).join('');
  return section(t('opsBlockedAfterRetries'), items.length ? table(['Task', t('opsAttempt'), 'Kind', t('opsLastError'), ''], rows) + pagination('blocked', page, t('opsBlockedAfterRetries')) : empty(t('opsNoBlockedAfterRetries')));
}

function renderRecentFailures(items) {
  const page = pageItems(items, 'failures');
  const rows = page.items.map(event => `<tr data-ops-task-id="${escapeHtml(event.task_id || '')}">
    <td><code>${escapeHtml(String(event.id))}</code></td>
    <td>${escapeHtml(event.kind || '')}</td>
    <td><code>${escapeHtml(event.task_id || '')}</code></td>
    <td>${formatTimestamp(event.created_at)}</td>
    <td>${errorDetails({ payload: event.payload, last_error: event.payload?.error || event.payload?.summary || event.payload?.reason })}</td>
    <td>${logButton(event.task_id)}</td>
  </tr>`).join('');
  return section(t('opsRecentFailures'), items.length ? `<p class="ops-table-note">${escapeHtml(t('opsRecentLimit'))}</p>` + table(['ID', 'Kind', 'Task', t('created'), t('opsLastError'), ''], rows) + pagination('failures', page, t('opsRecentFailures')) : empty(t('opsNoFailures')));
}

function section(title, body) {
  return `<section class="ops-section"><div class="section-title"><span>${escapeHtml(title)}</span></div>${body}</section>`;
}

function table(headers, rows) {
  return `<div class="ops-table-wrap"><table class="ops-table"><thead><tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function empty(message) {
  return `<p class="ops-empty">${escapeHtml(message)}</p>`;
}

function taskLink(task) {
  return `<button class="ops-task-link" type="button" data-ops-task-id="${escapeHtml(task.id || '')}"><code>${escapeHtml(task.id || '')}</code><span>${escapeHtml(task.title || '')}</span></button>`;
}

function logButton(taskId) {
  if (!taskId) return '';
  return `<button class="button ghost ops-log-button" type="button" data-ops-task-id="${escapeHtml(taskId)}" data-ops-view="log">${escapeHtml(t('opsViewLog'))}</button>`;
}

function errorDetails(item) {
  const text = String(item?.last_error || item?.payload?.error || item?.payload?.summary || '');
  if (!text) return '—';
  return `<details class="ops-error-detail"><summary>${escapeHtml(errorSummary(item))}</summary><pre>${escapeHtml(text)}</pre></details>`;
}

export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || Number.isNaN(Number(seconds))) return '—';
  const value = Math.max(0, Number(seconds));
  if (value < 60) return `${Math.round(value)}s`;
  if (value < 3600) return `${Math.floor(value / 60)}m ${Math.round(value % 60)}s`;
  return `${Math.floor(value / 3600)}h ${Math.floor((value % 3600) / 60)}m`;
}

export function formatTimestamp(epoch) {
  if (!epoch) return '—';
  const date = new Date(Number(epoch) * 1000);
  if (Number.isNaN(date.getTime())) return String(epoch);
  return date.toLocaleString();
}

export function errorSummary(item) {
  const raw = item?.last_error || item?.payload?.error || item?.payload?.summary || '';
  const text = String(raw || '—');
  return text.length > 96 ? `${text.slice(0, 93)}…` : text;
}
