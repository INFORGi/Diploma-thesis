import { initWindowDragging, initButtonHandlers, initDropdownStyleMenu, setTheme } from './windowManager.js';

document.addEventListener("DOMContentLoaded", function() {
    initButtonHandlers();
    initWindowDragging();
    initDropdownStyleMenu();
});


window.electron.onLoadSettings((settings) => {
    setTheme(settings.Theme); 
});


document.getElementById('new-map').onclick = function() {
    const divCreateCard = document.getElementById('create-map');
    divCreateCard.style.display = 'block';
};


document.getElementById('create').onclick = function() {
    window.electron.opencanvas();
};


document.getElementById('open-map').onclick = function() {
    alert('Эта функция еще не реализована.');
};