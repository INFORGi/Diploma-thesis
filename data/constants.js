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
    // width: "100%",
    // height: "100%",
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
    // maxHeight: "100%"
};

export const NODE_STYLES = {
    position: "absolute",
    backgroundColor: "transparent",
    // minWidth: "150px", 
    // minHeight: "50px",    
    width: "auto",
    height: "auto",
    // maxWidth: "300px", 
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
        tag: "path",
        dNormalized: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 0, y: 1 }
        ],
        fill: null,
        stroke: null,
        strokeWidth: "1",
        rx: "10"
    },
    TRAPEZOID: {
        tag: "path",
        dNormalized: [
            { x: 0, y: 0, fixedOffset: 20 },
            { x: 1, y: 0, fixedOffset: 20 },    
            { x: 1, y: 1 },                    
            { x: 0, y: 1 }                      
        ],
        fill: null,
        stroke: null,
        strokeWidth: "1",
        rx: "10"
    },
    SKEWED_RECTANGLE: {
        tag: "path",
        dNormalized: [
            { x: 0, y: 0, fixedOffset: 5 },   
            { x: 1, y: 0 },                    
            { x: 1, y: 1, fixedOffset: 5 },  
            { x: 0, y: 1 }                      
        ],
        fill: null,
        stroke: null,
        strokeWidth: "1",
        rx: "0"
    },
    NOTCHED_RECTANGLE: {
        tag: "path",
        dNormalized: [
            { x: 0, y: 0 },                    
            { x: 1, y: 0 },                    
            { x: 1, y: 1 },                     
            { x: 0.2, y: 1 },                   
            { x: 0, y: 0.8, fixedOffset: 20 }   
        ],
        fill: null,
        stroke: null,
        rx: "0",
        strokeWidth: "1"
    },
    FLATTENED_HEXAGON: {
        tag: "path",
        dNormalized: [
            { x: 0.1, y: 0.5 },    // левая середина
            { x: 0.25, y: 0 },     // верхний левый угол
            { x: 0.75, y: 0 },     // верхний правый угол
            { x: 0.9, y: 0.5 },    // правая середина
            { x: 0.75, y: 1 },     // нижний правый угол
            { x: 0.25, y: 1 },     // нижний левый угол
        ],
        fill: null,
        stroke: null,
        strokeWidth: "1",
        rx: "10"
    }
};

export const DEFAULT_NODE_DATA = {
    id: null,
    topic: {
        text: 'Текст',
        color: '#333',
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
        buttonAdd: { backgroundColor: 'rgb(26, 91, 189)', color: '#fff' },
        selectBorderColorNode: '2px solid #0267fd',
        selectZone: {
            backgroundColor: 'rgba(26, 91, 189, 0.2)',
            border: '1px dashed #0000FF'
        }
    },
    dark: {
        canvas: { backgroundColor: '#1a1a1a' },
        node: { backgroundColor: '#2d2d2d', borderColor: '#404040' },
        topic: { color: '#e0e0e0' },
        line: { color: '#606060', width: '2px' },
        buttonAdd: { backgroundColor: 'rgb(142, 5, 155)', color: '#fff' },
        selectBorderColorNode: '2px solid rgb(255, 74, 134)',
        selectZone: {
            backgroundColor: 'rgba(104, 172, 250, 0.2)',
            border: '1px dashed rgb(174, 174, 255)'
        }
    }
};

export const INDENTATION_BETWEEN_BUTTON_NODE = 20;
export const SPACING_WIDTH = 100;
export const SPACING_HEIGHT = 50;
export const CANVAS_SIZE_BUTTON = 15;