const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;


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
        icon: path.join(__dirname, '/data/icons/blue.ico'),
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

ipcMain.handle('save-map', async (event, { mapData, mapPath, isExisting }) => {
    try {
        console.log('Saving map:', mapPath);
        const dataDir = path.join(__dirname, 'data', 'map');
        
        await fs.mkdir(dataDir, { recursive: true });
        
        let finalPath;
        if (isExisting) {
            // Если файл существует, используем тот же путь
            finalPath = mapPath;
        } else {
            // Для нового файла обеспечиваем уникальность имени
            let tempPath = mapPath;
            let counter = 1;
            while (await fs.access(path.join(dataDir, `${tempPath}.json`))
                .then(() => true)
                .catch(() => false)) {
                tempPath = `${mapPath}_${counter}`;
                counter++;
            }
            finalPath = path.join(dataDir, `${tempPath}.json`);
        }
        
        await fs.writeFile(
            isExisting ? mapPath : finalPath,
            JSON.stringify(mapData, null, 2)
        );
        
        console.log('Saved successfully to:', finalPath);
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
            message,  // Исправляем синтаксис
            type,     // Исправляем синтаксис
            buttons: ['OK']
        });
    }
});

ipcMain.handle('show-save-dialog', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return 'cancel';

    const result = await dialog.showMessageBox(window, {
        type: 'question',
        buttons: ['Сохранить', 'Не сохранять', 'Отмена'],
        title: 'Сохранение изменений',
        message: 'Хотите сохранить изменения?',
        noLink: true, // Предотвращает зависание диалога
        defaultId: 0,
        cancelId: 2
    });

    const responses = ['save', 'dont-save', 'cancel'];
    return responses[result.response];
});

let isClosing = false;

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('confirm-close', (event, canClose) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (isClosing) {
        if (canClose) {
            win.close(); // Меняем app.quit() на win.close()
        }
        isClosing = false;
    }
});

app.on('before-quit', (event) => {
    const window = BrowserWindow.getFocusedWindow();
    if (!isClosing && window) {
        event.preventDefault();
        isClosing = true;
        window.webContents.send('before-close');
    }
});

let isNavigating = false;

ipcMain.handle('go-back', async (event) => {
    if (isNavigating) {
        console.log('Navigation already in progress');
        return false;
    }

    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) {
        console.error('Window not found or destroyed');
        return false;
    }

    isNavigating = true;

    try {
        // Ждем подтверждения от рендерера перед навигацией
        const canNavigate = await new Promise((resolve) => {
            win.webContents.send('check-navigation');
            ipcMain.once('navigation-response', (_, response) => {
                resolve(response);
            });
        });

        if (!canNavigate) {
            console.log('Navigation cancelled by user');
            return false;
        }

        if (!win.isDestroyed()) {
            console.log('Starting navigation sequence...');
            
            if (win.isFullScreen()) {
                win.setFullScreen(false);
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            if (!win.isDestroyed()) {
                await win.loadFile('html/new_menu.html');
                console.log('Navigation completed successfully');
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Navigation failed:', error);
        return false;
    } finally {
        isNavigating = false;
    }
});