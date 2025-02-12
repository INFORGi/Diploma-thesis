import { initWindowDragging, initButtonHandlers, initDropdownStyleMenu, setTheme } from './windowManager.js';
import { Rectangle } from './rectangle.js';
import { Square } from './square.js';

const shapesContainer = document.getElementById('shapes-container');


document.addEventListener("DOMContentLoaded", function() {
    initButtonHandlers();
    initWindowDragging();
    initDropdownStyleMenu();

    // Добавляем обработчик для правого клика
    const shapesContainer = document.getElementById('shapes-container');
    shapesContainer.addEventListener('contextmenu', function(event) {
        event.preventDefault(); // Предотвращаем стандартное контекстное меню
        showContextMenu(event.pageX, event.pageY);
    });

    // Обработчик для клика вне контекстного меню
    document.addEventListener('click', function() {
        hideContextMenu();
    });

    // Обработчики для кнопок контекстного меню
    document.getElementById('create-rectangle').addEventListener('click', function(event) {
        createRectangle(event.pageX, event.pageY);
        hideContextMenu();
    });

    document.getElementById('create-square').addEventListener('click', function() {
        createSquare();
        hideContextMenu();
    });
});

// Функция для отображения контекстного меню
function showContextMenu(x, y) {
    const contextMenu = document.getElementById('context-menu');
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.display = 'block';
}

// Функция для скрытия контекстного меню
function hideContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    contextMenu.style.display = 'none';
}

// Функция для создания прямоугольника
async function createRectangle(x, y) {
    const userInput = await window.electron.showdialog();
    if (userInput) { // Проверяем, что пользователь ввел текст
        const container = document.getElementById('shapes-container');
        const rectangle = new Rectangle(container, 200, 100, x, y, userInput);
    }
}

// Функция для создания квадрата
function createSquare(x, y) {
    const container = document.getElementById('shapes-container');
    const square = new Square(container, 100, 'Квадрат');
}


// Получаем настройки и устанавливаем тему
window.electron.onLoadSettings((settings) => {
    setTheme(settings.Theme); // Устанавливаем тему из настроек
});
