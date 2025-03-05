import { initWindowDragging, initButtonHandlers, initDropdownStyleMenu, setTheme } from './windowManager.js';
import { jsMind } from '../lib/jsmind/js/jsmind.js';
import { StyleManager } from './styleManager.js';
import { MIND_MAP_THEMES } from '../data/constants.js';

let jm = null;
let styleManager = null;

function initJsMind() {
    const container = document.getElementById('jsmind_container');
    if (!container) {
        console.error('Container not found: jsmind_container');
        return;
    }

    const mindContainer = document.getElementById('jsmind_container');

    // Настройка размеров контейнера и SVG
    const resizeContainer = () => {
        const svg = container.querySelector('svg');
        if (svg) {
            svg.style.width = mindContainer.clientWidth + 'px';
            svg.style.height = mindContainer.clientHeight + 'px';
            svg.setAttribute('width', mindContainer.clientWidth + 'px');
            svg.setAttribute('height', mindContainer.clientHeight + 'px');
        }
    };

    const canvasElement = document.querySelector('.canvas');
    if (canvasElement) {
        // Сначала центрируем карту
        setTimeout(() => {
            // Точный центр карты 5000x5000
            const centerX = mindContainer.clientWidth / 2;
            const centerY = mindContainer.clientHeight / 2;
            
            // Вычисляем позицию скролла для центрирования
            canvasElement.scrollLeft = centerX - (canvasElement.clientWidth / 2);
            canvasElement.scrollTop = centerY - (canvasElement.clientHeight / 2);
            
            console.log('Initial scroll position:', canvasElement.scrollLeft, canvasElement.scrollTop);
        }, 0);
    }

    container.style.position = 'absolute';
    container.style.overflow = 'auto';
    container.style.background = 'inherit';
    
    container.addEventListener('scroll', () => {
        if (jm) {
            jm.drawLines();
        }
    });

    const mind = {
        meta: {
            name: 'demo',
            author: 'user',
            version: '0.2',
            nodeTypes: {
                main: 'main',
                sub: 'sub',
                child: 'child'
            }
        },
        format: 'node_tree',
        data: {
            id: 'root',
            topic: 'Главная тема',
            type: 'main',
            connectionType: 'straight',
            style: {},
            children: []
        }
    };

    const options = {
        container: 'jsmind_container',
        theme: 'default',
        editable: true,
        mode: 'side',
        view: {
            hmargin: 200,
            vmargin: 100,
            line_width: MIND_MAP_THEMES.default.line.width,
            line_color: MIND_MAP_THEMES.default.line.color,
            draggable: true,
            engine: 'canvas'
        },
        layout: {
            hspace: 200,
            vspace: 200,
            pspace: 13
        }
    };

    try {
        jm = new jsMind(options);
        jm.show(mind);

        setTimeout(() => {
            const canvas = document.querySelector('.canvas');
            if (canvas && jm) {
                const rootElement = document.querySelector('.jsmind-node[data-isroot="true"]');
                if (rootElement) {
                    const mindContainer = document.getElementById('jsmind_container');
                    
                    // Получаем координаты корневого узла относительно контейнера карты
                    const rootRect = rootElement.getBoundingClientRect();
                    const containerRect = mindContainer.getBoundingClientRect();
        
                    // Вычисляем относительное положение корня
                    const rootX = rootRect.left - containerRect.left + rootRect.width / 2;
                    const rootY = rootRect.top - containerRect.top + rootRect.height / 2;
        
                    // Прокручиваем `.canvas` так, чтобы корневой узел оказался в центре
                    canvas.scrollLeft = rootX - canvas.clientWidth / 2;
                    canvas.scrollTop = rootY - canvas.clientHeight / 2;
        
                    console.log('Centered at:', canvas.scrollLeft, canvas.scrollTop);
                }
            }
        }, 100);
        

        // Обработчик изменения размеров
        window.addEventListener('resize', () => {
            if (jm) {
                resizeContainer();
                jm.resize();
                jm.drawLines();
            }
        });

        resizeContainer(); // Первоначальная настройка размеров

        jm.initContextMenu(); 

        document.getElementById('jsmind_container').addEventListener('contextmenu', (e) => {
            const node = e.target.closest('.jsmind-node');
            if (node) {
                e.preventDefault();
                jm.showContextMenu(e, node.id);
            }
        });

        applyTheme(options.theme);
        
        styleManager = new StyleManager('nodeStyleForm');
        initMapThemeMenu();
        
        document.getElementById('jsmind_container').addEventListener('click', (e) => {
            const node = e.target.closest('.jsmind-node');
            if (node) {
                styleManager.setNode(node);
            }
        });

        document.addEventListener('click', (e) => {
            const node = e.target.closest('.jsmind-node');
            if (node) {
                styleManager.setNode(node);
            }
        });

        window.addEventListener('resize', () => {
            if (jm) {
                jm.layout();
                jm.drawLines();
            }
        });

    } catch (error) {
        console.error('Error initializing jsMind:', error);
    }
}

function applyTheme(themeName) {
    if (!MIND_MAP_THEMES[themeName]) return;
    
    const theme = MIND_MAP_THEMES[themeName];
    
    const container = document.getElementById('jsmind_container');
    if (container) {
        container.style.backgroundColor = theme.canvas.backgroundColor;
    }

    const nodes = document.querySelectorAll('.jsmind-node');
    nodes.forEach(node => {
        if (node.dataset.isroot === 'true') {
            const styles = {
                backgroundColor: theme.root.backgroundColor,
                borderColor: theme.root.borderColor,
                borderWidth: '2px',
                boxShadow: theme.node.shadow
            };
            Object.assign(node.style, styles);
            
            const topic = node.querySelector('.node-topic');
            if (topic) {
                topic.style.color = theme.root.color || theme.node.color;
            }
            
            if (!node.nodeData) node.nodeData = {};
            if (!node.nodeData.nodeStyle) node.nodeData.nodeStyle = {};
            if (!node.nodeData.topicStyle) node.nodeData.topicStyle = {};
            
            Object.assign(node.nodeData.nodeStyle, styles);
            node.nodeData.topicStyle.color = theme.root.color || theme.node.color;
        } else {
            const styles = {
                backgroundColor: theme.node.backgroundColor,
                borderColor: theme.node.borderColor,
                borderWidth: theme.node.borderWidth,
                boxShadow: theme.node.shadow
            };
            Object.assign(node.style, styles);
            
            const topic = node.querySelector('.node-topic');
            if (topic) {
                topic.style.color = theme.node.color;
            }
            
            if (!node.nodeData) node.nodeData = {};
            Object.assign(node.nodeData.nodeStyle || {}, styles);
            if (node.nodeData.topicStyle) {
                node.nodeData.topicStyle.color = theme.node.color;
            }
        }
    });

    if (styleManager && styleManager.currentNode) {
        styleManager.updateFormValues();
    }

    if (jm && jm.options) {
        jm.options.view.line_color = theme.line.color;
        jm.options.view.line_width = theme.line.width;
        jm.drawLines();
    }
}

function initMapThemeMenu() {
    window.changeMapTheme = function(themeName) {
        if (!MIND_MAP_THEMES[themeName]) return;
        
        if (jm) {
            jm.options.theme = themeName;
            applyTheme(themeName);
        }
    };
}

function init(){
    initWindowDragging();
    initButtonHandlers();
    initDropdownStyleMenu();
    initJsMind();

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
    
    document.addEventListener('click', (e) => {
        const node = e.target.closest('.jsmind-node');
        if (node && styleManager) {
            styleManager.setNode(node);
        }
    });

    window.electron.onLoadSettings((settings) => {
        setTheme(settings.Theme);
        if (jm && settings.MapTheme) {
            changeMapTheme(settings.MapTheme);
        }
    });
});

window.electron.onLoadSettings((settings) => {
    setTheme(settings.Theme);
});
