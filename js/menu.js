import { initWindowDragging, initButtonHandlers, initDropdownStyleMenu, setTheme } from './windowManager.js';

document.addEventListener("DOMContentLoaded", function() {
    initButtonHandlers();
    initWindowDragging();
    initDropdownStyleMenu();
});

// Получаем настройки и устанавливаем тему
window.electron.onLoadSettings((settings) => {
    setTheme(settings.Theme); // Устанавливаем тему из настроек
});

// Обработка нажатия на кнопку новая интеллект-карта
document.getElementById('new-map').onclick = function() {
    const divCreateCard = document.getElementById('create-map');
    divCreateCard.style.display = 'block';
};

// Открыть канвас
document.getElementById('create').onclick = function() {
    window.electron.opencanvas();
};

// Обработка нажатия на кнопку открыть старую интеллект-карту
document.getElementById('open-map').onclick = function() {
    alert('Эта функция еще не реализована.');
};