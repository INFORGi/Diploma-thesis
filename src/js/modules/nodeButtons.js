import { INDENTATION_BETWEEN_BUTTON_NODE } from '../../data/constants.js';

export function nodeAddButtonActive() {
    const jm = window.jm;

    if (!jm || jm.activeNode.size !== 1) {
        nodeAddButtonDisable();
        return;
    }

    const nodeId = Array.from(jm.activeNode)[0];
    const node = jm.nodes.get(nodeId)?.element;
    if (!node) {
        console.warn('nodeAddButtonActive: No node found for activeNode[0]');
        return;
    }
    
    const buttonAdd = document.getElementById("create-node");
    if (!buttonAdd) {
        console.warn('nodeAddButtonActive: Button #create-node not found');
        return;
    }

    const nodeRect = node.getBoundingClientRect();
    const offsetX = INDENTATION_BETWEEN_BUTTON_NODE;
    
    let buttonX;
    const nodeData = jm.nodes.get(nodeId);

    if (!nodeData.parent) {
        buttonX = nodeRect.right + offsetX;
    } else {
        const parentNode = document.getElementById(nodeData.parent);
        if (!parentNode) {
            console.warn('nodeAddButtonActive: Parent node not found');
            return;
        }
        
        const parentRect = parentNode.getBoundingClientRect();
        if (parentRect.left - nodeRect.left > 0) {
            buttonX = nodeRect.left - offsetX - 24;
        } else {
            buttonX = nodeRect.right + offsetX;
        }
    }

    buttonAdd.style.left = `${buttonX}px`;
    buttonAdd.style.top = `${nodeRect.top + (nodeRect.height / 2)}px`;
    buttonAdd.style.visibility = 'visible';
}

export function nodeAddButtonDisable() {
    const buttonAdd = document.getElementById("create-node");
    if (buttonAdd) {
        buttonAdd.style.visibility = 'hidden';
    }
}

export function addNewNode(parentId) {
    const jm = window.jm;
    if (!parentId || !jm) {
        console.error('No parent node selected for adding a child or jsMind not initialized');
        return;
    }
    
    jm.addChild(parentId);
}
