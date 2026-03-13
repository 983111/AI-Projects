'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('zzAPI', {
  // Window
  minimize: () => ipcRenderer.send('win-minimize'),
  maximize: () => ipcRenderer.send('win-maximize'),
  close:    () => ipcRenderer.send('win-close'),

  // Planning — calls Groq directly from Node, no worker hop
  planCommand:    (opts)   => ipcRenderer.invoke('plan-command', opts),

  // Browser control
  browserStatus:  ()       => ipcRenderer.invoke('browser-status'),
  browserLaunch:  ()       => ipcRenderer.invoke('browser-launch'),
  browserClose:   ()       => ipcRenderer.invoke('browser-close'),
  browserAction:  (action) => ipcRenderer.invoke('browser-action', action),

  // Automation plan
  runAutomationPlan: (opts)  => ipcRenderer.invoke('run-automation-plan', opts),
  abortAutomation:   ()      => ipcRenderer.send('abort-automation'),

  // Screenshot + DOM state
  captureScreen:  () => ipcRenderer.invoke('capture-screen'),
  getPageState:   () => ipcRenderer.invoke('get-page-state'),

  // OS actions (clipboard etc.)
  osAction: (action) => ipcRenderer.invoke('os-action', action),

  // Events from main → renderer
  onWindowState:         (cb) => ipcRenderer.on('window-state',          (_, d) => cb(d)),
  onAutomationStep:      (cb) => ipcRenderer.on('automation-step',       (_, d) => cb(d)),
  onAutomationStepResult:(cb) => ipcRenderer.on('automation-step-result',(_, d) => cb(d)),
  onAutomationDone:      (cb) => ipcRenderer.on('automation-done',       (_, d) => cb(d)),
});