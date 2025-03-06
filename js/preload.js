const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    close: () => ipcRenderer.send('close-window'),
    move: ({ x, y }) => ipcRenderer.send('move-window', { x, y }),
    onLoadSettings: (callback) => ipcRenderer.on('load-settings', (event, settings) => callback(settings)),
    switchtheme: (theme) => ipcRenderer.send('switch-theme', theme),
    opencanvas: () => ipcRenderer.send('open-canvas'),
    showdialog: async () => await ipcRenderer.invoke('show-input-dialog'),
    goBack: () => ipcRenderer.send('go-back'),
});
