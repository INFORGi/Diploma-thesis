const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Путь к файлу с настройками
const settingsPath = path.join(__dirname, 'data', 'settings.json');

// Функция для чтения настроек из JSON файла
function readSettings() {
    try {
        const data = fs.readFileSync(settingsPath);
        const settings = JSON.parse(data);
        return settings;
    } catch (error) {
        return { User: '', Theme: 'dark' };
    }
}

// Создать окно
function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false, 
        webPreferences: {
            preload: path.join(__dirname, 'js/preload.js'), 
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });

    win.loadFile('html/new_menu.html');

    // Отправляем настройки в рендерер
    win.webContents.on('did-finish-load', () => {
        const settings = readSettings();
        win.webContents.send('load-settings', settings);
    });
    
    // win.webContents.openDevTools();
}

// Функция создания окна
app.whenReady().then(createWindow);

// Прекращение работы программы при закрытии всех окон
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Создание окна если окно не создалось
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Обработчики для IPC
ipcMain.on('minimize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.minimize();
});

// Обработка масштабирования окна
ipcMain.on('maximize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win.isFullScreen()) {
        win.setFullScreen(false);
    } else {
        win.setFullScreen(true);
    }
});

// Обработка закрытия окна
ipcMain.on('close-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.close();
});

// Обработка перемещения окна
ipcMain.on('move-window', (event, { x, y }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const currentPosition = win.getPosition();
    win.setPosition(currentPosition[0] + x, currentPosition[1] + y);
});

// Функция для записи настроек в JSON файл
ipcMain.on('switch-theme', (event, newTheme) => {
    try {
        // Читаем текущие настройки
        const data = fs.readFileSync(settingsPath);
        const settings = JSON.parse(data);
        // Обновляем тему
        settings.Theme = newTheme;
        // Записываем обновленные настройки обратно в файл
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4)); // Форматируем JSON с отступами
    } catch (error) {
        console.error('Ошибка при записи файла настроек:', error);
    }
});

ipcMain.on('open-canvas', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.loadFile('html/canvas.html');
    win.setFullScreen(true);
});

// Обработчик для получения текста от рендерера
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
            resolve(input); // Возвращаем введенный текст
        });
    });
});