import { DEFAULT_NODE_STYLE } from '../../data/constants.js';

export class Renderer {
    constructor(container) {
        if (new.target === Renderer) {
            throw new Error("Renderer is an abstract class");
        }
        this.container = container;
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
    
        return nodeElement;
    }

    createNodeElement(node) {
        const element = document.createElement('div');
        element.id = node.id;
        element.textContent = node.topic;
        
        Object.assign(element.style, {
            ...DEFAULT_NODE_STYLE,
            position: 'absolute'
        });

        return element;
    }

    clear() {
        this.container.innerHTML = '';
        this.nodeElements.clear();
    }
}