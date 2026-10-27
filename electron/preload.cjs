const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('btracker', {
  platform: process.platform,
  isDesktop: true,
});
