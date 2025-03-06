import { DEFAULT_NODE_STYLE, MIND_MAP_THEMES } from '../../../data/constants.js';

export class jsMind {
    constructor(options) {
        this.options = options;
        this.container = document.getElementById(options.container);
        this.nodes = new Map();
        this.lines = new Map();
        this.root = null;
        this.eventListeners = new Map(); // Добавляем хранилище для обработчиков событий
        this.initContainer();
    }

    // Добавляем метод для регистрации обработчиков событий
    add_event_listener(callback) {
        if (typeof callback !== 'function') {
            console.error('Event listener must be a function');
            return;
        }
        
        // Добавляем обработчик для разных типов событий
        const listenerId = Date.now();
        this.eventListeners.set(listenerId, callback);
        return listenerId;
    }

    // Добавляем метод для вызова обработчиков событий
    fireEvent(type, data) {
        this.eventListeners.forEach(callback => {
            try {
                callback(type, data);
            } catch (error) {
                console.error('Error in event listener:', error);
            }
        });
    }

    initContainer() {
        this.svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.container.appendChild(this.svgContainer);

        this.moveMap();
        this.layout();
        this.drawLines();
    }

    show(mind) {
        this.clear();
        if (mind.format === 'node_tree') {
            this.root = this.createNode(mind.data, null);
            this.layout();
        }
    }

    createNode(data, parent) {
        // Проверяем наличие MIND_MAP_THEMES
        if (!MIND_MAP_THEMES) {
            console.error('MIND_MAP_THEMES is not defined!');
            return null;
        }

        const node = document.createElement('div');
        node.id = data.id;
        node.className = 'jsmind-node';
        node.dataset.direction = data.direction || 'center';
        node.dataset.nodetype = data.type || 'child';
        node.dataset.isroot = !parent ? 'true' : 'false';

        const topic = document.createElement('div');
        topic.className = 'node-topic';
        topic.contentEditable = 'false';
        topic.textContent = data.topic;
        topic.spellcheck = false;

        
        topic.addEventListener('dblclick', (e) => {
            e.stopPropagation();
 
            topic.contentEditable = 'true';
            topic.classList.add('editing');
            topic.focus();

            
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(topic);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        });

        
        topic.addEventListener('blur', () => {  
            topic.contentEditable = 'false';
            topic.classList.remove('editing');
            
            if (topic.textContent.trim() === '') {
                topic.textContent = 'Текст';
            }
            
            const nodeData = this.nodes.get(node.id);
            if (nodeData) {
                nodeData.data.topic = topic.textContent;
            }
        });

        topic.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                topic.blur();
            }
        });

        topic.addEventListener('mousedown', (e) => {
            if (topic.contentEditable === 'true') {
                e.stopPropagation();
            }
        });

        node.appendChild(topic);

        node.style.position = 'absolute';

        // Применяем стили в правильном порядке
        if (!parent) {
            // Для корневого узла
            Object.assign(node.style, DEFAULT_NODE_STYLE);
            if (data.style) {
                Object.assign(node.style, data.style);
            }
        } else {
            // Для дочерних узлов - свои собственные стили
            Object.assign(node.style, DEFAULT_NODE_STYLE);
            if (data.style) {
                Object.assign(node.style, data.style);
            }
        }

        // Применяем размеры узла если они есть в сохраненных данных
        if (data.style) {
            if (data.style.width) node.style.width = data.style.width;
            if (data.style.height) node.style.height = data.style.height;
            if (data.style.minWidth) node.style.minWidth = data.style.minWidth;
            if (data.style.minHeight) node.style.minHeight = data.style.minHeight;
            if (data.style.padding) node.style.padding = data.style.padding;
        }

        // Сохраняем nodeData с правильными стилями
        node.nodeData = {
            nodeStyle: {
                ...DEFAULT_NODE_STYLE,
                ...(data.style || {}),
                left: data.position ? `${data.position.x}px` : '0',
                top: data.position ? `${data.position.y}px` : '0'
            },
            topicStyle: data.topicStyle || {},
            ...data
        };

        // Применяем позицию, если она есть
        if (data.position) {
            node.style.left = `${data.position.x}px`;
            node.style.top = `${data.position.y}px`;
        }

        // Применяем стили текста, если они есть
        if (data.topicStyle) {
            Object.assign(topic.style, data.topicStyle);
        }

        if (parent) {
            const parentNode = this.nodes.get(parent);
            if (parentNode && parentNode.element.nodeData) {
                if (parentNode.element.nodeData.nodeStyle) {
                    data.nodeStyle = { ...parentNode.element.nodeData.nodeStyle };
                }
                if (parentNode.element.nodeData.topicStyle) {
                    data.topicStyle = { ...parentNode.element.nodeData.topicStyle };
                }
            }
        }

        // Устанавливаем цвет канваса из данных карты или темы
        if (data.canvasColor && this.container) {
            this.container.style.backgroundColor = data.canvasColor;
        } else if (this.options.theme && MIND_MAP_THEMES[this.options.theme]) {
            this.container.style.backgroundColor = MIND_MAP_THEMES[this.options.theme].canvas.backgroundColor;
        }

        this.container.appendChild(node);
        this.nodes.set(data.id, {
            element: node,
            data: data,
            parent: parent,
            children: []
        });

        if (data.children) {
            data.children.forEach(child => {
                const childNode = this.createNode(child, data.id);
                this.nodes.get(data.id).children.push(childNode);
            });
        }

        this.makeNodeDraggable(node);
        this.fireEvent('node_created', { node: node, data: data });
        this.container.style.background = data.canvasColor || this.options.backgroundColor || '#ffffff';
        return data.id;
    }

    layout() {
        if (!this.root) return;
        
        const rootNode = this.nodes.get(this.root);
        if (!rootNode) return;

        const element = rootNode.element;
        
        // Получаем реальные размеры контейнера
        const containerWidth = this.container.offsetWidth;
        const containerHeight = this.container.offsetHeight;
        const centerX = Math.floor(containerWidth/2 - element.offsetWidth/2);
        const centerY = Math.floor(containerHeight/2 - element.offsetHeight/2);
        
        element.style.left = `${centerX}px`;
        element.style.top = `${centerY}px`;
        rootNode.data.position = { x: centerX, y: centerY };

        this.layoutNewChildren(this.root);
        this.drawLines();
    }

    layoutNewChildren(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node || !node.children.length) return;

        const { hspace, vspace } = this.options.layout;
        const direction = node.data.direction || 'right';
        
        // Обрабатываем только новые узлы
        node.children.forEach((childId) => {
            const child = this.nodes.get(childId);
            if (!child) return;

            const childElement = child.element;
            
            // Располагаем узел только если у него нет сохраненной позиции
            if (!child.data.position) {
                const parentX = parseInt(node.element.style.left) || 0;
                const parentY = parseInt(node.element.style.top) || 0;
                
                const xOffset = direction === 'left' ? -hspace : hspace;
                const x = parentX + xOffset;
                const y = parentY;
                
                childElement.style.left = `${x}px`;
                childElement.style.top = `${y}px`;
                
                // Сохраняем позицию в data
                child.data.position = { x, y };
            }
        });
    }

    drawLines() {
        this.svgContainer.innerHTML = '';
        this.nodes.forEach(node => {
            if (node.parent) {
                this.drawLine(node.parent, node.data.id);
            }
        });
    }

    drawLine(fromId, toId) {
        const from = this.nodes.get(fromId);
        const to = this.nodes.get(toId);
        if (!from || !to) return;

        const fromElement = from.element;
        const toElement = to.element;

        // Получаем точные координаты центров элементов
        const fromX = parseInt(fromElement.style.left) + Math.floor(fromElement.offsetWidth / 2);
        const fromY = parseInt(fromElement.style.top) + Math.floor(fromElement.offsetHeight / 2);
        const toX = parseInt(toElement.style.left) + Math.floor(toElement.offsetWidth / 2);
        const toY = parseInt(toElement.style.top) + Math.floor(toElement.offsetHeight / 2);

        let connectionType = to.data.connectionType;
        if (connectionType === 'inherit') {
            connectionType = from.data.connectionType || 'straight';
        }

        const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
        let path;

        switch (connectionType) {
            case 'straight':
                path = `M ${fromX} ${fromY} L ${toX} ${toY}`;
                break;
            case 'curved':
                const midX = (fromX + toX) / 2;
                path = `M ${fromX} ${fromY} Q ${midX} ${fromY}, ${toX} ${toY}`;
                break;
            case 'bezier':
            default:
                const dx = toX - fromX;
                path = `M ${fromX} ${fromY} C ${fromX + dx/2} ${fromY}, ${toX - dx/2} ${toY}, ${toX} ${toY}`;
                break;
        }

        line.setAttribute("d", path);
        line.setAttribute("stroke", this.options.view.line_color);
        line.setAttribute("stroke-width", this.options.view.line_width);
        line.setAttribute("fill", "none");
        
        this.svgContainer.appendChild(line);
    }

    makeNodeDraggable(node) {
        let startX, startY;
        let isDragging = false;
        let initialLeft, initialTop;

        const onMouseDown = (e) => {
            if (node.dataset.isroot === 'true') return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = parseInt(node.style.left) || 0;
            initialTop = parseInt(node.style.top) || 0;
            
            node.style.zIndex = '1000';
            node.classList.add('dragging');
            
            e.preventDefault(); 
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            node.style.left = `${initialLeft + dx}px`;
            node.style.top = `${initialTop + dy}px`;
            
            requestAnimationFrame(() => this.drawLines());
        };

        const onMouseUp = (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            node.classList.remove('dragging');
            node.style.zIndex = '1000';

            // Сохраняем новую позицию в nodeData
            const nodeId = node.id;
            const currentNode = this.nodes.get(nodeId);
            if (currentNode && currentNode.element.nodeData) {
                currentNode.element.nodeData.nodeStyle.left = node.style.left;
                currentNode.element.nodeData.nodeStyle.top = node.style.top;
            }

            this.nodes.forEach(nodeData => {
                if (nodeData.element) {
                    nodeData.element.classList.remove('potential-parent');
                }
            });

            const newParent = this.findClosestNode(node);
            if (!newParent) {
                this.layout();
                return;
            }

            if (this.isDescendant(node.id, newParent.id)) {
                console.warn('Нельзя соединить узел с его потомком');
                this.layout();
            } else {
                const nodeId = node.id;
                const targetId = newParent.id;
                
                const currentNode = this.nodes.get(nodeId);
                const oldParent = this.nodes.get(currentNode.parent);
                const newParentNode = this.nodes.get(targetId);

                if (oldParent) {
                    oldParent.children = oldParent.children.filter(id => id !== nodeId);
                }

                currentNode.parent = targetId;
                newParentNode.children.push(nodeId);
                
                const newDirection = this.determineDirection(newParentNode);
                currentNode.data.direction = newDirection;
                node.dataset.direction = newDirection;

                this.updateChildrenDirections(nodeId, newDirection);
            }
            this.layout();
        };

        node.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    clear() {
        this.container.innerHTML = '';
        this.nodes.clear();
        this.lines.clear();
        this.root = null;
        this.initContainer();
    }

    findClosestNode(draggedNode) {
        const draggedRect = draggedNode.getBoundingClientRect();
        const draggedCenterX = draggedRect.left + draggedRect.width / 2;
        const draggedCenterY = draggedRect.top + draggedRect.height / 2;
        let newParent = null;

        this.nodes.forEach((nodeData) => {
            if (nodeData && nodeData.element && nodeData.element !== draggedNode) {
                const element = nodeData.element;
                const rect = element.getBoundingClientRect();
                if (draggedCenterX >= rect.left && 
                    draggedCenterX <= rect.right && 
                    draggedCenterY >= rect.top && 
                    draggedCenterY <= rect.bottom) {
                    newParent = element;
                }
            }
        });

        return newParent;
    }

    calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - y1, 2) + Math.pow(y2 - y1, 2));
    }

    moveNode(nodeId, newParentId) {
        const node = this.nodes.get(nodeId);
        const newParent = this.nodes.get(newParentId);
        
        if (node && newParent) {
            newParent.appendChild(node);
            this.resetNodePosition(node);
            this.updateNodeRelations(nodeId, newParentId);
        }
    }

    
    resetNodePosition(node) {
        node.style.zIndex = 'auto';
        node.classList.remove('dragging');
    }

    add_node(parentId, topic = 'Текст') {
        const parent = this.nodes.get(parentId);
        if (!parent) return null;

        const parentData = parent.data;
        const parentElement = parent.element;
        const direction = this.determineDirection(parent);

        const newNodeId = 'node_' + Date.now();
        const newNodeData = {
            id: newNodeId,
            topic: topic,
            direction: direction,
            type: 'child',
            connectionType: 'inherit',
            
            style: parentElement.nodeData ? { ...parentElement.nodeData.style } : { ...DEFAULT_NODE_STYLE }
        };

        
        const childId = this.createNode(newNodeData, parentId);
        parent.children.push(childId);

        
        const childNode = this.nodes.get(childId);
        if (childNode) {
            childNode.element.style.transform = ''; 
        }

        
        this.layoutNewChildren(parentId);
        this.drawLines();
        
        return newNodeId;
    }

    initContextMenu() {
        this.container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const node = e.target.closest('.jsmind-node');
            if (node) {
                this.showContextMenu(e, node.id);
            }
        });
    }

    showContextMenu(event, nodeId) {
        const existingMenu = document.querySelector('.jsmind-context-menu');
        if (existingMenu) existingMenu.remove();

        const node = this.nodes.get(nodeId);
        if (!node) return;

        const menu = document.createElement('div');
        menu.className = 'jsmind-context-menu';
        menu.style.position = 'fixed';
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;
        menu.style.zIndex = '1000';

        const addButton = document.createElement('div');
        addButton.textContent = 'Добавить узел';
        addButton.onclick = () => {
            this.add_node(nodeId, 'Текст', event);
            menu.remove();
        };
        menu.appendChild(addButton);

        const isRoot = node.element.dataset.isroot === 'true';
        if (!isRoot) {
            const deleteButton = document.createElement('div');
            deleteButton.textContent = 'Удалить узел';
            deleteButton.onclick = () => {
                this.remove_node(nodeId);
                menu.remove();
            };
            menu.appendChild(deleteButton);
        }

        document.body.appendChild(menu);

        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);
    }

    
    countRootNodes() {
        let rootCount = 0;
        this.nodes.forEach(node => {
            if (node.element.dataset.isroot === 'true') {
                rootCount++;
            }
        });
        return rootCount;
    }

    remove_node(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        if (node.element.dataset.isroot === 'true') {
            console.warn('Нельзя удалить корневой узел');
            return;
        }

        const removeChildren = (nodeId) => {
            const node = this.nodes.get(nodeId);
            if (node) {
                node.children.forEach(childId => removeChildren(childId));
                node.element.remove();
                this.nodes.delete(nodeId);
            }
        };

        const parentNode = this.nodes.get(node.parent);
        if (parentNode) {
            parentNode.children = parentNode.children.filter(id => id !== nodeId);
        }

        removeChildren(nodeId);

        this.fireEvent('node_removed', { nodeId: nodeId });
        this.drawLines();
        this.layout();
    }

    updateNodeStyle(nodeId, styles) {
        const node = this.nodes.get(nodeId);
        if (node) {
            Object.assign(node.style, styles);
        }
    }

    showNodeContextMenu(event, nodeId) {
        const existingMenu = document.querySelector('.node-context-menu');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.className = 'node-context-menu';
        menu.style.cssText = `
            position: absolute;
            left: ${event.pageX}px;
            top: ${event.pageY}px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 10px;
            z-index: 1000;
            box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(menu);

        
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);
    }

    isDescendant(parentId, childId) {
        const checkChildren = (nodeId) => {
            const node = this.nodes.get(nodeId);
            if (!node) return false;
            
            if (node.children.includes(childId)) return true;
            
            return node.children.some(id => checkChildren(id));
        };
        
        return checkChildren(parentId);
    }

    determineDirection(parentNode) {
        if (!parentNode) return 'right';

        const rootNode = this.nodes.get(this.root);
        if (!rootNode) return 'right';

        const containerRect = this.container.getBoundingClientRect();
        const rootRect = rootNode.element.getBoundingClientRect();
        const parentRect = parentNode.element.getBoundingClientRect();

        const rootCenterX = rootRect.left + rootRect.width / 2;
        const currentX = parentRect.left + parentRect.width / 2;

        const newDirection = currentX < rootCenterX ? 'left' : 'right';

        if (parentNode.element.dataset.isroot !== 'true') {
            parentNode.data.direction = newDirection;
            parentNode.element.dataset.direction = newDirection;
        }

        return newDirection;
    }

    updateDirectionsAfterDrag(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        const newDirection = this.determineDirection(node);

        node.data.direction = newDirection;
        node.element.dataset.direction = newDirection;

        node.children.forEach(childId => {
            this.updateDirectionsAfterDrag(childId);
        });
    }

    updateChildrenDirections(nodeId, direction) {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        // Обновляем направление текущего узла
        node.data.direction = direction;
        node.element.dataset.direction = direction;

        // Рекурсивно обновляем направление всех дочерних узлов
        node.children.forEach(childId => {
            const childNode = this.nodes.get(childId);
            if (childNode) {
                this.updateChildrenDirections(childId, direction);
            }
        });
    }

    moveMap(){
        const container = this.container;

        const move = (e) => {
            if (e.buttons === 1) {
                container.scrollLeft -= e.movementX;
                container.scrollTop -= e.movementY;
            }
        }
    }

    get_root() {
        return this.root;
    }

    // Добавляем метод для получения данных карты
    get_data() {
        const data = {
            meta: {
                name: 'mindmap',
                author: 'user',
                version: '1.0'
            },
            format: 'node_tree',
            data: this.getNodeData(this.root)
        };
        return data;
    }

    // Вспомогательный метод для рекурсивного сбора данных узлов
    getNodeData(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return null;

        const element = node.element;
        const topic = element.querySelector('.node-topic');

        return {
            id: node.data.id,
            topic: node.data.topic,
            direction: node.data.direction,
            type: node.data.type,
            connectionType: node.data.connectionType || 'inherit',
            position: {
                x: parseInt(element.style.left) || 0,
                y: parseInt(element.style.top) || 0
            },
            canvasColor: this.container.style.background, // Сохраняем цвет канваса
            style: {
                backgroundColor: element.style.backgroundColor,
                borderColor: element.style.borderColor,
                borderWidth: element.style.borderWidth,
                borderStyle: element.style.borderStyle,
                borderRadius: element.style.borderRadius,
                boxShadow: element.style.boxShadow,
                width: element.style.width || element.offsetWidth + 'px',
                height: element.style.height || element.offsetHeight + 'px',
                minWidth: element.style.minWidth,
                minHeight: element.style.minHeight,
                padding: element.style.padding
            },
            topicStyle: topic ? {
                color: topic.style.color,
                fontSize: topic.style.fontSize,
                fontFamily: topic.style.fontFamily,
                fontWeight: topic.style.fontWeight,
                fontStyle: topic.style.fontStyle,
                textDecoration: topic.style.textDecoration
            } : {},
            children: node.children.map(childId => this.getNodeData(childId)).filter(Boolean)
        };
    }

    // Добавляем метод resize
    resize() {
        const containerWidth = this.container.offsetWidth;
        const containerHeight = this.container.offsetHeight;
        
        if (this.svgContainer) {
            this.svgContainer.setAttribute('width', containerWidth);
            this.svgContainer.setAttribute('height', containerHeight);
        }
        
        // Обновляем положение узлов после изменения размера
        this.layout();
    }

    // Добавляем новый метод для изменения цвета канваса
    setCanvasColor(color) {
        if (this.container) {
            this.container.style.background = color;
            this.options.backgroundColor = color;
            // Вызываем событие изменения
            this.fireEvent('canvas_changed', { color });
        }
    }

    applyTheme(themeName) {
        if (!MIND_MAP_THEMES[themeName]) return;
        
        const theme = MIND_MAP_THEMES[themeName];
        
        // Обновляем цвет канваса в соответствии с темой
        this.setCanvasColor(theme.canvas.backgroundColor);
        
        // ...rest of applyTheme code...
    }
}
