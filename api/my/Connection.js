export class Connection {
    constructor(jsPlumbInstance, sourceNode, targetNode) {
        this.jsPlumbInstance = jsPlumbInstance;
        this.sourceNode = sourceNode;
        this.targetNode = targetNode;
        this.createConnection();
    }

        createConnection() {
            const sourceAnchor = this.getAnchorPosition(this.sourceNode, "source");
            const targetAnchor = this.getAnchorPosition(this.targetNode, "target");

            this.jsPlumbInstance.connect({
                source: this.sourceNode.id,
                target: this.targetNode.id,
                anchors: [sourceAnchor, targetAnchor],
                paintStyle: { stroke: '#E32636', strokeWidth: 3 },
                connectorStyle: { curvature: 0.5 },
                detachable: false,
                editable: false,
            });
        }

    // createConnection() {
    //     this.jsPlumbInstance.connect({
    //         source: this.sourceNode.id,
    //         target: this.targetNode.id,
    //         anchors: [
    //             this.getAnchorPosition(this.sourceNode, "source"),
    //             this.getAnchorPosition(this.targetNode, "target")
    //         ],
    //         paintStyle: { stroke: '#E32636', strokeWidth: 3 },
    //         connector: ["Straight"], // Или CubicBezier для плавных линий
    //         detachable: false,
    //         editable: false,
    //     });
    // }
    
    getAnchorPosition(node, type) {
        switch (node.connectionType) {
            case "left": return type === "source" ? "Left" : "Right";
            case "right": return type === "source" ? "Right" : "Left";
            case "top": return type === "source" ? "Top" : "Bottom";
            case "bottom": return type === "source" ? "Bottom" : "Top";
            default: return "Center";
        }
    }
    
}
