import { NODE_STYLES, TOPIC_STYLES, MIND_MAP_THEMES, LINE_STYLES } from '../../../data/constants.js';
import { NodeContextMenu } from './contextMenu.js';

export class jsMind {
    constructor(options) {
        this.options = {
            container: options.container || 'jsmind_container',
            theme: options.theme || 'default'
        };
        this.container = document.getElementById(this.options.container);
        this.nodes = new Map();
        this.root = null;
        this.contextMenu = new NodeContextMenu(this);
        this.activeNode = null; // Добавляем отслеживание активного узла
        this.initContainer();
        this.initNodeEvents();
    }

    // Добавляем метод для управления z-index узлов
    setActiveNode(node) {
        // Сбрасываем z-index предыдущего активного узла
        if (this.activeNode && this.activeNode !== node) {
            this.activeNode.style.zIndex = '1';
        }
        
        // Устанавливаем новый активный узел
        if (node) {
            node.style.zIndex = '1000';
            this.activeNode = node;
        } else {
            this.activeNode = null;
        }
    }

    initContainer() {
        this.svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.container.appendChild(this.svgContainer);
        this.layout();
        this.drawLines();
    }

    show(data) {
        this.clear();
        this.options.theme = data.theme || this.options.theme;
        if (data.data) {
            this.root = this.createNode(data.data);
            this.layout();
        }
    }

    // Функция для глубокого клонирования объекта
    deepCloneStyle(style) {
        return JSON.parse(JSON.stringify(style));
    }

    createNode(data) {
        const nodeData = {
            id: data.id || `node_${Date.now()}`,
            topic: data.topic || 'Новая тема',
            parent: data.parent || null,
            children: data.children || [],
            // Используем функцию для клонирования
            styleNode: data.styleNode ? this.deepCloneStyle(data.styleNode) 
                                    : this.deepCloneStyle(NODE_STYLES.RECTANGLE),
            styleTopic: data.styleTopic ? this.deepCloneStyle(data.styleTopic)
                                      : this.deepCloneStyle(TOPIC_STYLES),
            styleLine: data.styleLine ? this.deepCloneStyle(data.styleLine)
                                    : this.deepCloneStyle(LINE_STYLES.DEFAULT),
            position: { x: data.position?.x || 0, y: data.position?.y || 0 },
            draggable: data.draggable !== undefined ? data.draggable : true
        };

        const node = this.createNodeElement(nodeData);
        this.nodes.set(nodeData.id, {
            element: node, 
            data: nodeData,
            parent: nodeData.parent,
            children: []
        });

        if (nodeData.children && Array.isArray(nodeData.children)) {
            nodeData.children.forEach(child => {
                child.parent = nodeData.id;
                const childId = this.createNode(child);
                this.nodes.get(nodeData.id).children.push(childId);
            });
        }

        return nodeData.id;
    }

    createNodeElement(data) {
        const node = document.createElement('div');
        node.id = data.id;
        node.className = 'jsmind-node';
        node.dataset.isroot = !data.parent ? 'true' : 'false';
    
        Object.assign(node.style, NODE_STYLES.BASE_NODE.styles);
    
        if (data.styleNode.shapeSvg) {
            const shape = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            shape.setAttribute('width', data.styleNode.shapeSvg.width);
            shape.setAttribute('height', data.styleNode.shapeSvg.height);
            shape.classList.add('node-shape');
    
            const shapeElement = document.createElementNS("http://www.w3.org/2000/svg", data.styleNode.shapeSvg.tag);
            
            // Установка общих атрибутов
            shapeElement.setAttribute('fill', data.styleNode.shapeSvg.fill);
            shapeElement.setAttribute('stroke', data.styleNode.shapeSvg.stroke);
            shapeElement.setAttribute('stroke-width', data.styleNode.shapeSvg.strokeWidth);
    
            // Установка специфичных атрибутов в зависимости от типа элемента
            if (data.styleNode.shapeSvg.tag === 'polygon') {
                shapeElement.setAttribute('points', data.styleNode.shapeSvg.points);
            } else if (data.styleNode.shapeSvg.tag === 'rect') {
                shapeElement.setAttribute('x', data.styleNode.shapeSvg.x || '0');
                shapeElement.setAttribute('y', data.styleNode.shapeSvg.y || '0');
                shapeElement.setAttribute('width', data.styleNode.shapeSvg.width);
                shapeElement.setAttribute('height', data.styleNode.shapeSvg.height);
                if (data.styleNode.shapeSvg.rx) {
                    shapeElement.setAttribute('rx', data.styleNode.shapeSvg.rx);
                    // shapeElement.setAttribute('ry', data.styleNode.shapeSvg.rx);
                }
                if (data.styleNode.shapeSvg.filter) {
                    // Для drop-shadow нужно создать filter элемент
                    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
                    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
                    filter.setAttribute('id', `shadow-${data.id}`);
                    filter.innerHTML = `
                        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.1)"/>
                    `;
                    defs.appendChild(filter);
                    shape.appendChild(defs);
                    shapeElement.setAttribute('filter', `url(#shadow-${data.id})`);
                }
            }
    
            shape.appendChild(shapeElement);
            node.appendChild(shape);
        }
        else{ return; }
    
        const topic = document.createElement('div');
        topic.className = 'node-topic';
        topic.contentEditable = 'false';
        topic.textContent = data.topic;
        topic.spellcheck = false;
    
        Object.assign(topic.style, data.styleTopic);
    
        this.setupTopicEventListeners(topic);
        node.appendChild(topic);
    
        node.style.left = `${data.position.x}px`;
        node.style.top = `${data.position.y}px`;
    
        this.container.appendChild(node);
        if (data.draggable) {
            this.makeNodeDraggable(node);
        }
    
        return node;
    }

    layout() {
        if (!this.root) return;
        
        const rootNode = this.nodes.get(this.root);
        if (!rootNode) return;

        const element = rootNode.element;
        const position = {
            x: Math.floor(this.container.offsetWidth/2 - element.offsetWidth/2),
            y: Math.floor(this.container.offsetHeight/2 - element.offsetHeight/2)
        };
        
        element.style.left = `${position.x}px`;
        element.style.top = `${position.y}px`;
        rootNode.data.position = position;

        this.layoutChildren(this.root);
        this.drawLines();
    }

    layoutChildren(nodeId, spacing = 100) {
        const node = this.nodes.get(nodeId);
        if (!node || !node.children.length) return;

        node.children.forEach((childId) => {
            const child = this.nodes.get(childId);
            if (!child) return;

            const position = {
                x: child.data.position.x,
                y: child.data.position.y
            };

            child.element.style.left = `${position.x}px`;
            child.element.style.top = `${position.y}px`;
            child.data.position = position;

            this.layoutChildren(childId, spacing);
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

        const fromX = parseInt(fromElement.style.left) + Math.floor(fromElement.offsetWidth / 2);
        const fromY = parseInt(fromElement.style.top) + Math.floor(fromElement.offsetHeight / 2);
        const toX = parseInt(toElement.style.left) + Math.floor(toElement.offsetWidth / 2);
        const toY = parseInt(toElement.style.top) + Math.floor(toElement.offsetHeight / 2);

        const lineStyle = from.data.styleLine || LINE_STYLES.STRAIGHT;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
        let path;

        switch (lineStyle.type) {
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
        Object.entries(lineStyle.style).forEach(([attr, value]) => {
            const svgAttr = attr.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
            line.setAttribute(svgAttr, value);
        });
        
        this.svgContainer.appendChild(line);
    }

    clear() {
        this.container.innerHTML = '';
        this.nodes.clear();
        this.root = null;
        this.initContainer();
    }

    get_data() {
        return {
            theme: this.options.theme,
            data: this.getNodeData(this.root)
        };
    }

    getNodeData(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return null;

        return {
            id: node.data.id,
            topic: node.data.topic,
            parent: node.data.parent,
            children: node.children.map(childId => this.getNodeData(childId)).filter(Boolean),
            styleNode: node.data.styleNode,
            styleTopic: node.data.styleTopic,
            styleLine: node.data.styleLine,
            position: node.data.position,
            draggable: node.data.draggable
        };
    }

    resize() {
        if (this.svgContainer) {
            this.svgContainer.setAttribute('width', this.container.offsetWidth);
            this.svgContainer.setAttribute('height', this.container.offsetHeight);
        }
        this.layout();
    }

    setupTopicEventListeners(topic) {
        topic.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            topic.contentEditable = 'true';
            topic.classList.add('editing');
            topic.focus();
        });

        topic.addEventListener('blur', () => {
            topic.contentEditable = 'false';
            topic.classList.remove('editing');
            if (topic.textContent.trim() === '') {
                topic.textContent = 'Текст';
            }
        });

        topic.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                topic.blur();
            }
        });
    }

    makeNodeDraggable(node) {
        let isDragging = false;
        let startX, startY;
        let initialLeft, initialTop;

        const handleMouseDown = (e) => {
            if (node.dataset.isroot === 'true') return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = parseInt(node.style.left);
            initialTop = parseInt(node.style.top);

            node.classList.add('dragging');
            this.setActiveNode(node); // Устанавливаем активный узел при начале перетаскивания
            e.stopPropagation();
        };

        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            const newX = initialLeft + dx;
            const newY = initialTop + dy;

            node.style.left = `${newX}px`;
            node.style.top = `${newY}px`;

            const nodeId = node.id;
            const nodeData = this.nodes.get(nodeId);
            if (nodeData) {
                nodeData.data.position = { x: newX, y: newY };
            }

            requestAnimationFrame(() => this.drawLines());
        };

        const handleMouseUp = () => {
            if (!isDragging) return;
            
            isDragging = false;
            node.classList.remove('dragging');

            const nearestNode = this.findNearestNode(node);
            if (nearestNode && nearestNode.element.id !== node.id) {
                this.changeParent(node.id, nearestNode.element.id);
                this.layoutChildren(nearestNode.element.id, nearestNode.element.width);
            }

            // Не сбрасываем активный узел здесь, так как узел остается выбранным
            this.drawLines();
        };

        node.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    findNearestNode(draggingNode) {
        const draggingRect = draggingNode.getBoundingClientRect();
        const threshold = Math.min(draggingRect.width, draggingRect.height) / 2;
        let nearest = null;
        let minDistance = Infinity;

        this.nodes.forEach((node) => {
            // Убираем проверку на root
            if (node.element === draggingNode) return;

            const rect = node.element.getBoundingClientRect();
            const distance = Math.sqrt(
                Math.pow((draggingRect.left + draggingRect.width/2) - (rect.left + rect.width/2), 2) +
                Math.pow((draggingRect.top + draggingRect.height/2) - (rect.top + rect.height/2), 2)
            );

            if (distance < threshold && distance < minDistance) {
                minDistance = distance;
                nearest = node;
            }
        });

        return nearest;
    }

    changeParent(nodeId, newParentId) {
        const node = this.nodes.get(nodeId);
        const oldParent = this.nodes.get(node.parent);
        const newParent = this.nodes.get(newParentId);

        if (!node || !oldParent || !newParent) return;

        // Проверка на циклическую связь
        if (this.isDescendant(nodeId, newParentId)) {
            console.warn('Нельзя присоединить узел к своему потомку');
            return;
        }

        // Удаляем узел из списка детей старого родителя
        oldParent.children = oldParent.children.filter(id => id !== nodeId);

        // Добавляем узел к новому родителю
        node.parent = newParentId;
        newParent.children.push(nodeId);

        // Обновляем данные узла
        node.data.parent = newParentId;

        // Сохраняем текущую позицию
        const currentPosition = {
            x: parseInt(node.element.style.left),
            y: parseInt(node.element.style.top)
        };
        node.data.position = currentPosition;
    }

    // Добавляем новый метод для проверки циклических связей
    isDescendant(nodeId, potentialParentId) {
        // Проверяем всю цепочку родителей потенциального родителя
        let currentId = potentialParentId;
        while (currentId) {
            if (currentId === nodeId) return true;
            const current = this.nodes.get(currentId);
            if (!current) break;
            currentId = current.parent;
        }
        return false;
    }

    initNodeEvents() {
        this.container.addEventListener('click', (e) => {
            const node = e.target.closest('.jsmind-node');
            if (node) {
                this.setActiveNode(node); // Устанавливаем активный узел при клике
                this.contextMenu.show(node);
            } else {
                this.setActiveNode(null); // Сбрасываем активный узел при клике вне узлов
            }
        });
    }

    addChild(parentId) {
        const parentNode = this.nodes.get(parentId);
        if (!parentNode) return;

        // Копируем стили родительского узла для нового узла
        const newNodeData = {
            id: `node_${Date.now()}`,
            topic: 'Новый узел',
            parent: parentId,
            children: [],
            // Наследуем стили от родителя с глубоким клонированием
            styleNode: this.deepCloneStyle(parentNode.data.styleNode),
            styleTopic: this.deepCloneStyle(parentNode.data.styleTopic),
            styleLine: this.deepCloneStyle(parentNode.data.styleLine),
            position: { x: 0, y: 0 },
            draggable: true
        };
        
        this.createNode(newNodeData);
        this.layout();
    }

    removeNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node || node.data.isroot) return;

        // Рекурсивно удаляем дочерние узлы
        node.children.forEach(childId => {
            this.removeNode(childId)         
            // Удаляем DOM элемент
            node.element.remove();
        });

        // Удаляем узел из списка детей родителя
        const parentNode = this.nodes.get(node.parent);
        if (parentNode) {
            parentNode.children = parentNode.children.filter(id => id !== nodeId);
        }
        
        // Удаляем DOM элемент
        node.element.remove();
        
        // Удаляем из Map
        this.nodes.delete(nodeId);
        
        this.contextMenu.hideAll();
        this.layout();
    }

    updateNode(nodeId, newData) {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        // Обновляем данные узла
        Object.assign(node.data, newData);

        // Сохраняем важные ссылки и данные
        const oldPosition = node.data.position;
        const oldParent = node.parent;
        const oldChildren = node.children;

        // Создаем новый элемент с обновленными стилями
        const newElement = this.createNodeElement(node.data);
        
        // Восстанавливаем позицию
        newElement.style.left = `${oldPosition.x}px`;
        newElement.style.top = `${oldPosition.y}px`;

        // Заменяем старый элемент новым
        node.element.parentNode.replaceChild(newElement, node.element);
        
        // Обновляем ссылку на элемент в данных узла
        node.element = newElement;
        node.parent = oldParent;
        node.children = oldChildren;

        // Перерисовываем линии
        this.drawLines();
    }

    updateNodeStyles(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        const element = node.element;
        const topic = element.querySelector('.node-topic');
        const data = node.data;

        if (data.styleNode.shapeSvg) {
            const shapeElement = element.querySelector('.node-shape polygon, .node-shape rect');
            if (shapeElement) {
                if (data.styleNode.shapeSvg.fill) {
                    shapeElement.setAttribute('fill', data.styleNode.shapeSvg.fill);
                }
                if (data.styleNode.shapeSvg.stroke) {
                    shapeElement.setAttribute('stroke', data.styleNode.shapeSvg.stroke);
                }
            }
        }

        if (topic) {
            Object.assign(topic.style, data.styleTopic);
        }

        // Перерисовываем линии, если нужно
        if (data.styleLine) {
            this.drawLines();
        }
    }
}
