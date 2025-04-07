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
    alignItems: "flex-start",
    justifyContent: "flex-start",
    fontWeight: "normal",
    textAlign: "justify",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    overflow: "hidden",
    textOverflow: "ellipsis",
    boxSizing: "border-box",
    padding: "10px",
    margin: "0"
};

export const NODE_STYLES = {
    position: "absolute",
    backgroundColor: "transparent",
    minWidth: "100px", 
    minHeight: "50px",    
    width: "fit-content", 
    height: "fit-content", 
    maxWidth: "300px", 
    borderRadius: '5px',
    cursor: "pointer",
    userSelect: "none", 
    outline: "none",
    zIndex: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
}

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
            { x: 0.2, y: 0 },
            { x: 0.8, y: 0 },
            { x: 1, y: 1 },
            { x: 0, y: 1 }
        ],
        fill: "#ffffff",
        stroke: "#cccccc",
        strokeWidth: "1"
    },
    SKEWED_RECTANGLE: {
        tag: "path",
        dNormalized: [
            { x: 0.1, y: 0 },
            { x: 1, y: 0 },
            { x: 0.9, y: 1 },
            { x: 0, y: 1 }
        ],
        fill: "#ffffff",
        stroke: "#cccccc",
        strokeWidth: "1"
    },
    NOTCHED_RECTANGLE: {
        tag: "path",
        dNormalized: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 0.2, y: 1 },
            { x: 0, y: 0.8 }
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
        line: { color: '#606060', width: '2px' }
    }
};

export const INDENTATION_BETWEEN_BUTTON_NODE = 20;
export const SPACING_WIDTH = 100;
export const SPACING_HEIGHT = 50;