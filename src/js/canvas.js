import { initWindowDragging, initButtonHandlers, initDropdownStyleMenu, setTheme } from './windowManager.js';
import { jsMind } from '../lib/jsmind/js/jsmind.js';
import { TOPIC_STYLES, CONTAINER_STYLES, LINE_STYLES, NODE_STYLES } from '../data/constants.js';
import { initSelection } from './modules/selection.js';
import { initMenuSystem, initButtonMenu } from './modules/menuSystem.js';
import { nodeAddButtonActive, nodeAddButtonDisable, addNewNode } from './modules/nodeButtons.js';

let jm = null;
let renderMap = document.getElementById('map-type');
let mapZoom = document.getElementById('map-zoom');

function init() {
    initWindowDragging();
    initButtonHandlers();
    initDropdownStyleMenu();
    initJsMind();
    initMenuSystem();
    initSelection();
    initButtonMenu();

    addValidation('#border-width', 1, 10);
}

function initJsMind() {
    try {
        const initialData = {
            settings: {
                container: 'jsmind_container',
                theme: 'dark',
                onNodeAddButtonActive: () => nodeAddButtonActive(),
                onNodeAddButtonDisable: () => nodeAddButtonDisable(),
                cascadeRemove: true,
                renderMap: "mind",
            },
            data: { 
                id: 'root', 
                topic: {
                    text: `<h1 class="parent-style" style="font-family: Arial; color: #000000; text-decoration: none; font-size: 32px; font-weight: bold;">Главная тема</h1>
                    <ul><li class="parent-style" style="font-family: Arial; font-size: 14px; color: #000000; font-weight: normal; font-style: normal; text-decoration: none;">Первый пункт</li><li style="font-family: Arial; font-size: 14px; color: #000000; font-weight: normal; font-style: normal; text-decoration: none;">Второй пункт</li></ul>
                    <img src="C:/Users/shulg/OneDrive/Pictures/Screenshots/ccc.png" style="width:100px; height:100px;" alt="Test image" />`,
                    globalStyle: {
                        color: '#0329a4',
                        fontSize: '14px',
                        fontFamily: 'Arial'
                    }
                },                
                parent: null,
                children: [],
                styleNode: JSON.parse(JSON.stringify(NODE_STYLES)),
                styleContainer: {...JSON.parse(JSON.stringify(CONTAINER_STYLES)) },
                styleTopic: JSON.parse(JSON.stringify(TOPIC_STYLES)),
                styleLine: JSON.parse(JSON.stringify(LINE_STYLES.DASHED)),
                position: { x: 0, y: 0 },
                draggable: false,
            }
        };

        jm = new jsMind(initialData);
        jm.show();
        
        window.jm = jm;

        renderMap.value = jm.settings.renderMap;
        mapZoom.value = 50;
    } catch (error) {
        console.error('Error initializing jsMind:', error);
    }
}

function addValidation(selector, min, max) {
    const input = document.querySelector(selector);
    if (!input) return;

    input.addEventListener('input', () => {
        const value = parseInt(input.value);
        input.value = isNaN(value) ? min : Math.max(min, Math.min(max, value));
    });
}

document.addEventListener("DOMContentLoaded", () => {
    init();
    window.electron.onLoadSettings(settings => setTheme(settings.Theme));
});