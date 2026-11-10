import assert from 'node:assert/strict';
import { attentionGroups } from '../static/attention.js?v=20261110-improvements';
const tasks = [
  { id: 'a', status: 'blocked', assignee: null },
  { id: 'b', status: 'review', assignee: 'dev' },
  { id: 'c', status: 'ready', assignee: null },
  { id: 'd', status: 'done', assignee: null },
  { id: 'e', status: 'archived', assignee: null },
];
const groups = attentionGroups(tasks);
assert.deepEqual(groups.blocked.map(task => task.id), ['a']);
assert.deepEqual(groups.unassigned.map(task => task.id), ['a', 'c']);
assert.deepEqual(groups.review.map(task => task.id), ['b']);
assert.deepEqual(attentionGroups(null), { blocked: [], unassigned: [], review: [] });
