'use strict';

const { app, BrowserWindow, Menu, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');

const isDev = !app.isPackaged;
const PREFERRED_PORT = 57321; // Fixed high port for stable localStorage origin

let mainWindow = null;
let nextProcess = null;

// ---------------------------------------------------------------------------
// Port utilities
// ---------------------------------------------------------------------------

function findFreePort(preferred) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => {
      const fallback = net.createServer();
      fallback.unref();
      fallback.on('error', reject);
      fallback.listen(0, '127.0.0.1', () => {
        const { port } = fallback.address();
        fallback.close(() => resolve(port));
      });
    });
    server.listen(preferred, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function waitForServer(port, maxRetries = 90) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    function attempt() {
      attempts += 1;
      const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
        res.resume();
        resolve();
      });
      req.setTimeout(1000);
      req.on('error', () => {
        if (attempts >= maxRetries) {
          reject(new Error(`Next.js not ready after ${maxRetries}s`));
        } else {
          setTimeout(attempt, 1000);
        }
      });
      req.on('timeout', () => {
        req.destroy();
        if (attempts >= maxRetries) {
          reject(new Error(`Next.js timed out after ${maxRetries}s`));
        } else {
          setTimeout(attempt, 1000);
        }
      });
    }
    attempt();
  });
}

// ---------------------------------------------------------------------------
// Next.js server
// ---------------------------------------------------------------------------

function startNextServer(port) {
  let command, args, cwd;

  if (isDev) {
    // Development: use `next start` (production mode) to avoid Turbopack
    // bundling the PDF.js worker into the main thread, which causes a
    // "Cannot assign to read only property 'isOffscreenCanvasSupported'" error.
    // Always run `npm run build` before `npm run electron`.
    cwd = path.join(__dirname, '..');
    command = 'npm';
    args = ['run', 'start', '--', '--port', String(port)];
  } else {
    // Packaged production: invoke Electron's bundled node with the next script.
    cwd = path.join(process.resourcesPath, 'app');
    command = process.execPath;
    args = [
      path.join(cwd, 'node_modules', 'next', 'dist', 'bin', 'next'),
      'start',
      '--port', String(port),
    ];
  }

  nextProcess = spawn(command, args, {
    cwd,
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
      ELECTRON_RUN_AS_NODE: '1',
    },
    shell: isDev,
    stdio: isDev ? 'inherit' : 'ignore',
    windowsHide: true,
  });

  nextProcess.on('error', (err) => {
    console.error('[Scholarly] Failed to start Next.js server:', err);
  });

  nextProcess.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`[Scholarly] Next.js server exited (code ${code}, signal ${signal})`);
    }
  });
}

// ---------------------------------------------------------------------------
// Build check
// ---------------------------------------------------------------------------

function ensureBuildExists() {
  const nextDir = path.join(__dirname, '..', '.next');
  if (!fs.existsSync(nextDir)) {
    dialog.showErrorBox(
      'Build Required',
      'No production build found.\n\nPlease run the following command first:\n\n  npm run build\n\nThen restart Scholarly.'
    );
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

async function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'Scholarly',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}/`);
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);

  if (isDev && !ensureBuildExists()) {
    app.quit();
    return;
  }

  try {
    const port = await findFreePort(PREFERRED_PORT);
    startNextServer(port);
    await waitForServer(port);
    await createWindow(port);
  } catch (err) {
    console.error('[Scholarly] Startup failed:', err);
    app.quit();
  }
});

function killNext() {
  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill();
  }
}

app.on('window-all-closed', () => {
  killNext();
  app.quit();
});

app.on('before-quit', killNext);
