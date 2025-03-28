import { NODE_STYLES } from '../../../data/constants.js';

export class NodeContextMenu {
    constructor(jm) {
        this.jm = jm;
        this.currentNode = null;
        this.menu = this.createMenu();
        this.styleMenu = this.createStyleMenu();
        this.shapeMenu = this.createShapeMenu();
        document.body.appendChild(this.menu);
        document.body.appendChild(this.styleMenu);
        document.body.appendChild(this.shapeMenu);
        this.setupEventListeners();
    }

    createMenu() {
        const menu = document.createElement('div');
        menu.className = 'node-toolbar';
        menu.innerHTML = `
            <button class="toolbar-btn" data-action="style" title="Стиль">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z"/>
                </svg>
            </button>
            <button class="toolbar-btn" data-action="shape" title="Форма">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
            </button>
            <button class="toolbar-btn" data-action="addChild" title="Добавить">+</button>
            <button class="toolbar-btn" data-action="delete" title="Удалить">×</button>
        `;
        menu.style.display = 'none';
        return menu;
    }

    createStyleMenu() {
        const menu = document.createElement('div');
        menu.className = 'style-popup';
        menu.innerHTML = `
            <div class="style-group">
                <input type="color" id="nodeBgColor" title="Цвет фона">
                <input type="color" id="nodeTextColor" title="Цвет текста">
                <input type="color" id="nodeBorderColor" title="Цвет границы">
            </div>
            <div class="style-group">
                <button data-style="bold" class="style-button">B</button>
                <button data-style="italic" class="style-button">I</button>
                <button data-style="underline" class="style-button">U</button>
            </div>
        `;
        menu.style.display = 'none';
        return menu;
    }

    createShapeMenu() {
        const menu = document.createElement('div');
        menu.className = 'shape-popup';
        menu.innerHTML = `
            <button data-shape="RECTANGLE">Прямоугольник</button>
            <button data-shape="TRAPEZOID">Трапеция</button>
            <button data-shape="SKEWED_RECTANGLE">Скошенный</button>
            <button data-shape="NOTCHED_RECTANGLE">С вырезом</button>
        `;
        menu.style.display = 'none';
        return menu;
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const isMenuClick = e.target.closest('.node-toolbar');
            const isStyleClick = e.target.closest('.style-popup');
            const isShapeClick = e.target.closest('.shape-popup');
            const isNodeClick = e.target.closest('.jsmind-node');

            if (!isMenuClick && !isStyleClick && !isShapeClick && !isNodeClick) {
                this.hideAll();
            }
        });

        this.menu.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const action = button.dataset.action;
            if (action && this.currentNode) {
                this.handleAction(action);
            }
        });

        // Обработчики для меню стилей
        this.styleMenu.addEventListener('input', (e) => {
            const target = e.target;
            if (target.type === 'color') {
                this.handleStyleChange(target.id, target.value);
            }
        });

        this.styleMenu.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (button && button.dataset.style) {
                this.handleStyleChange(button.dataset.style);
            }
        });

        // Обработчики для меню форм
        this.shapeMenu.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (button && button.dataset.shape) {
                this.handleShapeChange(button.dataset.shape);
            }
        });
    }

    handleAction(action) {
        if (!this.currentNode) return;

        switch (action) {
            case 'style':
                this.showStylePicker();
                break;
            case 'shape':
                this.showShapePicker();
                break;
            case 'addChild':
                this.jm.addChild(this.currentNode.id);
                break;
            case 'delete':
                this.jm.removeNode(this.currentNode.id);
                break;
        }
    }

    showStylePicker() {
        const rect = this.currentNode.getBoundingClientRect();
        this.styleMenu.style.display = 'block';
        this.styleMenu.style.left = `${rect.left}px`;
        this.styleMenu.style.top = `${rect.bottom + 10}px`;
        this.shapeMenu.style.display = 'none';
    }

    showShapePicker() {
        const rect = this.currentNode.getBoundingClientRect();
        this.shapeMenu.style.display = 'block';
        this.shapeMenu.style.left = `${rect.left}px`;
        this.shapeMenu.style.top = `${rect.bottom + 10}px`;
        this.styleMenu.style.display = 'none';
    }

    hideAll() {
        this.menu.style.display = 'none';
        this.styleMenu.style.display = 'none';
        this.shapeMenu.style.display = 'none';
        this.currentNode = null;
    }

    handleStyleChange(property, value) {
        if (!this.currentNode) return;
        const nodeId = this.currentNode.id;
        const nodeData = this.jm.nodes.get(nodeId);
        
        if (!nodeData) return;

        switch (property) {
            case 'nodeBgColor':
                if (nodeData.data.styleNode.shapeSvg) {
                    nodeData.data.styleNode.shapeSvg.fill = value;
                } else {
                    nodeData.data.styleNode.styles.backgroundColor = value;
                }
                break;
            case 'nodeTextColor':
                nodeData.data.styleTopic.color = value;
                break;
            case 'nodeBorderColor':
                if (nodeData.data.styleNode.shapeSvg) {
                    nodeData.data.styleNode.shapeSvg.stroke = value;
                } else {
                    nodeData.data.styleNode.styles.borderColor = value;
                }
                break;
            case 'bold':
                nodeData.data.styleTopic.fontWeight = 
                    nodeData.data.styleTopic.fontWeight === 'bold' ? 'normal' : 'bold';
                break;
            case 'italic':
                nodeData.data.styleTopic.fontStyle = 
                    nodeData.data.styleTopic.fontStyle === 'italic' ? 'normal' : 'italic';
                break;
            case 'underline':
                nodeData.data.styleTopic.textDecoration = 
                    nodeData.data.styleTopic.textDecoration === 'underline' ? 'none' : 'underline';
                break;
        }

        // Обновляем существующий узел вместо пересоздания
        this.updateNodeStyles(nodeData);
    }

    handleShapeChange(shapeName) {
        if (!this.currentNode || !NODE_STYLES[shapeName]) return;
        
        const nodeId = this.currentNode.id;
        const nodeData = this.jm.nodes.get(nodeId);
        
        if (nodeData) {
            const oldPosition = nodeData.data.position;
            nodeData.data.styleNode = { ...NODE_STYLES[shapeName] };
            // Сохраняем позицию при смене формы
            nodeData.data.position = oldPosition;
            
            // Обновляем узел через jsMind
            this.jm.updateNode(nodeId, nodeData.data);
            this.hideAll();
        }
    }

    updateNodeStyles(nodeData) {
        const node = this.currentNode;
        const topic = node.querySelector('.node-topic');
        
        if (nodeData.data.styleNode.shapeSvg) {
            // Обновляем SVG форму
            const polygon = node.querySelector('.node-shape polygon');
            if (polygon) {
                polygon.setAttribute('fill', nodeData.data.styleNode.shapeSvg.fill);
                polygon.setAttribute('stroke', nodeData.data.styleNode.shapeSvg.stroke);
            }
        } else {
            // Обновляем стили DIV
            Object.assign(node.style, nodeData.data.styleNode.styles);
        }

        // Обновляем стили текста
        if (topic) {
            Object.assign(topic.style, nodeData.data.styleTopic);
        }
    }

    show(node, position) {
        if (!node) return;
        this.currentNode = node;

        const rect = node.getBoundingClientRect();
        this.menu.style.display = 'flex';
        this.menu.style.left = `${rect.left}px`;
        this.menu.style.top = `${rect.top - 40}px`; // Располагаем над узлом
    }

    hide() {
        this.menu.style.display = 'none';
        this.currentNode = null;
    }
}
