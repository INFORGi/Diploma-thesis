import { DEFAULT_NODE_STYLE } from '../../../data/constants.js';

export class jsMind {
    constructor(options) {
        console.log('Initializing jsMind with options:', options);
        this.options = options;
        this.container = document.getElementById(options.container);
        console.log('Container found:', this.container);
        this.nodes = new Map();
        this.lines = new Map();
        this.root = null;
        this.initContainer();
    }

    initContainer() {
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.minHeight = '400px';
        
        this.svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svgContainer.style.position = 'absolute';
        this.svgContainer.style.width = '100%';
        this.svgContainer.style.height = '100%';
        this.svgContainer.style.pointerEvents = 'none';
        this.svgContainer.style.zIndex = '1';
        this.container.appendChild(this.svgContainer);

        
        setTimeout(() => {
            this.layout();
            this.drawLines();
        }, 100);
    }

    show(mind) {
        console.log('Showing mind map:', mind);
        this.clear();
        if (mind.format === 'node_tree') {
            this.root = this.createNode(mind.data, null);
            console.log('Root node created:', this.root);
            this.layout();
        }
    }

    createNode(data, parent) {
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
            console.log('Double click on topic'); 
            
            
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
            console.log('Blur event on topic'); 
            
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
        Object.assign(node.style, DEFAULT_NODE_STYLE);
        
        
        if (data.style) {
            Object.assign(node.style, data.style);
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

        node.nodeData = {
            nodeStyle: data.nodeStyle || {},
            topicStyle: data.topicStyle || {},
            ...data
        };

        if (node.nodeData.nodeStyle) {
            Object.assign(node.style, node.nodeData.nodeStyle);
        }
        
        if (node.nodeData.topicStyle) {
            const topic = node.querySelector('.node-topic');
            if (topic) {
                Object.assign(topic.style, node.nodeData.topicStyle);
            }
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
        return data.id;
    }

    layout() {
        if (!this.root) return;
        
        const rootNode = this.nodes.get(this.root);
        if (!rootNode) return;

        
        this.nodes.forEach((node, nodeId) => {
            const element = node.element;
            if (!element.style.left || !element.style.top) {
                if (nodeId === this.root) {
                    
                    const containerRect = this.container.getBoundingClientRect();
                    const rootX = containerRect.width / 2 - element.offsetWidth / 2;
                    const rootY = containerRect.height / 2 - element.offsetHeight / 2;
                    
                    element.style.left = `${rootX}px`;
                    element.style.top = `${rootY}px`;
                }
            }
        });

        
        this.layoutNewChildren(this.root);
        this.drawLines();
    }

    layoutNewChildren(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node || !node.children.length) return;

        const { hspace, vspace } = this.options.layout;
        const nodeWidth = 150;
        const nodeHeight = 40;
        const direction = node.data.direction || 'right';
        
        
        const newChildren = node.children.filter(childId => {
            const childNode = this.nodes.get(childId);
            return childNode && !childNode.element.style.transform;
        });

        if (newChildren.length > 0) {
            const parentElement = node.element;
            const parentRect = parentElement.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            
            
            const parentX = parseInt(parentElement.style.left) || 0;
            const parentY = parseInt(parentElement.style.top) || 0;

            newChildren.forEach((childId, index) => {
                const child = this.nodes.get(childId);
                if (!child) return;

                const childElement = child.element;
                const xOffset = direction === 'left' ? -hspace : hspace;
                
                
                const x = parentX + xOffset;
                const y = parentY + (index * (nodeHeight + vspace)) - 
                         ((newChildren.length - 1) * (nodeHeight + vspace) / 2);

                
                childElement.style.left = `${x}px`;
                childElement.style.top = `${y}px`;
                childElement.style.transform = 'translate(0, 0)';

                
                this.layoutNewChildren(childId);
            });
        }
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

        
        let connectionType = to.data.connectionType;
        if (connectionType === 'inherit') {
            connectionType = from.data.connectionType || 'straight';
        }

        const fromElement = from.element;
        const toElement = to.element;
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();

        const fromX = fromRect.left - containerRect.left + fromRect.width / 2;
        const fromY = fromRect.top - containerRect.top + fromRect.height / 2;
        const toX = toRect.left - containerRect.left + toRect.width / 2;
        const toY = toRect.top - containerRect.top + toRect.height / 2;

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

            this.nodes.forEach(nodeData => {
                if (nodeData.element) {
                    nodeData.element.classList.remove('potential-parent');
                }
            });
            
            requestAnimationFrame(() => this.drawLines());
        };

        const onMouseUp = (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            node.classList.remove('dragging');
            node.style.zIndex = '1';

            this.nodes.forEach(nodeData => {
                if (nodeData.element) {
                    nodeData.element.classList.remove('potential-parent');
                }
            });

            const newParent = this.findClosestNode(node);
            if (newParent && newParent !== node) {
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
                
                currentNode.data.direction = newParentNode.data.direction;
                node.dataset.direction = newParentNode.data.direction;
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
            
            
            this.draggedNode.element.style.left = `${x}px`;
            this.draggedNode.element.style.top = `${y}px`;
            
            
            this.drawLines();
        }
    }

    handleDragEnd() {
        if (this.draggedNode) {
            const droppedNode = this.draggedNode.element;
            const targetNode = this.findClosestNode(droppedNode);
            
            if (targetNode && targetNode !== droppedNode) {
                const nodeId = droppedNode.id;
                const targetId = targetNode.id;
                
                
                const node = this.nodes.get(nodeId);
                const oldParent = this.nodes.get(node.parent);
                const newParent = this.nodes.get(targetId);

                if (oldParent) {
                    oldParent.children = oldParent.children.filter(id => id !== nodeId);
                }

                node.parent = targetId;
                newParent.children.push(nodeId);

                
                node.data.direction = newParent.data.direction;
                droppedNode.dataset.direction = newParent.data.direction;
            }
            
            
            droppedNode.style.zIndex = 'auto';
            droppedNode.classList.remove('dragging');
            
            this.draggedNode = null;
            this.layout();
        }
    }

    findClosestNode(draggedNode) {
        const draggedRect = draggedNode.getBoundingClientRect();
        const draggedCenterX = draggedRect.left + draggedRect.width / 2;
        const draggedCenterY = draggedRect.top + draggedRect.height / 2;
        let newParent = null;

        this.nodes.forEach((nodeData) => {
            if (nodeData && nodeData.element && nodeData.element !== draggedNode) {
                const element = nodeData.element;
                if (element.dataset.isroot !== 'true') {
                    const rect = element.getBoundingClientRect();
                    if (draggedCenterX >= rect.left && 
                        draggedCenterX <= rect.right && 
                        draggedCenterY >= rect.top && 
                        draggedCenterY <= rect.bottom) {
                        newParent = element;
                    }
                }
            }
        });

        return newParent;
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
        node.style.zIndex = 'auto';
        node.classList.remove('dragging');
    }

    add_node(parentId, topic = 'Текст') {
        const parent = this.nodes.get(parentId);
        if (!parent) return null;

        const parentData = parent.data;
        const parentElement = parent.element;

        const newNodeId = 'node_' + Date.now();
        const newNodeData = {
            id: newNodeId,
            topic: topic,
            direction: parentData.direction || 'right',
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
            this.add_node(nodeId);
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
}
