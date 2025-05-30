import { TOPIC_STYLES, NODE_STYLES, 
    LINE_STYLES, DEFAULT_NODE_DATA, MIND_MAP_THEMES, 
    SPACING_WIDTH, SPACING_HEIGHT, DOUBLE_CLICK_DELAY,
    BASIC_CONTAINER } from '../../../data/constants.js';

export class jsMind {
    _editableNodes = false;

    constructor(map) {
        this.settings = {
            container: map.settings.container || 'jsmind_container',
            theme: map.settings.theme || 'default',
            onNodeAddButtonActive: map.settings.onNodeAddButtonActive || (() => {}),
            onNodeAddButtonDisable: map.settings.onNodeAddButtonDisable || (() => {}),
            cascadeRemove: map.settings.cascadeRemove ?? true,
            renderMap: map.settings.renderMap,
        };

        this.container = document.getElementById(this.settings.container);
        this.data = map.data;
        this.map = map;

        this.nodes = new Map();
        this.root = null;
        this.activeNode = new Set();
        this.selectedBlockContent = null;

        this.initContainer();

        Object.defineProperty(this, 'editableNodes', {
            get: () => this._editableNodes,
            set: (value) => {
                this._editableNodes = value;
                const event = new CustomEvent('editable-mode-change', {
                    detail: { editable: value }
                });
                document.dispatchEvent(event);
            }
        });
    }

    async show(data = this.data) {
        this.clear();
        if (data) {
            this.root = await this.createNode(data);
            await this.layout();
        }
    }

    async createNode(data) {
        const nodeData = {
            id: data.id || `node_${Date.now()}`,
            topic: data.topic || this.deepCloneStyle(DEFAULT_NODE_DATA.topic),
            parent: data.parent || null,
            children: data.children || [],
            styleContainer: this.deepCloneStyle(data.styleContainer || CONTAINER_STYLES),
            styleNode: this.deepCloneStyle(data.styleNode || NODE_STYLES),
            styleTopic: this.deepCloneStyle(data.styleTopic || TOPIC_STYLES),
            styleLine: this.deepCloneStyle(data.styleLine || LINE_STYLES.DEFAULT),
            position: data.position || { x: 0, y: 0 },
            draggable: data.draggable ?? true
        };

        const node = await this.createNodeElement(nodeData);
        this.addNodeToGraph(nodeData, node);

        const position = this.getPosition(nodeData.id);
        nodeData.position = position;
        node.style.left = `${position.x}px`;
        node.style.top = `${position.y}px`;

        await this.processChildren(nodeData);
        await this.updateNodeLayout(nodeData, node);

        return nodeData.id;
    }

    addNodeToGraph(nodeData, node) {
        this.nodes.set(nodeData.id, {
            element: node,
            data: nodeData,
            parent: nodeData.parent,
            children: []
        });

        const parentNode = this.nodes.get(nodeData.parent);
        if (parentNode) {
            parentNode.children.push(nodeData.id);
        }
    }

    async processChildren(nodeData) {
        if (!nodeData.children?.length) return;
        
        const childPromises = nodeData.children.map(child => {
            child.parent = nodeData.id;
            return this.createNode(child);
        });

        const childIds = await Promise.all(childPromises);
        this.nodes.get(nodeData.id).children.push(...childIds);
    }

    async updateNodeLayout(nodeData, node) {
        await this.layout(nodeData.id);
        const position = this.getPosition(nodeData.id);
        node.style.left = `${position.x}px`;
        node.style.top = `${position.y}px`;
        this.drawLines();
    }

    async createNodeElement(data) {
        const node = this.createBasicNodeElement(data);
        const container = this.createContainerElement(data);
        const topic = await this.createTopicElement(data);

        container.appendChild(topic);
        node.appendChild(container);
        this.container.appendChild(node);

        await this.finalizeNodeCreation(node, data);
        return node;
    }

    createBasicNodeElement(data) {
        const node = document.createElement('div');
        node.style.visibility = 'hidden';
        node.id = data.id;
        node.dataset.isroot = !data.parent ? 'true' : 'false';
        node.className = 'jsmind-node';
        Object.assign(node.style, data.styleNode, {
            left: `${data.position.x}px`,
            top: `${data.position.y}px`
        });

        return node;
    }

    createContainerElement(data) {
        const container = document.createElement('div');
        container.className = 'jsmind-container';        
        Object.assign(container.style, data.styleContainer);
        return container;
    }

    async createTopicElement(data) {
        const topic = document.createElement('div');
        topic.className = 'node-topic';
        const markdownText = data.topic.text || '';
        topic.dataset.markdown = markdownText;

        topic.innerHTML = await window.electron.renderMarkdown(markdownText);
        Object.assign(topic.style, data.styleTopic, {
            color: data.topic.globalStyle.color,
            fontSize: data.topic.globalStyle.fontSize,
            fontFamily: data.topic.globalStyle.fontFamily,
        });

        return topic;
    }

    async finalizeNodeCreation(node, data) {
        await new Promise(resolve => requestAnimationFrame(resolve));

        node.style.visibility = 'visible';

        if (data.draggable) {
            this.makeNodeDraggable(node);
        }

        this.setupTopicEventListeners(node.querySelector('.node-topic'));
    }

    async layout(nodeIds = this.root) {
        const nodesToUpdate = nodeIds instanceof Set ? nodeIds : new Set([nodeIds]);
        if (nodesToUpdate.size === 0) return;

        const validNodes = Array.from(nodesToUpdate).filter(id => this.nodes.has(id));
        if (validNodes.length === 0) return;

        await new Promise(resolve => requestAnimationFrame(resolve));

        const updateNode = (currentNodeId) => {
            const currentNode = this.nodes.get(currentNodeId);
            if (!currentNode) return;

            const nodeElement = currentNode.element;
            const container = nodeElement.querySelector('.jsmind-container');
            const topic = nodeElement.querySelector('.node-topic');

            if (container) {
                Object.assign(container.style, currentNode.data.styleContainer); // Применяем все стили styleContainer
            }

            if (topic) {
                Object.assign(topic.style, currentNode.data.topic.globalStyle); // Применяем все стили globalStyle
            }

            const position = this.getPosition(currentNodeId);
            currentNode.data.position = position;
            nodeElement.style.left = `${position.x}px`;
            nodeElement.style.top = `${position.y}px`;

            currentNode.children.forEach(childId => updateNode(childId));
        };

        if (nodesToUpdate.has(this.root)) {
            const node = this.nodes.get(this.root);
            if (node) {
                const containerRect = this.container.getBoundingClientRect();
                const elementRect = node.element.getBoundingClientRect();

                const position = {
                    x: Math.floor(containerRect.width / 2 - elementRect.width / 2),
                    y: Math.floor(containerRect.height / 2 - elementRect.height / 2)
                };

                node.element.style.left = `${position.x}px`;
                node.element.style.top = `${position.y}px`;
                node.data.position = position;
            }
        }

        validNodes.forEach(nodeId => updateNode(nodeId));

        await new Promise(resolve => requestAnimationFrame(resolve));
        this.drawLines();
    }

    addChild(parentId) {
        const parentNode = this.nodes.get(parentId);
        if (!parentNode) {
            console.error('Parent node not found');
            return;
        }

        const newNodeData = {
            id: `node_${Date.now()}`,
            topic: {
                text: BASIC_CONTAINER.p.replace('"></p>', '">Новый узел</p>'),
                globalStyle: {
                    color: parentNode.data.topic.globalStyle?.color || '#000000',
                    fontSize: parentNode.data.topic.globalStyle?.fontSize || '14px',
                    fontFamily: parentNode.data.topic.globalStyle?.fontFamily || 'Arial'
                }
            },
            parent: parentId,
            children: [],
            styleContainer: this.deepCloneStyle(parentNode.data.styleContainer),
            styleNode: this.deepCloneStyle(parentNode.data.styleNode),
            styleTopic: this.deepCloneStyle(parentNode.data.styleTopic),
            styleLine: this.deepCloneStyle(parentNode.data.styleLine),
            position: { x: 0, y: 0 },
            draggable: true
        };
    
        this.createNode(newNodeData);
    }

    async removeNode(notContent = false) {
        if (!this.activeNode || this.activeNode.size === 0) return;
        const nodesToRemove = new Set(this.activeNode);
    
        for (const nodeId of nodesToRemove) {
            if (nodeId === this.root) {
                this.setActiveNode();
                continue;
            }
    
            const node = this.nodes.get(nodeId);
            if (!node) continue;
    
            if (this.settings.cascadeRemove || notContent) {
                const removeNodeRecursively = (id) => {
                    const currentNode = this.nodes.get(id);
                    if (!currentNode) return;
                    [...currentNode.children].forEach(childId => {
                        removeNodeRecursively(childId);
                    });

                    currentNode.element.remove();
                    this.nodes.delete(id);
                };
    
                removeNodeRecursively(nodeId);
            } else {
                const parentNode = this.nodes.get(node.parent);
                
                if (parentNode) {
                    parentNode.children = parentNode.children.filter(id => id !== nodeId);
                    node.children.forEach(childId => {
                        const childNode = this.nodes.get(childId);
                        if (childNode) {
                            childNode.parent = node.parent;
                            childNode.data.parent = node.parent;
                            parentNode.children.push(childId);
                        }
                    });
                }
    
                node.element.remove();
                this.nodes.delete(nodeId);
            }
        }
    
        this.activeNode.clear();
        this.settings.onNodeAddButtonDisable();
        
        await this.layout();
        this.drawLines();
    }

    makeNodeDraggable(node) {
        let startX, startY;
        let isDragging = false;
        let initialLeft, initialTop;

        const onMouseDown = (e) => {
            if (node.dataset.isroot === 'true') return;
            if (this.nodes.get(node.id).data.draggable === false) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = parseInt(node.style.left) || 0;
            initialTop = parseInt(node.style.top) || 0;

            this.setActiveNode(new Set([node.id]));
            this.settings.onNodeAddButtonActive(node.id);
            
            e.preventDefault();
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            node.style.left = `${initialLeft + dx}px`;
            node.style.top = `${initialTop + dy}px`;
            
            this.settings.onNodeAddButtonDisable();
            this.drawLines();
        };

        const onMouseUp = () => {
            if (!isDragging) return;
            
            isDragging = false;
            
            const nodeData = this.nodes.get(node.id);
            if (nodeData) {
                nodeData.data.position = {
                    x: parseInt(node.style.left),
                    y: parseInt(node.style.top)
                };
            }

            const nearestNode = this.findNearestNode(node);
            if (nearestNode && nearestNode.element.id !== node.id) {
                this.changeParent(node.id, nearestNode.element.id);
            }

            this.drawLines();
            this.settings.onNodeAddButtonActive(node.id);
        };

        node.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    changeParent(nodeId, newParentId) {
        const node = this.nodes.get(nodeId);
        const oldParent = this.nodes.get(node.parent);
        const newParent = this.nodes.get(newParentId);

        if (!node || !oldParent || !newParent) return;

        if (this.isDescendant(nodeId, newParentId)) {
            console.warn('Нельзя присоединить узел к своему потомку');
            return;
        }

        oldParent.children = oldParent.children.filter(id => id !== nodeId);
        node.parent = newParentId;
        newParent.children.push(nodeId);
        node.data.parent = newParentId;

        const currentPosition = {
            x: parseInt(node.element.style.left),
            y: parseInt(node.element.style.top)
        };
        node.data.position = currentPosition;
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

        const lineStyle = from.data.styleLine || this.deepCloneStyle(LINE_STYLES.DEFAULT);
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
                const dx = toX - fromX;
                path = `M ${fromX} ${fromY} C ${fromX + dx / 2} ${fromY}, ${toX - dx / 2} ${toY}, ${toX} ${toY}`;
                break;
    
            case 'dashed':
            case 'dotted':
                path = `M ${fromX} ${fromY} L ${toX} ${toY}`;
                break;
    
            default:
                console.warn('Неизвестный тип линии:', lineStyle.type);
                return;
        }

        line.setAttribute("d", path);
        Object.entries(lineStyle.style).forEach(([attr, value]) => {
            const svgAttr = attr.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
            line.setAttribute(svgAttr, value);
        });

        this.svgContainer.appendChild(line);
    }

    setupTopicEventListeners(topic) {
        let isEditMode = false;
        let draggedBlock = null;
        let editingBlock = null;
        let clickTimer = null;
        let clickCount = 0;

        const exitBlockEditing = () => {
            if (!editingBlock) return;
            
            editingBlock.contentEditable = 'false';
            editingBlock.draggable = true;
            editingBlock = null;

            const node = topic.closest('.jsmind-node');
            if (node) {
                this.saveNodeContent(node.id, topic);
            }
        };

        const exitEditMode = () => {
            const contentMenuClicked = event?.target?.closest('.content-menu');
            if (contentMenuClicked) return;

            isEditMode = false;
            editingBlock = null;
            this.editableNodes = false;
            const node = topic.closest('.jsmind-node');
            if (!node) return;

            const nodeData = this.nodes.get(node.id);
            if (nodeData && node.dataset.isroot !== 'true') {
                nodeData.data.draggable = true;
            }

            topic.querySelectorAll('[data-editable]').forEach(block => {
                if (!block.textContent.trim() && block.tagName !== 'IMG') {
                    block.remove();
                    return;
                }
                if (block.tagName === 'UL' || block.tagName === 'OL') {
                    const children = Array.from(block.childNodes);
                    children.forEach(child => {
                        if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'LI') {
                            if (child.tagName !== 'IMG') {
                                const li = document.createElement('li');
                                li.textContent = child.textContent;
                                li.setAttribute('data-editable', 'true');
                                li.contentEditable = 'false';
                                li.draggable = false;
                                li.style.cssText = child.style.cssText;
                                if (child.classList.contains('parent-style')) {
                                    li.classList.add('parent-style');
                                }
                                block.replaceChild(li, child);
                            } else {    
                                const parent = block.parentNode;
                                const next = block.nextSibling;
                                block.removeChild(child);
                                if (parent) {
                                    if (next) {
                                        parent.insertBefore(child, next);
                                    } else {
                                        parent.appendChild(child);
                                    }
                                }
                            }
                        }
                    });
                }
                if (block.tagName === 'LI' && (!block.parentElement || (block.parentElement.tagName !== 'UL' && block.parentElement.tagName !== 'OL'))) {
                    const p = document.createElement('p');
                    p.textContent = block.textContent;
                    p.setAttribute('data-editable', 'true');
                    p.contentEditable = 'false';
                    p.draggable = false;
                    p.style.cssText = block.style.cssText;
                    if (block.classList.contains('parent-style')) {
                        p.classList.add('parent-style');
                    }

                    const parent = block.parentNode;
                    parent.replaceChild(p, block);
                }
            });

            topic.querySelectorAll('[data-editable]').forEach(block => {
                block.contentEditable = 'false';
                block.draggable = false;
                block.removeAttribute('data-editable');
            });

            node.classList.remove('editing-mode');
            this.saveNodeContent(node.id, topic);
        };

        const handleBlockClick = (block) => {
            clickCount++;
            
            if (clickCount === 1) {
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                    clickTimer = null;
                }, DOUBLE_CLICK_DELAY);
            } else if (clickCount === 2) {
                clearTimeout(clickTimer);
                clickCount = 0;
                clickTimer = null;

                const nonEditableTags = ['UL', 'OL', 'IMG'];
                if (nonEditableTags.includes(block.tagName)) {
                    return;
                }

                if (editingBlock === block) {
                    block.contentEditable = 'false';
                    block.draggable = true;
                    editingBlock = null;
                } else {
                    if (editingBlock) {
                        editingBlock.contentEditable = 'false';
                        editingBlock.draggable = true;
                    }
                    block.contentEditable = 'true';
                    block.draggable = false;
                    block.focus();
                    editingBlock = block;
                }
            }
        };

        topic.addEventListener('dblclick', (e) => {
            const node = topic.closest('.jsmind-node');
            if (!node || !this.activeNode.has(node.id) || this.activeNode.size !== 1) return;
            
            this.editableNodes = true;

            if (!isEditMode) {
                isEditMode = true;
                node.classList.add('editing-mode');

                const nodeData = this.nodes.get(node.id);
                if (nodeData) {
                    nodeData.data.draggable = false;
                }

                topic.querySelectorAll('h1, h2, h3, p, ul, ol, li, img').forEach(block => {
                    if (
                        block.tagName === 'IMG' || 
                        block.textContent.trim()
                    ) {
                        block.setAttribute('data-editable', 'true');
                        block.draggable = true;
                    }
                });
            }
        });

        topic.addEventListener('click', (e) => {
            const block = e.target.closest('[data-editable="true"]');
            if (!block) return;

            e.stopPropagation();

            if (editingBlock === block) return;
            if (this.selectedBlockContent) {
                this.selectedBlockContent.classList.remove('selected');
            }

            block.classList.add('selected');
            this.selectedBlockContent = block;

            if (isEditMode) {
                const event = new CustomEvent('block-selected', {
                    detail: {
                        block,
                        isImage: block.tagName === 'IMG'
                    }
                });
                document.dispatchEvent(event);
                
                handleBlockClick(block);
            }
        });

        topic.addEventListener('dragstart', (e) => {
            if (!isEditMode) {
                e.preventDefault();
                return;
            }
            const block = e.target.closest('[data-editable="true"]');
            if (!block || block === editingBlock) {
                e.preventDefault();
                return;
            }
            draggedBlock = block;
            draggedBlock.classList.add('dragging');
            e.dataTransfer.setData('text/plain', '');
        });

        topic.addEventListener('dragover', (e) => {
            if (!isEditMode || !draggedBlock) return;
            e.preventDefault();

            const block = e.target.closest('.image-wrapper') || e.target.closest('[data-editable="true"]'); // Проверяем контейнер
            if (!block) {
                const topicElement = e.target.closest('.node-topic');
                if (topicElement) {
                    topicElement.appendChild(draggedBlock);
                }
                return;
            }

            if (block === draggedBlock) return;

            const rect = block.getBoundingClientRect();
            const insertBefore = e.clientY < rect.top + rect.height / 2;

            if (insertBefore) {
                block.parentNode.insertBefore(draggedBlock, block);
            } else {
                block.parentNode.insertBefore(draggedBlock, block.nextSibling);
            }
        });

        topic.addEventListener('dragend', () => {
            if (draggedBlock) {
                draggedBlock.classList.remove('dragging');
                draggedBlock = null;
            }
        });

        document.addEventListener('mousedown', (e) => {
            const isContentMenuClick = e.target.closest('.content-menu');
            const isNodeOrBlockClick = topic.contains(e.target) || e.target.closest('.jsmind-node');
            
            if (isEditMode && !isContentMenuClick && !isNodeOrBlockClick) {
                exitEditMode();
            }
        });

        const handleKeyDown = (e) => {
            if (!isEditMode) return;

            if (e.key === 'Enter') {
                e.preventDefault();

                if (e.shiftKey) {
                    if (editingBlock) {
                        editingBlock.contentEditable = 'false';
                        editingBlock.draggable = true;

                        const newBlock = document.createElement(editingBlock.tagName);
                        newBlock.setAttribute('data-editable', 'true');
                        newBlock.contentEditable = 'true';
                        newBlock.draggable = false;
                        newBlock.style.cssText = editingBlock.style.cssText;

                        editingBlock.parentNode.insertBefore(newBlock, editingBlock.nextSibling);

                        newBlock.focus();
                        editingBlock = newBlock;

                        const node = topic.closest('.jsmind-node');
                        if (node) {
                            this.saveNodeContent(node.id, topic);
                        }
                    }
                    return;
                }

                if (editingBlock && editingBlock.contentEditable === 'true') {
                    exitBlockEditing();
                } 
                else {
                    exitEditMode();
                }
            }

            if (e.key === 'Delete' || e.key === 'Del') {
                e.preventDefault();

                const node = topic.closest('.jsmind-node');
                if (!node) return;

                if (this.selectedBlockContent && node.dataset.isroot === 'true') {
                    this.selectedBlockContent.remove();
                    this.selectedBlockContent = null;
                    if (topic.querySelectorAll('[data-editable]').length === 0) {
                        const h1 = document.createElement('H1');
                        h1.textContent = 'Главный узел';
                        h1.setAttribute('data-editable', 'true');
                        h1.draggable = true;
                        topic.innerHTML = '';
                        topic.appendChild(h1);
                        this.selectedBlockContent = h1;
                    }                    
                    this.saveNodeContent(node.id, topic);
                    return;
                }

                if (this.selectedBlockContent) {
                    this.selectedBlockContent.remove();
                    this.selectedBlockContent = null;

                    if (topic.querySelectorAll('[data-editable]').length === 0) {
                        const p = document.createElement('div');
                        p.innerHTML = BASIC_CONTAINER.p.replace('"></p>', '>Новый узел</p>');
                        p.firstChild.setAttribute('data-editable', 'true');
                        p.firstChild.draggable = true;
                        topic.appendChild(p.firstChild);
                    }
                    this.saveNodeContent(node.id, topic);
                }
            }


            if ((e.key === 'Escape' || e.key === 'Esc') && isEditMode) {
                e.preventDefault();
                if (editingBlock) {
                    exitBlockEditing();
                } else {
                    exitEditMode();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
    }

    clearActiveNodes() {
        Array.from(this.activeNode).forEach(nodeId => {
            const node = this.nodes.get(nodeId);
            if (node?.element) {
                node.element.style.zIndex = '1';
                node.element.style.border = 'none';
            }
        });
        this.activeNode.clear();
        this.drawLines();
        this.setActiveNodeCallback?.(false);
    }

    addActiveNode(nodeId) {
        if (!nodeId || !this.nodes.has(nodeId)) return;

        const theme = MIND_MAP_THEMES[this.settings.theme];
        const node = this.nodes.get(nodeId);
        
        node.element.style.zIndex = '1000';
        if (theme?.selectBorderColorNode) {
            node.element.style.border = theme.selectBorderColorNode;
        }
        this.activeNode.add(nodeId);

        this.drawLines();
        this.setActiveNodeCallback?.(true);
        }

    removeActiveNode(nodeId) {
        if (!nodeId || !this.nodes.has(nodeId)) return;

        const node = this.nodes.get(nodeId);
        if (node?.element) {
            node.element.style.zIndex = '1';
            node.element.style.border = 'none';
        }
        
        this.activeNode.delete(nodeId);
        this.drawLines();
        this.setActiveNodeCallback?.(this.activeNode.size > 0);
        console.log('RemoveActiveNode - current active:', this.activeNode);
    }

    setActiveNode(nodeIds = []) {
        this.clearActiveNodes();
        
        if (!nodeIds || nodeIds.length === 0) return;

        if (Array.isArray(nodeIds)) {
            nodeIds.forEach(id => this.addActiveNode(id));
        } else if (nodeIds instanceof Set) {
            nodeIds.forEach(id => this.addActiveNode(id));
        } else {
            this.addActiveNode(nodeIds);
        }
    }

    findNearestNode(draggingNode) {
        const draggingRect = draggingNode.getBoundingClientRect();
        const threshold = Math.min(draggingRect.width, draggingRect.height) / 2;
        let nearest = null;
        let minDistance = Infinity;

        this.nodes.forEach((node) => {
            if (node.element === draggingNode) return;

            const rect = node.element.getBoundingClientRect();
            const distance = Math.sqrt(
                Math.pow((draggingRect.left + draggingRect.width / 2) - (rect.left + rect.width / 2), 2) +
                Math.pow((draggingRect.top + draggingRect.height / 2) - (rect.top + rect.height / 2), 2)
            );

            if (distance < threshold && distance < minDistance) {
                minDistance = distance;
                nearest = node;
            }
        });

        return nearest;
    }

    isDescendant(nodeId, potentialParentId) {
        let currentId = potentialParentId;
        while (currentId) {
            if (currentId === nodeId) return true;
            const current = this.nodes.get(currentId);
            if (!current) break;
            currentId = current.parent;
        }
        return false;
    }

    deepCloneStyle(style) {
        return JSON.parse(JSON.stringify(style));
    }

    getPosition(nodeId) {        
        const node = this.nodes.get(nodeId);
        if (!node) return { x: 0, y: 0 };
        if (node.data.position.x !== 0 && node.data.position.y !== 0) return node.data.position;
    
        const parentNode = this.nodes.get(node.parent);
        if (!parentNode) {
            return node.data.position;
        }
    
        const parentRect = parentNode.element.getBoundingClientRect();
        const nodeRect = node.element.getBoundingClientRect();
        const parentX = parentNode.data.position.x;
        const parentY = parentNode.data.position.y;
    
        let x, y;
        const isRight = parentNode.parent === null 
            ? (parentNode.children.length % 2 !== 0) 
            : (parentX > (this.nodes.get(parentNode.parent)?.data.position.x || -Infinity));
    
        x = isRight 
            ? parentX + parentRect.width + SPACING_WIDTH 
            : parentX - nodeRect.width - SPACING_WIDTH;
    
        y = parentY;
    
        y = this.adjustYForCollisions(node, x, y, nodeRect);
    
        node.data.position = { x, y };
    
        return { x, y };
    }
    
    adjustYForCollisions(node, x, y, nodeRect) {
        let adjustedY = y;
        const tolerance = 5;
        const parentNode = this.nodes.get(node.data.parent);
        const parentX = parentNode.data.position.x;
        const isRight = x > parentX;

        const checkCollision = (testY) => {
            for (const [otherId, otherNode] of this.nodes) {
                if (otherId === node.data.id) continue;

                const otherRect = otherNode.element.getBoundingClientRect();
                const otherX = otherNode.data.position.x;
                const otherY = otherNode.data.position.y;

                if (
                    Math.abs(x - otherX) < (nodeRect.width + otherRect.width) / 2 + tolerance &&
                    Math.abs(testY - otherY) < (nodeRect.height + otherRect.height) / 2 + tolerance
                ) {
                    return true;
                }
            }
            return false;
        };

        if (!checkCollision(adjustedY)) {
            return adjustedY;
        }

        let offset = SPACING_HEIGHT;
        let direction = 1;
        while (true) {
            const testY = y + offset * direction;
            if (!checkCollision(testY)) {
                return testY;
            }

            if (direction === 1) {
                direction = -1;
            } else {
                direction = 1;
                offset += SPACING_HEIGHT;
            }
        }
    }
    
    getHeight(children = []) {
        if (children.length === 0) return 0;
    
        let height = 0;
        children.forEach((childId) => {
            const childNode = this.nodes.get(childId);
            if (childNode) {
                height += childNode.element.getBoundingClientRect().height + SPACING_HEIGHT;
            }
        });
        return height;
    }

    clear() {
        this.container.innerHTML = '';
        this.nodes.clear();
        this.root = null;
        this.initContainer();
    }

    initContainer() {
        this.container.innerHTML = '';
        this.svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svgContainer.style.position = 'absolute';
        this.svgContainer.style.width = '100%';
        this.svgContainer.style.height = '100%';
        this.svgContainer.style.left = '0';
        this.svgContainer.style.top = '0';
        this.svgContainer.style.pointerEvents = 'none';
        this.container.appendChild(this.svgContainer);
        this.container.style.overflow = 'visible';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        if (this.settings.theme) this.container.style.backgroundColor = MIND_MAP_THEMES[this.settings.theme].canvas.backgroundColor;
    }

    saveNodeContent(nodeId, topic) {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        const content = topic.innerHTML;
        node.data.topic.text = content;
        topic.dataset.markdown = content;

        this.layout(node.id);
    }
}