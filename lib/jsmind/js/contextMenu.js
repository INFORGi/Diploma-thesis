import { NodeStyleManager } from './nodeStyleManager.js';

export class NodeContextMenu {
    constructor(jm) {
        this.jm = jm;
        this.styleManager = new NodeStyleManager(jm);
        this.currentNode = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const isAnyMenuClick = e.target.closest('.context-menu');
            const isNodeClick = e.target.closest('.jsmind-node');

            if (!isAnyMenuClick && !isNodeClick) {
                this.hideAll();
            }
        });

        // Обработчики основного меню
        const actionsMenu = document.getElementById('node-actions-menu');
        actionsMenu.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const action = button.dataset.action;
            if (action) {
                this.handleAction(action);
            }
        });

        // Обработчики меню текста
        const textMenu = document.getElementById('text-style-menu');
        textMenu.addEventListener('input', (e) => {
            if (e.target.type === 'color') {
                this.handleStyleChange('textColor', e.target.value);
            }
        });
        textMenu.addEventListener('click', (e) => {
            const button = e.target.closest('.style-btn');
            if (button) {
                this.handleStyleChange(button.dataset.style);
            }
        });

        // Обработчики меню блока
        const nodeMenu = document.getElementById('node-style-menu');
        nodeMenu.addEventListener('input', (e) => {
            if (e.target.type === 'color') {
                this.handleStyleChange(e.target.id, e.target.value);
            }
        });
        nodeMenu.addEventListener('click', (e) => {
            const button = e.target.closest('.shape-btn');
            if (button) {
                this.handleShapeChange(button.dataset.shape);
            }
        });

        // Обработчики меню линий
        const lineMenu = document.getElementById('line-style-menu');
        lineMenu.addEventListener('click', (e) => {
            const button = e.target.closest('.line-btn');
            if (button) {
                this.handleLineChange(button.dataset.line);
            }
        });
    }

    handleAction(action) {
        if (!this.currentNode) return;

        switch (action) {
            case 'add-child':
                this.jm.addChild(this.currentNode.id);
                this.hideAll();
                break;
            case 'remove':
                if (this.currentNode.id !== 'root') {
                    this.jm.removeNode(this.currentNode.id);
                }
                break;
            case 'show-text-menu':
                this.showMenu('text-style-menu');
                break;
            case 'show-node-menu':
                this.showMenu('node-style-menu');
                break;
            case 'show-line-menu':
                this.showMenu('line-style-menu');
                break;
        }
    }

    showMenu(menuId) {
        if (!this.currentNode) return;

        // Скрываем все меню
        this.hideAll();

        const menu = document.getElementById(menuId);
        if (!menu) return;

        // Обновляем значения в цветовых инпутах
        if (menuId === 'node-style-menu' || menuId === 'text-style-menu') {
            const styles = this.styleManager.getCurrentStyles(this.currentNode);
            if (styles) {
                const inputs = menu.querySelectorAll('input[type="color"]');
                inputs.forEach(input => {
                    input.value = styles[input.id];
                });
            }
        }

        const rect = this.currentNode.getBoundingClientRect();
        menu.style.display = 'block';
        menu.style.left = `${rect.right + 10}px`;
        menu.style.top = `${rect.top}px`;
    }

    hideAll() {
        const menus = document.querySelectorAll('.context-menu');
        menus.forEach(menu => menu.style.display = 'none');
    }

    handleStyleChange(property, value) {
        if (!this.currentNode) return;
        this.styleManager.updateNodeStyle(this.currentNode, property, value);
    }

    handleShapeChange(shapeName) {
        if (!this.currentNode) return;
        this.styleManager.changeNodeShape(this.currentNode, shapeName);
        this.hideAll();
    }

    handleLineChange(lineType) {
        if (!this.currentNode) return;
        // TODO: Добавить обработку изменения стиля линии
        this.hideAll();
    }

    show(node) {
        if (!node) return;
        this.currentNode = node;
        this.showMenu('node-actions-menu');
    }

    hide() {
        this.hideAll();
        this.currentNode = null;
    }
}
