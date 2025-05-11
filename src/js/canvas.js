import { initWindowDragging, initButtonHandlers, initDropdownStyleMenu, setTheme } from './windowManager.js';
import { jsMind } from '../lib/jsmind/js/jsmind.js';
import { TOPIC_STYLES, FIGURE, LINE_STYLES, INDENTATION_BETWEEN_BUTTON_NODE, NODE_STYLES, CANVAS_SIZE_BUTTON, DEFAULT_NODE_DATA } from '../data/constants.js';

let jm = null;
let selectedNodes = new Set();
let activeEditBlock = null; // Add this line
let selectedBlocks = new Set(); // Add this line

// Кнопки для работы с фигурой узла
// let buttonFigur = null;
let bgColorFigur = document.getElementById('node-color');
let borderColorFigure = document.getElementById('border-color');
let borderWidth = document.getElementById('border-width');
let nodeWidth = document.getElementById('node-width');
let nodeHeight = document.getElementById('node-height');

// Кнопки для работы с линией
let groupBoxLineStyle = document.getElementById('line-style');
let inputLineColor = document.getElementById('line-color');
let inputLineWidth = document.getElementById('line-width');

// Кнопки глобальных настроек
let renderMap = document.getElementById('map-type');
let mapZoom = document.getElementById('map-zoom');

const inputs = [
    {
        element: bgColorFigur,
        event: 'input',
        handler: () => setData({ figure: { fill: bgColorFigur.value } })
    },
    {
        element: borderColorFigure,
        event: 'input',
        handler: () => setData({ figure: { stroke: borderColorFigure.value } })
    },
    {
        element: borderWidth,
        event: 'input',
        handler: () => setData({ figure: { strokeWidth: borderWidth.value } })
    },
    {
        element: nodeWidth,
        event: 'input',
        handler: () => setData({ size: { width: nodeWidth.value } })
    },
    {  
        element: nodeHeight,
        event: 'input',
        handler: () => setData({ size: { height: nodeHeight.value } })
    },
    {
        element: groupBoxLineStyle,
        event: 'change',
        handler: () => setData({ styleLine: { type: groupBoxLineStyle.value } })
    },
    {
        element: inputLineColor,
        event: 'input',
        handler: () => setData({ styleLine: { style: { stroke: inputLineColor.value } } })
    },
    {
        element: inputLineWidth,
        event: 'input',
        handler: () => setData({ styleLine: { style: { strokeWidth: inputLineWidth.value } } })
    }
];

function init() {
    initWindowDragging();
    initButtonHandlers();
    initDropdownStyleMenu();
    initJsMind();
    initShapeButtons();
    initButtonMenu();
    initSelection();
}

function initJsMind() {
    try {
        const initialData = {
            settings: {
                container: 'jsmind_container',
                theme: 'dark',
                onNodeAddButtonActive: nodeAddButtonActive,
                onNodeAddButtonDisable: nodeAddButtonDisable,
                onContextMenu: showContextMenu, // Добавляем новый обработчик
                cascadeRemove: true,
                renderMap: "mind",
            },
            data: { 
                id: 'root', 
                topic: {
                    text: `<ol><li>TEXT</li><li>text</li></ol><h3>hi</h3>
                    <img src="C:/Users/shulg/OneDrive/Pictures/Screenshots/ccc.png" style="width:450px; height:500px;" alt="Test image" />`,
                    color: '#000',
                    fontSize: '14px',
                    fontFamily: 'Arial'
                },                
                parent: null,
                children: [],
                styleNode: JSON.parse(JSON.stringify(NODE_STYLES)),
                figure: {...JSON.parse(JSON.stringify(FIGURE.TRAPEZOID)) },
                styleTopic: JSON.parse(JSON.stringify(TOPIC_STYLES)),
                styleLine: JSON.parse(JSON.stringify(LINE_STYLES.DASHED)),
                position: { x: 0, y: 0 },
                draggable: false,
            }
        };

        jm = new jsMind(initialData);
        jm.show();

        renderMap.value = jm.settings.renderMap;
        mapZoom.value = 50;
    } catch (error) {
        console.error('Error initializing jsMind:', error);
    }
}

// Новая функция для отображения контекстного меню
function showContextMenu(e, nodeId) {
    const contextMenu = document.getElementById('context-menu');
    const node = jm.nodes.get(nodeId);
    
    if (!node || !contextMenu) return;

    e.preventDefault();
    e.stopPropagation();
    
    contextMenu.style.display = 'block';
    
    // Позиционируем меню внутри видимой области
    const x = Math.min(e.pageX, window.innerWidth - contextMenu.offsetWidth);
    const y = Math.min(e.pageY, window.innerHeight - contextMenu.offsetHeight);
    
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    
    // Закрываем меню при клике вне его
    const closeMenu = (e) => {
        if (!e.target.closest('#context-menu')) {
            contextMenu.style.display = 'none';
            document.removeEventListener('click', closeMenu);
        }
    };
    
    document.addEventListener('click', closeMenu);
}

function initSelection() {
    const selectionBox = document.createElement('div');
    selectionBox.className = 'selection-box';
    document.getElementById('jsmind_container').appendChild(selectionBox);

    let startX, startY;
    let isSelecting = false;
    let justFinishedSelecting = false;

    document.addEventListener('mousedown', (e) => {
        if (!jm) return;

        const clickedNode = e.target.closest('.jsmind-node');

        if (clickedNode) {
            if (!e.ctrlKey) {
                selectedNodes.clear();
                selectedNodes.add(clickedNode.id);
            } else {
                if (selectedNodes.has(clickedNode.id)) {
                    selectedNodes.delete(clickedNode.id);
                } else {
                    selectedNodes.add(clickedNode.id);
                }
            }
            jm.setActiveNode([...selectedNodes]);
            if (selectedNodes.size === 1) {
                nodeAddButtonActive();
            } else {
                nodeAddButtonDisable();
            }


            getData();
            e.stopPropagation();
            return;
        }

        if (e.button === 0 && !e.target.matches('#create-node') && e.ctrlKey) {
            isSelecting = true;
            startX = e.pageX;
            startY = e.pageY;

            if (!e.ctrlKey) {
                selectedNodes.clear();
                jm.setActiveNode([]);
            }

            selectionBox.style.left = startX + 'px';
            selectionBox.style.top = startY + 'px';
            selectionBox.style.width = '0';
            selectionBox.style.height = '0';
            selectionBox.style.display = 'block';

            getData();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!isSelecting) return;

        e.preventDefault();

        const currentX = e.pageX;
        const currentY = e.pageY;
        
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';

        const selectionRect = {
            left,
            top,
            right: left + width,
            bottom: top + height
        };

        document.querySelectorAll('.jsmind-node').forEach(node => {
            const nodeRect = node.getBoundingClientRect();
            const adjustedNodeRect = {
                left: nodeRect.left + window.pageXOffset,
                top: nodeRect.top + window.pageYOffset,
                right: nodeRect.right + window.pageXOffset,
                bottom: nodeRect.bottom + window.pageYOffset
            };

            if (isRectIntersecting(selectionRect, adjustedNodeRect)) {
                selectedNodes.add(node.id);
            } 
            else {
                selectedNodes.delete(node.id);
            }
        });

        if (selectedNodes.size > 0) {
            jm.setActiveNode(new Set(selectedNodes));
        }
        else {
            jm.setActiveNode(new Set());
        }
        
        
    });

    document.addEventListener('mouseup', (e) => {
        if (isSelecting) {
            isSelecting = false;
            justFinishedSelecting = true;
            selectionBox.style.display = 'none';

            if (selectedNodes.size > 0) {
                jm.setActiveNode(new Set(selectedNodes));
                if (selectedNodes.size === 1) {
                    nodeAddButtonActive();
                } else {
                    nodeAddButtonDisable();
                }
            } else {
                jm.setActiveNode([]);
                nodeAddButtonDisable();
            }
            e.stopPropagation();
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.id === 'create-node' && selectedNodes.size === 1) {
            e.stopPropagation();
            const parentId = Array.from(selectedNodes)[0];
            addNewNode(parentId);
            return;
        }

        if (e.target.id === 'jsmind_container' && !isSelecting && !justFinishedSelecting) {
            selectedNodes.clear();
            jm.setActiveNode([]);
            nodeAddButtonDisable();
        }

        justFinishedSelecting = false;
    });

    window.addEventListener('keydown', async (e) => {
        if (e.key === 'Delete' || e.key === 'Del') {
            if (jm.activeNode.size > 0 && jm.selectedBlockContent === null) {
                await jm.removeNode();
            }
        }
    });

    function isRectIntersecting(rect1, rect2) {
        return rect1.left < rect2.right &&
               rect1.right > rect2.left &&
               rect1.top < rect2.bottom &&
               rect1.bottom > rect2.top;
    }
}

function initButtonMenu() {
    document.querySelectorAll('.menu-section-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const content = button.nextElementSibling;
            content.classList.toggle('hidden');
            
            if (content.classList.contains('hidden')) {
                button.textContent = button.textContent.replace('▼', '▶');
            } else {
                button.textContent = button.textContent.replace('▶', '▼');
            }
        });
    });

    document.getElementById('expand-all').addEventListener('click', () => {
        document.querySelectorAll('.menu-section-toggle').forEach(button => {
            const content = button.nextElementSibling;
            content.classList.remove('hidden');
            button.textContent = button.textContent.replace('▶', '▼');
        });
    });

    document.getElementById('collapse-all').addEventListener('click', () => {
        document.querySelectorAll('.menu-section-toggle').forEach(button => {
            const content = button.nextElementSibling;
            content.classList.add('hidden');
            button.textContent = button.textContent.replace('▼', '▶');
        });
    });

    const cascadeDeleteToggle = document.getElementById('cascade-delete');
    if (cascadeDeleteToggle) {
        cascadeDeleteToggle.checked = jm.settings.cascadeRemove || false;

        cascadeDeleteToggle.addEventListener('change', (e) => {
            e.stopPropagation();
            jm.settings.cascadeRemove = e.target.checked;
        });

        const slider = cascadeDeleteToggle.nextElementSibling;
        if (slider && slider.classList.contains('slider')) {
            slider.addEventListener('mousedown', (e) => e.stopPropagation());
            slider.addEventListener('mouseup', (e) => e.stopPropagation());
            slider.addEventListener('click', (e) => e.stopPropagation());
        }
    } else {
        console.error('Переключатель #cascade-delete не найден');
    }

    const buttonGroup = document.querySelector('.button-group');
    if (buttonGroup) {
        buttonGroup.addEventListener('click', function(event) {
            const target = event.target.closest('button');
            if (target && target.tagName === 'BUTTON') {
                const shape = target.dataset.shape;
                if (!shape) {
                    console.warn('Атрибут data-shape не определён');
                    return;
                }
                const typeFigure = shape.toUpperCase();
                if (!FIGURE[typeFigure]) {
                    console.warn(`Форма ${typeFigure} не найдена в FIGURE`);
                    return;
                }

                const dNormalizedCopy = JSON.parse(JSON.stringify(FIGURE[typeFigure].dNormalized));
                setData({ figure: {dNormalized: dNormalizedCopy} });
            }
        });
    }

    // Добавляем дебонсированные обработчики для полей ввода
    inputs.forEach(({ element, event, handler }) => {
        if (element) {
            const debouncedHandler = debounce(handler, 10);
            element.addEventListener(event, debouncedHandler);
        } else {
            console.warn(`Элемент ввода ${element} не найден`);
        }
    });
}

function initShapeButtons() {
    const buttonGroup = document.querySelector('.button-group');
    if (!buttonGroup) {
        console.error('Button group container not found');
        return;
    }

    buttonGroup.innerHTML = '';

    const canvasSizeButtonFigure = CANVAS_SIZE_BUTTON;

    Object.keys(FIGURE).forEach(shapeKey => {
        const figure = FIGURE[shapeKey];

        const button = document.createElement('button');
        button.className = 'shape-btn';
        // button.classList.add('menu-button');
        button.dataset.shape = shapeKey.toLowerCase();

        const canvas = document.createElement('canvas');
        canvas.width = canvasSizeButtonFigure;
        canvas.height = canvasSizeButtonFigure;
        canvas.style.width = `${canvasSizeButtonFigure}px`;
        canvas.style.height = `${canvasSizeButtonFigure}px`;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvasSizeButtonFigure, canvasSizeButtonFigure);

        ctx.fillStyle = figure.fill || '#ffffff';
        ctx.strokeStyle = figure.stroke || '#000000';
        ctx.lineWidth = parseFloat(figure.strokeWidth) || 1;

        if (figure.dNormalized) {
            drawPath(ctx, figure.dNormalized, canvasSizeButtonFigure, canvasSizeButtonFigure);
        } else {
            console.warn(`No dNormalized points provided for figure: ${shapeKey}`);
        }

        ctx.fill();
        ctx.stroke();

        button.appendChild(canvas);
        buttonGroup.appendChild(button);
    });

    function drawPath(ctx, points, width, height) {
        ctx.beginPath();
    
        const getPointCoords = (point) => {
            let x = point.x * width;
            let y = point.y * height;

            if (point.fixedOffset !== undefined) {
                const offset = point.fixedOffset / 5;
                if (point.x <= 0.5) {
                    x = Math.max(0, x + offset);
                } else {
                    x = Math.min(width, x - offset);
                }
                if (point.y <= 0.5) {
                    y = Math.max(0, y + offset);
                } else {
                    y = Math.min(height, y - offset);
                }
            }

            return { x, y };
        };
    
        const pointsCount = points.length;
    
        if (pointsCount < 2) return;
    
        const coords = points.map(point => getPointCoords(point));
    
        ctx.moveTo(coords[0].x, coords[0].y);
    
        points.forEach((point, index) => {
            const current = coords[index];
            ctx.lineTo(current.x, current.y);
        });
    
        ctx.closePath();
    }
}

document.addEventListener("DOMContentLoaded", function() {
    init();
    window.addEventListener('beforeunload', async (event) => {});
    window.electron.onLoadSettings((settings) => { setTheme(settings.Theme); });
});

function nodeAddButtonActive() {
    if (selectedNodes.size !== 1) {
        nodeAddButtonDisable();
        return;
    }

    const node = jm.nodes.get(Array.from(jm.activeNode)[0])?.element;
    if (!node) {
        console.warn('nodeAddButtonActive: No node found for activeNode[0]');
        return;
    }
    
    const buttonAdd = document.getElementById("create-node");
    if (!buttonAdd) {
        console.warn('nodeAddButtonActive: Button #create-node not found');
        return;
    }

    const nodeRect = node.getBoundingClientRect();
    const buttonRect = buttonAdd.getBoundingClientRect();
    const offsetX = INDENTATION_BETWEEN_BUTTON_NODE;
    
    let buttonX;
    const nodeData = jm.nodes.get(node.id);

    if (!nodeData.parent) {
        buttonX = nodeRect.right + offsetX;
    } else {
        const parentNode = document.getElementById(nodeData.parent);
        if (!parentNode) {
            console.warn('nodeAddButtonActive: Parent node not found');
            return;
        }
        
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
    
    jm.addChild(parentId);
}

function getData() {
    const nodes = jm.activeNode;
    if (!nodes) return;

    // Один узел — заполняем его данными
    if (nodes.size === 1) {
        const node = jm.nodes.get(Array.from(nodes)[0]);
        fillUIWithNodeData(node);
    }
    else if (nodes.size !== 1) {
        fillUIWithDefaultData();
    }

    function fillUIWithNodeData(node) {
        try {
            bgColorFigur.value = node.data.figure.fill;
            borderColorFigure.value = node.data.figure.stroke;
            borderWidth.value = node.data.figure.strokeWidth;

            const width = node.data.styleNode.width === "auto" || !isFinite(parseFloat(node.data.styleNode.width))
                ? parseFloat(node.data.styleNode.minWidth) || 250
                : parseFloat(node.data.styleNode.width);
            const height = node.data.styleNode.height === "auto" || !isFinite(parseFloat(node.data.styleNode.height))
                ? parseFloat(node.data.styleNode.minHeight) || 75
                : parseFloat(node.data.styleNode.height);

            nodeWidth.value = width;
            nodeHeight.value = height;

            groupBoxLineStyle.value = node.data.styleLine.type;
            inputLineColor.value = node.data.styleLine.style.stroke;
            inputLineWidth.value = node.data.styleLine.style.strokeWidth;
        } catch (error) {
            console.error('Ошибка заполнения данными узла: ' + error);
        }
    }

    function fillUIWithDefaultData() {
        try {
            const defaultFigure = FIGURE.RECTANGLE;
            const defaultLine = LINE_STYLES.BEZIER;

            bgColorFigur.value = defaultFigure.fill;
            borderColorFigure.value = defaultFigure.stroke;
            borderWidth.value = defaultFigure.strokeWidth;

            groupBoxLineStyle.value = defaultLine.type;
            inputLineColor.value = defaultLine.style.stroke;
            inputLineWidth.value = defaultLine.style.strokeWidth;
        } catch (error) {
            console.error('Ошибка при установке стандартных значений: ' + error);
        }
    }
}

// Функция для дебонсинга
function debounce(fn, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

function setData(updates = {}) {
    try {
        if (!jm.activeNode || jm.activeNode.size === 0) {
            console.log('Нет активных узлов для изменения стилей');
            return;
        }

        jm.activeNode.forEach(nodeId => {
            const node = jm.nodes.get(nodeId);
            if (!node) {
                console.warn(`Узел ${nodeId} не найден в jm.nodes`);
                return;
            }

            if (updates.figure) {
                Object.assign(node.data.figure, updates.figure);
                
                // const canvas = node.element.querySelector('canvas');
                // const container = node.element.querySelector('.jsmind-node-content');
                // jm.drawNodeFigure(canvas, container, node.data.figure);
            }

            if (updates.styleLine) {
                if (!node.data.styleLine || typeof node.data.styleLine !== 'object') {
                    node.data.styleLine = { ...LINE_STYLES.STRAIGHT };
                }
                if (!node.data.styleLine.style || typeof node.data.styleLine.style !== 'object') {
                    node.data.styleLine.style = { ...LINE_STYLES.STRAIGHT.style };
                }

                if (updates.styleLine.type) {
                    const type = updates.styleLine.type.toUpperCase();
                    if (!LINE_STYLES[type]) {
                        console.warn(`Стиль линии ${type} не найден в LINE_STYLES`);
                        return;
                    }

                    const currentStroke = node.data.styleLine.style.stroke || LINE_STYLES[type].style.stroke;
                    const currentStrokeWidth = node.data.styleLine.style.strokeWidth || LINE_STYLES[type].style.strokeWidth;

                    node.data.styleLine = {
                        type: updates.styleLine.type,
                        style: { ...JSON.parse(JSON.stringify(LINE_STYLES[type].style)) }
                    };

                    node.data.styleLine.style.stroke = currentStroke;
                    node.data.styleLine.style.strokeWidth = currentStrokeWidth;
                } else if (updates.styleLine.style) {
                    Object.assign(node.data.styleLine.style, updates.styleLine.style);
                } else {
                    console.warn('Пропущено обновление styleLine: некорректные данные', updates.styleLine);
                }
            }

            if (updates.size) {
                const minWidth = parseFloat(node.data.styleNode.minWidth) || 250;
                const minHeight = parseFloat(node.data.styleNode.minHeight) || 75;

                const topic = node.element.querySelector('.node-topic');
                const contentRect = topic.getBoundingClientRect();

                const newWidth = Math.max(
                    parseFloat(updates.size.width) || minWidth,
                    contentRect.width + PADDING_WITH_NODE * 2
                );
                const newHeight = Math.max(
                    parseFloat(updates.size.height) || minHeight,
                    contentRect.height + PADDING_WITH_NODE * 2
                );

                node.data.styleNode.width = newWidth;
                node.data.styleNode.height = newHeight;
            }

            jm.layout(jm.root, new Set([nodeId]));
        });
    } catch (error) {
        console.error('Ошибка в методе setData: ' + error);
    }
}