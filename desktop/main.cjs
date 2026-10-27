const { app, BrowserWindow, Menu, dialog, ipcMain, screen } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

app.setName('Qual é o Filme LIVE');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
Menu.setApplicationMenu(null);

let gameWindow = null;
let panelWindow = null;
let serverModule = null;
let serverPort = null;
let layout = 'portrait';
let isQuitting = false;

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    focusWindow(gameWindow);
  });

  app.whenReady().then(startApplication).catch((error) => {
    dialog.showErrorBox('Qual é o Filme LIVE', error?.stack || String(error));
    app.quit();
  });
}

async function startApplication() {
  const userDataDirectory = app.getPath('userData');
  const databasePath = path.join(userDataDirectory, 'qual_e_o_filme.db');
  fs.mkdirSync(userDataDirectory, { recursive: true });
  // shortcut: seed is a snapshot; refresh it when starter challenges change.
  if (!fs.existsSync(databasePath)) {
    fs.copyFileSync(path.join(process.resourcesPath, 'qual_e_o_filme.seed.db'), databasePath);
  }

  process.env.START_SERVER = 'false';
  process.env.NODE_ENV = 'production';
  process.env.QUAL_FILME_DB_PATH = databasePath;
  serverModule = require(path.join(app.getAppPath(), 'desktop-build', 'server.cjs'));
  serverPort = await serverModule.startServer({
    host: '127.0.0.1',
    port: 0,
    staticDirectory: path.join(app.getAppPath(), 'dist'),
  });

  createGameWindow();
  gameWindow.once('ready-to-show', () => gameWindow.show());
  await gameWindow.loadURL(gameUrl());
}

function focusWindow(window) {
  if (!window || window.isDestroyed()) return;
  window.show();
  window.focus();
}

function getWorkArea() {
  if (gameWindow && !gameWindow.isDestroyed()) {
    return screen.getDisplayMatching(gameWindow.getBounds()).workArea;
  }
  return screen.getPrimaryDisplay().workArea;
}

function getGameBounds(nextLayout = layout) {
  const area = getWorkArea();
  const margin = 48;
  let width;
  let height;

  if (nextLayout === 'portrait') {
    height = Math.max(480, Math.min(960, area.height - margin));
    width = Math.round(height * 9 / 16);
  } else {
    width = Math.max(640, Math.min(1280, area.width - margin));
    height = Math.round(width * 9 / 16);
    if (height > area.height - margin) {
      height = Math.max(360, area.height - margin);
      width = Math.round(height * 16 / 9);
    }
  }

  return {
    x: Math.round(area.x + (area.width - width) / 2),
    y: Math.round(area.y + (area.height - height) / 2),
    width,
    height,
  };
}

function gameUrl() {
  return `http://127.0.0.1:${serverPort}/?layout=${layout}`;
}

function createGameWindow() {
  const bounds = getGameBounds();
  gameWindow = new BrowserWindow({
    ...bounds,
    title: 'Qual é o Filme LIVE — Jogo',
    frame: false,
    useContentSize: true,
    resizable: true,
    minWidth: layout === 'portrait' ? 270 : 640,
    minHeight: layout === 'portrait' ? 480 : 360,
    backgroundColor: '#0E0E10',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  gameWindow.setAspectRatio(9 / 16);
  secureWindow(gameWindow);
  installGameShortcuts(gameWindow);
  gameWindow.on('closed', () => {
    gameWindow = null;
    app.quit();
  });
}

function secureWindow(window) {
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  window.webContents.on('will-navigate', (event, url) => {
    try {
      const target = new URL(url);
      if (target.origin !== `http://127.0.0.1:${serverPort}`) event.preventDefault();
    } catch {
      event.preventDefault();
    }
  });
}

function installGameShortcuts(window) {
  window.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;

    if (input.key === 'Tab' && !input.alt && !input.control && !input.meta) {
      event.preventDefault();
      openPanel();
      return;
    }

    if (input.key === 'F9') {
      event.preventDefault();
      toggleLayout();
    } else if (input.key === 'F11') {
      event.preventDefault();
      window.setFullScreen(!window.isFullScreen());
    } else if (input.key === 'Escape' && window.isFullScreen()) {
      window.setFullScreen(false);
    }
  });
}

function installPanelShortcuts(window) {
  window.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F9') {
      event.preventDefault();
      toggleLayout();
    } else if (input.key === 'Escape') {
      event.preventDefault();
      returnToGame();
    }
  });
}

function toggleLayout() {
  if (!gameWindow || gameWindow.isDestroyed()) return;
  layout = layout === 'portrait' ? 'landscape' : 'portrait';
  gameWindow.setFullScreen(false);
  const nextBounds = getGameBounds(layout);
  gameWindow.setMinimumSize(layout === 'portrait' ? 270 : 640, layout === 'portrait' ? 480 : 360);
  gameWindow.setAspectRatio(layout === 'portrait' ? 9 / 16 : 16 / 9);
  gameWindow.setBounds(nextBounds);
  gameWindow.loadURL(gameUrl());
}

function openPanel() {
  if (panelWindow && !panelWindow.isDestroyed()) {
    focusWindow(panelWindow);
    return;
  }

  const area = getWorkArea();
  const width = Math.min(1200, Math.max(760, area.width - 48));
  const height = Math.min(840, Math.max(560, area.height - 48));
  panelWindow = new BrowserWindow({
    width,
    height,
    title: 'Qual é o Filme LIVE — Painel',
    show: false,
    backgroundColor: '#0E0E10',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  secureWindow(panelWindow);
  installPanelShortcuts(panelWindow);
  panelWindow.once('ready-to-show', () => panelWindow && panelWindow.show());
  panelWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      returnToGame();
    }
  });
  panelWindow.on('closed', () => {
    panelWindow = null;
  });
  panelWindow.loadURL(`http://127.0.0.1:${serverPort}/?view=admin`);
}

function returnToGame() {
  if (panelWindow && !panelWindow.isDestroyed()) panelWindow.hide();
  focusWindow(gameWindow);
}

ipcMain.on('desktop:open-admin', openPanel);
ipcMain.on('desktop:return-to-game', returnToGame);

app.on('before-quit', (event) => {
  if (!serverModule || isQuitting) return;
  event.preventDefault();
  isQuitting = true;
  serverModule.stopServer().finally(() => app.quit());
});

app.on('activate', () => {
  focusWindow(gameWindow);
});
