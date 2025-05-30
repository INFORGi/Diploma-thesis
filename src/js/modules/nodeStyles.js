import { LINE_STYLES, CONTAINER_STYLES } from '../../data/constants.js';

export function setData(updates = {}) {
    try {
        if (!jm.activeNode || jm.activeNode.size === 0) {
            console.log('Нет активных узлов для изменения стилей');
            return;
        }

        jm.activeNode.forEach(nodeId => {
            const node = jm.nodes.get(nodeId);
            if (!node) {
                console.warn(`Узел ${nodeId} не найден в jm.nodes`);
                return;
            }

            const container = node.element.querySelector('.jsmind-container');
            const topic = node.element.querySelector('.node-topic');

            if (updates.styleContainer) {
                const minWidth = parseFloat(CONTAINER_STYLES.minWidth) || 250;
                const maxWidth = parseFloat(CONTAINER_STYLES.maxWidth) || 900;
                const minHeight = parseFloat(CONTAINER_STYLES.minHeight) || 200;
                const maxHeight = parseFloat(CONTAINER_STYLES.maxHeight) || 800;

                Object.entries(updates.styleContainer).forEach(([key, value]) => {
                    if (key === 'borderWidth') {
                        const parsedValue = parseInt(value);
                        node.data.styleContainer[key] = isNaN(parsedValue) ? 3 : Math.max(1, Math.min(10, parsedValue));
                        node.data.styleContainer.border = `${node.data.styleContainer.borderWidth}px solid ${node.data.styleContainer.borderColor || '#cccccc'}`;
                    } else if (key === 'borderColor') {
                        node.data.styleContainer[key] = value;
                        node.data.styleContainer.border = `${node.data.styleContainer.borderWidth || 3}px solid ${value}`;
                    } else if (key === 'width' || key === 'height') {
                        let parsedValue = typeof value === 'string' ? parseFloat(value) : value;
                        if (isNaN(parsedValue)) {
                            console.warn(`Некорректное значение для ${key}: ${value}, используется значение по умолчанию`);
                            parsedValue = key === 'width' ? parseFloat(CONTAINER_STYLES.width) : parseFloat(CONTAINER_STYLES.height);
                        }
                        const min = key === 'width' ? minWidth : minHeight;
                        const max = key === 'width' ? maxWidth : maxHeight;
                        const newValue = Math.max(min, Math.min(max, parsedValue));
                        if (node.data.styleContainer[key] !== `${newValue}px`) {
                            node.data.styleContainer[key] = `${newValue}px`;
                            console.log(`setData: Обновлено ${key} для узла ${nodeId}: ${newValue}px`);
                        }
                    } else {
                        node.data.styleContainer[key] = value;
                    }
                });

                if (container) {
                    container.style.border = node.data.styleContainer.border;
                    container.style.width = node.data.styleContainer.width;
                    container.style.height = node.data.styleContainer.height;
                    container.style.backgroundColor = node.data.styleContainer.backgroundColor;
                    container.style.minWidth = `${minWidth}px`;
                    container.style.minHeight = `${minHeight}px`;
                    console.log(`setData: Применены стили для узла ${nodeId}: width=${container.style.width}, height=${container.style.height}`);
                }
            }

            if (updates.styleLine) {
                if (!node.data.styleLine || typeof node.data.styleLine !== 'object') {
                    node.data.styleLine = { ...LINE_STYLES.STRAIGHT };
                }
                if (!node.data.styleLine.style || typeof node.data.styleLine.style !== 'object') {
                    node.data.styleLine.style = { ...LINE_STYLES.STRAIGHT.style };
                }

                if (updates.styleLine.type) {
                    const type = updates.styleLine.type.toUpperCase();
                    if (!LINE_STYLES[type]) {
                        console.warn(`Стиль линии ${type} не найден в LINE_STYLES`);
                        return;
                    }

                    const currentStroke = node.data.styleLine.style.stroke || LINE_STYLES[type].style.stroke;
                    const currentStrokeWidth = node.data.styleLine.style.strokeWidth || LINE_STYLES[type].style.strokeWidth;

                    node.data.styleLine = {
                        type: updates.styleLine.type,
                        style: { ...JSON.parse(JSON.stringify(LINE_STYLES[type].style)) }
                    };

                    node.data.styleLine.style.stroke = currentStroke;
                    node.data.styleLine.style.strokeWidth = currentStrokeWidth;
                } else if (updates.styleLine.style) {
                    Object.assign(node.data.styleLine.style, updates.styleLine.style);
                } else {
                    console.warn('Пропущено обновление styleLine: некорректные данные', updates.styleLine);
                }
            }

            if (updates.globalStyle) {
                if (!node.data.topic.globalStyle) {
                    node.data.topic.globalStyle = {};
                }
                Object.assign(node.data.topic.globalStyle, updates.globalStyle);

                if (topic) {
                    if (updates.globalStyle.color) topic.style.color = updates.globalStyle.color;
                    if (updates.globalStyle.fontSize) topic.style.fontSize = updates.globalStyle.fontSize;
                    if (updates.globalStyle.fontFamily) topic.style.fontFamily = updates.globalStyle.fontFamily;
                    jm.saveNodeContent(nodeId, topic);
                }
            }
        });

        requestAnimationFrame(() => {
            jm.layout(jm.activeNode);
            jm.drawLines();
        });
    } catch (error) {
        console.error('Ошибка в методе setData: ' + error);
    }
}
