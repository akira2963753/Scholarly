'use strict';

// Placeholder for future IPC bridges.
// The app communicates with the backend via HTTP to the local Next.js server,
// so no IPC is needed right now.
//
// Example of how to expose IPC to the renderer when needed:
// const { contextBridge, ipcRenderer } = require('electron');
// contextBridge.exposeInMainWorld('electronAPI', {
//   someMethod: () => ipcRenderer.invoke('some-channel'),
// });
