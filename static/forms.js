import { api } from './api.js?v=20261110-improvements';
import { escapeHtml } from './markdown.js?v=20261110-improvements';
import { t } from './i18n.js?v=20261110-improvements';
import { state, toast, setBoard } from './state.js?v=20261110-improvements';

function stepKey(step) {
  return step.step_key || step.key || '';
}

let workflowDirty = false;

function renderWorkflowSteps(root, steps, profiles, editable) {
  const items = (steps || []).map((step, index) => {
    const key = stepKey(step);
    const deps = step.depends_on || [];
    const assignee = step.assignee ? `@${step.assignee}` : t('unassigned');
    const criteria = (step.acceptance_criteria || []).map(item => `<li>${escapeHtml(item)}</li>`).join('');
    const profileOptions = [`<option value="">${escapeHtml(t('unassigned'))}</option>`, ...(profiles || []).map(profile => `<option value="${escapeHtml(profile.name)}"${profile.name === step.assignee ? ' selected' : ''}>${escapeHtml(profile.name)}</option>`)].join('');
    const dependencies = (steps || []).filter(candidate => stepKey(candidate) !== key).map(candidate => `<label><input type="checkbox" data-step-dependency value="${escapeHtml(stepKey(candidate))}"${deps.includes(stepKey(candidate)) ? ' checked' : ''} /> ${escapeHtml(candidate.title || stepKey(candidate))} <code>${escapeHtml(stepKey(candidate))}</code></label>`).join('');
    return `<li class="workflow-step ${escapeHtml(step.status || 'todo')}" data-step-key="${escapeHtml(key)}">
      <div><strong>${escapeHtml(step.title || key)}</strong><code>${escapeHtml(key)}</code></div>
      <div class="workflow-meta"><span>${escapeHtml(assignee)}</span><span>${escapeHtml(step.status || 'todo')}</span>${deps.length ? `<span>← ${deps.map(escapeHtml).join(', ')}</span>` : ''}</div>
      ${step.body ? `<p>${escapeHtml(step.body)}</p>` : ''}
      ${criteria ? `<ul class="workflow-criteria">${criteria}</ul>` : ''}
      ${editable ? `<div class="workflow-step-editor"><label>${escapeHtml(t('assignee'))}<select data-step-assignee>${profileOptions}</select></label><fieldset><legend>${escapeHtml(t('workflowDependsOn'))}</legend>${dependencies || `<span class="muted">${escapeHtml(t('none'))}</span>`}</fieldset><div class="workflow-order"><button type="button" class="button ghost" data-step-order="up" ${index === 0 ? 'disabled' : ''}>${escapeHtml(t('workflowMoveUp'))}</button><button type="button" class="button ghost" data-step-order="down" ${index === steps.length - 1 ? 'disabled' : ''}>${escapeHtml(t('workflowMoveDown'))}</button></div></div>` : ''}
    </li>`;
  }).join('');
  root.innerHTML = items ? `<ol class="workflow-step-list">${items}</ol>` : `<p class="muted">${t('empty')}</p>`;
}

function renderAttachmentList(attachments) {
  const items = (attachments || []).map(att => `<li><span>${escapeHtml(att.filename || att.name || 'attachment')}</span><small>${Number(att.size_bytes || att.size || 0).toLocaleString()} B</small></li>`).join('');
  return items ? `<ul class="workflow-attachment-list">${items}</ul>` : '';
}

function renderWorkflowDraft(root, draft) {
  if (!root) return;
  if (!draft) {
    root.innerHTML = `<p class="muted">${t('workflowDraftEmpty')}</p>`;
    return;
  }
  const proposal = draft.proposal || {};
  const warnings = [...(proposal.warnings || []), ...((draft.validation || {}).warnings || [])];
  const questions = proposal.questions || [];
  const notApplyable = proposal.applyable === false;
  root.innerHTML = `
    <div class="workflow-draft-summary">
      <div class="workflow-meta"><span>${t('workflowDraftStatus')}: ${escapeHtml(draft.status || 'draft')}</span><span>${t('workflowPlannerProfile')}: ${escapeHtml(draft.planner_profile || '')}</span><span>rev ${escapeHtml(String(draft.revision || 1))}</span></div>
      <h4>${escapeHtml(proposal.title || t('workflowCreate'))}</h4>
      <p>${escapeHtml(proposal.summary || '')}</p>
      ${proposal.strategy ? `<p><strong>Strategy</strong> ${escapeHtml(proposal.strategy)}</p>` : ''}
      ${renderAttachmentList(draft.attachments || [])}
      ${notApplyable ? `<div class="workflow-warnings"><strong>${escapeHtml(t('workflowNotApplyable'))}</strong></div>` : ''}
      ${warnings.length ? `<div class="workflow-warnings"><strong>Warnings</strong><ul>${warnings.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}
      ${questions.length ? `<div class="workflow-questions"><strong>Questions</strong><ul>${questions.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}
      ${draft.status !== 'applied' ? `<p>${escapeHtml(t('workflowOrderHint'))}</p>` : ''}
    </div>`;
  const steps = document.createElement('div');
  renderWorkflowSteps(steps, proposal.steps || [], draft.profiles || [], draft.status !== 'applied');
  root.appendChild(steps);
  if (draft.status !== 'applied') {
    const actions = document.createElement('div');
    actions.className = 'workflow-draft-actions';
    actions.innerHTML = `<button type="button" class="button ghost" data-workflow-save disabled>${escapeHtml(t('workflowSaveChanges'))}</button><button type="button" class="button ghost" data-workflow-discard disabled>${escapeHtml(t('workflowDiscardChanges'))}</button><span class="muted" data-workflow-dirty hidden>${escapeHtml(t('workflowUnsaved'))}</span>`;
    root.appendChild(actions);
  }
}

async function readWorkflowAttachments(input) {
  const files = Array.from(input?.files || []);
  const attachments = [];
  for (const file of files) {
    attachments.push({
      filename: file.name,
      content_type: file.type || 'text/plain',
      content: await file.text()
    });
  }
  return attachments;
}

function setWorkflowBusy(form, busy) {
  form.querySelectorAll('button, input, textarea, select').forEach(el => {
    if (el.dataset.workflowCancel !== undefined) return;
    el.disabled = Boolean(busy);
  });
  if (!busy) {
    const steps = [...form.querySelectorAll('[data-step-key]')];
    steps.forEach((row, index) => {
      row.querySelector('[data-step-order="up"]')?.toggleAttribute('disabled', index === 0);
      row.querySelector('[data-step-order="down"]')?.toggleAttribute('disabled', index === steps.length - 1);
    });
  }
}

function updateWorkflowActionState(form) {
  const hasDraft = Boolean(state.workflowDraft?.draft_id);
  const applied = state.workflowDraft?.status === 'applied';
  const notApplyable = state.workflowDraft?.proposal?.applyable === false;
  const revise = form.querySelector('[data-workflow-revise]');
  const apply = form.querySelector('[data-workflow-apply]');
  if (revise) revise.disabled = !hasDraft || applied || workflowDirty;
  if (apply) apply.disabled = !hasDraft || applied || notApplyable || workflowDirty;
  const plan = form.querySelector('[data-workflow-plan]');
  if (plan) plan.disabled = workflowDirty;
  for (const selector of ['[data-workflow-save]', '[data-workflow-discard]']) {
    const button = form.querySelector(selector);
    if (button) button.disabled = !workflowDirty || applied;
  }
  const dirty = form.querySelector('[data-workflow-dirty]');
  if (dirty) dirty.hidden = !workflowDirty;
}

function resetWorkflowDesigner(form) {
  state.workflowDraft = null;
  workflowDirty = false;
  form.reset();
  renderWorkflowDraft(document.getElementById('workflowDraftPreview'), null);
  updateWorkflowActionState(form);
}

async function createWorkflowDraft(form) {
  const prompt = String(form.querySelector('#workflowPrompt')?.value || '').trim();
  if (!prompt) return;
  const previewRoot = document.getElementById('workflowDraftPreview');
  previewRoot.innerHTML = `<p class="muted">${escapeHtml(t('workflowPlanning'))}</p>`;
  const result = await api.createWorkflowDraft(state.board, {
    prompt,
    planner_profile: String(form.querySelector('#workflowPlannerProfile')?.value || '').trim() || null,
    attachments: await readWorkflowAttachments(form.querySelector('#workflowAttachments'))
  });
  state.workflowDraft = result.draft;
  renderWorkflowDraft(previewRoot, state.workflowDraft);
  updateWorkflowActionState(form);
}

async function reviseWorkflowDraft(form) {
  const revisionPrompt = String(form.querySelector('#workflowRevisionPrompt')?.value || '').trim();
  if (!state.workflowDraft?.draft_id || !revisionPrompt) return;
  const previewRoot = document.getElementById('workflowDraftPreview');
  previewRoot.innerHTML = `<p class="muted">${escapeHtml(t('workflowPlanning'))}</p>`;
  const result = await api.reviseWorkflowDraft(state.board, state.workflowDraft.draft_id, { revision_prompt: revisionPrompt });
  state.workflowDraft = result.draft;
  form.querySelector('#workflowRevisionPrompt').value = '';
  renderWorkflowDraft(previewRoot, state.workflowDraft);
  updateWorkflowActionState(form);
}

async function applyWorkflowDraft(form, load) {
  if (!state.workflowDraft?.draft_id) return;
  const payload = { instance_id: String(form.querySelector('[name="instance_id"]')?.value || '').trim() || null };
  const result = await api.instantiateWorkflowDraft(state.board, state.workflowDraft.draft_id, payload);
  state.workflowDraft.status = 'applied';
  state.workflowDraft.applied_instance_id = result.instance_id;
  renderWorkflowDraft(document.getElementById('workflowDraftPreview'), state.workflowDraft);
  updateWorkflowActionState(form);
  toast(`${result.created} ${t('createdToast')} · ${result.existing} existing`);
  await load();
}

export function setupWorkflowDialog(load) {
  const workflowDialog = document.getElementById('workflowDialog');
  const workflowForm = document.getElementById('workflowForm');
  const workflowBtn = document.getElementById('workflowBtn');
  if (!workflowDialog || !workflowForm || !workflowBtn) return;

  workflowBtn.addEventListener('click', () => {
    resetWorkflowDesigner(workflowForm);
    workflowDialog.showModal();
  });
  workflowForm.addEventListener('submit', ev => ev.preventDefault());
  const preview = document.getElementById('workflowDraftPreview');
  preview.addEventListener('change', ev => {
    if (!ev.target.matches('[data-step-assignee], [data-step-dependency]')) return;
    workflowDirty = true;
    updateWorkflowActionState(workflowForm);
  });
  preview.addEventListener('click', async ev => {
    const reorder = ev.target.closest('[data-step-order]');
    if (reorder) {
      const item = reorder.closest('[data-step-key]');
      const other = reorder.dataset.stepOrder === 'up' ? item.previousElementSibling : item.nextElementSibling;
      if (!other) return;
      if (reorder.dataset.stepOrder === 'up') item.parentElement.insertBefore(item, other);
      else item.parentElement.insertBefore(other, item);
      const items = [...item.parentElement.children];
      items.forEach((row, index) => {
        row.querySelector('[data-step-order="up"]').disabled = index === 0;
        row.querySelector('[data-step-order="down"]').disabled = index === items.length - 1;
      });
      workflowDirty = true;
      updateWorkflowActionState(workflowForm);
      return;
    }
    if (ev.target.closest('[data-workflow-discard]')) {
      workflowDirty = false;
      renderWorkflowDraft(preview, state.workflowDraft);
      updateWorkflowActionState(workflowForm);
      return;
    }
    if (!ev.target.closest('[data-workflow-save]') || !state.workflowDraft || !workflowDirty) return;
    const steps = [...preview.querySelectorAll('[data-step-key]')].map(row => ({
      key: row.dataset.stepKey,
      assignee: row.querySelector('[data-step-assignee]').value || null,
      depends_on: [...row.querySelectorAll('[data-step-dependency]:checked')].map(input => input.value)
    }));
    try {
      setWorkflowBusy(workflowForm, true);
      const result = await api.editWorkflowDraft(state.board, state.workflowDraft.draft_id, { revision: state.workflowDraft.revision, steps });
      state.workflowDraft = result.draft;
      workflowDirty = false;
      renderWorkflowDraft(preview, state.workflowDraft);
      toast(t('workflowSaved'));
    } catch (err) {
      toast(err.message || String(err), 'error');
    } finally {
      setWorkflowBusy(workflowForm, false);
      updateWorkflowActionState(workflowForm);
    }
  });
  workflowForm.querySelector('[data-workflow-cancel]').addEventListener('click', () => workflowDialog.close());
  workflowForm.querySelector('[data-workflow-plan]').addEventListener('click', async () => {
    try {
      setWorkflowBusy(workflowForm, true);
      await createWorkflowDraft(workflowForm);
    } catch (err) {
      toast(err.message || String(err), 'error');
    } finally {
      setWorkflowBusy(workflowForm, false);
      updateWorkflowActionState(workflowForm);
    }
  });
  workflowForm.querySelector('[data-workflow-revise]').addEventListener('click', async () => {
    try {
      setWorkflowBusy(workflowForm, true);
      await reviseWorkflowDraft(workflowForm);
    } catch (err) {
      toast(err.message || String(err), 'error');
    } finally {
      setWorkflowBusy(workflowForm, false);
      updateWorkflowActionState(workflowForm);
    }
  });
  workflowForm.querySelector('[data-workflow-apply]').addEventListener('click', async () => {
    try {
      setWorkflowBusy(workflowForm, true);
      await applyWorkflowDraft(workflowForm, load);
    } catch (err) {
      toast(err.message || String(err), 'error');
    } finally {
      setWorkflowBusy(workflowForm, false);
      updateWorkflowActionState(workflowForm);
    }
  });
}

function openTaskCreateDialog(dialog, form, status = 'ready') {
  if (dialog.open) {
    requestAnimationFrame(() => form.querySelector('#taskTitle')?.focus());
    return;
  }
  form.reset();
  const taskStatus = form.querySelector('#taskStatus');
  const taskAssignee = form.querySelector('#taskAssignee');
  if (taskStatus) taskStatus.value = status || 'ready';
  if (taskAssignee) taskAssignee.value = localStorage.getItem('lastAssignee') || '';
  dialog.showModal();
  requestAnimationFrame(() => form.querySelector('#taskTitle')?.focus());
}

export function setupTaskCreateDialog(load) {
  const taskDialog = document.getElementById('taskDialog');
  const taskForm = document.getElementById('taskCreateForm');
  const taskButton = document.getElementById('taskCreateBtn');
  if (!taskDialog || !taskForm || !taskButton) return;

  taskButton.addEventListener('click', () => openTaskCreateDialog(taskDialog, taskForm, 'ready'));
  document.addEventListener('kanban:open-task-create', ev => {
    openTaskCreateDialog(taskDialog, taskForm, ev.detail?.status || 'ready');
  });
  taskForm.querySelector('[data-task-cancel]').addEventListener('click', () => taskDialog.close());
  taskForm.addEventListener('submit', async ev => {
    ev.preventDefault();
    const form = new FormData(ev.currentTarget);
    const title = String(form.get('title') || '').trim();
    if (!title) return;
    const body = String(form.get('body') || '').trim();
    const payload = {
      title,
      body: body || null,
      assignee: form.get('assignee') || null,
      status: form.get('status') || 'ready'
    };
    localStorage.setItem('lastAssignee', payload.assignee || '');
    await api.createTask(state.board, payload);
    taskDialog.close();
    toast(t('createdToast'));
    await load();
  });
}

export function setupForms(load) {
  setupTaskCreateDialog(load);

  const boardDialog = document.getElementById('boardDialog');
  document.getElementById('newBoardBtn').addEventListener('click', () => boardDialog.showModal());
  document.getElementById('boardForm').addEventListener('submit', async ev => {
    ev.preventDefault();
    const form = Object.fromEntries(new FormData(ev.currentTarget));
    if (!form.slug) return;
    const data = await api.createBoard({ ...form, switch: true });
    setBoard(data.current);
    boardDialog.close();
    toast('board created');
    await load();
  });

  const bulkDialog = document.getElementById('bulkDialog');
  document.getElementById('bulkBtn').addEventListener('click', () => bulkDialog.showModal());
  document.getElementById('bulkForm').addEventListener('submit', async ev => {
    ev.preventDefault();
    const lines = new FormData(ev.currentTarget).get('lines');
    const data = await api.bulkCreate(state.board, { lines });
    bulkDialog.close();
    toast(`${data.created} created`);
    await load();
  });

  setupWorkflowDialog(load);
}
