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
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    userSelect: "none",
    zIndex: "1"
};

// Добавим стили для разных типов узлов
export const NODE_THEMES = {
    root: {
        backgroundColor: "#f0f0f0",
        borderWidth: "2px",
        borderColor: "#666666",
        fontWeight: "bold",
        fontSize: "16px"
    },
    left: {
        backgroundColor: "#e1f5fe",
        borderColor: "#81d4fa"
    },
    right: {
        backgroundColor: "#f3e5f5",
        borderColor: "#ce93d8"
    }
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