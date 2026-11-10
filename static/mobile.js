import { api } from './api.js?v=20261110-improvements';
import { t } from './i18n.js?v=20261110-improvements';
import { state, toast } from './state.js?v=20261110-improvements';

export function availableMoveStatuses(current) {
  const statuses = ['triage', 'todo', 'ready'];
  if (['running', 'ready'].includes(current)) statuses.push('blocked');
  if (['running', 'ready', 'blocked', 'done'].includes(current)) statuses.push('review');
  if (['running', 'ready', 'blocked'].includes(current)) statuses.push('done');
  if (current !== 'archived') statuses.push('archived');
  return statuses.filter(status => status !== current);
}

export function movePayload(status, reason, summary) {
  if (status === 'blocked') return { status, block_reason: reason.trim() };
  if (status === 'done') return { status, summary: summary.trim(), result: summary.trim() };
  return { status };
}

export function setupMobileFallback() {
  const dialog = document.getElementById('moveDialog');
  const form = document.getElementById('moveForm');
  const select = document.getElementById('moveStatus');
  if (!dialog || !form || !select) return;
  let taskId = null;
  let taskBoard = null;
  const error = document.getElementById('moveError');
  const submit = form.querySelector('[type="submit"]');

  function updateFields() {
    document.getElementById('moveReasonLabel').hidden = select.value !== 'blocked';
    document.getElementById('moveSummaryLabel').hidden = select.value !== 'done';
    document.getElementById('moveArchiveWarning').hidden = select.value !== 'archived';
  }

  function open(card) {
    if (dialog.open) return;
    taskId = card.dataset.taskId;
    taskBoard = state.board;
    form.reset();
    error.hidden = true;
    select.replaceChildren();
    for (const status of availableMoveStatuses(card.dataset.taskStatus)) {
      const option = document.createElement('option');
      option.value = status;
      option.textContent = t(status);
      select.appendChild(option);
    }
    document.getElementById('moveTaskTitle').textContent = card.querySelector('h3')?.textContent || taskId;
    updateFields();
    dialog.showModal();
  }

  document.addEventListener('click', ev => {
    const button = ev.target.closest?.('[data-mobile-move]');
    const card = button?.closest('.task-card');
    if (card) open(card);
  });
  document.addEventListener('contextmenu', ev => {
    const card = ev.target.closest?.('.task-card');
    if (!card || !matchMedia('(max-width: 760px)').matches) return;
    ev.preventDefault();
    open(card);
  });
  select.addEventListener('change', updateFields);
  document.getElementById('moveCancel').addEventListener('click', () => dialog.close());
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    if (!taskId || !select.value) return;
    const data = new FormData(form);
    const payload = movePayload(select.value, String(data.get('reason') || ''), String(data.get('summary') || ''));
    submit.disabled = true;
    error.hidden = true;
    try {
      await api.updateTask(taskBoard, taskId, payload);
      dialog.close();
      toast(`${t('moveConfirm')} → ${t(payload.status)}`);
      document.dispatchEvent(new CustomEvent('kanban:refresh'));
    } catch (err) {
      error.textContent = err.message || String(err);
      error.hidden = false;
    } finally {
      submit.disabled = false;
    }
  });
}
