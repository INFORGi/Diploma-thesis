export class Renderer {
    constructor(container, jsPlumbInstance) {
        if (new.target === Renderer) {
            throw new Error("Renderer is an abstract class and cannot be instantiated directly");
        }
        this.container = container;
        this.jsPlumb = jsPlumbInstance;
    }

    renderNode(node, parentElement) {
        throw new Error("Method 'renderNode()' must be implemented");
    }

    renderConnection(source, target) {
        throw new Error("Method 'renderConnection()' must be implemented");
    }

    updateNodePosition(node) {
        throw new Error("Method 'updateNodePosition()' must be implemented");
    }
}