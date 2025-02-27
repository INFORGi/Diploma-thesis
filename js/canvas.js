import { initWindowDragging, initButtonHandlers, initDropdownStyleMenu, setTheme } from './windowManager.js';
import { jsMind } from '../lib/jsmind/js/jsmind.js';

let jm = null; // глобальная переменная для хранения экземпляра jsMind

function initJsMind() {
    const options = {
        container: 'jsmind_container',
        theme: 'orange',
        editable: true,
        mode: 'side',
        view: {
            hmargin: 100,
            vmargin: 50,
            line_width: 2,
            line_color: '#555'
        },
        layout: {
            hspace: 200,  // Увеличиваем горизонтальное расстояние
            vspace: 100,  // Увеличиваем вертикальное расстояние
            pspace: 13
        }
    };

    const mind = {
        meta: {
            name: 'demo',
            author: 'user',
            version: '0.1'
        },
        format: 'node_tree',
        data: {
            id: 'root',
            topic: 'Главная тема',
            children: [
                {
                    id: 'left1',
                    topic: 'Левая ветвь 1',
                    direction: 'left',
                    children: [
                        { id: 'left1.1', topic: 'Подтема 1.1' },
                        { id: 'left1.2', topic: 'Подтема 1.2' }
                    ]
                },
                {
                    id: 'right1',
                    topic: 'Правая ветвь 1',
                    direction: 'right',
                    children: [
                        { id: 'right1.1', topic: 'Подтема 1.1' },
                        { id: 'right1.2', topic: 'Подтема 1.2' }
                    ]
                }
            ]
        }
    };

    jm = new jsMind(options);
    jm.show(mind);
}

function init(){
    initWindowDragging();
    initButtonHandlers();
    initDropdownStyleMenu();
    initJsMind();

    // Заменяем обработчик двойного клика
    document.getElementById('jsmind_container').addEventListener('dblclick', async function(e) {
        const node = e.target.closest('.jsmind-node');

        if (node) {
            const topic = node.querySelector('.node-topic');
            if (topic) {
                topic.focus();
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", function() {
    init();
});

// Получаем настройки и устанавливаем тему
window.electron.onLoadSettings((settings) => {
    setTheme(settings.Theme);
});
