import { initWindowDragging, initButtonHandlers, initDropdownStyleMenu, setTheme } from './windowManager.js';
import { jsMind } from '../lib/jsmind/js/jsmind.js';
import { TOPIC_STYLES, CONTAINER_STYLES, LINE_STYLES, 
    INDENTATION_BETWEEN_BUTTON_NODE, NODE_STYLES, CANVAS_SIZE_BUTTON, MENU_CONTROLS } from '../data/constants.js';

let jm = null;

let bgColorFigur = document.getElementById('node-color');
let borderColorFigure = document.getElementById('border-color');
let borderWidth = document.getElementById('border-width');
let nodeWidth = document.getElementById('node-width');
let nodeHeight = document.getElementById('node-height');

let groupBoxLineStyle = document.getElementById('line-style');
let inputLineColor = document.getElementById('line-color');
let inputLineWidth = document.getElementById('line-width');

let renderMap = document.getElementById('map-type');
let mapZoom = document.getElementById('map-zoom');

const inputs = [
    {
        element: bgColorFigur,
        event: 'input',
        handler: () => setData({ container: { backgroundColor: bgColorFigur.value } })
    },
    {
        element: borderColorFigure,
        event: 'input',
        handler: () => setData({ container: { borderColor: borderColorFigure.value } })
    },
    {
        element: borderWidth,
        event: 'input',
        handler: () => setData({ container: { borderWidth: `${borderWidth.value}px` } })
    },
    {
        element: nodeWidth,
        event: 'input',
        handler: () => setData({ container: { width: `${nodeWidth.value}px` } })
    },
    {  
        element: nodeHeight,
        event: 'input',
        handler: () => setData({ container: { height: `${nodeHeight.value}px` } })
    },
    {
        element: groupBoxLineStyle,
        event: 'change',
        handler: () => setData({ line: { type: groupBoxLineStyle.value } })
    },
    {
        element: inputLineColor,
        event: 'input',
        handler: () => setData({ line: { style: { stroke: inputLineColor.value } } })
    },
    {
        element: inputLineWidth,
        event: 'input',
        handler: () => setData({ line: { style: { strokeWidth: inputLineWidth.value } } })
    }
];

function init() {
    initWindowDragging();
    initButtonHandlers();
    initDropdownStyleMenu();
    initJsMind();
    initMenuSystem();
    initSelection();
    initButtonMenu();
    
    addValidation('#font-size', 8, 72);
    addValidation('#img-width', 10, 1000);
    addValidation('#img-height', 10, 1000);
}

function initMenuSystem() {
    requestAnimationFrame(() => {
        const menus = {
            node: document.querySelector('.menu.floating-menu'),
            content: document.querySelector('.menu.content-menu'),
            text: document.querySelector('.text-controls'),
            image: document.querySelector('.image-controls')
        };

        if (!validateMenus(menus)) return;

        setupInitialMenuState(menus);
        setupMenuEventListeners(menus);
    });
}

function validateMenus(menus) {
    const missingMenus = Object.entries(menus)
        .filter(([key, element]) => !element)
        .map(([key]) => key);

    if (missingMenus.length > 0) {
        console.error('Missing menus:', missingMenus);
        return false;
    }
    return true;
}

function setupInitialMenuState(menus) {
    Object.values(menus).forEach(menu => {
        menu.style.display = 'none';
    });
}

function setupMenuEventListeners(menus) {
    jm.setActiveNodeCallback = (hasActiveNodes) => {
        if (hasActiveNodes && !jm.editableNodes) {
            menus.node.style.display = 'block';
            menus.content.style.display = 'none';
            updateNodeMenu();
        } else {
            menus.node.style.display = 'none';
        }
    };

    document.addEventListener('editable-mode-change', (e) => {
        const isEditable = e.detail.editable;
        if (isEditable) {
            menus.node.style.display = 'none';
            menus.content.style.display = 'block';
            
            if (jm.selectedBlockContent) {
                const isImage = jm.selectedBlockContent.tagName === 'IMG';
                menus.text.style.display = isImage ? 'none' : 'block';
                menus.image.style.display = isImage ? 'block' : 'none';
            } else {
                menus.text.style.display = 'block';
                menus.image.style.display = 'none';
            }
        }
    });

    document.addEventListener('block-selected', (e) => {
        const block = e.detail.block;
        const isImage = block.tagName === 'IMG';
        
        menus.text.style.display = isImage ? 'none' : 'block';
        menus.image.style.display = isImage ? 'block' : 'none';

        if (isImage) {
            updateImageControls(block);
        } else {
            updateTextControls(block);
        }
    });
}

function initJsMind() {
    try {
        const initialData = {
            settings: {
                container: 'jsmind_container',
                theme: 'dark',
                onNodeAddButtonActive: nodeAddButtonActive,
                onNodeAddButtonDisable: nodeAddButtonDisable,
                cascadeRemove: true,
                renderMap: "mind",
            },
            data: { 
                id: 'root', 
                topic: {
                    text: `<ol><li style="color:red;">TEXT</li><li>text</li></ol>
                    <h3>hi</h3>
                    <img src="C:/Users/shulg/OneDrive/Pictures/Screenshots/ccc.png" style="width:150px; height:75px;" alt="Test image" />`,
                    color: '#000',
                    fontSize: '14px',
                    fontFamily: 'Arial'
                },                
                parent: null,
                children: [],
                styleNode: JSON.parse(JSON.stringify(NODE_STYLES)),
                styleContainer: {...JSON.parse(JSON.stringify(CONTAINER_STYLES)) },
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

function initSelection() {
    const selectionBox = document.createElement('div');
    selectionBox.className = 'selection-box';
    document.getElementById('jsmind_container').appendChild(selectionBox);

    let startX, startY;
    let isSelecting = false;
    let justFinishedSelecting = false;

    document.addEventListener('mousedown', (e) => {
        if (!jm || e.target.closest('.menu')) return;

        const clickedNode = e.target.closest('.jsmind-node');
        const clickedCanvas = e.target.id === 'jsmind_container';

        
        if (clickedCanvas) {
            if (!e.ctrlKey) {
                jm.clearActiveNodes();
            }
            nodeAddButtonDisable();
            
            
            if (e.ctrlKey) {
                isSelecting = true;
                startX = e.pageX;
                startY = e.pageY;
                
                selectionBox.style.left = startX + 'px';
                selectionBox.style.top = startY + 'px';
                selectionBox.style.width = '0';
                selectionBox.style.height = '0';
                selectionBox.style.display = 'block';
            }
            return;
        }

        
        if (clickedNode) {
            console.log('Clicked node:', clickedNode.id);
            const currentActive = new Set(jm.activeNode);
            console.log('Active nodes before:', currentActive);

            if (e.ctrlKey) {
                
                if (currentActive.has(clickedNode.id)) {
                    
                    jm.removeActiveNode(clickedNode.id);
                } else {
                    
                    jm.addActiveNode(clickedNode.id);
                }
            } else {
                
                jm.clearActiveNodes();
                jm.addActiveNode(clickedNode.id);
            }

            console.log('Active nodes after:', jm.activeNode);

            if (jm.activeNode.size === 1) {
                nodeAddButtonActive();
            } else {
                nodeAddButtonDisable();
            }
            
            e.stopPropagation();
            return;
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

            const intersects = isRectIntersecting(selectionRect, adjustedNodeRect);
            
            if (intersects && !jm.activeNode.has(node.id)) {
                jm.addActiveNode(node.id);
            } else if (!intersects && jm.activeNode.has(node.id)) {
                jm.removeActiveNode(node.id);
            }
        });

        if (jm.activeNode.size === 1) {
            nodeAddButtonActive();
        } else {
            nodeAddButtonDisable();
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (isSelecting) {
            isSelecting = false;
            justFinishedSelecting = true;
            selectionBox.style.display = 'none';

            if (jm.activeNode.size > 0) {
                jm.setActiveNode(new Set(jm.activeNode));
                if (jm.activeNode.size === 1) {
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
        if (e.target.id === 'create-node' && jm.activeNode.size === 1) {
            e.stopPropagation();
            const parentId = Array.from(jm.activeNode)[0];
            addNewNode(parentId);
        }
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

function addValidation(selector, min, max) {
    const input = document.querySelector(selector);
    if (!input) return;

    input.addEventListener('input', () => {
        const value = parseInt(input.value);
        input.value = isNaN(value) ? min : Math.max(min, Math.min(max, value));
    });
}

function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

document.addEventListener("DOMContentLoaded", () => {
    init();
    window.electron.onLoadSettings(settings => setTheme(settings.Theme));
});

function nodeAddButtonActive() {
    if (jm.activeNode.size !== 1) {
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

function updateNodeMenu() {
    if (!jm.activeNode.size) return;

    const controls = {
        nodeColor: document.getElementById('node-color'),
        borderColor: document.getElementById('border-color'),
        borderWidth: document.getElementById('border-width'),
        nodeWidth: document.getElementById('node-width'),
        nodeHeight: document.getElementById('node-height'),
        lineStyle: document.getElementById('line-style'),
        lineColor: document.getElementById('line-color'),
        lineWidth: document.getElementById('line-width')
    };

    if (jm.activeNode.size === 1) {
        const nodeId = Array.from(jm.activeNode)[0];
        const node = jm.nodes.get(nodeId);
        if (!node) return;

        const { styleNode, styleContainer, styleLine } = node.data;

        controls.nodeColor.value = styleNode.backgroundColor || '#ffffff';
        controls.borderColor.value = styleNode.borderColor || '#cccccc';
        controls.borderWidth.value = parseInt(styleNode.borderWidth) || 1;
        controls.nodeWidth.value = styleContainer.width || 300;
        controls.nodeHeight.value = styleContainer.height || 250;

        controls.lineStyle.value = styleLine.type || 'straight';
        controls.lineColor.value = styleLine.style.stroke || '#555555';
        controls.lineWidth.value = parseInt(styleLine.style.strokeWidth) || 2;
    } 
    else {
        controls.nodeColor.value = NODE_STYLES.backgroundColor || '#ffffff';
        controls.borderColor.value = NODE_STYLES.borderColor || '#cccccc';
        controls.borderWidth.value = '1';
        controls.nodeWidth.value = CONTAINER_STYLES.minWidth;
        controls.nodeHeight.value = CONTAINER_STYLES.minHeight;

        controls.lineStyle.value = LINE_STYLES.STRAIGHT.type;
        controls.lineColor.value = LINE_STYLES.STRAIGHT.style.stroke;
        controls.lineWidth.value = LINE_STYLES.STRAIGHT.style.strokeWidth;
    }
}

function setData(data) {
    if (!jm.activeNode.size) return;

    jm.activeNode.forEach(nodeId => {
        const node = jm.nodes.get(nodeId);
        if (!node) return;

        const container = node.element.querySelector('.jsmind-container');
        if (!container) return;

        if (data.container) {
            Object.assign(node.data.styleContainer, data.container);
            Object.assign(container.style, data.container);
        }

        if (data.line) {
            if (data.line.type) {
                
                node.data.styleLine.type = data.line.type;
            }
            if (data.line.style) {
                
                Object.assign(node.data.styleLine.style, data.line.style);
            }
        }
    });

    jm.drawLines();
}