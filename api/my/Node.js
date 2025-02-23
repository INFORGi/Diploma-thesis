export class Node {
    constructor(id, topic, style = {}, x = 0, y = 0, connectionType = 'right', children = [], draggable = true) {
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
        Object.assign(this, newData);
    }
}