const { app, BrowserWindow, ipcMain, dialog } = require('electron');

const MarkdownIt = require('markdown-it');
const markdownItContainer = require('markdown-it-container');
const markdownItAttrs = require('markdown-it-attrs');

const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

const settingsPath = path.join(__dirname, 'data', 'settings.json');

const md = new MarkdownIt()
  .use(markdownItContainer)
  .use(markdownItAttrs);

function readSettings() {
    try {
        const data = fs.readFileSync(settingsPath);
        return JSON.parse(data);
    } catch (error) {
        return { Theme: 'dark' };
    }
}

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        transparent: false,
        roundedCorners: true,  
        icon: path.join(__dirname, '/data/icons/blue.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'js/preload.js'),
            contextIsolation: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            nodeIntegration: false,
            sandbox: true
        },
    });

    win.loadFile('html/new_menu.html');
    
    win.webContents.on('did-finish-load', () => {
        win.webContents.send('load-settings', readSettings());
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

// Window control handlers
ipcMain.on('minimize-window', (event) => {
    BrowserWindow.fromWebContents(event.sender).minimize();
});

ipcMain.on('maximize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.isFullScreen() ? win.setFullScreen(false) : win.setFullScreen(true);
});

ipcMain.on('close-window', (event) => {
    BrowserWindow.fromWebContents(event.sender).close();
});

ipcMain.on('move-window', (event, { x, y }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const currentPosition = win.getPosition();
    win.setPosition(currentPosition[0] + x, currentPosition[1] + y);
});

ipcMain.on('switch-theme', (event, newTheme) => {
    try {
        const settings = readSettings();
        settings.Theme = newTheme;
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4));
    } catch (error) {
        console.error('Error writing settings:', error);
    }
});

ipcMain.on('open-canvas', async (event, mapPath) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.loadFile('html/canvas.html');
    
    if (mapPath) {
        try {
            const fullPath = path.join(__dirname, 'data/map', mapPath);
            const mapData = await fsPromises.readFile(fullPath, 'utf-8');
            const parsedData = JSON.parse(mapData);
            parsedData.meta = { path: fullPath };
            win.webContents.on('did-finish-load', () => {
                win.webContents.send('load-map-data', parsedData);
            });
        } catch (error) {
            console.error('Error loading map:', error);
            win.webContents.on('did-finish-load', () => {
                win.webContents.send('load-map-data', null);
            });
        }
    }
    
    win.setFullScreen(true);
});

ipcMain.handle('save-map', async (event, { mapData, mapPath, isExisting, imageData }) => {
    try {
        const dataDir = path.join(__dirname, 'data', 'map');
        const imgDir = path.join(dataDir, 'img');
        
        await fsPromises.mkdir(dataDir, { recursive: true });
        await fsPromises.mkdir(imgDir, { recursive: true });
        
        const finalPath = isExisting ? mapPath : path.join(dataDir, `${mapPath}.json`);
        const imgPath = path.join(imgDir, path.basename(mapPath, '.json'));

        await fsPromises.writeFile(finalPath, JSON.stringify(mapData, null, 2));

        if (imageData?.svg) {
            await fsPromises.writeFile(`${imgPath}.svg`, imageData.svg);
        }
        
        return { success: true, path: finalPath };
    } catch (error) {
        console.error('Save error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.on('show-notification', (event, message, type) => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
        dialog.showMessageBox(window, {
            message,
            type,
            buttons: ['OK']
        });
    }
});

ipcMain.handle('render-markdown', async (event, markdown) => {
    try {
        return md.render(markdown);
    } catch (error) {
        console.error('Error rendering markdown:', error);
        return markdown;
    }
});