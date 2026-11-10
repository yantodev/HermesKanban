import { api } from './api.js?v=20261110-improvements';
import { applyI18n, lang, setLang, t } from './i18n.js?v=20261110-improvements';
import { setupThemeToggle, updateThemeToggleLabel } from './theme.js?v=20261110-improvements';
import { renderBoard, renderKpis } from './board.js?v=20261110-improvements';
import { setupDependencyControls } from './dependency-lines.js?v=20261110-improvements';
import { setupForms } from './forms.js?v=20261110-improvements';
import { setupMobileFallback } from './mobile.js?v=20261110-improvements';
import { setupAppUpdatePrompt } from './update.js?v=20261110-improvements';
import { setupOperationsPanel, refreshOperationsPanel } from './operations.js?v=20261110-improvements';
import { closeDrawer, openTaskDrawer } from './drawer.js?v=20261110-improvements';
import { attentionGroups } from './attention.js?v=20261110-improvements';
import { state, setBoard, toast } from './state.js?v=20261110-improvements';

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

function renderAttention(data) {
  const root = document.getElementById('attentionContent');
  const categorized = attentionGroups(data?.tasks);
  const groups = [
    [t('blocked'), categorized.blocked],
    [t('profileMissing'), categorized.unassigned],
    [t('review'), categorized.review],
  ];
  const unique = new Set(groups.flatMap(([, items]) => items.map(item => item.id)));
  document.getElementById('attentionCount').textContent = `(${unique.size})`;
  root.replaceChildren();
  if (state.query || state.assignee || state.includeArchived) {
    const note = document.createElement('p');
    note.className = 'muted attention-note';
    note.textContent = t('attentionFiltered');
    root.appendChild(note);
  }
  for (const [label, items] of groups) {
    const section = document.createElement('section');
    const title = document.createElement('h3');
    title.textContent = `${label} (${items.length})`;
    section.appendChild(title);
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'muted';
      empty.textContent = t('empty');
      section.appendChild(empty);
    }
    for (const task of items.slice(0, 5)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'attention-task';
      button.dataset.attentionTask = task.id;
      button.textContent = task.title || task.id;
      section.appendChild(button);
    }
    if (items.length > 5) {
      const more = document.createElement('p');
      more.className = 'muted';
      more.textContent = t('attentionMore').replace('{count}', String(items.length - 5));
      section.appendChild(more);
    }
    root.appendChild(section);
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
  try {
    const status = await api.status();
    document.getElementById('healthDot').classList.toggle('ok', status.ok);
    document.getElementById('healthText').textContent = status.ok ? 'OK' : 'Error';
    document.getElementById('healthWarning').hidden = Boolean(status.ok);
    document.getElementById('dbPath').textContent = status.db_path || '';
    document.getElementById('serverLabel').textContent = `${status.service || 'kanban-webui'} · ${window.location.host}`;
  } catch (err) {
    document.getElementById('healthDot').classList.remove('ok');
    document.getElementById('healthText').textContent = 'Error';
    document.getElementById('healthWarning').hidden = false;
    console.warn(err);
  }
}

function updateFilterCount() {
  const count = Number(Boolean(state.assignee)) + Number(state.includeArchived) + Number(state.dependencyView !== 'focus');
  const badge = document.getElementById('filterCount');
  badge.textContent = count ? String(count) : '';
  badge.hidden = !count;
  badge.setAttribute('aria-label', `${count} ${t('activeFilters')}`);
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
  document.getElementById('boardDescription').textContent = data.board_meta.description || '';
  updateFilterCount();
  renderKpis(data);
  renderBoard(data);
  renderAttention(data);
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
  document.getElementById('archivedToggle').addEventListener('change', ev => { state.includeArchived = ev.target.checked; updateFilterCount(); load(); });
  document.getElementById('searchInput').addEventListener('input', ev => { state.query = ev.target.value; clearTimeout(ev.target._timer); ev.target._timer = setTimeout(load, 250); });
  document.getElementById('assigneeFilter').addEventListener('change', ev => { state.assignee = ev.target.value; updateFilterCount(); load(); });
  document.getElementById('dependencyView').addEventListener('change', ev => { state.dependencyView = ev.target.value; updateFilterCount(); });
  document.getElementById('attentionContent').addEventListener('click', ev => {
    const task = ev.target.closest('[data-attention-task]');
    if (task) openTaskDrawer(task.dataset.attentionTask).catch(err => toast(err.message || String(err), 'error'));
  });
  document.addEventListener('click', ev => {
    document.querySelectorAll('.menu-disclosure[open]').forEach(menu => {
      if (!menu.contains(ev.target) || ev.target.closest('button')) menu.open = false;
    });
  });
  document.getElementById('overlay').addEventListener('click', closeDrawer);
  document.addEventListener('kanban:refresh', load);
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') {
      document.querySelectorAll('.menu-disclosure[open]').forEach(menu => { menu.open = false; menu.querySelector('summary')?.focus(); });
      closeDrawer();
    }
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
