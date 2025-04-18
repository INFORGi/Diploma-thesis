import { initWindowDragging, initButtonHandlers, initDropdownStyleMenu, setTheme } from './windowManager.js';
import { jsMind } from '../lib/jsmind/js/jsmind.js';
import { TOPIC_STYLES, FIGURE, LINE_STYLES, INDENTATION_BETWEEN_BUTTON_NODE, NODE_STYLES, CANVAS_SIZE_BUTTON } from '../data/constants.js';

let jm = null;
let selectedNodes = new Set();

function init() {
    initWindowDragging();
    initButtonHandlers();
    initDropdownStyleMenu();
    initJsMind();
    initButtonMenu();
    initSelection();
    initShapeButtons();
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
                figure: {...JSON.parse(JSON.stringify(FIGURE.TRAPEZOID)) },
                styleTopic: JSON.parse(JSON.stringify(TOPIC_STYLES)),
                styleLine: JSON.parse(JSON.stringify(LINE_STYLES.DASHED)),
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
            } else if (!e.ctrlKey) {
                selectedNodes.delete(node.id);
            }
        });

        if (selectedNodes.size > 0) {
            jm.setActiveNode(new Set(selectedNodes));
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

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Del') {
            if (jm.activeNode.size > 0) {
                jm.removeNode();
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
        cascadeDeleteToggle.checked = jm.options.cascadeRemove || false;

        cascadeDeleteToggle.addEventListener('change', (e) => {
            e.stopPropagation();
            jm.options.cascadeRemove = e.target.checked;
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