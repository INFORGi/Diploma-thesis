const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    close: () => ipcRenderer.send('close-window'),
    move: ({ x, y }) => ipcRenderer.send('move-window', { x, y }),
    onLoadSettings: (callback) => ipcRenderer.on('load-settings', (event, settings) => callback(settings)),
    switchtheme: (theme) => ipcRenderer.send('switch-theme', theme),
    opencanvas: (mapData) => ipcRenderer.send('open-canvas', mapData),
    saveMap: (data) => ipcRenderer.invoke('save-map', data),
    showNotification: (message, type = 'info') => ipcRenderer.send('show-notification', message, type),
    onLoadMapData: (callback) => ipcRenderer.on('load-map-data', (_, data) => callback(data)),
    renderMarkdown: (markdown) => ipcRenderer.invoke('render-markdown', markdown),
});