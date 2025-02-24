import { Renderer } from './Renderer.js';
import { Connection } from './Connection.js';

export class TreeRenderer extends Renderer {
    constructor(container, jsPlumbInstance) {
        super(container, jsPlumbInstance);
        
        this.config = {
            nodeWidth: 150,
            nodeHeight: 80,
            horizontalSpacing: 200,
            verticalSpacing: 100
        };
        
        this.connections = new Map();
    }

    renderNode(node, parentElement = this.container) {
        const nodeElement = this.createNodeElement(node);
        parentElement.appendChild(nodeElement);
        this.nodeElements.set(node.id, nodeElement);
        
        this.positionNode(node, nodeElement);
        
        if (node.draggable) {
            this.makeDraggable(nodeElement, node.id);
        }

        // Создаем соединение с родительским узлом
        if (node.parent) {
            this.createConnection(node, node.parent);
        }

        return nodeElement;
    }

    createConnection(node, parentNode) {
        const connectionKey = `${parentNode.id}-${node.id}`;
        const direction = this.determineDirection(node);
        
        // Устанавливаем тип соединения на основе направления
        node.connectionType = direction;
        
        // Создаем новое соединение
        const connection = new Connection(
            this.jsPlumb,
            parentNode,
            node,
            'default'
        );
        
        this.connections.set(connectionKey, connection);
    }

    determineDirection(node) {
        if (!node.parent) return 'right';
        
        const parentElement = this.nodeElements.get(node.parent.id);
        const nodeElement = this.nodeElements.get(node.id);
        
        if (parentElement && nodeElement) {
            const parentRect = parentElement.getBoundingClientRect();
            const nodeRect = nodeElement.getBoundingClientRect();
            return nodeRect.left > parentRect.left ? 'right' : 'left';
        }
        
        return 'right';
    }

    positionNode(node, element) {
        if (!node.parent) {
            // Центрируем корневой узел
            const left = (this.container.clientWidth / 2) - (this.config.nodeWidth / 2);
            const top = (this.container.clientHeight / 2) - (this.config.nodeHeight / 2);
            element.style.left = `${left}px`;
            element.style.top = `${top}px`;
        } else {
            // Позиционируем дочерние узлы относительно родителя
            const parentElement = this.nodeElements.get(node.parent.id);
            if (parentElement) {
                const parentRect = parentElement.getBoundingClientRect();
                const containerRect = this.container.getBoundingClientRect();
                
                const direction = this.determineDirection(node);
                const horizontalOffset = direction === 'right' ? 
                    this.config.horizontalSpacing : 
                    -this.config.horizontalSpacing;
                
                const left = parentRect.left - containerRect.left + horizontalOffset;
                const top = parentRect.top - containerRect.top + this.config.verticalSpacing;
                
                element.style.left = `${left}px`;
                element.style.top = `${top}px`;
            }
        }
    }

    makeDraggable(element, nodeId) {
        this.jsPlumb.draggable(element, {
            start: () => {},
            drag: () => {
                this.updateNodeConnections(nodeId);
            },
            stop: (event) => {
                this.handleDragEnd(event, nodeId);
            }
        });
    }

    handleDragEnd(event, nodeId) {
        const node = this.nodeElements.get(nodeId);
        if (node) {
            const rect = node.getBoundingClientRect();
            const parentRect = this.container.getBoundingClientRect();
            const x = rect.left - parentRect.left;
            const y = rect.top - parentRect.top;

            node.style.left = `${x}px`;
            node.style.top = `${y}px`;
            
            this.updateNodeConnections(nodeId);
        }
    }

    updateNodeConnections(nodeId) {
        this.jsPlumb.revalidate(nodeId);
    }

    removeNode(nodeId) {
        // Удаляем все соединения узла
        this.jsPlumb.deleteConnectionsForElement(nodeId);
        
        // Удаляем элемент из DOM
        const element = this.nodeElements.get(nodeId);
        if (element) {
            element.remove();
            this.nodeElements.delete(nodeId);
        }

        // Удаляем соединения из нашей карты
        Array.from(this.connections.keys())
            .filter(key => key.includes(nodeId))
            .forEach(key => this.connections.delete(key));
    }
}