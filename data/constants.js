export const LINE_STYLES = {
    STRAIGHT: {
        type: "straight",

        style: {
            stroke: "#555555",
            strokeWidth: "2px",
            fill: "none"
        }
    },
    CURVED: {
        type: "curved",

        style: {
            stroke: "#555555",
            strokeWidth: "2px",
            fill: "none",
            strokeLinecap: "round",
            strokeLinejoin: "round"
        }
    },
    BEZIER: {
        type: "bezier",
        style: {
            stroke: "#555555",
            strokeWidth: "2px",
            fill: "none",
            strokeLinecap: "round",
            strokeLinejoin: "round"
        }
    }
};

export const TOPIC_STYLES = {
    width: "100%",
    height: "100%",
    padding: "8px 15px",
    color: "#333333",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    fontWeight: "normal",
    textAlign: "center",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    overflow: "hidden",
    textOverflow: "ellipsis"
};

export const NODE_STYLES = {
    BASE_NODE: {
        type: "div",
        styles: {
            position: "absolute",
            backgroundColor: "transparent", // Прозрачный фон для всех узлов
            minWidth: "120px",
            minHeight: "40px",
            padding: "0",
            margin: "5px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            userSelect: "none", 
            outline: "none",
            zIndex: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        }
    },
    RECTANGLE: {
        styles: {
            backgroundColor: "#ffffff", // Переопределяем прозрачность для прямоугольника
            border: "1px solid #cccccc",
            borderRadius: "5px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }
    },
    TRAPEZOID: {
        shapeSvg: {
            width: "120px",
            height: "40px",
            tag: "polygon",
            points: "24,0 96,0 120,40 0,40", // Трапеция
            fill: "#ffffff",
            stroke: "#cccccc",
            strokeWidth: "1"
        }
    },
    SKEWED_RECTANGLE: {
        shapeSvg: {
            width: "120px",
            height: "40px",
            tag: "polygon",
            points: "12,0 120,0 108,40 0,40", // Скошенный прямоугольник
            fill: "#ffffff",
            stroke: "#cccccc",
            strokeWidth: "1"
        }
    },
    NOTCHED_RECTANGLE: {
        shapeSvg: {
            width: "120px",
            height: "40px",
            tag: "polygon",
            points: "0,0 120,0 120,40 24,40 0,32", // Вырез
            fill: "#ffffff",
            stroke: "#cccccc",
            strokeWidth: "1"
        }
    }
};
export const DEFAULT_NODE_DATA = {
    id: null,
    topic: null,
    parent: null,
    children: {},
    styleNode: NODE_STYLES.RECTANGLE,
    styleTopic: TOPIC_STYLES,
    styleLine: LINE_STYLES.DEFAULT,
    position: { x: 0, y: 0 },
    draggable: true
};

export const DEFAULT_OPTIONS = {
    container: "jsmind_container",
    theme: "default"
};

export const MIND_MAP_THEMES = {
    default: {
        canvas: { backgroundColor: '#ffffff' },
        node: { backgroundColor: '#ffffff', borderColor: '#cccccc' },
        topic: { color: '#333333' },
        line: { color: '#555555', width: '2px' }
    },
    dark: {
        canvas: { backgroundColor: '#1a1a1a' },
        node: { backgroundColor: '#2d2d2d', borderColor: '#404040' },
        topic: { color: '#e0e0e0' },
        line: { color: '#606060', width: '2px' }
    }
};