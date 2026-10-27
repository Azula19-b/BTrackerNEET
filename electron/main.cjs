const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { createDatabase, loadCatalog } = require('./database.cjs');
const { compileAndRun, cancelRun } = require('./runner.cjs');

let mainWindow;
let repository;

const handlers = {
  'problems:list': (_, filters) => repository.listProblems(filters),
  'problems:get': (_, problemId) => repository.getProblem(problemId),
  'problems:add': (_, input) => repository.addCustomProblem(input),
  'problems:update': (_, problemId, input) => repository.updateCustomProblem(problemId, input),
  'problems:delete': (_, problemId) => repository.deleteCustomProblem(problemId),
  'progress:update': (_, problemId, input) => repository.updateProgress(problemId, input),
  'notes:update': (_, problemId, notes) => repository.updateNotes(problemId, notes),
  'sessions:start': (_, problemId) => repository.startSession(problemId),
  'sessions:end': (_, sessionId) => repository.endSession(sessionId),
  'attempts:list': (_, problemId) => repository.getAttempts(problemId),
  'attempts:draft': (_, problemId, code, sessionId) => repository.saveDraft(problemId, code, sessionId),
  'attempts:save': (_, problemId, code, sessionId) => repository.saveAttempt(problemId, code, sessionId),
  'hints:view': (_, problemId, hintNumber, sessionId) => repository.viewHint(problemId, hintNumber, sessionId),
  'solution:reveal': (_, problemId, sessionId) => repository.revealSolution(problemId, sessionId),
  'reviews:list': () => repository.getReviews(),
  'reviews:schedule': (_, problemId, date) => repository.scheduleReview(problemId, date, true),
  'reviews:complete': (_, problemId, input) => repository.completeReview(problemId, input),
  'analytics:get': () => repository.getAnalytics(),
  'runner:execute': (_, input) => compileAndRun(input),
  'runner:cancel': (_, sessionId) => cancelRun(sessionId),
  'backup:export': async () => {
    const { canceled, filePath } = await dialog.showSaveDialog({ defaultPath: 'BTrackerNEET-backup.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (canceled) return null;
    fs.writeFileSync(filePath, JSON.stringify(repository.exportData(), null, 2)); return filePath;
  },
  'backup:import': async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (canceled) return null;
    repository.importData(JSON.parse(fs.readFileSync(filePaths[0], 'utf8'))); return filePaths[0];
  },
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 680,
    title: 'BTrackerNEET',
    backgroundColor: '#0b1020',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) mainWindow.loadURL(devUrl);
  else mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  repository = createDatabase(path.join(app.getPath('userData'), 'btrackerneet.db'), loadCatalog());
  for (const [channel, handler] of Object.entries(handlers)) ipcMain.handle(channel, handler);
  createWindow();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on('before-quit', () => repository?.close());
