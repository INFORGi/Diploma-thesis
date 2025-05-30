export const LINE_STYLES = {
    STRAIGHT: {
        type: "straight",
        style: {
            stroke: "#555555",
            strokeWidth: "2",
            fill: "none"
        }
    },
    CURVED: {
        type: "curved",
        style: {
            stroke: "#555555",
            strokeWidth: "2",
            fill: "none",
            strokeLinecap: "round",
            strokeLinejoin: "round"
        }
    },
    BEZIER: {
        type: "bezier",
        style: {
            stroke: "#555555",
            strokeWidth: "2",
            fill: "none",
            strokeLinecap: "round",
            strokeLinejoin: "round"
        }
    },
    DASHED: {
        type: "dashed",
        style: {
            stroke: "#555555",
            strokeWidth: "2",
            fill: "none",
            strokeDasharray: "5,5"
        }
    },
    DOTTED: {
        type: "dotted",
        style: {
            stroke: "#555555",
            strokeWidth: "2",
            fill: "none",
            strokeDasharray: "2,6",
            strokeLinecap: "round"
        }
    }
};

export const TOPIC_STYLES = {
    position: "relative",
    width: "100%",
    height: "100%",
    zIndex: "2",
    display: "flex",
    flexDirection: "column",
    alignItems: "normal",
    justifyContent: "stretch",
    fontWeight: "normal",
    textAlign: "justify",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    overflow: "auto",
    boxSizing: "border-box",
    padding: "10px",
};

export const NODE_STYLES = {
    position: "absolute",
    width: "auto",
    height: "auto",
    cursor: "pointer",
    userSelect: "none", 
    outline: "none",
    zIndex: "1",
    padding: "10px"
};

export const CONTAINER_STYLES = {
    backgroundColor: "#ffffff",
    minWidth: '250px',
    minHeight: '200px',
    maxWidth: '900px',
    maxHeight: '800px',
    width: '250px',
    height: '200px',
    border: "3px solid #cccccc",
    borderRadius: '15px',
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    overflow: "visible"
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
        fill: "#ffffff",
        stroke: "#cccccc",
        strokeWidth: "1",
        rx: "10",
        allowedSpace: {
            width: "90%",
            height: "90%"
        }
    },
    TRAPEZOID: {
        tag: "path",
        dNormalized: [
            { x: 0, y: 0, fixedOffset: 20 },
            { x: 1, y: 0, fixedOffset: 20 },    
            { x: 1, y: 1 },                    
            { x: 0, y: 1 }                      
        ],
        fill: "#ffffff",
        stroke: "#cccccc",
        strokeWidth: "1",
        rx: "10",
        allowedSpace: {
            width: null,
            height: null
        }
    },
    SKEWED_RECTANGLE: {
        tag: "path",
        dNormalized: [
            { x: 0, y: 0, fixedOffset: 5 },   
            { x: 1, y: 0 },                    
            { x: 1, y: 1, fixedOffset: 5 },  
            { x: 0, y: 1 }                      
        ],
        fill: "#ffffff",
        stroke: "#cccccc",
        strokeWidth: "1",
        rx: "0",
        allowedSpace: {
            width: null,
            height: null
        }
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
        fill: "#ffffff",
        stroke: "#cccccc",
        rx: "0",
        strokeWidth: "1",
        allowedSpace: {
            width: null,
            height: null
        }
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
        fill: "#ffffff",
        stroke: "#cccccc",
        strokeWidth: "1",
        rx: "10",
        allowedSpace: {
            width: null,
            height: null
        }
    }
};

export const BASIC_CONTAINER = {
    h1: '<h1 style="font-family: Arial; color: #000000; font-style: normal; text-decoration: none; font-size: 32px; font-weight: bold;"></h1>',
    h2: '<h2 style="font-family: Arial; color: #000000; font-style: normal; text-decoration: none; font-size: 34.5px; font-weight: bold;"></h2>',
    h3: '<h3 style="font-family: Arial; color: #000000; font-style: normal; text-decoration: none; font-size: 26.9px; font-weight: bold;"></h3>',
    p: '<p class="parent-style" style="font-family: Arial; font-size: 14px; color: #000000; font-weight: normal; font-style: normal; text-decoration: none;"></p>',
    ul: '<ul style=""></ul>',
    ol: '<ol style=""></ol>',
    li: '<li style="font-family: Arial; font-size: 14px; color: #000000; font-weight: normal; font-style: normal; text-decoration: none;"></li>',
    img: '<img src="" alt="Image" style="width: 100px; height: 100px; object-fit: cover; border-radius: 10px;">',
};

export const DEFAULT_NODE_DATA = {
    id: null,
    topic: {
        text: { ...BASIC_CONTAINER.p},
        globalStyle: {
            color: '#000',
            fontSize: '14px',
            fontFamily: 'Arial'
        },
    },  
    parent: null,
    children: {},
    styleNode: { ...NODE_STYLES },
    styleContainer: { ...CONTAINER_STYLES },
    styleTopic: { ...TOPIC_STYLES },
    styleLine: { ...LINE_STYLES.STRAIGHT },
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
        canvas: { backgroundColor: '#2d2d2d' },
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

export const MENU_CONTROLS = {
    text: {
        fontFamily: '#font-family',
        fontSize: '#font-size',
        textColor: '#text-color',
        boldBtn: '#bold-btn',
        italicBtn: '#italic-btn',
        underlineBtn: '#underline-btn'
    },
    image: {
        path: '#img-path',
        width: '#img-width',
        height: '#img-height',
        position: '#img-position',
        select: '#img-select',
        upload: '#img-upload'
    },
    list: {
        toUnordered: '#to-ul-btn',      // Кнопка для преобразования в ul
        toOrdered: '#to-ol-btn'         // Кнопка для преобразования в ol
    }
};

export const INDENTATION_BETWEEN_BUTTON_NODE = 20;
export const SPACING_WIDTH = 100;
export const SPACING_HEIGHT = 50;
export const CANVAS_SIZE_BUTTON = 25;
export const PADDING_WITH_NODE = 1;
export const DOUBLE_CLICK_DELAY = 300;