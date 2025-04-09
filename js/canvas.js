import { initWindowDragging, initButtonHandlers, initDropdownStyleMenu, setTheme } from './windowManager.js';
import { jsMind } from '../lib/jsmind/js/jsmind.js';
import { TOPIC_STYLES, FIGURE, LINE_STYLES, INDENTATION_BETWEEN_BUTTON_NODE, MIND_MAP_THEMES, NODE_STYLES } from '../data/constants.js';

let jm = null;
let styleManager = null;
let isMapModified = false;
let currentMapPath = null;
let currentFilePath = null;
let navigationLock = null;

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

    try {
        const initialData = {
            settings: {
                container: 'jsmind_container',
                theme: 'dark',
                onNodeAddButtonActive: nodeAddButtonActive, // Передаем функцию для показа кнопки
                onNodeAddButtonDisable: nodeAddButtonDisable, // Передаем функцию для скрытия кнопки
                cascadeRemove: true,
            },
            data: { 
                id: 'root', 
                topic: {
                    text: 'Главная тема',
                    color: "#333333",
                    fontSize: "14px",
                    fontFamily: "Arial, sans-serif"
                },
                parent: null,
                children: [],
                styleNode: JSON.parse(JSON.stringify(NODE_STYLES)),
                figure: JSON.parse(JSON.stringify(FIGURE.TRAPEZOID)),
                styleTopic: JSON.parse(JSON.stringify(TOPIC_STYLES)),
                styleLine: JSON.parse(JSON.stringify(LINE_STYLES.BEZIER)),
                position: { x: 0, y: 0 },
                draggable: false,
            }
        };

        jm = new jsMind(initialData);
        jm.show();
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

async function exportMapImage() {
    if (!jm) return null;
    try {
        const container = document.querySelector('#jsmind_container');
        const svgElement = container.querySelector('svg');
        if (!svgElement || !container) return null;

        const nodes = container.querySelectorAll('.jsmind-node');
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        const lines = svgElement.querySelectorAll('path');
        [...nodes, ...lines].forEach(element => {
            const rect = element.getBoundingClientRect();
            minX = Math.min(minX, rect.left);
            minY = Math.min(minY, rect.top);
            maxX = Math.max(maxX, rect.right);
            maxY = Math.max(maxY, rect.bottom);
        });

        const padding = 50;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        const width = maxX - minX;
        const height = maxY - minY;

        const newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        newSvg.setAttribute('width', width);
        newSvg.setAttribute('height', height);
        newSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        const bgColor = window.getComputedStyle(container).backgroundColor;
        const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        background.setAttribute('width', '100%');
        background.setAttribute('height', '100%');
        background.setAttribute('fill', bgColor);
        newSvg.appendChild(background);

        const contentGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        contentGroup.setAttribute('transform', `translate(${-minX}, ${-minY})`);

        const linesGroup = svgElement.querySelector('g');
        if (linesGroup) {
            const newGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            
            Array.from(linesGroup.attributes).forEach(attr => {
                newGroup.setAttribute(attr.name, attr.value);
            });

            linesGroup.querySelectorAll('path').forEach(path => {
                const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                Array.from(path.attributes).forEach(attr => {
                    newPath.setAttribute(attr.name, attr.value);
                });
                newPath.setAttribute('stroke', path.getAttribute('stroke') || '#666');
                newPath.setAttribute('stroke-width', path.getAttribute('stroke-width') || '1');
                newPath.setAttribute('fill', 'none');
                newGroup.appendChild(newPath);
            });

            contentGroup.appendChild(newGroup);
        }

        nodes.forEach(node => {
            const rect = node.getBoundingClientRect();
            const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            const computedStyle = window.getComputedStyle(node);
            
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

function collectNodeData(nodeId) {
    const node = jm.nodes.get(nodeId);
    if (!node) {
        return null;
    }

    const nodeData = {
        id: nodeId,
        topic: node.data.topic || '',
        direction: node.data.direction || 'right',
        type: node.data.type || 'node',
        expanded: node.expanded,
        children: []
    };

    if (node.data) {
        Object.assign(nodeData, Object.assign({}, node.data));
    }

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

        nodeData.style = Object.assign(
            {},
            nodeStyle,
            node.element.nodeData?.nodeStyle || {}
        );

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

            nodeData.topicStyle = Object.assign(
                {},
                topicStyle,
                node.element.nodeData?.topicStyle || {}
            );
        }
    }

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
        if (choice === 'save') {
            return await saveMap();
        } else if (choice === 'dont-save') {
            return true;
        }
        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.disabled = false;
        }
        return false;
    }
    return true;
}

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

function nodeAddButtonActive(nodeId) {
    const node = jm.nodes.get(nodeId)?.element;
    if (!node) return;
    
    const buttonAdd = document.getElementById("create-node");
    if (!buttonAdd) return;

    const nodeRect = node.getBoundingClientRect();
    const buttonRect = buttonAdd.getBoundingClientRect();
    const offsetX = INDENTATION_BETWEEN_BUTTON_NODE;
    
    let buttonX;
    const nodeData = jm.nodes.get(node.id);

    if (!nodeData.parent) {
        buttonX = nodeRect.right + offsetX;
    } else {
        const parentNode = document.getElementById(nodeData.parent);
        if (!parentNode) return;
        
        const parentRect = parentNode.getBoundingClientRect();
        if (parentRect.left - nodeRect.left > 0) {
            buttonX = nodeRect.left - offsetX - buttonRect.width;
        } else {
            buttonX = nodeRect.right + offsetX;
        }
    }

    buttonAdd.style.left = `${buttonX}px`;
    buttonAdd.style.top = `${nodeRect.top + (nodeRect.height / 2)}px`;
    buttonAdd.style.visibility = 'visible';
}

function nodeAddButtonDisable() {
    const buttonAdd = document.getElementById("create-node");
    if (buttonAdd) {
        buttonAdd.style.visibility = 'hidden';
    }
}

function addNewNode(parentId) {
    if (!parentId || !jm) {
        console.error('No parent node selected for adding a child or jsMind not initialized');
        return;
    }
    
    console.log('Adding new node to parent:', parentId); // Отладочный лог
    jm.addChild(parentId);
    markMapAsModified();
}

document.addEventListener("DOMContentLoaded", function() {
    init();
    
    // Обработчик клика для добавления узла (перемещен выше)
    document.addEventListener('click', (e) => {
        const addButton = document.getElementById('create-node');
        if (e.target === addButton && jm && jm.activeNode) {
            e.stopPropagation(); // Предотвращаем всплытие события
            addNewNode(jm.activeNode.id);
        }
    });

    // Обработчик mousedown для выделения узлов
    document.addEventListener('mousedown', (e) => {
        if (!jm) return;
        
        const clickedNode = e.target.closest('.jsmind-node');
        if (clickedNode) {
            jm.setActiveNode(clickedNode);
            nodeAddButtonActive(clickedNode.id);
        } else if (!e.target.matches('#create-node')) {
            jm.setActiveNode(null);
            nodeAddButtonDisable();
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Del') {
            const activeNode = jm.activeNode;
            if (activeNode) {
                jm.removeNode(activeNode.id);
                markMapAsModified();
            }
        }
    });

    window.addEventListener('beforeunload', async (event) => { }); // Для предуприждения что не сохранено

    window.electron.onLoadSettings((settings) => {
        setTheme(settings.Theme);
        if (jm && settings.MapTheme) {
            changeMapTheme(settings.MapTheme);
        }
    });
});
