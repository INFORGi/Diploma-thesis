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
    goBack: () => {
        if (!window.isNavigating) {
            window.isNavigating = true;
            console.log('Preload: Sending go-back signal');
            return ipcRenderer.invoke('go-back');
        }
        return Promise.resolve(false);
    },
    onCheckNavigation: (callback) => {
        ipcRenderer.on('check-navigation', () => callback());
    },
    sendNavigationResponse: (response) => {
        ipcRenderer.send('navigation-response', response);
    },
    saveMap: (data) => {
        console.log('Preload: saveMap called with data:', data);
        try {
            const result = ipcRenderer.invoke('save-map', data);
            console.log('Preload: save-map invoke sent');
            return result;
        } catch (error) {
            console.error('Preload: Error in saveMap:', error);
            throw error;
        }
    },
    showNotification: (message, type = 'info') => ipcRenderer.send('show-notification', message, type),
    showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
    onBeforeClose: (callback) => {
        ipcRenderer.on('before-close', () => callback());
    },
    confirmClose: (canClose) => ipcRenderer.send('confirm-close', canClose),
    
    getExistingMaps: () => ipcRenderer.invoke('get-existing-maps'),
    openExistingMap: (filename) => ipcRenderer.invoke('open-existing-map', filename)
});
