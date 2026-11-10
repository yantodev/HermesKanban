import assert from 'node:assert/strict';

globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const handlers = {};
const panel = {
  innerHTML: '', hidden: false,
  addEventListener: (event, handler) => { handlers[event] = handler; },
  querySelector: () => ({ focus() {} }),
};
const toggle = { setAttribute() {}, addEventListener() {} };
globalThis.document = { getElementById: id => ({ opsPanel: panel, opsToggleBtn: toggle })[id] || null };

const { state } = await import('../static/state.js?v=20261110-improvements');
const { setupOperationsPanel, renderOperationsPanel } = await import('../static/operations.js?v=20261110-improvements');
setupOperationsPanel();
state.opsData = {
  blocked_after_retries: Array.from({ length: 12 }, (_, i) => ({ task: { id: `blocked-${i + 1}`, title: `Task ${i + 1}` } })),
  recent_failures: Array.from({ length: 12 }, (_, i) => ({ id: i + 1, task_id: `failed-${i + 1}`, kind: 'failed' })),
};

function clickPage(key, direction) {
  const button = { dataset: { opsPage: key, direction: String(direction) }, disabled: false };
  handlers.click({ target: { closest: selector => selector === '[data-ops-page]' ? button : null } });
}
function section(name) {
  return panel.innerHTML.split(`<span>${name}</span>`)[1].split('</section>')[0];
}

renderOperationsPanel(state.opsData);
assert.match(section('Terblokir setelah percobaan ulang'), /1–5 dari 12/);
assert.match(section('Kegagalan terbaru'), /1–5 dari 12/);
assert.doesNotMatch(section('Terblokir setelah percobaan ulang'), /blocked-6/);
clickPage('blocked', 1);
assert.match(section('Terblokir setelah percobaan ulang'), /6–10 dari 12/);
assert.match(section('Terblokir setelah percobaan ulang'), /blocked-6/);
assert.doesNotMatch(section('Terblokir setelah percobaan ulang'), /blocked-11/);
assert.match(section('Kegagalan terbaru'), /1–5 dari 12/);
clickPage('failures', 1);
clickPage('failures', 1);
assert.match(section('Kegagalan terbaru'), /11–12 dari 12/);
assert.match(section('Terblokir setelah percobaan ulang'), /6–10 dari 12/);
state.opsData.recent_failures = state.opsData.recent_failures.slice(0, 6);
renderOperationsPanel(state.opsData);
assert.match(section('Kegagalan terbaru'), /6–6 dari 6/);
state.board = 'another-board';
renderOperationsPanel(state.opsData);
assert.match(section('Terblokir setelah percobaan ulang'), /1–5 dari 12/);
assert.match(section('Kegagalan terbaru'), /1–5 dari 6/);
state.opsData.blocked_after_retries = state.opsData.blocked_after_retries.slice(0, 5);
renderOperationsPanel(state.opsData);
assert.match(section('Terblokir setelah percobaan ulang'), /blocked-5/);
assert.doesNotMatch(section('Terblokir setelah percobaan ulang'), /ops-pagination/);

state.opsData.blocked_after_retries = [{ task: { id: 'task-log', title: 'A task' }, last_error: '<script>alert(1)</script>' }];
renderOperationsPanel(state.opsData);
assert.match(section('Terblokir setelah percobaan ulang'), /data-ops-view="log"/);
assert.match(section('Terblokir setelah percobaan ulang'), /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.doesNotMatch(section('Terblokir setelah percobaan ulang'), /<script>/);
state.opsData.blocked_after_retries = [];
renderOperationsPanel(state.opsData);
assert.match(section('Terblokir setelah percobaan ulang'), /Tidak ada tugas yang terblokir/);
assert.doesNotMatch(section('Terblokir setelah percobaan ulang'), /ops-pagination/);
