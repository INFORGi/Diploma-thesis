import { Node } from './Node.js';
import { TreeRenderer } from './TreeRenderer.js';
import { findNodeById, findParentNode, traverseNodes } from './utils.js';
import { DEFAULT_NODE_STYLE } from '../../data/constants.js';

export class MindMap {
    constructor(containerId, rendererType = 'tree', options = {}, meta = {}) {
        // Инициализация рендерера
        this.renderer = this.createRenderer(containerId, rendererType);

        // Данные карты
        this.nodes = []; // Все узлы карты
        this.connections = []; // Все соединения

        // Инициализация корневого узла
        this.initializeRootNode(options, meta);
    }

    /**
     * Создает рендерер в зависимости от типа.
     * @param {string} containerId - ID контейнера.
     * @param {string} type - Тип рендерера (например, 'tree').
     * @returns {Renderer} - Экземпляр рендерера.
     */
    createRenderer(containerId, type) {
        const container = document.getElementById(containerId);
        if (!container) throw new Error(`Container "${containerId}" not found`);

        const jsPlumbInstance = jsPlumb.getInstance({
            Container: container });

        switch (type) {
            case 'tree':
                return new TreeRenderer(container, jsPlumbInstance);
            // Другие типы рендереров можно добавить здесь
            default:
                throw new Error(`Unknown renderer type: ${type}`);
        }
    }

    /**
     * Инициализирует корневой узел карты.
     * @param {Object} options - Настройки карты.
     * @param {Object} meta - Метаданные карты.
     */
    initializeRootNode(options, meta) {
        const rootNode = new Node(
            'root',
            'Text',
            options.style || DEFAULT_NODE_STYLE,
            window.innerWidth / 2 - (options.width || 0) / 2,
            window.innerHeight / 2 - (options.height || 0) / 2,
            'right',
            [],
            options.draggable !== false
        );

        this.addNode(null, rootNode);
    }

    /**
     * Добавляет новый узел в карту.
     * @param {string|null} parentId - ID родительского узла (null для корневого).
     * @param {Object} nodeData - Данные нового узла.
     */
    addNode(parentId, nodeData) {
        if (findNodeById(nodeData.id, this.nodes[0])) {
            console.warn(`Узел с id "${nodeData.id}" уже существует!`);
            return;
        }
    
        console.log(this.nodes);

        const parent = parentId ? findNodeById(parentId, this.nodes[0]) : null;
        if (!parent && parentId) {
            console.error(`Parent node with id "${parentId}" not found`);
            return;
        }
    
        const node = new Node(
            nodeData.id,
            nodeData.topic,
            nodeData.style,
            nodeData.x || (parent ? parent.x + 150 : 0),
            nodeData.y || (parent ? parent.y + 100 : 0),
            nodeData.connectionType || 'left',
            [],
            nodeData.draggable !== undefined ? nodeData.draggable : true
        );
    
        if (parent) {
            parent.children.push(node); // Добавляем в дочерние узлы родителя
        } else {
            this.nodes.push(node); // Если нет родителя, добавляем как отдельный узел
        }
    
        // Отрисовка узла и соединения
        const parentElement = parent ? this.renderer.nodeElements.get(parent.id) : this.renderer.container;
        this.renderer.renderNode(node, parentElement);
        if (parent) this.renderer.renderConnection(parent, node);
    }
    
    

    /**
     * Удаляет узел из карты.
     * @param {string} nodeId - ID узла для удаления.
     */
    removeNode(nodeId) {
        const parentNode = findParentNode(nodeId, this.nodes);
        if (!parentNode) {
            console.error(`Node with id "${nodeId}" not found`);
            return;
        }

        // Удаляем узел из списка детей родителя
        parentNode.children = parentNode.children.filter(node => node.id !== nodeId);

        // Удаляем узел из общего списка узлов
        this.nodes = this.nodes.filter(node => node.id !== nodeId);

        // Перерисовываем карту
        this.render();
    }

    /**
     * Обновляет данные узла.
     * @param {string} nodeId - ID узла.
     * @param {Object} newData - Новые данные узла.
     */
    updateNode(nodeId, newData) {
        const node = findNodeById(nodeId, this.nodes);
        if (node) {
            node.update(newData);
            this.renderer.updateNodePosition(node);
            this.updateConnections(nodeId);
        } else {
            console.error(`Node with id "${nodeId}" not found`);
        }
    }

    /**
     * Отрисовывает всю карту.
     */
    render() {
        this.renderer.clear();
        traverseNodes(this.nodes[0], node => {
            this.renderer.renderNode(node);
            node.children.forEach(child => 
                this.renderer.renderConnection(node, child)
            );
        });
    }

    /**
     * Обновляет соединения для узла после перемещения.
     * @param {string} nodeId - ID узла.
     */
    updateConnections(nodeId) {
        const node = findNodeById(nodeId, this.nodes);
        const parentNode = findParentNode(nodeId, this.nodes);
        if (!node) return;

        // Обновляем соединение с родителем
        if (parentNode) {
            this.renderer.jsPlumb.deleteConnectionsForElement(node.id);
            this.renderer.renderConnection(parentNode, node);
        }

        // Обновляем соединения с детьми
        this.updateChildConnections(nodeId);
    }

    /**
     * Рекурсивно обновляет соединения для всех дочерних узлов.
     * @param {string} nodeId - ID родительского узла.
     */
    updateChildConnections(nodeId) {
        const node = findNodeById(nodeId, this.nodes);
        if (node) {
            node.children.forEach(child => {
                // Обновляем тип соединения
                child.connectionType = this.calculateConnectionType(child, node);

                // Удаляем старое соединение
                this.renderer.jsPlumb.deleteConnectionsForElement(child.id);

                // Создаем новое соединение
                this.renderer.renderConnection(node, child);

                // Рекурсивно обновляем соединения для вложенных детей
                this.updateChildConnections(child.id);
            });
        }
    }

    /**
     * Вычисляет тип соединения между узлами.
     * @param {Node} node - Дочерний узел.
     * @param {Node} parent - Родительский узел.
     * @returns {string} - Тип соединения ('left', 'right', 'top', 'bottom').
     */
    calculateConnectionType(node, parent) {
        const dx = node.x - parent.x;
        const dy = node.y - parent.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? "right" : "left";
        } else {
            return dy > 0 ? "bottom" : "top";
        }
    }

    /**
     * Обрабатывает завершение перетаскивания узла.
     * @param {Object} event - Событие перетаскивания.
     * @param {string} nodeId - ID узла.
     */
    handleDragEnd(event, nodeId) {
        this.renderer.handleDragEnd(event, nodeId);
    }
}