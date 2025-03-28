import { initWindowDragging, initButtonHandlers, initDropdownStyleMenu, setTheme } from './windowManager.js';
import { jsMind } from '../lib/jsmind/js/jsmind.js';
import { StyleManager } from './styleManager.js';
import { MIND_MAP_THEMES } from '../data/constants.js';
import { DEFAULT_NODE_DATA, TOPIC_STYLES, NODE_STYLES, LINE_STYLES } from '../data/constants.js';

let jm = null;
let styleManager = null;
let isMapModified = false;
let currentMapPath = null;
let currentFilePath = null; // Добавляем переменную для хранения пути текущего файла
let navigationLock = null; // Добавляем переменную для блокировки навигации

function markMapAsModified() {
    isMapModified = true;
}

function initJsMind() {
    const container = document.getElementById('jsmind_container');
    if (!container) {
        console.error('Container not found: jsmind_container');
        return;
    }

    container.style.position = 'absolute';
    container.style.overflow = 'auto';
    container.style.background = 'inherit';

    const options = {
        container: 'jsmind_container',
        theme: 'default'
    };

    try {
        jm = new jsMind(options);
        
        // Исправляем структуру начальных данных
        const initialData = {
            theme: 'default',
            data: { 
                id: 'root', 
                topic: 'Главная тема', 
                parent: null,
                children: [{
                    id: 'rodsot', 
                    topic: 'тема', 
                    parent: 'root',
                    children: [],
                    styleNode: { ...NODE_STYLES.RECTANGLE },
                    styleTopic: { ...TOPIC_STYLES },
                    styleLine: { ...LINE_STYLES.STRAIGHT },
                    position: { x: 0, y: 0 },
                    draggable: true,
                }],
                styleNode: { ...NODE_STYLES.RECTANGLE },
                styleTopic: { ...TOPIC_STYLES },
                styleLine: { ...LINE_STYLES.STRAIGHT },
                position: { x: 0, y: 0 },
                draggable: false,
            }
        };

        jm.show(initialData);

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

function init() {
    console.log('Initializing application...');
    initWindowDragging();
    initButtonHandlers();
    initDropdownStyleMenu();
    initJsMind();
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
// Изменяем функцию saveMap
async function saveMap() {
    if (!jm) {
        console.error('jsMind instance is not initialized');
        return false;
    }

    try {
        // Упрощенная структура данных
        const mapData = {
            theme: jm.options.theme,
            data: jm.getNodeData(jm.get_root())
        };

        const savePath = currentFilePath || `mindmap_${Date.now()}`;

        const saveData = {
            mapData,
            mapPath: savePath,
            isExisting: Boolean(currentFilePath),
            imageData: await exportMapImage()
        };

        const result = await window.electron.saveMap(saveData);

        if (result.success) {
            isMapModified = false;
            if (!currentFilePath) {
                currentFilePath = result.path;
                window.electron.showNotification('Карта сохранена');
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
            return saveResult;
        } else if (choice === 'dont-save') {
            return true;
        }
        
        // Разблокируем кнопку перед возвратом false
        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.disabled = false;
        }
        return false;
    }
    return true;
}

// Добавляем функцию для разблокировки кнопки
function unlockBackButton() {
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.disabled = false;
        navigationLock = null;
    }
}

async function navigateBack() {
    const backButton = document.getElementById('back-button');
    if (!backButton) return;
    
    backButton.disabled = true;

    try {
        const result = await window.electron.goBack();
        if (!result) {
            backButton.disabled = false;
        }
    } catch (error) {
        console.error('Navigation error:', error);
        backButton.disabled = false;
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
