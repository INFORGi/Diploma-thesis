const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;


const settingsPath = path.join(__dirname, 'data', 'settings.json');

/**
 * Читает настройки приложения из файла settings.json
 * @returns {Object} Объект с настройками или настройки по умолчанию
 */
function readSettings() {
    try {
        const data = fs.readFileSync(settingsPath);
        const settings = JSON.parse(data);
        return settings;
    } catch (error) {
        return { User: '', Theme: 'dark' };
    }
}

/**
 * Создает и настраивает главное окно приложения
 */
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
            allowRunningInsecureContent: false
        },
    });

    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;" +
                    "img-src 'self' data: blob:;" +
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval';" +
                    "style-src 'self' 'unsafe-inline';"
                ]
            }
        });
    });

    win.loadFile('html/new_menu.html');

    
    win.webContents.on('did-finish-load', () => {
        const settings = readSettings();
        win.webContents.send('load-settings', settings);
    });
    
    win.webContents.openDevTools();
}

/**
 * Инициализация приложения при готовности
 */
app.whenReady().then(createWindow);

/**
 * Обработчик закрытия всех окон приложения
 */
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

/**
 * Обработчик активации приложения
 */
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

/**
 * Обработчик минимизации окна
 * @param {Event} event - Событие Electron
 */
ipcMain.on('minimize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.minimize();
});

/**
 * Обработчик переключения полноэкранного режима
 * @param {Event} event - Событие Electron
 */
ipcMain.on('maximize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win.isFullScreen()) {
        win.setFullScreen(false);
    } else {
        win.setFullScreen(true);
    }
});

/**
 * Обработчик закрытия окна
 * @param {Event} event - Событие Electron
 */
ipcMain.on('close-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.close();
});

/**
 * Обработчик перемещения окна
 * @param {Event} event - Событие Electron
 * @param {Object} coords - Координаты перемещения
 * @param {number} coords.x - Смещение по X
 * @param {number} coords.y - Смещение по Y
 */
ipcMain.on('move-window', (event, { x, y }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const currentPosition = win.getPosition();
    win.setPosition(currentPosition[0] + x, currentPosition[1] + y);
});

/**
 * Обработчик переключения темы
 * @param {Event} event - Событие Electron
 * @param {string} newTheme - Новая тема
 */
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

/**
 * Обработчик открытия холста
 * @param {Event} event - Событие Electron
 */
ipcMain.on('open-canvas', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    // const settings = readSettings();
    win.loadFile('html/canvas.html');
    // win.webContents.on('did-finish-load', () => {
    //     win.webContents.send('load-settings', settings); // Передаем настройки
    // });
    win.setFullScreen(true);
});

/**
 * Обработчик показа диалога ввода
 * @param {Event} event - Событие Electron
 * @returns {Promise<string>} Введенное значение
 */
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

/**
 * Обработчик сохранения карты
 * @param {Event} event - Событие Electron
 * @param {Object} params - Параметры сохранения
 * @param {Object} params.mapData - Данные карты
 * @param {string} params.mapPath - Путь сохранения
 * @param {boolean} params.isExisting - Флаг существующей карты
 * @param {Object} params.imageData - Данные изображения
 * @returns {Promise<Object>} Результат сохранения
 */
ipcMain.handle('save-map', async (event, { mapData, mapPath, isExisting, imageData }) => {
    try {
        console.log('Saving map:', mapPath);
        const dataDir = path.join(__dirname, 'data', 'map');
        const imgDir = path.join(dataDir, 'img');
        
        await fsPromises.mkdir(dataDir, { recursive: true });
        await fsPromises.mkdir(imgDir, { recursive: true });
        
        let finalPath;
        let imgPath;
        
        if (isExisting) {
            finalPath = mapPath;
            imgPath = path.join(imgDir, path.basename(mapPath, '.json'));
        } else {
            let tempPath = mapPath;
            let counter = 1;
            while (await fsPromises.access(path.join(dataDir, `${tempPath}.json`))
                .then(() => true)
                .catch(() => false)) {
                tempPath = `${mapPath}_${counter}`;
                counter++;
            }
            finalPath = path.join(dataDir, `${tempPath}.json`);
            imgPath = path.join(imgDir, tempPath);
        }

        await fsPromises.writeFile(finalPath, JSON.stringify(mapData, null, 2));

        if (imageData && imageData.svg) {
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

/**
 * Показывает диалог подтверждения сохранения
 * @returns {Promise<string>} Результат выбора пользователя ('save'|'dont-save'|'cancel')
 */
ipcMain.handle('show-save-dialog', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return 'cancel';

    const result = await dialog.showMessageBox(window, {
        type: 'question',
        buttons: ['Сохранить', 'Не сохранять', 'Отмена'],
        title: 'Сохранение изменений',
        message: 'Хотите сохранить изменения?',
        noLink: true, 
        defaultId: 0,
        cancelId: 2
    });

    const responses = ['save', 'dont-save', 'cancel'];
    return responses[result.response];
});

let isClosing = false;

/**
 * Обработчик закрытия всех окон приложения
 */
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

/**
 * Обработчик подтверждения закрытия
 * @param {Event} event - Событие Electron
 * @param {boolean} canClose - Флаг разрешения закрытия
 */
ipcMain.on('confirm-close', (event, canClose) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (isClosing) {
        if (canClose) {
            win.close(); 
        }
        isClosing = false;
    }
});

/**
 * Обработчик события перед закрытием приложения
 * @param {Event} event - Событие Electron
 */
app.on('before-quit', (event) => {
    const window = BrowserWindow.getFocusedWindow();
    if (!isClosing && window) {
        event.preventDefault();
        isClosing = true;
        window.webContents.send('before-close');
    }
});

let isNavigating = false;

/**
 * Обработчик навигации назад
 * @param {Event} event - Событие Electron
 * @returns {Promise<boolean>} Успешность навигации
 */
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

ipcMain.handle('get-existing-maps', async () => {
    try {
        const mapDir = path.join(__dirname, 'data/map');
        const files = await fsPromises.readdir(mapDir);
        
        const maps = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const name = path.parse(file).name;
                maps.push({
                    name: name,
                    file: file,
                    image: `${name}.svg`
                });
            }
        }
        return maps;
    } catch (error) {
        console.error('Error reading maps:', error);
        return [];
    }
});

ipcMain.handle('open-existing-map', async (event, filename) => {
    try {
        const mapPath = path.join(__dirname, 'data/map', filename);
        const mapData = await fsPromises.readFile(mapPath, 'utf-8');
        createCanvasWindow();
        canvasWindow.webContents.on('did-finish-load', () => {
            canvasWindow.webContents.send('load-map-data', JSON.parse(mapData));
        });
    } catch (error) {
        console.error('Error opening map:', error);
    }
});