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
    const divExistingMaps = document.getElementById('existing-maps');
    
    divExistingMaps.style.display = 'none';
    divCreateCard.style.display = 'flex';
};


document.getElementById('create').onclick = function() {
    window.electron.opencanvas(null); // null для новой карты
};


document.getElementById('open-map').onclick = function() {
    const divExistingMaps = document.getElementById('existing-maps');
    const divCreateCard = document.getElementById('create-map');
    
    // Скрываем div создания новой карты
    divCreateCard.style.display = 'none';
    
    // Получаем список карт
    window.electron.getExistingMaps().then(maps => {
        divExistingMaps.innerHTML = ''; // Очищаем предыдущее содержимое
        
        maps.forEach(map => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card entry-point';

            // Очищаем имя от временной метки
            const cleanedName = map.name.replace(/_\d+$/, '');

            cardDiv.innerHTML = `
                <img class="img-card entry-point" src="../data/map/img/${map.image}">
                <p class="p-card entry-point">${cleanedName}</p>
                <button class="button-card button-transform entry-point" data-map="${map.file}" type="button">Открыть</button>
            `;
            
            divExistingMaps.appendChild(cardDiv);
            
            // Добавляем обработчик для кнопки открытия
            const button = cardDiv.querySelector('button');
            button.onclick = function() {
                window.electron.opencanvas(this.dataset.map);
            };
        });
        
        divExistingMaps.style.display = 'flex';

        const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';

        document.querySelectorAll('#existing-maps .entry-point').forEach(el => {
            el.classList.remove('entry-point');
            el.classList.add(currentTheme);
        });
    });
};