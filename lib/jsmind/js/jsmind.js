import { FIGURE, TOPIC_STYLES, NODE_STYLES, LINE_STYLES, DEFAULT_NODE_DATA, MIND_MAP_THEMES, SPACING_WIDTH, SPACING_HEIGHT } from '../../../data/constants.js';

export class jsMind {
    constructor(options) {
        this.options = {
            container: options.container || 'jsmind_container',
            theme: options.theme || 'default',
            onNodeAddButtonActive: options.onNodeAddButtonActive || (() => {}),
            onNodeAddButtonDisable: options.onNodeAddButtonDisable || (() => {})
        };
        this.container = document.getElementById(this.options.container);
        this.nodes = new Map();
        this.root = null;
        this.activeNode = null;
        this.initContainer();
    }

    async show(data) {
        this.clear();
        this.options.theme = data.theme || this.options.theme;
        if (data.data) {
            this.root = await this.createNode(data.data);
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

        if (nodeData.children && Array.isArray(nodeData.children)) {
            for (const child of nodeData.children) {
                child.parent = nodeData.id;
                const childId = await this.createNode(child);
                this.nodes.get(nodeData.id).children.push(childId);
            }
        }

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
        Object.assign(containerWithTextShape.style, {
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });
    
        let canvas, ctx;
        if (data.figure) {
            canvas = document.createElement('canvas');
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            
            ctx = canvas.getContext('2d');
            containerWithTextShape.appendChild(canvas);
        }
    
        const topic = document.createElement('div');
        topic.className = 'node-topic';
        const markdownText = data.topic.text || '';
        topic.dataset.markdown = markdownText;
        topic.innerHTML = await window.electron.renderMarkdown(markdownText);
        
        Object.assign(topic.style, data.styleTopic, {
            color: data.topic.color,
            fontSize: data.topic.fontSize,
            fontFamily: data.topic.fontFamily,
            position: 'relative',
            zIndex: '2'
        });
    
        if (data.figure.tag === 'path' && data.figure.dNormalized) {
            const pointsByY = {};
            data.figure.dNormalized.forEach(point => {
                const y = point.y;
                if (!pointsByY[y]) pointsByY[y] = [];
                pointsByY[y].push(point);
            });
    
            let minWidthRatio = 1;
            const computedStyle = getComputedStyle(containerWithTextShape);
            const containerWidth = parseInt(computedStyle.width) || 150;
    
            for (const y in pointsByY) {
                const points = pointsByY[y];
                if (points.length < 2) continue;
    
                points.sort((a, b) => a.x - b.x);
    
                const leftPoint = points[0];
                const rightPoint = points[points.length - 1];
    
                let leftX, rightX;
                if (leftPoint.fixedOffset !== undefined) {
                    leftX = leftPoint.x <= 0.5 ? leftPoint.fixedOffset : containerWidth - leftPoint.fixedOffset;
                } else {
                    leftX = leftPoint.x * containerWidth;
                }
                if (rightPoint.fixedOffset !== undefined) {
                    rightX = rightPoint.x <= 0.5 ? rightPoint.fixedOffset : containerWidth - rightPoint.fixedOffset;
                } else {
                    rightX = rightPoint.x * containerWidth;
                }
    
                const width = (rightX - leftX) / containerWidth;
                minWidthRatio = Math.min(minWidthRatio, width);
            }
    
            topic.style.maxWidth = `${minWidthRatio * 80}%`;
            topic.style.alignSelf = 'center';
        } else {
            topic.style.maxWidth = '80%';
            topic.style.alignSelf = 'center';
        }
    
        topic.spellcheck = false;
        containerWithTextShape.appendChild(topic);
        node.appendChild(containerWithTextShape);
    
        node.style.left = `${data.position.x}px`;
        node.style.top = `${data.position.y}px`;
    
        this.container.appendChild(node);
    
        const drawFigure = () => {
            if (!data.figure) return;
            
            const computedStyle = getComputedStyle(containerWithTextShape);
            canvas.width = parseInt(computedStyle.width) || 150;
            canvas.height = parseInt(computedStyle.height) || 150;
    
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = data.figure.fill || '#ffffff';
            ctx.strokeStyle = data.figure.stroke || '#cccccc';
            ctx.lineWidth = data.figure.strokeWidth || 1;
    
            switch (data.figure.tag) {
                case 'rect':
                    const radius = data.figure.rx || 10;
                    this.drawRoundedRect(ctx, 0, 0, canvas.width, canvas.height, radius);
                    break;
                case 'path':
                    if (data.figure.dNormalized) {
                        this.drawPath(ctx, data.figure.dNormalized, canvas.width, canvas.height);
                    }
                    break;
                default:
                    console.warn(`Unsupported figure tag: ${data.figure.tag}`);
            }
            ctx.fill();
            ctx.stroke();
        };
    
        drawFigure();
    
        const resizeObserver = new ResizeObserver(() => {
            drawFigure();
        });
        resizeObserver.observe(containerWithTextShape);
    
        if (data.draggable) {
            this.makeNodeDraggable(node);
        }
        this.setupTopicEventListeners(topic);
    
        return node;
    }
    
    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    
    drawPath(ctx, points, width, height) {
        ctx.beginPath();
        points.forEach((point, index) => {
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
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.closePath();
    }

    setupTopicEventListeners(topic) {
        let originalContent;
        let originalWidth;
        let originalHeight;

        topic.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const node = topic.closest('.jsmind-node');
            originalWidth = node.offsetWidth;
            originalHeight = node.offsetHeight;
            
            topic.contentEditable = 'true';
            originalContent = topic.dataset.markdown || topic.textContent;
            topic.textContent = originalContent;
            
            node.style.width = originalWidth + 'px';
            node.style.height = originalHeight + 'px';
            
            topic.classList.add('editing');
            topic.focus();
            
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(topic);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        });

        topic.addEventListener('blur', async () => {
            const node = topic.closest('.jsmind-node');
            topic.contentEditable = 'false';
            topic.classList.remove('editing');

            const nodeId = node.id;
            const nodeData = this.nodes.get(nodeId);
            const markdown = topic.textContent.trim() || 'Текст';

            topic.dataset.markdown = markdown;
            nodeData.data.topic.text = markdown;

            topic.innerHTML = await window.electron.renderMarkdown(markdown);
            
            Object.assign(topic.style, nodeData.data.styleTopic);
            
            node.style.width = '';
            node.style.height = '';
        });

        topic.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                topic.blur();
            }
        });
    }

    updateNode(nodeId, newData) {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        Object.assign(node.data, newData);
        const oldPosition = node.data.position;
        const oldParent = node.parent;
        const oldChildren = node.children;

        const newElement = this.createNodeElement(node.data);
        newElement.style.left = `${oldPosition.x}px`;
        newElement.style.top = `${oldPosition.y}px`;

        node.element.parentNode.replaceChild(newElement, node.element);
        node.element = newElement;
        node.parent = oldParent;
        node.children = oldChildren;

        this.drawLines();
    }

    removeNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node || node.data.isroot) return;

        node.children.forEach(childId => {
            this.removeNode(childId);
            node.element.remove();
        });

        const parentNode = this.nodes.get(node.parent);
        if (parentNode) {
            parentNode.children = parentNode.children.filter(id => id !== nodeId);
        }

        node.element.remove();
        this.nodes.delete(nodeId);

        this.layout();
    }

    addChild(parentId) {
        const parentNode = this.nodes.get(parentId);
        if (!parentNode) return;

        const newNodeData = {
            id: `node_${Date.now()}`,
            topic: this.deepCloneStyle(DEFAULT_NODE_DATA.topic),
            parent: parentId,
            children: [],
            styleNode: this.deepCloneStyle(parentNode.data.styleNode),
            styleTopic: this.deepCloneStyle(parentNode.data.styleTopic),
            styleLine: this.deepCloneStyle(parentNode.data.styleLine),
            position: { x: 0, y: 0 },
            draggable: true
        };

        this.createNode(newNodeData);
        this.layout();
    }

    async layout() {
        if (!this.root) return;
    
        const rootNode = this.nodes.get(this.root);
        if (!rootNode) return;

        await new Promise(resolve => requestAnimationFrame(resolve));
    
        const containerRect = this.container.getBoundingClientRect();
        const elementRect = rootNode.element.getBoundingClientRect();
    
        const position = {
            x: Math.floor(containerRect.width / 2 - elementRect.width / 2),
            y: Math.floor(containerRect.height / 2 - elementRect.height / 2)
        };
    
        rootNode.element.style.left = `${position.x}px`;
        rootNode.element.style.top = `${position.y}px`;
        rootNode.data.position = position;
    
        this.layoutChildren(this.root);
        this.drawLines();
    }

    layoutChildren(nodeId, spacing = SPACING_WIDTH) {
        const node = this.nodes.get(nodeId);
        if (!node || !node.children.length) return;
        const height = this.getHeight(node.children);
        
        node.children.forEach((childId, index) => {
            const child = this.nodes.get(childId);
            if (!child) return;
    
            const parentX = node.data.position.x;
            const parentY = node.data.position.y;
            const parentWidth = node.element.getBoundingClientRect().width;
    
            const xChild = parentX + parentWidth + spacing;
            const yChild = parentY - (height / 2) + (index * (node.element.getBoundingClientRect().height + SPACING_HEIGHT)) + SPACING_HEIGHT;
    
            child.element.style.left = `${xChild}px`;
            child.element.style.top = `${yChild}px`;
            child.data.position = { x: xChild, y: yChild };
    
            this.layoutChildren(childId, spacing);
        });
    }

    getHeight(children = []) {
        let height = 0;

        if (children.length === 0) return this.nodes.get(id).element.getBoundingClientRect().height;
        
        children.forEach(id => {
            let node = this.nodes.get(id).element.getBoundingClientRect();

            height += node.height;
            height += SPACING_HEIGHT;
        });

        return height;
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
                path = `M ${fromX} ${fromY} C ${fromX + dx / 2} ${fromY}, ${toX - dx / 2} ${toY}, ${toX} ${toY}`;
                break;
        }

        line.setAttribute("d", path);
        Object.entries(lineStyle.style).forEach(([attr, value]) => {
            const svgAttr = attr.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
            line.setAttribute(svgAttr, value);
        });

        this.svgContainer.appendChild(line);
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

            this.setActiveNode(node);
            this.options.onNodeAddButtonActive(node.id);
            
            e.preventDefault();
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            node.style.left = `${initialLeft + dx}px`;
            node.style.top = `${initialTop + dy}px`;
            
            this.options.onNodeAddButtonDisable();
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
            this.options.onNodeAddButtonActive(node.id);
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

    setActiveNode(node) {
        if (this.activeNode) {
            this.activeNode.style.zIndex = '1';
            this.activeNode.style.border = 'none';
        }
    
        if (node) {
            node.style.zIndex = '1000';
            const theme = MIND_MAP_THEMES[this.options.theme];
            if (theme && theme.borderColorNode) {
                node.style.border = theme.borderColorNode;
            }
            this.activeNode = node;
        } else {
            this.activeNode = null;
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

    deepCloneStyle(style) {
        return JSON.parse(JSON.stringify(style));
    }

    generatePathD(normalizedPoints, width, height) {
        const pathCommands = normalizedPoints.map((point, index) => {
            const x = point.x * width;
            const y = point.y * height;
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        });
        pathCommands.push('Z');
        return pathCommands.join(' ');
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

    getNodeData(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return null;

        return {
            id: node.data.id,
            topic: node.data.topic,
            parent: node.data.parent,
            children: node.children.map(childId => this.getNodeData(childId)).filter(Boolean),
            styleNode: node.data.styleNode,
            figure: node.data.figure,
            styleTopic: node.data.styleTopic,
            styleLine: node.data.styleLine,
            position: node.data.position,
            draggable: node.data.draggable
        };
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
    }
}