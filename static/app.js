import { api } from './api.js?v=20260508-02';
import { applyI18n, lang, setLang, t } from './i18n.js?v=20260508-02';
import { setupThemeToggle, updateThemeToggleLabel } from './theme.js?v=20260508-02';
import { renderBoard, renderKpis } from './board.js?v=20260508-02';
import { setupDependencyControls } from './dependency-lines.js?v=20260508-02';
import { setupForms } from './forms.js?v=20260508-02';
import { setupMobileFallback } from './mobile.js?v=20260508-02';
import { setupAppUpdatePrompt } from './update.js?v=20260508-02';
import { setupOperationsPanel, refreshOperationsPanel } from './operations.js?v=20260508-02';
import { closeDrawer } from './drawer.js?v=20260508-02';
import { state, setBoard, toast } from './state.js?v=20260508-02';

function renderBoardCards(data) {
  const root = document.getElementById('boardCards');
  if (!root) return;
  const boards = Array.isArray(data?.boards) ? data.boards : [];
  const count = document.getElementById('boardCardsCount');
  if (count) count.textContent = `${boards.length} ${t('boardsCount')}`;
  root.replaceChildren();

  for (const board of boards) {
    const card = document.createElement('button');
    const active = board.slug === state.board;
    card.type = 'button';
    card.className = `board-card${active ? ' is-active' : ''}`;
    card.setAttribute('data-board-card', board.slug);
    card.setAttribute('aria-pressed', active ? 'true' : 'false');
    card.innerHTML = `
      <span class="board-card-top">
        <span class="board-card-icon" aria-hidden="true"></span>
        ${active ? `<span class="board-card-active">${t('activeBoard')}</span>` : ''}
      </span>
      <strong class="board-card-name"></strong>
      <code class="board-card-slug"></code>
      <span class="board-card-description"></span>
      <span class="board-card-footer">
        <span class="board-card-total"></span>
        <span class="board-card-open">${t('openBoard')} →</span>
      </span>`;
    card.querySelector('.board-card-name').textContent = board.name || board.slug;
    card.querySelector('.board-card-icon').textContent = board.icon || '▦';
    card.querySelector('.board-card-slug').textContent = board.slug;
    card.querySelector('.board-card-description').textContent = board.description || '';
    card.querySelector('.board-card-total').textContent = `${board.total || 0} ${t('boardTasks')}`;
    card.addEventListener('click', () => selectBoard(board.slug));
    root.appendChild(card);
  }

  if (!boards.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = t('empty');
    root.appendChild(empty);
  }
}

async function selectBoard(slug) {
  if (!slug) return;
  setBoard(slug);
  await api.switchBoard(slug);
  await load();
}

async function loadBoards() {
  const data = await api.boards();
  const select = document.getElementById('boardSelect');
  select.replaceChildren();
  for (const b of data.boards) {
    const option = document.createElement('option');
    option.value = b.slug;
    option.textContent = `${b.icon || ''} ${b.name || b.slug} (${b.total || 0})`;
    select.appendChild(option);
  }
  if (!data.boards.find(b => b.slug === state.board)) setBoard(data.current || 'default');
  select.value = state.board;
  renderBoardCards(data);
}

async function loadStatus() {
  const status = await api.status();
  document.getElementById('healthDot').classList.toggle('ok', status.ok);
  document.getElementById('healthText').textContent = status.ok ? 'OK' : 'Error';
  document.getElementById('dbPath').textContent = status.db_path || '';
  const serverLabel = document.getElementById('serverLabel');
  if (serverLabel) serverLabel.textContent = `${status.service || 'kanban-webui'} · ${window.location.host}`;
}

function countAssigneeTasks(assignee) {
  return Object.values(assignee.counts || {}).reduce((sum, count) => sum + Number(count || 0), 0);
}

function assigneeOptionLabel(assignee) {
  const count = countAssigneeTasks(assignee);
  const kind = assignee.on_disk ? t('agentProfile') : t('manualAssignee');
  return `${assignee.name} · ${kind}${count ? ` (${count})` : ''}`;
}

function appendOption(select, value, label) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  select.appendChild(option);
}

function renderAssigneeControls(data) {
  const assignees = Array.isArray(data.assignees) ? data.assignees : [];
  const profileAssignees = assignees.filter(item => item && item.on_disk);

  const taskAssignee = document.getElementById('taskAssignee');
  const previousTaskAssignee = taskAssignee.value || localStorage.getItem('lastAssignee') || '';
  taskAssignee.replaceChildren();
  appendOption(taskAssignee, '', t('unassigned'));
  for (const assignee of profileAssignees) appendOption(taskAssignee, assignee.name, assigneeOptionLabel(assignee));
  taskAssignee.value = profileAssignees.some(item => item.name === previousTaskAssignee) ? previousTaskAssignee : '';

  const filter = document.getElementById('assigneeFilter');
  const previousFilter = state.assignee || filter.value || '';
  filter.replaceChildren();
  appendOption(filter, '', t('allAssignees'));
  for (const assignee of assignees) appendOption(filter, assignee.name, assigneeOptionLabel(assignee));
  if (assignees.some(item => item.name === previousFilter)) {
    filter.value = previousFilter;
  } else {
    filter.value = '';
    state.assignee = '';
  }
}

export async function load() {
  await api.config().then(cfg => { state.config = cfg; });
  await loadBoards();
  const params = {
    board: state.board,
    include_archived: state.includeArchived,
    q: state.query,
    assignee: state.assignee
  };
  const data = await api.board(params);
  state.data = data;
  state.latestEventId = data.latest_event_id;
  renderAssigneeControls(data);
  document.getElementById('boardTitle').textContent = data.board_meta.name || data.board;
  document.getElementById('boardDescription').textContent = data.board_meta.description || 'WebUI Kanban khusus yang menggunakan basis data yang sama dengan Hermes CLI';
  renderKpis(data);
  renderBoard(data);
  await refreshOperationsPanel();
  await loadStatus();
}

function setupControls() {
  document.getElementById('refreshBtn').addEventListener('click', load);
  document.getElementById('langToggle').addEventListener('click', () => { setLang(lang() === 'id' ? 'en' : 'id'); updateThemeToggleLabel(); load(); });
  document.getElementById('boardSelect').addEventListener('change', async ev => {
    setBoard(ev.target.value);
    await api.switchBoard(state.board);
    await load();
  });
  document.getElementById('archivedToggle').addEventListener('change', ev => { state.includeArchived = ev.target.checked; load(); });
  document.getElementById('searchInput').addEventListener('input', ev => { state.query = ev.target.value; clearTimeout(ev.target._timer); ev.target._timer = setTimeout(load, 250); });
  document.getElementById('assigneeFilter').addEventListener('change', ev => { state.assignee = ev.target.value; load(); });
  document.getElementById('overlay').addEventListener('click', closeDrawer);
  document.addEventListener('kanban:refresh', load);
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') closeDrawer();
    const tagName = ev.target?.tagName?.toLowerCase();
    const isTyping = ['input', 'select', 'textarea'].includes(tagName) || ev.target?.isContentEditable;
    if (!isTyping && ev.key === '/') { ev.preventDefault(); document.getElementById('searchInput').focus(); }
    if (!isTyping && ev.key.toLowerCase() === 'n') document.getElementById('taskCreateBtn').click();
  });
}

async function pollEvents() {
  try {
    const data = await api.events(state.board, state.latestEventId || 0);
    if (data.events.length) await load();
  } catch (err) {
    console.warn(err);
  } finally {
    state.refreshTimer = setTimeout(pollEvents, 2500);
  }
}

async function main() {
  applyI18n();
  setupThemeToggle();
  setupControls();
  setupDependencyControls();
  setupForms(load);
  setupMobileFallback();
  setupAppUpdatePrompt();
  setupOperationsPanel();
  const storedAssignee = localStorage.getItem('lastAssignee') || '';
  const taskAssignee = document.getElementById('taskAssignee');
  if (taskAssignee) taskAssignee.value = storedAssignee;
  try {
    await load();
    pollEvents();
  } catch (err) {
    console.error(err);
    toast(err.message || String(err), 'error');
  }
}

main();
