import { initWindowDragging, initButtonHandlers, initDropdownStyleMenu, setTheme } from './windowManager.js';
import { jsMind } from '../lib/jsmind/js/jsmind.js';
import { StyleManager } from './styleManager.js';

let jm = null; 
let styleManager = null;

function initJsMind() {
    const container = document.getElementById('jsmind_container');
    if (!container) {
        console.log('Container not found');
        return;
    }

    
    console.log('Container dimensions:', {
        width: container.offsetWidth,
        height: container.offsetHeight,
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight
    });

    const options = {
        container: 'jsmind_container',
        theme: 'orange',
        editable: true,
        mode: 'side',
        view: {
            hmargin: 100,
            vmargin: 50,
            line_width: 2,
            line_color: '#555'
        },
        layout: {
            hspace: 200,  
            vspace: 100,  
            pspace: 13
        }
    };

    const mind = {
        meta: {
            name: 'demo',
            author: 'user',
            version: '0.2',
            nodeTypes: {
                main: 'main',
                sub: 'sub',
                child: 'child'
            }
        },
        format: 'node_tree',
        data: {
            id: 'root',
            topic: 'Главная тема',
            type: 'main',
            connectionType: 'straight',
            style: {},
            children: [
                {
                    id: 'left1',
                    topic: 'Левая ветвь 1',
                    direction: 'left',
                    type: 'sub',
                    connectionType: 'curved',
                    style: {},
                    children: [
                        { 
                            id: 'left1.1', 
                            topic: 'Подтема 1.1',
                            type: 'child',
                            connectionType: 'inherit', 
                            style: {}
                        },
                        { 
                            id: 'left1.2', 
                            topic: 'Подтема 1.2',
                            type: 'child',
                            connectionType: 'inherit'
                        }
                    ]
                },
                {
                    id: 'right1',
                    topic: 'Правая ветвь 1',
                    direction: 'right',
                    type: 'sub',
                    connectionType: 'bezier',
                    style: {},
                    children: [
                        { 
                            id: 'right1.1', 
                            topic: 'Подтема 1.1',
                            type: 'child',
                            connectionType: 'inherit'
                        },
                        { 
                            id: 'right1.2', 
                            topic: 'Подтема 1.2',
                            type: 'child',
                            connectionType: 'inherit'
                        }
                    ]
                }
            ]
        }
    };

    try {
        jm = new jsMind(options);
        jm.show(mind);
        jm.initContextMenu();
        
        
        styleManager = new StyleManager('nodeStyleForm');

        
        container.addEventListener('click', (e) => {
            const node = e.target.closest('.jsmind-node');
            if (node) {
                styleManager.setNode(node);
            }
        });

        
        window.addEventListener('resize', () => {
            if (jm) {
                jm.layout();
                jm.drawLines();
            }
        });
    } catch (error) {
        console.error('Error initializing jsMind:', error);
    }
}

function init(){
    initWindowDragging();
    initButtonHandlers();
    initDropdownStyleMenu();
    initJsMind();

    
    document.getElementById('jsmind_container').addEventListener('dblclick', async function(e) {
        const node = e.target.closest('.jsmind-node');

        if (node) {
            const topic = node.querySelector('.node-topic');
            if (topic) {
                topic.focus();
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", function() {
    init();
});


window.electron.onLoadSettings((settings) => {
    setTheme(settings.Theme);
});
