function tokenHeaders() {
  const token = localStorage.getItem('kanbanToken');
  return token ? { 'X-Kanban-Token': token } : {};
}

function promptForToken() {
  const entered = window.prompt('Kanban API token:');
  const token = (entered || '').trim();
  if (token) localStorage.setItem('kanbanToken', token);
  return token;
}

function errorMessage(data, fallback) {
  const message = data.detail || data.error || fallback;
  if (Array.isArray(message)) return message.map(x => x.msg || JSON.stringify(x)).join(', ');
  if (message && typeof message === 'object') return JSON.stringify(message);
  return message;
}

export async function request(path, options = {}) {
  const { _authRetry = false, ...requestOptions } = options;
  const headers = { ...(requestOptions.headers || {}), ...tokenHeaders() };
  let body = requestOptions.body;
  if (body && typeof body !== 'string' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  const res = await fetch(path, { ...requestOptions, headers, body });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (res.status === 401 && !_authRetry && path.startsWith('/api/')) {
    if (promptForToken()) return request(path, { ...options, _authRetry: true });
  }
  if (!res.ok) throw new Error(errorMessage(data, res.statusText));
  return data;
}

function boardQuery(board, extra = {}) {
  const clean = { ...extra };
  if (board) clean.board = board;
  return new URLSearchParams(clean).toString();
}

export const api = {
  health: () => request('/health'),
  status: () => request('/api/service/status'),
  appUpdateStatus: () => request('/api/app/update-status'),
  applyAppUpdate: () => request('/api/app/update', { method: 'POST' }),
  config: () => request('/api/config'),
  opsSummary: (board, recentLimit = 20) => request(`/api/ops/summary?${boardQuery(board, { recent_limit: recentLimit })}`),
  boards: () => request('/api/boards'),
  createBoard: payload => request('/api/boards', { method: 'POST', body: payload }),
  switchBoard: slug => request(`/api/boards/${encodeURIComponent(slug)}/switch`, { method: 'POST' }),
  createWorkflowDraft: (board, payload) => request(`/api/workflows/drafts?${boardQuery(board)}`, { method: 'POST', body: payload }),
  getWorkflowDraft: (board, draftId) => request(`/api/workflows/drafts/${encodeURIComponent(draftId)}?${boardQuery(board)}`),
  reviseWorkflowDraft: (board, draftId, payload) => request(`/api/workflows/drafts/${encodeURIComponent(draftId)}/revise?${boardQuery(board)}`, { method: 'POST', body: payload }),
  instantiateWorkflowDraft: (board, draftId, payload = {}) => request(`/api/workflows/drafts/${encodeURIComponent(draftId)}/instantiate?${boardQuery(board)}`, { method: 'POST', body: payload }),
  workflowInstance: (board, instanceId) => request(`/api/workflows/instances/${encodeURIComponent(instanceId)}?${boardQuery(board)}`),
  board: params => {
    const clean = {};
    for (const [key, value] of Object.entries(params || {})) {
      if (value !== undefined && value !== null && value !== '') clean[key] = value;
    }
    const query = new URLSearchParams(clean).toString();
    return request(query ? `/api/board?${query}` : '/api/board');
  },
  createTask: (board, payload) => request(`/api/tasks?${new URLSearchParams({ board })}`, { method: 'POST', body: payload }),
  bulkCreate: (board, payload) => request(`/api/tasks/bulk-create?${new URLSearchParams({ board })}`, { method: 'POST', body: payload }),
  task: (board, id) => request(`/api/tasks/${encodeURIComponent(id)}?${new URLSearchParams({ board })}`),
  updateTask: (board, id, payload) => request(`/api/tasks/${encodeURIComponent(id)}?${new URLSearchParams({ board })}`, { method: 'PATCH', body: payload }),
  comment: (board, id, payload) => request(`/api/tasks/${encodeURIComponent(id)}/comments?${new URLSearchParams({ board })}`, { method: 'POST' , body: payload }),
  linkTask: (board, payload) => request(`/api/links?${new URLSearchParams({ board })}`, { method: 'POST', body: payload }),
  unlinkTask: (board, parentId, childId) => request(`/api/links?${new URLSearchParams({ board, parent_id: parentId, child_id: childId })}`, { method: 'DELETE' }),
  taskLog: (board, id, tail = 100000) => request(`/api/tasks/${encodeURIComponent(id)}/log?${new URLSearchParams({ board, tail })}`),
  homeChannels: (board, id) => request(`/api/home-channels?${new URLSearchParams({ board, task_id: id })}`),
  subscribeHome: (board, id, platform) => request(`/api/tasks/${encodeURIComponent(id)}/home-subscribe/${encodeURIComponent(platform)}?${new URLSearchParams({ board })}`, { method: 'POST' }),
  unsubscribeHome: (board, id, platform) => request(`/api/tasks/${encodeURIComponent(id)}/home-subscribe/${encodeURIComponent(platform)}?${new URLSearchParams({ board })}`, { method: 'DELETE' }),
  monitor: (board, id) => request(`/api/tasks/${encodeURIComponent(id)}/monitor?${new URLSearchParams({ board, tail: 65536 })}`),
  events: (board, since = 0) => request(`/api/events?${new URLSearchParams({ board, since })}`)
};
