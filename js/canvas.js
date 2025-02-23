import { initWindowDragging, initButtonHandlers, initDropdownStyleMenu, setTheme } from './windowManager.js';
import { MindMap } from '../api/my/MindMap.js';

function init(){
    initButtonHandlers();
    initWindowDragging();
    initDropdownStyleMenu();
}

document.addEventListener("DOMContentLoaded", function() {
    init();

    const mindMap = new MindMap('canvas-inner', 'tree',{ draggable: false });
    mindMap.addNode('root',{id:'root2', topic: 'dsadsad', style:{ backgroundColor: "#7FFFD4"}});
    mindMap.addNode('root',{id:'root3', topic: 'dsadsad', style:{}});
    mindMap.render();

    // Добавляем обработчик для правого клика
    const shapesContainer = document.getElementById('canvas-inner');
    shapesContainer.addEventListener('contextmenu', function(event) {
        event.preventDefault(); // Предотвращаем стандартное контекстное меню
        showContextMenu(event.pageX, event.pageY, shapesContainer);
    });

    // Обработчик для клика вне контекстного меню
    document.addEventListener('click', function() {
        hideContextMenu();
    });

    // Обработчик для кнопки создания прямоугольника
    const createRectangleButton = document.getElementById('create-rectangle');
    if (createRectangleButton) {
        createRectangleButton.addEventListener('click', function(event) {
            createRectangle(event.pageX, event.pageY);
            hideContextMenu();
        });
    } else {
        console.error("Create Rectangle button not found!");
    }
});

// Функция для отображения контекстного меню
function showContextMenu(x, y, container) {
    const contextMenu = document.getElementById('context-menu');
    if (!contextMenu) {
        console.error("Context menu not found!");
        return;
    }

    // Получаем размеры меню и окна
    const menuWidth = contextMenu.offsetWidth;
    const menuHeight = contextMenu.offsetHeight;
    const windowWidth = container.windowWidth;
    const windowHeight = container.windowHeight;

    // Корректируем позицию, чтобы меню не выходило за границы
    const adjustedX = x + menuWidth > windowWidth ? windowWidth - menuWidth : x;
    const adjustedY = y + menuHeight > windowHeight ? y - menuHeight : y;

    // Применяем стили
    contextMenu.style.left = `${adjustedX}px`;
    contextMenu.style.top = `${adjustedY}px`;
    contextMenu.style.display = 'block';
}

// Функция для скрытия контекстного меню
function hideContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    if (contextMenu) {
        contextMenu.style.display = 'none';
    }
}

// Функция для создания прямоугольника
async function createRectangle(x, y) {
    
}

// Получаем настройки и устанавливаем тему
window.electron.onLoadSettings((settings) => {
    setTheme(settings.Theme); // Устанавливаем тему из настроек
});
