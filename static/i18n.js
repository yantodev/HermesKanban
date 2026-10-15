export const labels = {
  en: {
    subtitle: 'Readable operations board', newBoard: 'New board', refresh: 'Refresh', themeDark: 'Switch dark', themeLight: 'Switch light', quickTitle: 'Type a task title and press Enter', boardsOverview: 'Boards', boardsCount: 'boards', boardTasks: 'tasks', activeBoard: 'Active', openBoard: 'Open board',
    taskCreate: 'Create task', taskCreateHint: 'Open this dialog only when you need to set title, details, agent profile, and status for a new task.', taskTitlePlaceholder: 'Task title', taskBodyPlaceholder: 'Task details/instructions (optional)',
    assignee: 'Agent profile', create: 'Create', created: 'Created', createdToast: 'Created', search: 'Search title/body/ID', allAssignees: 'All assignees', unassigned: 'Unassigned', profileMissing: 'Agent profile missing', profileMissingShort: 'Needs profile', agentProfile: 'profile', manualAssignee: 'manual', showArchived: 'Show archived',
    bulkCreate: 'Bulk create', boardName: 'Board name', description: 'Description', cancel: 'Cancel', bulkHint: 'One task per line.', loading: 'Loading…',
    workflow: 'Workflow', workflowCreate: 'Create AI workflow', workflowDesignerHint: 'Design a task DAG from a prompt and attachments, then approve it into real Kanban tasks.', workflowPrompt: 'Workflow prompt', workflowPromptPlaceholder: 'Describe goals, outputs, constraints, and desired step count', workflowPlannerProfile: 'Planner profile', workflowAttachments: 'Attachments', workflowPlan: 'Plan', workflowPlanning: 'AI is designing a workflow draft…', workflowRevise: 'Revise', workflowRevisionPlaceholder: 'Describe step/profile/dependency changes', workflowApply: 'Apply', workflowDraftStatus: 'Draft status', workflowDraftEmpty: 'Enter a prompt and click Plan to preview a draft.', workflowNotApplyable: 'This draft is not applyable yet. Resolve questions and send a revision.', workflowInstance: 'Instance ID', workflowStep: 'Current step', workflowSteps: 'steps',
    updateAvailable: 'Update available', updateTitle: 'KanbanWebUI update', updateApply: 'Update and restart', updateLater: 'Later', updateChecking: 'Checking update status…', updateRestarting: 'Applying update… this page will reload after the server restarts.', updateBlocked: 'Automatic update blocked', updateNoCommits: 'No commit details',
    triage: 'Triage', todo: 'Todo', ready: 'Ready', running: 'Running', blocked: 'Blocked', done: 'Done', archived: 'Archived',
    title: 'Title', body: 'Body', noDescription: 'No description', priority: 'Priority', status: 'Status', workspace: 'Workspace', createdBy: 'Created by',
    comments: 'Comments', events: 'Events', runs: 'Runs', monitor: 'Live Run Monitor', context: 'Context', log: 'Log', workerLog: 'Worker log',
    dependencies: 'Dependencies', parents: 'Parents', children: 'Children', parent: 'Parent', child: 'Child', chooseTask: 'Choose task', none: 'None', remove: 'Remove',
    parentPortHint: 'Left parent port: drag to another task right child port to link as parent', childPortHint: 'Right child port: drag to another task left parent port to link as child', linkCreatedToast: 'Parent/child linked', linkInvalidToast: 'Connect one left parent port with one right child port.', linkSameTaskToast: 'A task cannot link to itself.',
    dependencyViewFocus: 'Lines: Focus', dependencyViewAll: 'Lines: All', dependencyViewBlocked: 'Lines: Blocked', dependencyViewOff: 'Lines: Hidden',
    dependencyMap: 'Dependency map', currentTask: 'Current task', noDependencies: 'No parent/child links',
    notifyHomeChannels: 'Notify home channels', noHomeChannels: 'No home channels configured', noWorkerLog: 'No worker log yet',
    complete: 'Complete', block: 'Block', unblock: 'Unblock', archive: 'Archive', save: 'Save', close: 'Close', addComment: 'Add comment',
    operations: 'Operations', opsOverview: 'Operations overview', opsRunning: 'Running now', opsHeartbeatOverdue: 'Heartbeat overdue', opsRetryQueue: 'Retry queue', opsBlockedAfterRetries: 'Blocked after retries', opsRecentFailures: 'Recent failures', opsNoRunning: 'No running tasks', opsNoRetry: 'No retry candidates', opsNoBlockedAfterRetries: 'No tasks blocked after retries', opsNoFailures: 'No recent failure events', opsEligibleNow: 'Eligible now', opsEstimatedWait: 'Estimated wait', opsAttempt: 'Attempt', opsLastError: 'Last error', opsOpenTask: 'Open task', opsEstimatedBackoffAdvisory: 'Estimated backoff is advisory until dispatcher-level backoff is implemented.', empty: 'None'
  },
  id: {
    subtitle: 'Papan operasi yang mudah dibaca', newBoard: 'Tambah papan', refresh: 'Muat ulang', themeDark: 'Beralih ke tema gelap', themeLight: 'Beralih ke tema terang', quickTitle: 'Ketik judul tugas lalu tekan Enter', boardsOverview: 'Daftar board', boardsCount: 'board', boardTasks: 'tugas', activeBoard: 'Aktif', openBoard: 'Buka board',
    taskCreate: 'Buat tugas', taskCreateHint: 'Buka dialog ini hanya jika Anda perlu menetapkan judul, detail, profil agen, dan status untuk tugas baru.', taskTitlePlaceholder: 'Judul tugas', taskBodyPlaceholder: 'Detail/instruksi tugas (opsional)',
    assignee: 'Profil agen', create: 'Buat', created: 'Dibuat', createdToast: 'Berhasil dibuat', search: 'Cari judul/isi/ID', allAssignees: 'Semua penanggung jawab', unassigned: 'Belum ditugaskan', profileMissing: 'Profil agen belum ditentukan', profileMissingShort: 'Profil diperlukan', agentProfile: 'profil', manualAssignee: 'manual', showArchived: 'Tampilkan arsip',
    bulkCreate: 'Tambah massal', boardName: 'Nama papan', description: 'Deskripsi', cancel: 'Batal', bulkHint: 'Masukkan satu tugas per baris.', loading: 'Memuat…',
    workflow: 'Alur kerja', workflowCreate: 'Buat alur kerja AI', workflowDesignerHint: 'Rancang DAG tugas dari prompt dan lampiran, lalu setujui untuk menerapkannya sebagai tugas Kanban nyata.', workflowPrompt: 'Prompt alur kerja', workflowPromptPlaceholder: 'Jelaskan tujuan, hasil, batasan, dan jumlah langkah yang diinginkan', workflowPlannerProfile: 'Profil perencana', workflowAttachments: 'Lampiran', workflowPlan: 'Rancang', workflowPlanning: 'AI sedang merancang draf alur kerja…', workflowRevise: 'Revisi', workflowRevisionPlaceholder: 'Jelaskan perubahan langkah/profil/dependensi', workflowApply: 'Terapkan', workflowDraftStatus: 'Status draf', workflowDraftEmpty: 'Masukkan prompt lalu klik Rancang untuk melihat pratinjau draf.', workflowNotApplyable: 'Draf ini belum dapat diterapkan. Selesaikan pertanyaan lalu kirim revisi.', workflowInstance: 'ID instans', workflowStep: 'Langkah saat ini', workflowSteps: 'langkah',
    updateAvailable: 'Pembaruan tersedia', updateTitle: 'Pembaruan KanbanWebUI', updateApply: 'Perbarui dan mulai ulang', updateLater: 'Nanti', updateChecking: 'Memeriksa status pembaruan…', updateRestarting: 'Menerapkan pembaruan… halaman ini akan dimuat ulang setelah server dimulai ulang.', updateBlocked: 'Pembaruan otomatis diblokir', updateNoCommits: 'Tidak ada detail commit',
    triage: 'Triage', todo: 'Menunggu', ready: 'Siap', running: 'Berjalan', blocked: 'Terblokir', done: 'Selesai', archived: 'Diarsipkan',
    title: 'Judul', body: 'Isi', noDescription: 'Tidak ada deskripsi', priority: 'Prioritas', status: 'Status', workspace: 'Ruang kerja', createdBy: 'Dibuat oleh',
    comments: 'Komentar', events: 'Peristiwa', runs: 'Eksekusi', monitor: 'Monitor eksekusi langsung', context: 'Konteks', log: 'Log', workerLog: 'Log worker',
    dependencies: 'Dependensi', parents: 'Induk', children: 'Anak', parent: 'Induk', child: 'Anak', chooseTask: 'Pilih tugas', none: 'Tidak ada', remove: 'Hapus',
    parentPortHint: 'Port induk kiri: seret ke port anak kanan tugas lain untuk menghubungkan sebagai induk', childPortHint: 'Port anak kanan: seret ke port induk kiri tugas lain untuk menghubungkan sebagai anak', linkCreatedToast: 'Induk/anak terhubung', linkInvalidToast: 'Hubungkan satu port induk kiri dengan satu port anak kanan.', linkSameTaskToast: 'Tugas tidak dapat terhubung ke dirinya sendiri.',
    dependencyViewFocus: 'Garis: Fokus', dependencyViewAll: 'Garis: Semua', dependencyViewBlocked: 'Garis: Terblokir', dependencyViewOff: 'Garis: Tersembunyi',
    dependencyMap: 'Peta dependensi', currentTask: 'Tugas saat ini', noDependencies: 'Tidak ada tautan induk/anak',
    notifyHomeChannels: 'Beri tahu kanal utama', noHomeChannels: 'Belum ada kanal utama yang dikonfigurasi', noWorkerLog: 'Belum ada log worker',
    complete: 'Selesai', block: 'Blokir', unblock: 'Buka blokir', archive: 'Arsipkan', save: 'Simpan', close: 'Tutup', addComment: 'Tambah komentar',
    operations: 'Operasi', opsOverview: 'Ringkasan operasi', opsRunning: 'Sedang berjalan', opsHeartbeatOverdue: 'Heartbeat terlambat', opsRetryQueue: 'Antrean percobaan ulang', opsBlockedAfterRetries: 'Terblokir setelah percobaan ulang', opsRecentFailures: 'Kegagalan terbaru', opsNoRunning: 'Tidak ada tugas yang berjalan', opsNoRetry: 'Tidak ada kandidat percobaan ulang', opsNoBlockedAfterRetries: 'Tidak ada tugas yang terblokir setelah percobaan ulang', opsNoFailures: 'Tidak ada peristiwa kegagalan terbaru', opsEligibleNow: 'Memenuhi syarat sekarang', opsEstimatedWait: 'Perkiraan waktu tunggu', opsAttempt: 'Percobaan', opsLastError: 'Kesalahan terakhir', opsOpenTask: 'Buka tugas', opsEstimatedBackoffAdvisory: 'Perkiraan backoff hanya sebagai referensi sampai backoff tingkat dispatcher diterapkan.', empty: 'Tidak ada'
  }
};

const storedLang = localStorage.getItem('kanbanLang');
let currentLang = storedLang === 'en' ? 'en' : 'id';

export function lang() { return currentLang; }
export function setLang(next) { currentLang = next === 'en' ? 'en' : 'id'; localStorage.setItem('kanbanLang', currentLang); applyI18n(); }
export function t(key) { return (labels[currentLang] && labels[currentLang][key]) || labels.id[key] || key; }

export function applyI18n(root = document) {
  root.documentElement?.setAttribute('lang', currentLang);
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  const toggle = root.getElementById?.('langToggle');
  if (toggle) toggle.textContent = currentLang === 'id' ? 'EN' : 'ID';
}
