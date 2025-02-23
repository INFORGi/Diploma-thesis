import { Renderer } from './Renderer.js';
import { Connection } from './Connection.js';
import { DEFAULT_NODE_STYLE } from '../../data/constants.js';

export class TreeRenderer extends Renderer {
    constructor(container, jsPlumbInstance) {
        super(container, jsPlumbInstance);
        this.nodeElements = new Map();
    }

    renderNode(node, parentElement = this.container) {
        if (!parentElement) {
            console.error('Parent element is null!');
            return;
        }
        
        const nodeElement = this.createNodeElement(node);
        parentElement.appendChild(nodeElement);
        this.nodeElements.set(node.id, nodeElement);
    
        if (node.draggable) {
            this.makeDraggable(nodeElement, node.id);
        }

        return nodeElement;
    }

    createNodeElement(node) {
        const element = document.createElement('div');
        element.id = node.id;
        element.textContent = node.topic;
        element.contenteditable = true;
        
        Object.assign(element.style, {
            ...DEFAULT_NODE_STYLE,
            ...node.style,
            position: 'absolute',
            left: `${node.x}px`,
            top: `${node.y}px`
        });

        this.addHoverEffects(element, node);
        return element;
    }

    addHoverEffects(element, node) {
        element.addEventListener('mouseenter', () => {
            element.style.backgroundColor = node.style.hoverBackgroundColor || '#f0f0f0';
            element.style.boxShadow = node.style.hoverBoxShadow || '3px 3px 8px rgba(0, 0, 0, 0.3)';
        });

        element.addEventListener('mouseleave', () => {
            element.style.backgroundColor = node.style.backgroundColor || DEFAULT_NODE_STYLE.backgroundColor;
            element.style.boxShadow = node.style.boxShadow || DEFAULT_NODE_STYLE.boxShadow;
        });
    }

    makeDraggable(element, nodeId) {
        this.jsPlumb.draggable(element, {
            stop: (event) => this.handleDragEnd(event, nodeId)
        });
    }

    renderConnection(source, target) {
        new Connection(this.jsPlumb, source, target);
    }

    updateNodePosition(node) {
        const element = this.nodeElements.get(node.id);
        if (element) {
            element.style.left = `${node.x}px`;
            element.style.top = `${node.y}px`;
        }
    }

    clear() {
        this.container.innerHTML = '';
        this.nodeElements.clear();
        this.jsPlumb.deleteEveryConnection();
    }
}