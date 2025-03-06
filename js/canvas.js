import { initWindowDragging, initButtonHandlers, initDropdownStyleMenu, setTheme } from './windowManager.js';
import { jsMind } from '../lib/jsmind/js/jsmind.js';
import { StyleManager } from './styleManager.js';
import { MIND_MAP_THEMES } from '../data/constants.js';

let jm = null;
let styleManager = null;
let isMapModified = false;
let currentMapPath = null;
let currentFilePath = null; // Добавляем переменную для хранения пути текущего файла
let navigationLock = null; // Добавляем переменную для блокировки навигации

function markMapAsModified() {
    isMapModified = true;
}

// Добавляем функцию для экспорта изображения
async function exportMapImage() {
    if (!jm) return null;
    
    try {
        const container = document.querySelector('#jsmind_container');
        const svgElement = container.querySelector('svg');
        if (!svgElement || !container) return null;

        // Находим реальные границы содержимого
        const nodes = container.querySelectorAll('.jsmind-node');
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        // Учитываем и линии при расчете границ
        const lines = svgElement.querySelectorAll('path');
        [...nodes, ...lines].forEach(element => {
            const rect = element.getBoundingClientRect();
            minX = Math.min(minX, rect.left);
            minY = Math.min(minY, rect.top);
            maxX = Math.max(maxX, rect.right);
            maxY = Math.max(maxY, rect.bottom);
        });

        // Добавляем отступы
        const padding = 50;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        const width = maxX - minX;
        const height = maxY - minY;

        // Создаем новый SVG с оптимальными размерами
        const newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        newSvg.setAttribute('width', width);
        newSvg.setAttribute('height', height);
        newSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        // Добавляем фон
        const bgColor = window.getComputedStyle(container).backgroundColor;
        const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        background.setAttribute('width', '100%');
        background.setAttribute('height', '100%');
        background.setAttribute('fill', bgColor);
        newSvg.appendChild(background);

        // Создаем группу для содержимого с правильным смещением
        const contentGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        contentGroup.setAttribute('transform', `translate(${-minX}, ${-minY})`);

        // Копируем линии связей с сохранением всех атрибутов
        const linesGroup = svgElement.querySelector('g');
        if (linesGroup) {
            const newGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            
            // Копируем все атрибуты группы
            Array.from(linesGroup.attributes).forEach(attr => {
                newGroup.setAttribute(attr.name, attr.value);
            });

            // Копируем все линии с их атрибутами
            linesGroup.querySelectorAll('path').forEach(path => {
                const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                Array.from(path.attributes).forEach(attr => {
                    newPath.setAttribute(attr.name, attr.value);
                });
                // Убеждаемся, что линии видны
                newPath.setAttribute('stroke', path.getAttribute('stroke') || '#666');
                newPath.setAttribute('stroke-width', path.getAttribute('stroke-width') || '1');
                newPath.setAttribute('fill', 'none');
                newGroup.appendChild(newPath);
            });

            contentGroup.appendChild(newGroup);
        }

        // Добавляем узлы
        nodes.forEach(node => {
            const rect = node.getBoundingClientRect();
            const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            const computedStyle = window.getComputedStyle(node);
            
            // Создаем прямоугольник узла
            const nodeRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            nodeRect.setAttribute('x', rect.left);
            nodeRect.setAttribute('y', rect.top);
            nodeRect.setAttribute('width', rect.width);
            nodeRect.setAttribute('height', rect.height);
            nodeRect.setAttribute('rx', computedStyle.borderRadius);
            nodeRect.setAttribute('ry', computedStyle.borderRadius);
            nodeRect.setAttribute('fill', computedStyle.backgroundColor);
            nodeRect.setAttribute('stroke', computedStyle.borderColor);
            nodeRect.setAttribute('stroke-width', computedStyle.borderWidth);
            
            // Добавляем текст
            const topic = node.querySelector('.node-topic');
            if (topic) {
                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute('x', rect.left + 10);
                text.setAttribute('y', rect.top + rect.height/2 + 5);
                text.setAttribute('fill', computedStyle.color);
                text.setAttribute('font-family', computedStyle.fontFamily);
                text.setAttribute('font-size', computedStyle.fontSize);
                text.textContent = topic.textContent;
                
                if (computedStyle.fontWeight === 'bold') {
                    text.setAttribute('font-weight', 'bold');
                }
                if (computedStyle.fontStyle === 'italic') {
                    text.setAttribute('font-style', 'italic');
                }
                
                nodeGroup.appendChild(nodeRect);
                nodeGroup.appendChild(text);
            }
            
            contentGroup.appendChild(nodeGroup);
        });

        newSvg.appendChild(contentGroup);

        // Добавляем стили для линий
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
        style.textContent = `
            path {
                fill: none;
                stroke-linecap: round;
                stroke-linejoin: round;
            }
            ${MIND_MAP_THEMES[jm.options.theme]?.line ? `
                path {
                    stroke: ${MIND_MAP_THEMES[jm.options.theme].line.color};
                    stroke-width: ${MIND_MAP_THEMES[jm.options.theme].line.width}px;
                }
            ` : ''}
        `;
        defs.appendChild(style);
        newSvg.insertBefore(defs, newSvg.firstChild);

        // Возвращаем только SVG данные
        return {
            svg: new XMLSerializer().serializeToString(newSvg)
        };
    } catch (error) {
        console.error('Error exporting map image:', error);
        return null;
    }
}

async function saveMap() {
    if (!jm) {
        console.error('jsMind instance is not initialized');
        return false;
    }

    try {
        const rootNode = jm.nodes.get(jm.get_root());
        if (!rootNode) {
            throw new Error('Root node not found');
        }

        // Создаем полностью новые данные карты
        const mapData = {
            meta: {
                name: rootNode.data.topic || 'Mindmap',
                author: 'user',
                version: '1.0',
                path: currentFilePath
            },
            format: 'node_tree',
            data: jm.getNodeData(jm.get_root())
        };

        // Получаем изображение карты
        const imageData = await exportMapImage();

        const saveData = {
            mapData,
            mapPath: currentFilePath || `${rootNode.data.topic || 'Mindmap'}_${new Date().toISOString().slice(0, 10)}`,
            isExisting: Boolean(currentFilePath),
            imageData
        };

        const result = await window.electron.saveMap(saveData);

        if (result.success) {
            isMapModified = false;
            if (!currentFilePath) {
                currentFilePath = result.path;
                window.electron.showNotification('Карта сохранена: ' + rootNode.data.topic);
            }
            return true;
        }
        throw new Error(result.error);
    } catch (error) {
        console.error('Save error:', error);
        window.electron.showNotification('Ошибка при сохранении: ' + error.message, 'error');
        return false;
    }
}

// Вспомогательная функция для сбора данных узлов
function collectNodeData(nodeId) {
    const node = jm.nodes.get(nodeId);
    if (!node) {
        return null;
    }

    // Создаем базовую структуру данных узла
    const nodeData = {
        id: nodeId,
        topic: node.data.topic || '',
        direction: node.data.direction || 'right',
        type: node.data.type || 'node',
        expanded: node.expanded,
        children: []
    };

    // Сохраняем все свойства из node.data
    if (node.data) {
        Object.assign(nodeData, Object.assign({}, node.data));
    }

    // Собираем актуальные стили из DOM
    if (node.element) {
        const computedStyle = window.getComputedStyle(node.element);
        const nodeStyle = {
            backgroundColor: computedStyle.backgroundColor,
            borderColor: computedStyle.borderColor,
            borderWidth: computedStyle.borderWidth,
            borderStyle: computedStyle.borderStyle,
            borderRadius: computedStyle.borderRadius,
            boxShadow: computedStyle.boxShadow
        };

        // Объединяем с существующими стилями, если они есть
        nodeData.style = Object.assign(
            {},
            nodeStyle,
            node.element.nodeData?.nodeStyle || {}
        );

        // Собираем стили текста
        const topic = node.element.querySelector('.node-topic');
        if (topic) {
            const computedTopicStyle = window.getComputedStyle(topic);
            const topicStyle = {
                color: computedTopicStyle.color,
                fontSize: computedTopicStyle.fontSize,
                fontFamily: computedTopicStyle.fontFamily,
                fontWeight: computedTopicStyle.fontWeight,
                fontStyle: computedTopicStyle.fontStyle,
                textDecoration: computedTopicStyle.textDecoration
            };

            // Объединяем с существующими стилями текста
            nodeData.topicStyle = Object.assign(
                {},
                topicStyle,
                node.element.nodeData?.topicStyle || {}
            );
        }
    }

    // Рекурсивно собираем данные дочерних узлов
    node.children.forEach(childId => {
        const childData = collectNodeData(childId);
        if (childData) {
            nodeData.children.push(childData);
        }
    });

    return nodeData;
}

async function handleUnsavedChanges() {
    if (isMapModified) {
        const choice = await window.electron.showSaveDialog();
        console.log('Save dialog choice:', choice);
        
        if (choice === 'save') {
            const saveResult = await saveMap();
            // Возвращаем результат сохранения
            return saveResult;
        } else if (choice === 'dont-save') {
            return true;
        }
        return false;
    }
    return true;
}

function initJsMind() {
    // Добавим проверку на наличие MIND_MAP_THEMES
    if (!MIND_MAP_THEMES) {
        console.error('MIND_MAP_THEMES not loaded');
        return;
    }
    
    const container = document.getElementById('jsmind_container');
    if (!container) {
        console.error('Container not found: jsmind_container');
        return;
    }

    const mindContainer = document.getElementById('jsmind_container');

    
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
        
        setTimeout(() => {
            
            const centerX = mindContainer.clientWidth / 2;
            const centerY = mindContainer.clientHeight / 2;
            
            
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
        
        // Добавляем слушатель для загрузки данных карты
        window.electron.onLoadMapData((mapData) => {
            if (mapData) {
                currentFilePath = mapData.meta?.path;
                jm.show(mapData);
            } else {
                // Очищаем путь при создании новой карты
                currentFilePath = null;
                jm.show(mind);
            }
        });

        jm.show(mind);

        // Теперь этот метод должен работать
        jm.add_event_listener((type) => {
            if (['node_changed', 'node_created', 'node_removed'].includes(type)) {
                markMapAsModified();
            }
        });

        setTimeout(() => {
            const canvas = document.querySelector('.canvas');
            if (canvas && jm) {
                const rootElement = document.querySelector('.jsmind-node[data-isroot="true"]');
                if (rootElement) {
                    const mindContainer = document.getElementById('jsmind_container');
                    
                    
                    const rootRect = rootElement.getBoundingClientRect();
                    const containerRect = mindContainer.getBoundingClientRect();
        
                    
                    const rootX = rootRect.left - containerRect.left + rootRect.width / 2;
                    const rootY = rootRect.top - containerRect.top + rootRect.height / 2;
        
                    
                    canvas.scrollLeft = rootX - canvas.clientWidth / 2;
                    canvas.scrollTop = rootY - canvas.clientHeight / 2;
        
                    console.log('Centered at:', canvas.scrollLeft, canvas.scrollTop);
                }
            }
        }, 100);
        

        
        window.addEventListener('resize', () => {
            if (jm) {
                resizeContainer();
                jm.resize();
                jm.drawLines();
            }
        });

        resizeContainer(); 

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
            const sidebar = document.querySelector('.style-sidebar');
            
            if (node) {
                if (styleManager) {
                    styleManager.setNode(node);
                    sidebar.classList.add('visible');
                }
            } else if (!e.target.closest('.style-sidebar')) {
                
                sidebar.classList.remove('visible');
                if (styleManager) {
                    styleManager.setNode(null);
                }
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
    const themeButtons = document.querySelectorAll('.map-theme-button');
    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const themeName = button.dataset.theme;
            if (themeName && MIND_MAP_THEMES[themeName] && jm) {
                console.log('Changing theme to:', themeName);
                jm.options.theme = themeName;
                applyTheme(themeName);
            }
        });
    });
}

async function navigateBack() {
    if (navigationLock) return;
    navigationLock = true;

    const backButton = document.getElementById('back-button');
    if (!backButton) {
        navigationLock = null;
        return;
    }
    
    backButton.disabled = true;

    try {
        const navigationResult = await window.electron.goBack();
        console.log('Navigation result:', navigationResult);
        
        if (!navigationResult) {
            navigationLock = null;
            backButton.disabled = false;
        }
    } catch (error) {
        console.error('Navigation error:', error);
        navigationLock = null;
        backButton.disabled = false;
    }
}

function init() {
    console.log('Initializing application...');
    initWindowDragging();
    initButtonHandlers(); // Используем импортированную функцию
    initDropdownStyleMenu();

    // Добавляем обработчик загрузки карты перед инициализацией jsMind
    window.electron.onLoadMapData((mapData) => {
        if (mapData && mapData.meta.path) {
            currentFilePath = mapData.meta.path;
            console.log('Loading existing map:', currentFilePath);
        }
    });

    initJsMind();

    console.log('Adding event listeners...');
    
    // Оставляем только один обработчик для всех сочетаний клавиш
    window.addEventListener('keydown', async (e) => {
        if (e.ctrlKey && (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'ы')) {
            console.log('Save hotkey detected:', e.key);
            e.preventDefault();
            e.stopPropagation();
            await saveMap();
        }
    }, true);

    document.getElementById('jsmind_container').addEventListener('dblclick', async function(e) {
        const node = e.target.closest('.jsmind-node');

        if (node) {
            const topic = node.querySelector('.node-topic');
            if (topic) {
                topic.focus();
            }
        }
    });

    window.electron.onBeforeClose(async () => {
        console.log('Before close handler triggered');
        const canClose = await handleUnsavedChanges();
        console.log('Can close:', canClose);
        window.electron.confirmClose(canClose);
    });

    window.electron.onCheckNavigation(async () => {
        let canNavigate = true;
        
        if (isMapModified) {
            const choice = await window.electron.showSaveDialog();
            if (choice === 'save') {
                const saveSuccess = await saveMap();
                canNavigate = saveSuccess;
            } else if (choice === 'cancel') {
                canNavigate = false;
            }
        }
        
        window.electron.sendNavigationResponse(canNavigate);
    });

    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Проверяем блокировку перед вызовом
            if (!navigationLock && !backButton.disabled) {
                await navigateBack();
            }
        });
    }
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
