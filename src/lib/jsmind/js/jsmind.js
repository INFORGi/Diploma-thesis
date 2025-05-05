import { FIGURE, TOPIC_STYLES, NODE_STYLES, 
    LINE_STYLES, DEFAULT_NODE_DATA, MIND_MAP_THEMES, 
    SPACING_WIDTH, SPACING_HEIGHT, PADDING_WITH_NODE,
    DOUBLE_CLICK_DELAY } from '../../../data/constants.js';

    
export class jsMind {
    constructor(map) {
        this.settings = {
            container: map.settings.container || 'jsmind_container',
            theme: map.settings.theme || 'default',
            onNodeAddButtonActive: map.settings.onNodeAddButtonActive || (() => {}),
            onNodeAddButtonDisable: map.settings.onNodeAddButtonDisable || (() => {}),
            onContextMenu: map.settings.onContextMenu || (() => {}), // Добавляем новый обработчик
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
            styleNode: data.styleNode ? this.deepCloneStyle(data.styleNode) : this.deepCloneStyle(NODE_STYLES),
            styleTopic: data.styleTopic ? this.deepCloneStyle(data.styleTopic) : this.deepCloneStyle(TOPIC_STYLES),
            styleLine: data.styleLine ? this.deepCloneStyle(data.styleLine) : this.deepCloneStyle(LINE_STYLES.DEFAULT),
            figure: data.figure ? this.deepCloneStyle(data.figure) : this.deepCloneStyle(FIGURE.RECTANGLE),
            position: { x: data.position?.x || 0, y: data.position?.y || 0 },
            draggable: data.draggable !== undefined ? data.draggable : true
        };
    
        const node = await this.createNodeElement(nodeData);
    
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
    
        if (nodeData.children && Array.isArray(nodeData.children)) {
            for (const child of nodeData.children) {
                child.parent = nodeData.id;
                const childId = await this.createNode(child);
                this.nodes.get(nodeData.id).children.push(childId);
            }
        }
    
        // Обновляем размеры и отрисовываем узел
        await this.layout(this.root, new Set([nodeData.id]));
    
        // Устанавливаем позицию после layout
        const position = this.getPosition(nodeData.id);
        node.style.left = `${position.x}px`;
        node.style.top = `${position.y}px`;
    
        this.drawLines();
    
        return nodeData.id;
    }

    async createNodeElement(data) {
        const node = document.createElement('div');
        node.id = data.id;
        node.dataset.isroot = !data.parent ? 'true' : 'false';
        node.className = 'jsmind-node';
        Object.assign(node.style, JSON.parse(JSON.stringify(NODE_STYLES)));
    
        const containerWithTextShape = document.createElement('div');
        containerWithTextShape.className = 'jsmind-node-content';
    
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        containerWithTextShape.appendChild(canvas);
    
        const topic = document.createElement('div');
        topic.className = 'node-topic';
        const markdownText = data.topic.text || '';
        topic.dataset.markdown = markdownText;
    
        containerWithTextShape.appendChild(topic);
        node.appendChild(containerWithTextShape);
        node.style.visibility = 'hidden';
        this.container.appendChild(node);
    
        topic.innerHTML = await window.electron.renderMarkdown(markdownText);
        Object.assign(topic.style, data.styleTopic, {
            color: data.topic.color,
            fontSize: data.topic.fontSize,
            fontFamily: data.topic.fontFamily,
            position: 'relative',
            zIndex: '2'
        });
    
        // Дождаться обновления DOM
        await new Promise(resolve => requestAnimationFrame(resolve));
    
        node.style.visibility = 'visible';
    
        if (data.draggable) {
            this.makeNodeDraggable(node);
        }

        this.setupTopicEventListeners(topic);
    
        return node;
    }

    async layout(nodeId = this.root, updatedNodes = new Set()) {
        if (!nodeId) return;
    
        const node = this.nodes.get(nodeId);
        if (!node) return;
    
        await new Promise(resolve => requestAnimationFrame(resolve));
    
        const updateNode = (currentNodeId) => {
            const currentNode = this.nodes.get(currentNodeId);
            if (!currentNode) return;

            const nodeElement = currentNode.element;
            const topic = nodeElement.querySelector('.node-topic');
            const containerContent = nodeElement.querySelector('.jsmind-node-content');
            const canvas = nodeElement.querySelector('canvas');

            if ((updatedNodes.size === 0 || updatedNodes.has(currentNodeId)) && topic && topic.innerHTML) {
                const contentRect = topic.getBoundingClientRect();
                if (contentRect.width > 0 && contentRect.height > 0) {
                    const { width, height, maxWidth, maxHeight } = this.calculateNodeDimensions(currentNode.data.figure, currentNode.data, contentRect);

                    console.log(width, height, maxWidth, maxHeight);
                    
                    containerContent.style.width = `${width}px`;
                    containerContent.style.height = `${height}px`;
                    topic.style.width = maxWidth;
                    topic.style.height = maxHeight;

                    this.drawNodeFigure(canvas, containerContent, currentNode.data.figure);
                }
            }

            nodeElement.style.left = `${currentNode.data.position.x}px`;
            nodeElement.style.top = `${currentNode.data.position.y}px`;

            currentNode.children.forEach(childId => {
                updateNode(childId);
            });
        };
    
        updateNode(nodeId);

        if (nodeId === this.root) {
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
            topic: this.deepCloneStyle(DEFAULT_NODE_DATA.topic),
            parent: parentId,
            children: [],
            figure: this.deepCloneStyle(parentNode.data.figure),
            styleNode: this.deepCloneStyle(parentNode.data.styleNode),
            styleTopic: this.deepCloneStyle(parentNode.data.styleTopic),
            styleLine: this.deepCloneStyle(parentNode.data.styleLine),
            position: { x: 0, y: 0 },
            draggable: true
        };
    
        this.createNode(newNodeData);
    }

    async removeNode() {
        if (!this.activeNode || this.activeNode.size === 0) return;
        const nodesToRemove = new Set(this.activeNode);
    
        for (const nodeId of nodesToRemove) {
            if (nodeId === this.root) {
                this.setActiveNode();
                continue;
            }
    
            const node = this.nodes.get(nodeId);
            if (!node) continue;
    
            if (this.settings.cascadeRemove) {
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

    drawPath(ctx, points, width, height, rx = 0) {
        ctx.beginPath();
    
        const getPointCoords = (point) => {
            let x, y;
            if (point.fixedOffset !== undefined) {
                if (point.x <= 0.5) {
                    x = point.fixedOffset;
                } else {
                    x = width - point.fixedOffset;
                }
                if (point.y <= 0.5) {
                    y = point.y * height;
                } else {
                    y = height - point.fixedOffset;
                }
            } else {
                x = point.x * width;
                y = point.y * height;
            }
            return { x, y };
        };
    
        const radius = parseFloat(rx) || 0;
        const pointsCount = points.length;
    
        if (pointsCount < 2) return;
    
        const coords = points.map(point => getPointCoords(point));
    
        if (radius > 0) {
            const startIndex = 0;
            const current = coords[startIndex];
            const nextIndex = (startIndex + 1) % pointsCount;
            const prevIndex = (startIndex - 1 + pointsCount) % pointsCount;
            const next = coords[nextIndex];
            const prev = coords[prevIndex];
    
            const dx1 = current.x - prev.x;
            const dy1 = current.y - prev.y;
            const dx2 = next.x - current.x;
            const dy2 = next.y - current.y;
    
            const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    
            const safeRadius = Math.min(radius, len1 / 2, len2 / 2);
    
            if (safeRadius > 0) {
                const t1 = safeRadius / len1;
                const x1 = current.x - dx1 * t1;
                const y1 = current.y - dy1 * t1;
                ctx.moveTo(x1, y1);
            } else {
                ctx.moveTo(current.x, current.y);
            }
        } else {
            ctx.moveTo(coords[0].x, coords[0].y);
        }
    
        points.forEach((point, index) => {
            const current = coords[index];
            const nextIndex = (index + 1) % pointsCount;
            const prevIndex = (index - 1 + pointsCount) % pointsCount;
            const next = coords[nextIndex];
            const prev = coords[prevIndex];
    
            if (radius > 0) {
                const dx1 = current.x - prev.x;
                const dy1 = current.y - prev.y;
                const dx2 = next.x - current.x;
                const dy2 = next.y - current.y;
    
                const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
                const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    
                const safeRadius = Math.min(radius, len1 / 2, len2 / 2);
    
                if (safeRadius > 0) {
                    const t1 = safeRadius / len1;
                    const x1 = current.x - dx1 * t1;
                    const y1 = current.y - dy1 * t1;
    
                    const t2 = safeRadius / len2;
                    const x2 = current.x + dx2 * t2;
                    const y2 = current.y + dy2 * t2;
    
                    ctx.lineTo(x1, y1);
                    ctx.quadraticCurveTo(current.x, current.y, x2, y2);
                } else {
                    ctx.lineTo(current.x, current.y);
                }
            } else {
                ctx.lineTo(current.x, current.y);
            }
        });
    
        ctx.closePath();
    }

    setupTopicEventListeners(topic) {
        let isEditMode = false;
        let draggedBlock = null;
        let editingBlock = null;
        let clickTimer = null;
        let clickCount = 0;

        const exitEditMode = () => {
            isEditMode = false;
            editingBlock = null;
            const node = topic.closest('.jsmind-node');
            if (!node) return;

            // Restore node dragging
            const nodeData = this.nodes.get(node.id);
            if (nodeData && node.dataset.isroot !== 'true') {
                nodeData.data.draggable = true;
            }

            // Cleanup editable blocks
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

            if (!isEditMode) {
                isEditMode = true;
                node.classList.add('editing-mode');

                const nodeData = this.nodes.get(node.id);
                if (nodeData) {
                    nodeData.data.draggable = false;
                }

                // Make blocks editable while preserving their original markup
                topic.querySelectorAll('h1, h2, h3, p, ul, ol, li').forEach(block => {
                    if (block.textContent.trim()) {
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

            const block = e.target.closest('[data-editable="true"]');
            if (!block || block === draggedBlock) return;

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
            if (isEditMode && !topic.contains(e.target)) {
                exitEditMode();
            }
        });

        topic.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isEditMode) {
                e.preventDefault();
                exitEditMode();
            } else if (e.key === 'Enter') {
                if (!e.shiftKey) {
                    e.preventDefault();
                    exitEditMode();
                } else if (isEditMode && editingBlock) {
                    e.preventDefault();
                    const selection = window.getSelection();
                    const range = selection.getRangeAt(0);
                    
                    // Get text content before and after cursor
                    const content = editingBlock.textContent;
                    const cursorPosition = range.startOffset;
                    const textBefore = content.substring(0, cursorPosition);
                    const textAfter = content.substring(cursorPosition);
                    
                    // Update current block with text before cursor
                    editingBlock.textContent = textBefore;
                    
                    // Create new block of the same type
                    const newBlock = document.createElement(editingBlock.tagName);
                    newBlock.setAttribute('data-editable', 'true');
                    newBlock.draggable = false;
                    newBlock.contentEditable = 'true';
                    newBlock.textContent = textAfter;
                    
                    // Insert new block after current block
                    if (editingBlock.nextSibling) {
                        editingBlock.parentNode.insertBefore(newBlock, editingBlock.nextSibling);
                    } else {
                        editingBlock.parentNode.appendChild(newBlock);
                    }
                    
                    // Focus new block and set cursor to start
                    newBlock.focus();
                    const newRange = document.createRange();
                    newRange.setStart(newBlock.firstChild || newBlock, 0);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    
                    editingBlock = newBlock;
                }
            }
        });

        document.addEventListener('mousedown', (e) => {
            if (isEditMode && !topic.contains(e.target)) {
                exitEditMode();
            }
        });

        // Add keydown listener for delete functionality
        window.addEventListener('keydown', async (e) => {
            if ((e.key === 'Delete' || e.key === 'Del') && this.selectedBlockContent) {
                e.preventDefault();
                const node = topic.closest('.jsmind-node');
                if (!node) return;

                // Remove the block from the DOM
                this.selectedBlockContent.remove();

                // Clear selection
                this.selectedBlockContent = null;

                // Save updated content
                this.saveNodeContent(node.id, topic);
            }
        });
    }

    setActiveNode(nodeIds) {
        this.activeNode.forEach(nodeId => {
            const activeNode = this.nodes.get(nodeId)?.element;
            if (activeNode) {
                activeNode.style.zIndex = '1';
                activeNode.style.border = 'none';
            }
        });
        this.activeNode.clear();
    
        if (!nodeIds || nodeIds.size === 0) {
            this.drawLines();
            return;
        }
    
        const theme = MIND_MAP_THEMES[this.settings.theme];
    
        nodeIds.forEach(nodeId => {
            const node = this.nodes.get(nodeId);
            if (node) {
                node.element.style.zIndex = '1000';
                if (theme && theme.selectBorderColorNode) {
                    node.element.style.border = theme.selectBorderColorNode;
                }
                this.activeNode.add(nodeId);
            }
        });
    
        this.drawLines();
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
        this.container.appendChild(this.svgContainer);

        if (this.settings.theme) this.container.style.backgroundColor = MIND_MAP_THEMES[this.settings.theme].canvas.backgroundColor;
    }

    findEdges(points) {
        let minY = 1, maxY = 0;
        points.forEach(point => {
            if (point.y < minY) minY = point.y;
            if (point.y > maxY) maxY = point.y;
        });

        const topPoints = points.filter(p => Math.abs(p.y - minY) < 0.1);
        const bottomPoints = points.filter(p => Math.abs(p.y - maxY) < 0.1);
        
        const leftPoints = points.filter(p => p.x < 0.2);
        const rightPoints = points.filter(p => p.x > 0.8);

        return {
            top: topPoints.length >= 2 ? topPoints.sort((a, b) => a.x - b.x) : null,
            bottom: bottomPoints.length >= 2 ? bottomPoints.sort((a, b) => a.x - b.x) : null,
            left: leftPoints.length >= 2 ? leftPoints.sort((a, b) => a.y - b.y) : null,
            right: rightPoints.length >= 2 ? rightPoints.sort((a, b) => a.y - b.y) : null
        };
    }

    getEdgeLength(points) {
        if (!points || points.length < 2) return 1;

        const [p1, p2] = [points[0], points[points.length - 1]];
        
        if (p1.fixedOffset !== undefined || p2.fixedOffset !== undefined) {
            const p1Offset = p1.fixedOffset !== undefined ? p1.fixedOffset : 0;
            const p2Offset = p2.fixedOffset !== undefined ? p2.fixedOffset : 0;
            
            const totalOffset = p1Offset + p2Offset;
            
            return 1 - (totalOffset / 150);
        }

        return Math.abs(p2.x - p1.x) || Math.abs(p2.y - p1.y);
    }

    calculateNodeDimensions(figure, data, topicRect) {
        const padding = PADDING_WITH_NODE;
        let width, height, maxWidth, maxHeight;
    
        // Защита от некорректных размеров topicRect
        const safeWidth = topicRect.width > 0 ? topicRect.width : 100;
        const safeHeight = topicRect.height > 0 ? topicRect.height : 30;
    
        if (figure.tag === 'path' && figure.dNormalized) {
            const edges = this.findEdges(figure.dNormalized);
            const horizontalRatio = Math.min(
                edges.top ? this.getEdgeLength(edges.top) : 1,
                edges.bottom ? this.getEdgeLength(edges.bottom) : 1
            );
            const verticalRatio = Math.min(
                edges.left ? this.getEdgeLength(edges.left) : 1,
                edges.right ? this.getEdgeLength(edges.right) : 1
            );
    
            width = Math.max(safeWidth / horizontalRatio + padding * 2, 250);
            height = Math.max(safeHeight / verticalRatio + padding * 2, 175);

            console.log(safeWidth / horizontalRatio + padding * 2);
            
            maxWidth = `${horizontalRatio * 0.95 * 100 - parseInt(figure.strokeWidth || 1)}%`;
            maxHeight = `${verticalRatio * 0.95 * 100 - parseInt(figure.strokeWidth || 1)}%`;
        } else {
            width = Math.max(safeWidth + padding * 2, 250);
            height = Math.max(safeHeight + padding * 2, 175);
            maxWidth = '90%';
            maxHeight = '90%';
        }
        
        return { width, height, maxWidth, maxHeight };
    }

    drawNodeFigure(canvas, container, figure) {
        const computedStyle = getComputedStyle(container);
        const strokeWidth = parseFloat(figure.strokeWidth) * 2 || 1;
        const strokePadding = strokeWidth;
    
        canvas.width = parseInt(computedStyle.width) + strokePadding;
        canvas.height = parseInt(computedStyle.height) + strokePadding;
    
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        ctx.translate(strokeWidth / 2, strokeWidth / 2);
    
        ctx.fillStyle = figure.fill || '#ffffff';
        ctx.strokeStyle = figure.stroke || '#cccccc';
        ctx.lineWidth = strokeWidth;
    
        if (figure.dNormalized) {
            this.drawPath(ctx, figure.dNormalized, canvas.width - strokePadding, canvas.height - strokePadding, figure.rx);
        }
    
        ctx.fill();
        ctx.stroke();
    }

    saveNodeContent(nodeId, topic) {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        const content = topic.innerHTML;
        node.data.topic.text = content;
        topic.dataset.markdown = content;

        this.layout(this.root, new Set([node.id]));
    }
}