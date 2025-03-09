export const LINE_STYLES = {
    DEFAULT: "default",
    DASHED: "dashed",
    CURVED: "curved",
    ARROW: "arrow",
    NO_ENDPOINTS: "no_endpoints"
};

export const DEFAULT_NODE_STYLE = {
    width: "auto",
    minWidth: "120px",
    maxWidth: "200px",
    padding: "10px 15px",
    margin: "5px",
    backgroundColor: "#ffffff",
    color: "#333333",
    border: "1px solid #cccccc",
    borderRadius: "5px",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    fontWeight: "normal",
    textAlign: "center",
    lineHeight: "1.4",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    cursor: "pointer",
    position: "absolute",
    transition: "all 0.3s ease",
    overflow: "hidden",
    whiteSpace: "wrap",
    textOverflow: "ellipsis",
    userSelect: "none",
    zIndex: "1"
};


export const CONNECTION_DIRECTIONS = {
    RIGHT: "Right",
    LEFT: "Left",   
    BOTTOM: "Bottom",
    TOP: "Top",
};

export const DEFAULT_META = {
    name: "DEFAULT NAME",
    author: "INFORG",
    version: "0.0"
};

export const DEFAULT_OPTIONS = {
    editable: true,
    theme: ""
};

export const MIND_MAP_THEMES = {
    default: {
        canvas: {
            backgroundColor: '#ffffff'
        },
        node: {
            backgroundColor: '#ffffff',
            color: '#333333',
            borderColor: '#cccccc',
            borderWidth: '1px',
            shadow: '0 2px 5px rgba(0,0,0,0.1)',
            hoverShadow: '0 0 10px rgba(0,0,0,0.2)'
        },
        root: {
            backgroundColor: '#f0f0f0',
            borderColor: '#d0d0d0'
        },
        line: {
            color: '#555555',
            width: '2px'
        }
    },
    dark: {
        canvas: {
            backgroundColor: '#1a1a1a'
        },
        node: {
            backgroundColor: '#2d2d2d',
            color: '#e0e0e0',
            borderColor: '#404040',
            borderWidth: '1px',
            shadow: '0 2px 5px rgba(0,0,0,0.3)',
            hoverShadow: '0 0 10px rgba(255,255,255,0.1)'
        },
        root: {
            backgroundColor: '#404040',
            borderColor: '#505050'
        },
        line: {
            color: '#606060',
            width: '2px'
        }
    },
    blue: {
        canvas: {
            backgroundColor: '#f5f9ff'
        },
        node: {
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            borderColor: '#90caf9',
            borderWidth: '1px',
            shadow: '0 2px 5px rgba(25,118,210,0.1)',
            hoverShadow: '0 0 10px rgba(25,118,210,0.2)'
        },
        root: {
            backgroundColor: '#1976d2',
            borderColor: '#1565c0',
            color: '#ffffff'
        },
        line: {
            color: '#64b5f6',
            width: '2px'
        }
    }
};