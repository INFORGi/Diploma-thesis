export class Node {
    constructor(id, topic, style = {}, x = 0, y = 0, connectionType = "left", children = [], draggable = true) {
        this.id = id;
        this.topic = topic;
        this.style = style;
        this.x = x;
        this.y = y;
        this.connectionType = connectionType;
        this.children = children;
        this.draggable = draggable;
    }

    update(newData) {
        this.topic = newData.topic || this.topic;
        this.style = { ...this.style, ...newData.style };
        this.x = newData.x || this.x;
        this.y = newData.y || this.y;
        this.connectionType = newData.connectionType || this.connectionType;
        this.draggable = newData.draggable !== undefined ? newData.draggable : this.draggable;
    }
}
