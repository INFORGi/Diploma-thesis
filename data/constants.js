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
    position: "relative",
    zIndex: "2",
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "normal",
    textAlign: "center",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    overflow: "hidden",
    boxSizing: "border-box",
    maxHeight: "100%"
};

export const NODE_STYLES = {
    position: "absolute",
    backgroundColor: "transparent",
    minWidth: "150px", 
    minHeight: "50px",    
    width: "auto",
    height: "auto",
    maxWidth: "300px", 
    borderRadius: '5px',
    cursor: "pointer",
    userSelect: "none", 
    outline: "none",
    zIndex: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px"
};

export const FIGURE = {
    RECTANGLE: {
        tag: "rect",
        fill: "#ffffff",
        stroke: "#cccccc",
        strokeWidth: "1",
        rx: "10",
        width: "100%",
        height: "100%"
    },
    TRAPEZOID: {
        tag: "path",
        dNormalized: [
            { x: 0, y: 0, fixedOffset: 20 },    // Левый верхний угол, отступ 20px от левого края
            { x: 1, y: 0, fixedOffset: 20 },    // Правый верхний угол, отступ 20px от правого края
            { x: 1, y: 1 },                     // Правый нижний угол (полная ширина)
            { x: 0, y: 1 }                      // Левый нижний угол (полная ширина)
        ],
        fill: "#ffffff",
        stroke: "#cccccc",
        strokeWidth: "1"
    },
    SKEWED_RECTANGLE: {
        tag: "path",
        dNormalized: [
            { x: 0, y: 0, fixedOffset: 15 },    // Левый верхний угол, отступ 15px от левого края
            { x: 1, y: 0 },                     // Правый верхний угол (полная ширина)
            { x: 1, y: 1, fixedOffset: 15 },    // Правый нижний угол, отступ 15px от правого края
            { x: 0, y: 1 }                      // Левый нижний угол (полная ширина)
        ],
        fill: "#ffffff",
        stroke: "#cccccc",
        strokeWidth: "1"
    },
    NOTCHED_RECTANGLE: {
        tag: "path",
        dNormalized: [
            { x: 0, y: 0 },                     // Левый верхний угол
            { x: 1, y: 0 },                     // Правый верхний угол
            { x: 1, y: 1 },                     // Правый нижний угол
            { x: 0.2, y: 1 },                   // Точка выреза снизу (20% ширины)
            { x: 0, y: 0.8, fixedOffset: 20 }   // Точка выреза слева, отступ 20px от нижнего края
        ],
        fill: "#ffffff",
        stroke: "#cccccc",
        strokeWidth: "1"
    }
};

export const DEFAULT_NODE_DATA = {
    id: null,
    topic: {
        text: 'Текст',
        color: "#333333",
        fontSize: "14px",
        fontFamely: "Arial, sans-serif"
    },
    parent: null,
    children: {},
    styleNode: { ...NODE_STYLES },
    figure: { ...FIGURE.RECTANGLE },
    styleTopic: { ...TOPIC_STYLES },
    styleLine: { ...LINE_STYLES.DEFAULT },
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
        line: { color: '#555555', width: '2px' },
        borderColorNode: '2px solid #0267fd' 
    },
    dark: {
        canvas: { backgroundColor: '#1a1a1a' },
        node: { backgroundColor: '#2d2d2d', borderColor: '#404040' },
        topic: { color: '#e0e0e0' },
        line: { color: '#606060', width: '2px' },
        borderColorNode: '2px solid #4a9eff'
    }
};

export const INDENTATION_BETWEEN_BUTTON_NODE = 20;
export const SPACING_WIDTH = 100;
export const SPACING_HEIGHT = 50;