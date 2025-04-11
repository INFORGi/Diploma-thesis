import { initWindowDragging, initButtonHandlers, initDropdownStyleMenu, setTheme } from './windowManager.js';
import { jsMind } from '../lib/jsmind/js/jsmind.js';
import { TOPIC_STYLES, FIGURE, LINE_STYLES, INDENTATION_BETWEEN_BUTTON_NODE, MIND_MAP_THEMES, NODE_STYLES } from '../data/constants.js';

let jm = null;
let selectedNodes = new Set();

let isSelecting = false;
let selectionBox = null;

function init() {
    initWindowDragging();
    initButtonHandlers();
    initDropdownStyleMenu();
    initJsMind();
    // initNode();
    // initZoneBox();
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

function initNode() {
    document.addEventListener('mousedown', (e) => {
        if (!jm) return;
        
        const clickedNode = e.target.closest('.jsmind-node');
        if (clickedNode) {
            if (!e.ctrlKey) {
                selectedNodes.clear();
                selectedNodes.add(clickedNode.id);
            } else {
                selectedNodes.add(clickedNode.id);
            }

            jm.setActiveNode([...selectedNodes]);

            if (selectedNodes.size === 1) {
                nodeAddButtonActive();
            } else {
                nodeAddButtonDisable();
            }
        } else if (!e.target.matches('#create-node')) {
            selectedNodes.clear();
            jm.setActiveNode([]);
            nodeAddButtonDisable();
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.id === 'create-node' && selectedNodes.size === 1) {
            e.stopPropagation();
            const parentId = Array.from(selectedNodes)[0];
            addNewNode(parentId);
        }

        if (e.target.id === 'jsmind_container') {
            jm.setActiveNode();
        }
    });

    // Обработчик клавиш для удаления
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Del') {
            if (jm.activeNode.size > 0) {
                jm.removeNode();
            }
        }
    });
}

function initZoneBox() {
    selectionBox = document.createElement('div');
    selectionBox.className = 'selection-box';
    document.getElementById('jsmind_container').appendChild(selectionBox);

    let startX, startY;

    document.addEventListener('mousedown', (e) => {
        if (e.target.closest('.jsmind-node') || e.button !== 0) return;
        
        isSelecting = true;
        startX = e.pageX;
        startY = e.pageY;
        
        selectionBox.style.left = startX + 'px';
        selectionBox.style.top = startY + 'px';
        selectionBox.style.width = '0';
        selectionBox.style.height = '0';
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

        selectionBox.style.display = 'block';
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

    document.addEventListener('mouseup', () => {
        if (!isSelecting) return;
        
        isSelecting = false;
        selectionBox.style.display = 'none';
    });
}

function initSelection() {
    const selectionBox = document.createElement('div');
    selectionBox.className = 'selection-box';
    document.getElementById('jsmind_container').appendChild(selectionBox);

    let startX, startY;
    let isSelecting = false;
    let justFinishedSelecting = false; // Флаг для отслеживания завершения выделения

    document.addEventListener('mousedown', (e) => {
        if (!jm) return;

        console.log('mousedown:', {
            target: e.target.id || e.target.className,
            ctrlKey: e.ctrlKey,
            button: e.button,
            selectedNodesBefore: [...selectedNodes],
            activeNodeBefore: [...jm.activeNode]
        });

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

            console.log('mousedown on node completed:', {
                selectedNodes: [...selectedNodes],
                activeNode: [...jm.activeNode]
            });

            if (selectedNodes.size === 1) {
                nodeAddButtonActive();
            } else {
                nodeAddButtonDisable();
            }
            e.stopPropagation();
            return;
        }

        if (e.button === 0 && !e.target.matches('#create-node')) {
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
        console.log('mouseup:', {
            target: e.target.id || e.target.className,
            isSelecting: isSelecting,
            selectedNodesBefore: [...selectedNodes],
            activeNodeBefore: [...jm.activeNode]
        });

        if (isSelecting) {
            isSelecting = false;
            justFinishedSelecting = true; // Устанавливаем флаг
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

            console.log('mouseup completed:', {
                selectedNodes: [...selectedNodes],
                activeNode: [...jm.activeNode]
            });
            e.stopPropagation();
        }
    });

    document.addEventListener('click', (e) => {
        console.log('click:', {
            target: e.target.id || e.target.className,
            selectedNodesBefore: [...selectedNodes],
            activeNodeBefore: [...jm.activeNode],
            justFinishedSelecting: justFinishedSelecting
        });

        if (e.target.id === 'create-node' && selectedNodes.size === 1) {
            e.stopPropagation();
            const parentId = Array.from(selectedNodes)[0];
            addNewNode(parentId);
            return;
        }

        // Не сбрасываем выделение сразу после завершения области
        if (e.target.id === 'jsmind_container' && !isSelecting && !justFinishedSelecting) {
            selectedNodes.clear();
            jm.setActiveNode([]);
            nodeAddButtonDisable();
            console.log('click reset completed:', {
                selectedNodes: [...selectedNodes],
                activeNode: [...jm.activeNode]
            });
        }

        // Сбрасываем флаг после обработки клика
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

document.addEventListener("DOMContentLoaded", function() {
    init();

    // Для предуприждения что не сохранено
    window.addEventListener('beforeunload', async (event) => { }); 
    // Настройка темы
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
