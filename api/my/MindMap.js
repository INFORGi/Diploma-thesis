import { Node } from './Node.js';
import { Connection } from './Connection.js';

export class MindMap {
    constructor(containerId, options = {}, meta = {}, format = "node_tree", data = {}, style = {}) {
        this.mind = {
            option: {
                container: containerId,
                editable: true,
                theme: 'orange',
                ...options,
            },
            meta: {
                name: "First",
                author: "INFORG",
                version: "0.0",
                ...meta,
            },
            format: format,
            data: new Node("root", "jsMind", style, window.innerWidth / 2 - data.width / 2, window.innerHeight / 2 - data.height / 2, "right", [], false), // Разрешаем перетаскивание по умолчанию
            ...data,
        };

        this.container = document.getElementById(this.mind.option.container);
        if (!this.container) throw new Error(`Container "${this.mind.option.container}" not found`);
        
        // Убедитесь, что контейнер имеет позиционирование relative для правильного позиционирования дочерних элементов
        this.container.style.position = 'relative';
        this.container.style.width = '100%'; // Задаем ширину
        this.container.style.height = '100vh'; // Задаем высоту на всю страницу

        this.jsPlumbInstance = jsPlumb.getInstance({ Container: this.container });

    }

    addNode(parentId, nodeData) {
        const parentNode = this.findNodeById(parentId, this.mind.data);
        if (!parentNode) {
            console.error(`Parent node with id "${parentId}" not found`);
            return;
        }
        const newNode = new Node(nodeData.id, nodeData.topic, nodeData.style, nodeData.x || parentNode.x + 150, nodeData.y || parentNode.y + 100, nodeData.connectionType || "left", [], nodeData.draggable !== undefined ? nodeData.draggable : true);
        parentNode.children.push(newNode);
        this.render();
    }

    removeNode(nodeId) {
        const parentNode = this.findParentNode(nodeId, this.mind.data);
        if (!parentNode) {
            console.error(`Node with id "${nodeId}" not found`);
            return;
        }
        parentNode.children = parentNode.children.filter(node => node.id !== nodeId);
        this.render();
    }

    updateNode(nodeId, newData) {
        const node = this.findNodeById(nodeId, this.mind.data);
        if (node) {
            node.update(newData);
            this.render();
        } else {
            console.error(`Node with id "${nodeId}" not found`);
        }
    }

    findNodeById(nodeId, node = this.mind.data) {
        if (node.id === nodeId) return node;
        for (const child of node.children) {
            const result = this.findNodeById(nodeId, child);
            if (result) return result;
        }
        return null;
    }

    findParentNode(nodeId, node = this.mind.data) {
        for (const child of node.children) {
            if (child.id === nodeId) return node;
            const result = this.findParentNode(nodeId, child);
            if (result) return result;
        }
        return null;
    }

    render() {
        const renderNode = (node, parentElement) => {
            const nodeElement = document.createElement("div");
            nodeElement.id = node.id;
            nodeElement.textContent = node.topic;
            nodeElement.style.position = "absolute";
            nodeElement.style.width = node.style.width || "100px";
            nodeElement.style.height = node.style.height || "50px";
            nodeElement.style.backgroundColor = node.style.backgroundColor || "#fff";
            nodeElement.style.color = node.style.color || "#000";
            nodeElement.style.border = node.style.border || "1px solid rgb(44, 184, 44)";
            nodeElement.style.left = `${node.x}px`;
            nodeElement.style.top = `${node.y}px`;

            // Добавляем элемент в контейнер
            parentElement.appendChild(nodeElement);

            // Делаем узел перетаскиваемым, если это разрешено
            if (node.draggable) {
                this.jsPlumbInstance.draggable(nodeElement);
                nodeElement.addEventListener('dragstart', (e) => this.handleDragStart(e, node.id));
                nodeElement.addEventListener('drag', (e) => this.handleDrag(e, node.id));
                nodeElement.addEventListener('mouseup', (e) => this.handleDragEnd(e, node.id));
            }

            node.children.forEach(child => renderNode(child, parentElement));
        };

        this.container.innerHTML = "";
        renderNode(this.mind.data, this.container);
        this.renderConnections();
    }

    renderConnections() {
        this.jsPlumbInstance.deleteEveryConnection(); // Удаляем все соединения перед обновлением
        const renderConnection = (node) => {
            node.children.forEach(child => {
                new Connection(this.jsPlumbInstance, node, child);
                renderConnection(child);
            });
        };
        renderConnection(this.mind.data);
    }
    


    handleDragStart(e, nodeId) {
        e.dataTransfer.setData("nodeId", nodeId);
    }

    handleDrag(e, nodeId) {
        const node = this.findNodeById(nodeId);
        if (node) {
            const nodeElement = document.getElementById(nodeId);
            nodeElement.style.left = `${e.clientX - nodeElement.offsetWidth / 2}px`;
            nodeElement.style.top = `${e.clientY - nodeElement.offsetHeight / 2}px`;
        }
    }

    handleDragEnd(e, nodeId) {
        const node = this.findNodeById(nodeId);
        if (node) {
            node.x = e.clientX - 50;
            node.y = e.clientY - 25;
    
            const parentNode = this.findParentNode(nodeId);
            if (parentNode) {
                node.connectionType = this.calculateConnectionType(node, parentNode);
            }
    
            this.updateConnections(nodeId);        
              
        }
    }

    updateConnections(nodeId) {
        const node = this.findNodeById(nodeId);
        const parentNode = this.findParentNode(nodeId);
        if (!node) return;
    
        // Обновляем соединение с родителем
        if (parentNode) {
            this.jsPlumbInstance.deleteConnectionsForElement(node.id);
            new Connection(this.jsPlumbInstance, parentNode, node);
        }
    
        // Обновляем соединения с детьми
        this.updateChildConnections(nodeId);
    }
    
    updateChildConnections(nodeId) {
        const node = this.findNodeById(nodeId);
        if (node) {
            node.children.forEach(child => {
                // Обновляем connectionType ребенка относительно нового положения родителя
                child.connectionType = this.calculateConnectionType(child, node);
                // Удаляем старое соединение
                this.jsPlumbInstance.deleteConnectionsForElement(child.id);
                // Создаём новое соединение с обновленными анкерами
                new Connection(this.jsPlumbInstance, node, child);
                // Рекурсивно обновляем соединения для вложенных детей
                this.updateChildConnections(child.id);
            });
        }
    }
     
    calculateConnectionType(node, parent) {
        const dx = node.x - parent.x;
        const dy = node.y - parent.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? "right" : "left";
        } 
        else {
            return dy > 0 ? "bottom" : "top";
        }
    }
    
}
