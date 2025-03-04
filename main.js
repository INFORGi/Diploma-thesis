const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');


const settingsPath = path.join(__dirname, 'data', 'settings.json');


function readSettings() {
    try {
        const data = fs.readFileSync(settingsPath);
        const settings = JSON.parse(data);
        return settings;
    } catch (error) {
        return { User: '', Theme: 'dark' };
    }
}


function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        transparent: false,
        roundedCorners: true,  
        webPreferences: {
            preload: path.join(__dirname, 'js/preload.js'),
            contextIsolation: true,
        },
    });

    win.loadFile('html/new_menu.html');

    
    win.webContents.on('did-finish-load', () => {
        const settings = readSettings();
        win.webContents.send('load-settings', settings);
    });
    
    win.webContents.openDevTools();
}


app.whenReady().then(createWindow);


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});


app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});


ipcMain.on('minimize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.minimize();
});


ipcMain.on('maximize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win.isFullScreen()) {
        win.setFullScreen(false);
    } else {
        win.setFullScreen(true);
    }
});


ipcMain.on('close-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.close();
});


ipcMain.on('move-window', (event, { x, y }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const currentPosition = win.getPosition();
    win.setPosition(currentPosition[0] + x, currentPosition[1] + y);
});


ipcMain.on('switch-theme', (event, newTheme) => {
    try {
        
        const data = fs.readFileSync(settingsPath);
        const settings = JSON.parse(data);
        
        settings.Theme = newTheme;
        
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4)); 
    } catch (error) {
        console.error('Ошибка при записи файла настроек:', error);
    }
});

ipcMain.on('open-canvas', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.loadFile('html/canvas.html');
    win.setFullScreen(true);
});


ipcMain.handle('show-input-dialog', async (event) => {
    inputDialog = new BrowserWindow({
        width: 300,
        height: 200,
        parent: BrowserWindow.fromWebContents(event.sender),
        modal: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    inputDialog.loadFile('html/inputDialog.html');

    return new Promise((resolve) => {
        ipcMain.once('input-dialog-response', (event, input) => {
            resolve(input); 
        });
    });
});