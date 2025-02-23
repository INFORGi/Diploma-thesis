import { LINE_STYLES } from '../../data/constants.js';
import { CONNECTION_DIRECTIONS } from '../../data/constants.js';

export class Connection {
    constructor(jsPlumbInstance, sourceNode, targetNode, styleType = "default") {
        this.jsPlumbInstance = jsPlumbInstance;
        this.sourceNode = sourceNode;
        this.targetNode = targetNode;
        this.styleType = styleType;
        this.connection = null;
    
        this.lineStyles = LINE_STYLES;
    
        setTimeout(() => {
            this.createConnection();
            this.applyStyle(this.styleType);
        }, 100); // Задержка в 100 мс
    }
    

    // Создание базового соединения
    createConnection() {
        if (!this.jsPlumbInstance) {
            console.error("Ошибка: jsPlumbInstance не определён");
            return;
        }
    
        // Проверяем, есть ли такие элементы в DOM
        if (!document.getElementById(this.sourceNode.id)) {
            console.error(`Ошибка: sourceNode ${this.sourceNode.id} не найден в DOM`);
            return;
        }
        if (!document.getElementById(this.targetNode.id)) {
            console.error(`Ошибка: targetNode ${this.targetNode.id} не найден в DOM`);
            return;
        }
    
        const styleParams = this.getStyleParams(this.styleType);
    

        const sourceElement = document.getElementById(this.sourceNode.id);
        const targetElement = document.getElementById(this.targetNode.id);

        console.log('Source position:', sourceElement.getBoundingClientRect());
        console.log('Target position:', targetElement.getBoundingClientRect());


        const commonParams = {
            source: this.sourceNode.id,
            target: this.targetNode.id,
            anchors: [
                this.getAnchorPosition(this.sourceNode, "source"), 
                this.getAnchorPosition(this.targetNode, "target")
            ],
            detachable: false,
            editable: false,
            endpoints: styleParams.endpoints || ["Blank", "Blank"], 
        };
    
        this.connection = this.jsPlumbInstance.connect(commonParams);
    }

    // Заполняем параметры стиля
    applyStyle(styleType) {
        if (!this.connection) {
            console.error("Ошибка: connection не определён!");
            return;
        }
    
        const styleParams = this.getStyleParams(styleType);
    
        if (styleParams.paintStyle) this.connection.setPaintStyle(styleParams.paintStyle);
        if (styleParams.connector) this.connection.setConnector(styleParams.connector);
        if (styleParams.overlays) this.connection.setOverlays(styleParams.overlays);
    }

    // Генератор параметров стиля
    getStyleParams(styleType, color = "#000") {
        const params = {};

        switch (styleType) {
            case this.lineStyles.DASHED:
                params.paintStyle = { stroke: color, strokeWidth: 2, dashstyle: "5 5" };
                params.connector = ["Straight"];
                params.endpoints = ["Blank", "Blank"];
                break;

            case this.lineStyles.CURVED:
                params.paintStyle = { stroke: color, strokeWidth: 4 };
                params.connector = ["Bezier", { curvature: 0.7 }];
                params.endpoints = [
                    { 
                        type: "Dot", 
                        radius: 6,
                        fill: "transparent",
                        paintStyle: { stroke: color, strokeWidth: 2 }
                    },
                    "Blank"
                ];
                break;

            case this.lineStyles.ARROW:
                params.paintStyle = { stroke: color, strokeWidth: 3 };
                params.connector = ["Straight"];
                params.overlays = [
                    ["Arrow", { 
                        location: 1, 
                        width: 14, 
                        height: 14, 
                        foldback: 0.8,
                        fill: "#fff"
                    }]
                ];
                params.endpoints = ["Blank", "Blank"];
                break;

            case this.lineStyles.NO_ENDPOINTS:
                params.paintStyle = { stroke: color, strokeWidth: 3 };
                params.connector = ["Flowchart", { stub: 20 }];
                params.overlays = [
                    ["Label", { 
                        label: "Text", 
                        cssClass: "connection-checkmark",
                        location: 0.5
                    }]
                ];
                params.endpoints = ["Blank", "Blank"];
                break;

            default:
                params.paintStyle = { stroke: color, strokeWidth: 3 };
                params.connector = ["Bezier", { curvature: 0.5 }];
                params.endpoints = ["Blank", "Blank"];
        }

        return params;
    }

    // getAnchorPosition(node, type) {
    //     switch (node.connectionType) {
    //         case "left": return type === "source" ? CONNECTION_DIRECTIONS.LEFT : CONNECTION_DIRECTIONS.RIGHT;
    //         case "right": return type === "source" ? CONNECTION_DIRECTIONS.RIGHT : CONNECTION_DIRECTIONS.LEFT;
    //         case "top": return type === "source" ? CONNECTION_DIRECTIONS.TOP : CONNECTION_DIRECTIONS.TOP;
    //         case "bottom": return type === "source" ? CONNECTION_DIRECTIONS.BOTTOM : CONNECTION_DIRECTIONS.TOP;
    //         default: return "Center";
    //     }
    // }

    getAnchorPosition(node, type) {
        switch (node.connectionType) {
            case "left":
                // Для левого соединения:
                // - source (родитель) привязывается к правой стороне
                // - target (ребёнок) привязывается к левой стороне
                return type === "source" ? [1, 0.5, 0, 0] : [0, 0.5, 0, 0];
            case "right":
                return type === "source" ? [0, 0.5, 0, 0] : [1, 0.5, 0, 0];
            default:
                return "Center";
        }
    }
}