import assert from 'node:assert/strict';

globalThis.localStorage = { getItem: () => null, setItem: () => {} };
globalThis.requestAnimationFrame = () => 1;
const board = {
  innerHTML: '', dataset: {}, style: { setProperty(name, value) { this[name] = value; } },
  querySelectorAll: () => [], addEventListener() {},
};
const kpis = { innerHTML: '', style: { setProperty() {} } };
globalThis.document = { getElementById: id => ({ board, kpiRow: kpis })[id] || null, addEventListener() {} };
const { renderBoard, renderKpis } = await import('../static/board.js?v=20261110-improvements');
const triage = { id: 't-triage', title: 'Needs triage', status: 'triage', assignee: 'agent' };
const todo = { id: 't-todo', title: 'Waiting', status: 'todo', assignee: 'agent' };
const data = { column_order: ['triage', 'todo', 'ready'], columns: { triage: [triage], todo: [todo], ready: [] }, stats: { by_status: { triage: 1, todo: 1 } } };
renderBoard(data);
assert.doesNotMatch(board.innerHTML, /class="board-column" data-status="triage"/);
assert.match(board.innerHTML, /data-status="todo"[\s\S]*?<h2>Menunggu<\/h2><small>2<\/small>/);
assert.match(board.innerHTML, /data-task-id="t-triage"/);
assert.match(board.innerHTML, /data-task-id="t-todo"/);
assert.match(board.innerHTML, /class="triage-label"[^>]*>Triage<\/span>/);
assert.equal(triage.status, 'triage');
assert.equal(board.style['--kanban-column-count'], '2');
renderKpis(data);
assert.doesNotMatch(kpis.innerHTML, /<small>Triage<\/small>/);
assert.match(kpis.innerHTML, /<small>Menunggu<\/small><strong>2<\/strong>/);
