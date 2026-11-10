export function attentionGroups(tasks) {
  const items = Array.isArray(tasks) ? tasks : [];
  return {
    blocked: items.filter(task => task.status === 'blocked'),
    unassigned: items.filter(task => !task.assignee && !['done', 'archived'].includes(task.status)),
    review: items.filter(task => task.status === 'review'),
  };
}
