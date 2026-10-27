const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('btracker', {
  platform: process.platform,
  isDesktop: true,
  problems: {
    list: (filters) => ipcRenderer.invoke('problems:list', filters),
    get: (id) => ipcRenderer.invoke('problems:get', id),
    add: (input) => ipcRenderer.invoke('problems:add', input),
    update: (id, input) => ipcRenderer.invoke('problems:update', id, input),
    delete: (id) => ipcRenderer.invoke('problems:delete', id),
  },
  progress: { update: (id, input) => ipcRenderer.invoke('progress:update', id, input) },
  notes: { update: (id, notes) => ipcRenderer.invoke('notes:update', id, notes) },
  sessions: { start: (id) => ipcRenderer.invoke('sessions:start', id), end: (id) => ipcRenderer.invoke('sessions:end', id) },
  attempts: {
    list: (id) => ipcRenderer.invoke('attempts:list', id),
    saveDraft: (id, code, sessionId) => ipcRenderer.invoke('attempts:draft', id, code, sessionId),
    save: (id, code, sessionId) => ipcRenderer.invoke('attempts:save', id, code, sessionId),
  },
  hints: { view: (id, number, sessionId) => ipcRenderer.invoke('hints:view', id, number, sessionId) },
  solution: { reveal: (id, sessionId) => ipcRenderer.invoke('solution:reveal', id, sessionId) },
  reviews: {
    list: () => ipcRenderer.invoke('reviews:list'), schedule: (id, date) => ipcRenderer.invoke('reviews:schedule', id, date),
    complete: (id, input) => ipcRenderer.invoke('reviews:complete', id, input),
  },
  analytics: { get: () => ipcRenderer.invoke('analytics:get') },
  runner: { execute: (input) => ipcRenderer.invoke('runner:execute', input), cancel: (sessionId) => ipcRenderer.invoke('runner:cancel', sessionId) },
  backup: { export: () => ipcRenderer.invoke('backup:export'), import: () => ipcRenderer.invoke('backup:import') },
});
