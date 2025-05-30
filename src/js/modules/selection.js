import { nodeAddButtonActive, nodeAddButtonDisable, addNewNode } from './nodeButtons.js';

export function initSelection() {
    const selectionBox = document.createElement('div');
    selectionBox.className = 'selection-box';
    document.getElementById('jsmind_container').appendChild(selectionBox);

    let startX, startY;
    let isSelecting = false;
    let justFinishedSelecting = false;

    document.addEventListener('mousedown', (e) => {
        if (!jm || e.target.closest('.menu')) return;

        const clickedNode = e.target.closest('.jsmind-node');
        const clickedCanvas = e.target.id === 'jsmind_container';

        
        if (clickedCanvas) {
            if (!e.ctrlKey) {
                jm.clearActiveNodes();
            }
            nodeAddButtonDisable();
            
            
            if (e.ctrlKey) {
                isSelecting = true;
                startX = e.pageX;
                startY = e.pageY;
                
                selectionBox.style.left = startX + 'px';
                selectionBox.style.top = startY + 'px';
                selectionBox.style.width = '0';
                selectionBox.style.height = '0';
                selectionBox.style.display = 'block';
            }
            return;
        }

        
        if (clickedNode) {
            const currentActive = new Set(jm.activeNode);

            if (e.ctrlKey) {
                
                if (currentActive.has(clickedNode.id)) {
                    
                    jm.removeActiveNode(clickedNode.id);
                } else {
                    
                    jm.addActiveNode(clickedNode.id);
                }
            } else {
                
                jm.clearActiveNodes();
                jm.addActiveNode(clickedNode.id);
            }

            if (jm.activeNode.size === 1) {
                nodeAddButtonActive();
            } else {
                nodeAddButtonDisable();
            }
            
            e.stopPropagation();
            return;
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!isSelecting) return;

        e.preventDefault();

        const currentX = e.pageX;
        const currentY = e.pageY;
        
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';

        const selectionRect = {
            left,
            top,
            right: left + width,
            bottom: top + height
        };

        
        document.querySelectorAll('.jsmind-node').forEach(node => {
            const nodeRect = node.getBoundingClientRect();
            const adjustedNodeRect = {
                left: nodeRect.left + window.pageXOffset,
                top: nodeRect.top + window.pageYOffset,
                right: nodeRect.right + window.pageXOffset,
                bottom: nodeRect.bottom + window.pageYOffset
            };

            const intersects = isRectIntersecting(selectionRect, adjustedNodeRect);
            
            if (intersects && !jm.activeNode.has(node.id)) {
                jm.addActiveNode(node.id);
            } else if (!intersects && jm.activeNode.has(node.id)) {
                jm.removeActiveNode(node.id);
            }
        });

        if (jm.activeNode.size === 1) {
            nodeAddButtonActive();
        } else {
            nodeAddButtonDisable();
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (isSelecting) {
            isSelecting = false;
            justFinishedSelecting = true;
            selectionBox.style.display = 'none';

            if (jm.activeNode.size > 0) {
                jm.setActiveNode(new Set(jm.activeNode));
                if (jm.activeNode.size === 1) {
                    nodeAddButtonActive();
                } else {
                    nodeAddButtonDisable();
                }
            } else {
                jm.setActiveNode([]);
                nodeAddButtonDisable();
            }
            e.stopPropagation();
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.id === 'create-node' && jm.activeNode.size === 1) {
            e.stopPropagation();
            const parentId = Array.from(jm.activeNode)[0];
            addNewNode(parentId);
        }
    });

    window.addEventListener('keydown', async (e) => {
        if (e.key === 'Delete' || e.key === 'Del') {
            if (jm.activeNode.size > 0 && jm.selectedBlockContent === null) {
                await jm.removeNode();
            }
        }
    });

    function isRectIntersecting(rect1, rect2) {
        return rect1.left < rect2.right &&
               rect1.right > rect2.left &&
               rect1.top < rect2.bottom &&
               rect1.bottom > rect2.top;
    }
}