import { DEFAULT_NODE_STYLE } from '../../../data/constants.js';

export class jsMind {
    constructor(options) {
        this.options = options;
        this.container = document.getElementById(options.container);
        this.nodes = new Map();
        this.lines = new Map();
        this.root = null;
        this.initContainer();
    }

    initContainer() {
        this.container.style.position = 'relative';
        this.svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svgContainer.style.position = 'absolute';
        this.svgContainer.style.width = '100%';
        this.svgContainer.style.height = '100%';
        this.svgContainer.style.pointerEvents = 'none';
        this.container.appendChild(this.svgContainer);
    }

    show(mind) {
        this.clear();
        if (mind.format === 'node_tree') {
            this.root = this.createNode(mind.data, null);
            this.layout();
        }
    }

    createNode(data, parent) {
        const node = document.createElement('div');
        node.id = data.id;
        node.className = 'jsmind-node';
        node.dataset.direction = data.direction || 'center';
        
        const topic = document.createElement('div');
        topic.className = 'node-topic';
        topic.textContent = data.topic;
        node.appendChild(topic);

        node.style.position = 'absolute';
        Object.assign(node.style, DEFAULT_NODE_STYLE);
        
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
        return data.id;
    }

    layout() {
        if (!this.root) return;
        
        const rootNode = this.nodes.get(this.root);
        if (!rootNode) return;

        // Позиционируем корневой узел в центре
        const rootElement = rootNode.element;
        const containerRect = this.container.getBoundingClientRect();
        const rootX = containerRect.width / 2 - rootElement.offsetWidth / 2;
        const rootY = containerRect.height / 2 - rootElement.offsetHeight / 2;
        
        rootElement.style.left = `${rootX}px`;
        rootElement.style.top = `${rootY}px`;

        // Размещаем дочерние узлы
        this.layoutChildren(this.root, rootX, rootY, 0);
        this.drawLines();
    }

    layoutChildren(nodeId, parentX, parentY, level) {
        const node = this.nodes.get(nodeId);
        if (!node || !node.children.length) return;

        const { hspace, vspace } = this.options.layout;
        const nodeWidth = 150; // Фиксированная ширина узла
        const nodeHeight = 40; // Фиксированная высота узла
        const direction = node.data.direction || 'right';
        
        node.children.forEach((childId, index) => {
            const child = this.nodes.get(childId);
            if (!child) return;

            const childElement = child.element;
            const xOffset = direction === 'left' ? -hspace : hspace;
            
            // Вычисляем позицию для каждого дочернего элемента
            const x = parentX + xOffset;
            const y = parentY + (index * (nodeHeight + vspace)) - 
                     ((node.children.length - 1) * (nodeHeight + vspace) / 2);

            // Применяем позицию
            childElement.style.left = `${x}px`;
            childElement.style.top = `${y}px`;

            // Рекурсивно размещаем дочерние элементы
            this.layoutChildren(childId, x, y, level + 1);
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
        
        // Получаем текущие трансформации
        const fromTransform = fromElement.style.transform;
        const toTransform = toElement.style.transform;
        
        // Получаем базовые позиции
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();

        // Вычисляем центры элементов с учетом трансформации
        const fromX = fromRect.left - containerRect.left + fromRect.width / 2;
        const fromY = fromRect.top - containerRect.top + fromRect.height / 2;
        const toX = toRect.left - containerRect.left + toRect.width / 2;
        const toY = toRect.top - containerRect.top + toRect.height / 2;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const dx = toX - fromX;
        const dy = toY - fromY;
        
        // Создаем кривую Безье для более плавной линии
        const path = `M ${fromX} ${fromY} C ${fromX + dx/2} ${fromY}, ${toX - dx/2} ${toY}, ${toX} ${toY}`;
        
        line.setAttribute("d", path);
        line.setAttribute("stroke", this.options.view.line_color);
        line.setAttribute("stroke-width", this.options.view.line_width);
        line.setAttribute("fill", "none");
        
        this.svgContainer.appendChild(line);
    }

    makeNodeDraggable(node) {
        let startX, startY;
        let currentTransform = { x: 0, y: 0 };
        let isDragging = false;

        const onMouseDown = (e) => {
            if (node.dataset.isroot) return;
            
            isDragging = true;
            startX = e.clientX - currentTransform.x;
            startY = e.clientY - currentTransform.y;
            
            node.style.zIndex = '1000';
            node.classList.add('dragging');
            
            // Отключаем transition на время перетаскивания
            node.style.transition = 'none';
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const x = e.clientX - startX;
            const y = e.clientY - startY;
            
            currentTransform = { x, y };
            
            // Используем transform вместо left/top для лучшей производительности
            node.style.transform = `translate(${x}px, ${y}px)`;
            
            // Используем requestAnimationFrame для оптимизации отрисовки линий
            requestAnimationFrame(() => this.drawLines());
        };

        const onMouseUp = () => {
            if (!isDragging) return;
            
            isDragging = false;
            node.classList.remove('dragging');
            node.style.zIndex = '1';
            
            // Возвращаем transition
            node.style.transition = 'all 0.3s ease';
            
            // Обновляем позицию узла в данных
            const nodeId = node.id;
            const nodeData = this.nodes.get(nodeId);
            if (nodeData) {
                nodeData.x = currentTransform.x;
                nodeData.y = currentTransform.y;
            }
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

    initDragAndDrop() {
        this.container.addEventListener('mousedown', (e) => this.handleDragStart(e));
        document.addEventListener('mousemove', (e) => this.handleDragMove(e));
        document.addEventListener('mouseup', () => this.handleDragEnd());
    }

    handleDragStart(e) {
        const node = e.target.closest('.jsmind-node');
        if (node && !node.dataset.isroot) {
            e.preventDefault();
            
            const rect = node.getBoundingClientRect();
            this.draggedNode = {
                element: node,
                startX: e.clientX - rect.left,
                startY: e.clientY - rect.top,
                initialX: rect.left,
                initialY: rect.top
            };
            
            node.style.zIndex = '1000';
            node.classList.add('dragging');
        }
    }

    handleDragMove(e) {
        if (this.draggedNode) {
            e.preventDefault();
            
            const x = e.clientX - this.draggedNode.startX;
            const y = e.clientY - this.draggedNode.startY;
            
            // Обновляем позицию узла
            this.draggedNode.element.style.left = `${x}px`;
            this.draggedNode.element.style.top = `${y}px`;
            
            // Перерисовываем линии при перемещении
            this.drawLines();
        }
    }

    handleDragEnd() {
        if (this.draggedNode) {
            const droppedNode = this.draggedNode.element;
            const targetNode = this.findClosestNode(droppedNode);
            
            if (targetNode && targetNode !== droppedNode) {
                this.moveNode(droppedNode.id, targetNode.id);
            } else {
                // Возвращаем на исходную позицию если нет целевого узла
                this.resetNodePosition(droppedNode);
            }
            
            this.draggedNode = null;
        }
    }

    findClosestNode(draggedNode) {
        const draggedRect = draggedNode.getBoundingClientRect();
        let closestNode = null;
        let minDistance = Infinity;

        this.nodes.forEach((node) => {
            if (node !== draggedNode && !node.dataset.isroot) {
                const rect = node.getBoundingClientRect();
                const distance = this.calculateDistance(
                    draggedRect.left + draggedRect.width/2,
                    draggedRect.top + draggedRect.height/2,
                    rect.left + rect.width/2,
                    rect.top + rect.height/2
                );
                
                if (distance < minDistance && distance < 100) { // 100px - максимальное расстояние для привязки
                    minDistance = distance;
                    closestNode = node;
                }
            }
        });

        return closestNode;
    }

    calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
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
        node.style.position = 'relative';
        node.style.left = 'auto';
        node.style.top = 'auto';
        node.style.zIndex = 'auto';
    }

    updateNodeRelations(nodeId, newParentId) {
        // Здесь можно обновить внутреннюю структуру данных, если необходимо
        console.log(`Node ${nodeId} moved to parent ${newParentId}`);
    }

    add_node(parentId, newNodeId, topic) {
        const parentNode = this.nodes.get(parentId);
        if (parentNode) {
            const childrenContainer = parentNode.querySelector('.children-container');
            const nodeData = {
                id: newNodeId,
                topic: topic,
                isroot: false
            };
            this.createNode(nodeData, childrenContainer);
        }
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

        // Создаем секции для разных типов стилей
        const sections = {
            'Цвет фона': ['#ffffff', '#ffcccc', '#ccffcc', '#cce5ff', '#ffeb99'],
            'Цвет текста': ['#000000', '#ff0000', '#008000', '#0000ff', '#800080'],
            'Размер текста': ['12px', '14px', '16px', '18px', '20px'],
            'Границы': ['1px solid black', '2px dashed #666', '3px solid #999', '2px dotted #333']
        };

        for (const [title, values] of Object.entries(sections)) {
            const section = document.createElement('div');
            section.innerHTML = `<div style="margin-bottom: 5px; font-weight: bold;">${title}</div>`;
            
            const optionsContainer = document.createElement('div');
            optionsContainer.style.cssText = 'display: flex; gap: 5px; margin-bottom: 10px;';

            values.forEach(value => {
                const option = document.createElement('div');
                
                if (title === 'Цвет фона' || title === 'Цвет текста') {
                    option.style.cssText = `
                        width: 20px;
                        height: 20px;
                        background-color: ${value};
                        border: 1px solid #ccc;
                        cursor: pointer;
                    `;
                    option.onclick = () => {
                        const style = title === 'Цвет фона' ? 
                            { backgroundColor: value } : 
                            { color: value };
                        this.updateNodeStyle(nodeId, style);
                        menu.remove();
                    };
                } else {
                    option.style.cssText = `
                        padding: 5px;
                        border: 1px solid #ccc;
                        cursor: pointer;
                        font-size: ${title === 'Размер текста' ? value : '12px'};
                    `;
                    option.textContent = title === 'Размер текста' ? value : '▢';
                    if (title === 'Границы') option.style.border = value;
                    
                    option.onclick = () => {
                        const style = title === 'Размер текста' ? 
                            { fontSize: value } : 
                            { border: value };
                        this.updateNodeStyle(nodeId, style);
                        menu.remove();
                    };
                }
                
                optionsContainer.appendChild(option);
            });

            section.appendChild(optionsContainer);
            menu.appendChild(section);
        }

        document.body.appendChild(menu);

        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }
}
