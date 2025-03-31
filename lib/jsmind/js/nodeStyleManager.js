import { FIGURE, TOPIC_STYLES } from '../../../data/constants.js';

export class NodeStyleManager {
    constructor(jm) {
        this.jm = jm;
    }

    updateNodeStyle(node, styleType, value) {
        const nodeData = this.jm.nodes.get(node.id);
        if (!nodeData) return;

        const styles = {
            backgroundColor: () => nodeData.data.styleNode.shapeSvg.fill = value,
            textColor: () => nodeData.data.styleTopic.color = value,
            borderColor: () => nodeData.data.styleNode.shapeSvg.stroke = value,
            bold: () => nodeData.data.styleTopic.fontWeight = nodeData.data.styleTopic.fontWeight === 'bold' ? 'normal' : 'bold',
            italic: () => nodeData.data.styleTopic.fontStyle = nodeData.data.styleTopic.fontStyle === 'italic' ? 'normal' : 'italic',
            underline: () => nodeData.data.styleTopic.textDecoration = nodeData.data.styleTopic.textDecoration === 'underline' ? 'none' : 'underline'
        };

        if (styles[styleType]) {
            styles[styleType]();
            this.jm.updateNodeStyles(node.id);
        }
    }

    changeNodeShape(node, shapeName) {
        const nodeData = this.jm.nodes.get(node.id);
        if (!nodeData || !FIGURE[shapeName]) return;

        const oldStyles = {
            fill: nodeData.data.styleNode.shapeSvg?.fill,
            stroke: nodeData.data.styleNode.shapeSvg?.stroke,
            topicStyles: { ...nodeData.data.styleTopic }
        };

        // Создаем глубокую копию нового стиля
        nodeData.data.styleNode = JSON.parse(JSON.stringify(FIGURE[shapeName]));
        
        // Сохраняем старые цвета
        if (oldStyles.fill) {
            nodeData.data.styleNode.shapeSvg.fill = oldStyles.fill;
        }
        if (oldStyles.stroke) {
            nodeData.data.styleNode.shapeSvg.stroke = oldStyles.stroke;
        }

        nodeData.data.styleTopic = oldStyles.topicStyles;

        this.jm.updateNode(node.id, nodeData.data);
    }

    getCurrentStyles(node) {
        const nodeData = this.jm.nodes.get(node.id);
        if (!nodeData) return null;

        return {
            backgroundColor: nodeData.data.styleNode.shapeSvg?.fill || '#ffffff',
            textColor: nodeData.data.styleTopic.color || '#333333',
            borderColor: nodeData.data.styleNode.shapeSvg?.stroke || '#cccccc',
            fontWeight: nodeData.data.styleTopic.fontWeight,
            fontStyle: nodeData.data.styleTopic.fontStyle,
            textDecoration: nodeData.data.styleTopic.textDecoration
        };
    }
}
