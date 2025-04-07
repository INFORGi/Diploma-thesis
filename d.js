    // async createNodeElement(data) {
    //     const node = document.createElement('div');
    //     node.id = data.id;
    //     node.dataset.isroot = !data.parent ? 'true' : 'false';
    //     node.className = 'jsmind-node';

    //     Object.assign(node.style, JSON.parse(JSON.stringify(NODE_STYLES)));

    //     const containerWithTextShape = document.createElement('div');
    //     containerWithTextShape.className = 'jsmind-node-content';
        
    //     if (data.figure) {
    //         const shape = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    //         shape.classList.add('node-shape');
    //         shape.style.width = '100%';
    //         shape.style.height = '100%';
    //         shape.setAttribute('preserveAspectRatio', 'none');
    //         shape.setAttribute('viewBox', `0 0 100 100`);

    //         const shapeElement = document.createElementNS("http://www.w3.org/2000/svg", data.figure.tag);
 
    //         shapeElement.setAttribute('fill', data.figure.fill || '#ffffff');
    //         shapeElement.setAttribute('stroke', data.figure.stroke || '#cccccc');
    //         shapeElement.setAttribute('stroke-width', data.figure.strokeWidth || '1');

    //         if (data.figure.tag === 'path' && data.figure.dNormalized) {
    //             shapeElement.setAttribute('d', this.generatePathD(data.figure.dNormalized, data.figure.width, data.figure.height));
    //         } else if (data.figure.tag === 'rect') {
    //             shapeElement.setAttribute('width', '100%');
    //             shapeElement.setAttribute('height', '100%');
    //             if (data.figure.rx) {
    //                 shapeElement.setAttribute('rx', data.figure.rx);
    //             }
    //         }

    //         shape.appendChild(shapeElement);
    //         containerWithTextShape.appendChild(shape);
    //     }

    //     const topic = document.createElement('div');
    //     topic.className = 'node-topic';
    //     topic.contentEditable = 'false';

    //     const markdownText = data.topic.text || '';
    //     topic.dataset.markdown = markdownText;
    //     topic.innerHTML = await window.electron.renderMarkdown(markdownText);
        
    //     topic.style.color = data.topic.color;
    //     topic.style.fontSize = data.topic.fontSize;
    //     topic.style.fontFamily = data.topic.fontFamily;      

    //     topic.spellcheck = false;

    //     Object.assign(topic.style, data.styleTopic);

    //     this.setupTopicEventListeners(topic);
    //     containerWithTextShape.appendChild(topic);
        
    //     node.appendChild(containerWithTextShape);

    //     node.style.left = `${data.position.x}px`;
    //     node.style.top = `${data.position.y}px`;

    //     this.container.appendChild(node);
    //     if (data.draggable) {
    //         this.makeNodeDraggable(node);
    //     }

    //     return node;
    // }

        // setupTopicEventListeners(topic) {
    //     topic.addEventListener('dblclick', (e) => {
    //         e.stopPropagation();
    //         topic.contentEditable = 'true';

    //         const originalMarkdown = topic.dataset.markdown || topic.textContent;
    //         topic.textContent = originalMarkdown;
    //         topic.classList.add('editing');
    //         topic.focus();
            
    //         console.log('Editing started with:', originalMarkdown);
    //     });
    
    //     topic.addEventListener('blur', async () => {
    //         topic.contentEditable = 'false';
    //         topic.classList.remove('editing');
    
    //         const nodeId = topic.closest('.jsmind-node').id;
    //         const nodeData = this.nodes.get(nodeId);
    //         const markdown = topic.textContent.trim() || 'Текст';

    //         topic.dataset.markdown = markdown;
    //         nodeData.data.topic.text = markdown;

    //         topic.innerHTML = await window.electron.renderMarkdown(markdown);
            
    //         console.log('Updated node data:', nodeData);
    //     });
    
    //     topic.addEventListener('keydown', (e) => {
    //         if (e.key === 'Enter' && !e.shiftKey) {
    //             e.preventDefault();
    //             topic.blur();
    //         }
    //     });
    // }