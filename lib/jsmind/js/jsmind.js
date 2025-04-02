import { FIGURE, TOPIC_STYLES, NODE_STYLES, LINE_STYLES } from '../../../data/constants.js';

export class jsMind {
    constructor(options) {
        this.options = {
            container: options.container || 'jsmind_container',
            theme: options.theme || 'default'
        };
        this.container = document.getElementById(this.options.container);
        this.nodes = new Map();
        this.root = null;
        this.activeNode = null;
        this.initContainer();
        this.initNodeEvents();
    }

    setActiveNode(node) {
        if (this.activeNode && this.activeNode !== node) {
            this.activeNode.style.zIndex = '1';
        }
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
            styleNode: data.styleNode ? this.deepCloneStyle(data.styleNode) : this.deepCloneStyle(FIGURE.RECTANGLE),
            styleTopic: data.styleTopic ? this.deepCloneStyle(data.styleTopic) : this.deepCloneStyle(TOPIC_STYLES),
            styleLine: data.styleLine ? this.deepCloneStyle(data.styleLine) : this.deepCloneStyle(LINE_STYLES.DEFAULT),
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
        node.dataset.isroot = !data.parent ? 'true' : 'false';
        node.className = 'jsmind-node';
        
        Object.assign(node.style, JSON.parse(JSON.stringify(NODE_STYLES)));

        const containerWithTextShape = document.createElement('div');
        containerWithTextShape.className = 'jsmind-node-content';
        
    
        if (data.styleNode.shapeSvg) {
            const shape = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            shape.classList.add('node-shape');
    
            const shapeElement = document.createElementNS("http://www.w3.org/2000/svg", data.styleNode.shapeSvg.tag);

            shapeElement.setAttribute('fill', data.styleNode.shapeSvg.fill);
            shapeElement.setAttribute('stroke', data.styleNode.shapeSvg.stroke);
            shapeElement.setAttribute('stroke-width', data.styleNode.shapeSvg.strokeWidth);

            if (data.styleNode.shapeSvg.tag === 'polygon') {
                shapeElement.setAttribute('points', data.styleNode.shapeSvg.points);
            } else if (data.styleNode.shapeSvg.tag === 'rect') {
                shapeElement.setAttribute('width', '100%');
                shapeElement.setAttribute('height', '100%');
                if (data.styleNode.shapeSvg.rx) {
                    shapeElement.setAttribute('rx', data.styleNode.shapeSvg.rx);
                }
            }
            shape.appendChild(shapeElement);
            containerWithTextShape.appendChild(shape);
        }
        else{ return; }
    
        const topic = document.createElement('div');
        topic.className = 'node-topic';
        topic.contentEditable = 'false';
        topic.textContent = data.topic;
        topic.spellcheck = false;
    
        Object.assign(topic.style, data.styleTopic);
    
        this.setupTopicEventListeners(topic);
        containerWithTextShape.appendChild(topic);
        
        node.appendChild(containerWithTextShape);
    
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
            const textColor = topic.style.color || window.getComputedStyle(topic).color;
            const rgb = textColor.match(/\d+/g)?.map(Number) || [51, 51, 51];
            const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
            topic.classList.add(brightness < 128 ? 'light' : 'dark');

            e.stopPropagation();
            topic.contentEditable = 'true';
            topic.classList.add('editing');
            topic.focus();
        });

        topic.addEventListener('blur', () => {
            topic.contentEditable = 'false';
            topic.classList.remove('editing', 'light', 'dark'); // Удаляем все классы одновременно
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
        let dragOffsetX, dragOffsetY;

        const onMouseDown = (e) => {
            if (node.dataset.isroot === 'true') return;
            
            isDragging = true;
            
            // Получаем текущие координаты узла
            const nodeRect = node.getBoundingClientRect();
            
            // Вычисляем смещение курсора относительно узла
            dragOffsetX = e.clientX - nodeRect.left;
            dragOffsetY = e.clientY - nodeRect.top;
            
            node.style.zIndex = '1000';
            
            e.stopPropagation();
            e.preventDefault();
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;

            // Вычисляем новые координаты с учетом смещения
            const x = e.clientX - dragOffsetX;
            const y = e.clientY - dragOffsetY;

            // Устанавливаем позицию узла
            node.style.left = x + 'px';
            node.style.top = y + 'px';

            // Обновляем линии
            this.drawLines();
        };

        const onMouseUp = () => {
            if (!isDragging) return;
            
            isDragging = false;
            node.style.zIndex = '1';

            // Обновляем позицию в данных
            const nodeData = this.nodes.get(node.id);
            if (nodeData) {
                nodeData.data.position = {
                    x: parseInt(node.style.left),
                    y: parseInt(node.style.top)
                };
            }

            this.drawLines();
        };

        node.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
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
