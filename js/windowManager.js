// const fs = require('fs');
// const path = require('path');

// Переменные для отслеживания состояния перетаскивания
let isDragging = false;
let startX;
let startY;
let lastX = 0;
let lastY = 0;

// Функция для инициализации перетаскивания окна
function initWindowDragging() {
    const titleBar = document.getElementById('title-bar');

    // Обработчик начала перетаскивания
    titleBar.addEventListener('mousedown', (event) => {
        isDragging = true;
        startX = event.clientX;
        startY = event.clientY;
    });

    // Обработчик перемещения мыши
    window.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const x = event.clientX - startX;
            const y = event.clientY - startY;

            // Отправляем только если перемещение достаточно велико
            if (Math.abs(x - lastX) > 1 || Math.abs(y - lastY) > 1) {
                window.electron.move({ x: x, y: y });
                lastX = x;
                lastY = y;
            }
        }
    });

    // Обработчик окончания перетаскивания
    window.addEventListener('mouseup', () => {
        isDragging = false;
        lastX = 0;
        lastY = 0;
    });
}

// Функция для инициализации обработчиков кнопок
function initButtonHandlers() {
    document.getElementById('minimize').onclick = function() {
        window.electron.minimize();
    };

    document.getElementById('maximize').onclick = function() {
        window.electron.maximize();

        console.log('click');
    };

    document.getElementById('close').onclick = function() {
        window.electron.close();
    };
}

function initDropdownStyleMenu(){
    // Переменные для отслеживания состояния выпадающего меню
    const menuButton = document.getElementById('menu-button');
    const divDropdown = document.getElementById('div-dropdown');
    const themeSwitch = document.getElementById('theme-switch-menu');
    const themeButton = document.getElementById('theme-button');
    const themeSwithButtonLight = document.getElementById('button-swith-theme-light');
    const themeSwithButtonDark = document.getElementById('button-swith-theme-dark');

    // Обработчик для показа/скрытия выпадающего меню
    menuButton.addEventListener('click', function(event) {
        event.stopPropagation();
        const isVisible = divDropdown.style.display === 'block';
        divDropdown.style.display = isVisible ? 'none' : 'block';
    });

    // Обработчик для показа/скрытия выпадающего меню тем
    themeButton.addEventListener('click', function(event) {
        event.stopPropagation(); // Остановить всплытие события
        const isVisible = themeSwitch.style.display === 'block';
        themeSwitch.style.display = isVisible ? 'none' : 'block';
    });

    // Обработчик для скрытия меню при клике вне его
    document.addEventListener('click', function(event) {
        // Проверяем, кликнули ли мы вне выпадающего меню и кнопок
        if (!menuButton.contains(event.target) && !divDropdown.contains(event.target)) {
            divDropdown.style.display = 'none';
        }
        
        if (!themeButton.contains(event.target) && !themeSwitch.contains(event.target)) {
            themeSwitch.style.display = 'none';
        }
    });

    // Функция для переключения тем
    function toggleTheme(newTheme) {
        const elements = document.querySelectorAll('.dark, .light');

        elements.forEach(element => {
            if (newTheme === 'light') {
                element.classList.remove('dark');
                element.classList.add('light');

                window.electron.switchtheme(newTheme);
            } else if (newTheme === 'dark') {
                element.classList.remove('light');
                element.classList.add('dark');

                window.electron.switchtheme(newTheme);
            }
        });
    }

    // Обработчик для кнопки светлой темы
    themeSwithButtonLight.addEventListener('click', function(event) {
        event.stopPropagation(); // Остановить всплытие события
        toggleTheme('light');
        themeSwitch.style.display = 'none'; // Скрываем меню выбора темы
        divDropdown.style.display = 'none';
    });

    // Обработчик для кнопки темной темы
    themeSwithButtonDark.addEventListener('click', function(event) {
        event.stopPropagation(); // Остановить всплытие события
        toggleTheme('dark');
        themeSwitch.style.display = 'none'; // Скрываем меню выбора темы
        divDropdown.style.display = 'none';
    });
}

function setTheme(theme) {
    const elements = document.querySelectorAll('.entry-point');

    elements.forEach(element => {
        if (theme === 'light') {
            element.classList.remove('entry-point');
            element.classList.add('light');
        } else if (theme === 'dark') {
            element.classList.remove('entry-point');
            element.classList.add('dark');
        }
    });
}

// Экспортируем функции
export { initWindowDragging, initButtonHandlers, initDropdownStyleMenu, setTheme};