import { NODE_STYLES, CONTAINER_STYLES, LINE_STYLES } from '../../data/constants.js';
import { setData } from './nodeStyles.js';

function updateInputValue(inputElement, value) {
    if (inputElement) {
        inputElement.value = value;
    }
}

export function initInputs() {
    inputs.forEach(({ element, event, handler }) => {
        if (element) {
            const debouncedHandler = debounce(handler, 30);
            element.addEventListener(event, debouncedHandler);
        } else {
            console.warn(`Элемент ввода ${element} не найден`);
        }
    });
}

function debounce(fn, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

export function updateNodeMenu() {
    if (!jm.activeNode.size) return;

    const controls = {
        nodeColor: document.getElementById('node-color'),
        borderColor: document.getElementById('border-color'),
        borderWidth: document.getElementById('border-width'),
        nodeWidth: document.getElementById('node-width'),
        nodeHeight: document.getElementById('node-height'),
        lineStyle: document.getElementById('line-style'),
        lineColor: document.getElementById('line-color'),
        lineWidth: document.getElementById('line-width'),
        globalTextColor: document.getElementById('text-color'),
        globalTextSize: document.getElementById('text-size'),
        globalFontFamily: document.getElementById('font-family')
    };
    
    if (jm.activeNode.size === 1) {
        const nodeId = Array.from(jm.activeNode)[0];
        const node = jm.nodes.get(nodeId);
        if (!node) return;

        const parts = node.data.styleContainer.border.split(' ');
        const borderWidthValue = parts[0] ? parseInt(parts[0]) : node.data.styleContainer.borderWidth || 3;

        controls.nodeColor.value = node.data.styleContainer.backgroundColor;
        controls.borderColor.value = parts[2] || node.data.styleContainer.borderColor || '#cccccc';
        controls.borderWidth.value = borderWidthValue;
        controls.nodeWidth.value = parseInt(node.data.styleContainer.width);
        controls.nodeHeight.value = parseInt(node.data.styleContainer.height);
        controls.lineStyle.value = node.data.styleLine.type;
        controls.lineColor.value = node.data.styleLine.style.stroke;
        controls.lineWidth.value = parseInt(node.data.styleLine.style.strokeWidth);
        controls.globalTextColor.value = node.data.topic.globalStyle.color;
        controls.globalTextSize.value = parseInt(node.data.topic.globalStyle.fontSize);
        controls.globalFontFamily.value = node.data.topic.globalStyle.fontFamily;

        controls.nodeColor.addEventListener('input', () => setData({ styleContainer: { backgroundColor: controls.nodeColor.value } }));
        controls.borderColor.addEventListener('input', () => setData({ styleContainer: { borderColor: controls.borderColor.value } }));
        controls.borderWidth.addEventListener('input', () => setData({ styleContainer: { borderWidth: `${controls.borderWidth.value}px` } }));
        controls.nodeWidth.addEventListener('input', () => setData({ styleContainer: { width: `${controls.nodeWidth.value}px` } }));
        controls.nodeHeight.addEventListener('input', () => setData({ styleContainer: { height: `${controls.nodeHeight.value}px` } }));
        controls.lineStyle.addEventListener('change', () => setData({ styleLine: { type: controls.lineStyle.value } }));
        controls.lineColor.addEventListener('input', () => setData({ styleLine: { style: { stroke: controls.lineColor.value } } }));
        controls.lineWidth.addEventListener('input', () => setData({ styleLine: { style: { strokeWidth: `${controls.lineWidth.value}px` } } }));
        controls.globalTextColor.addEventListener('input', () => setData({ globalStyle: { color: controls.globalTextColor.value } }));
        controls.globalTextSize.addEventListener('input', () => setData({ globalStyle: { fontSize: `${controls.globalTextSize.value}px` } }));
        controls.globalFontFamily.addEventListener('change', () => setData({ globalStyle: { fontFamily: controls.globalFontFamily.value } }));
    } else {
        updateInputValue(controls.nodeColor, NODE_STYLES.backgroundColor || '#ffffff');
        updateInputValue(controls.borderColor, NODE_STYLES.borderColor || '#cccccc');
        updateInputValue(controls.borderWidth, 3);
        updateInputValue(controls.nodeWidth, CONTAINER_STYLES.minWidth);
        updateInputValue(controls.nodeHeight, CONTAINER_STYLES.minHeight);
        updateInputValue(controls.lineStyle, LINE_STYLES.STRAIGHT.type);
        updateInputValue(controls.lineColor, LINE_STYLES.STRAIGHT.style.stroke);
        updateInputValue(controls.lineWidth, LINE_STYLES.STRAIGHT.style.strokeWidth);
        updateInputValue(controls.globalTextColor, '#000000');
        updateInputValue(controls.globalTextSize, 16);
        updateInputValue(controls.globalFontFamily, 'Arial');
    }
}

export function updateTextControls(block) {
    const controls = {
        fontFamily: document.getElementById('block-font-family'),
        fontSize: document.getElementById('block-font-size'),
        textColor: document.getElementById('block-text-color'),
        textAlign: document.getElementById('block-text-align'),
        useParentStyle: document.getElementById('use-parent-style'),
        boldBtn: document.getElementById('block-bold-btn'),
        italicBtn: document.getElementById('block-italic-btn'),
        underlineBtn: document.getElementById('block-underline-btn')
    };

    if (!block || !controls.fontFamily) return;

    const computedStyle = window.getComputedStyle(block);

    updateInputValue(controls.fontFamily, block.style.fontFamily || computedStyle.fontFamily || 'Arial');
    updateInputValue(controls.fontSize, parseInt(block.style.fontSize || computedStyle.fontSize) || 14);
    updateInputValue(controls.textColor, rgbToHex(block.style.color || computedStyle.color) || '#000000');
    updateInputValue(controls.textAlign, block.style.textAlign || computedStyle.textAlign || 'left');

    if (controls.useParentStyle) {
        controls.useParentStyle.checked = block.classList.contains('parent-style');
    }

    updateButtonStates(block, controls);

    controls.fontFamily.onchange = () => block.style.fontFamily = controls.fontFamily.value;
    controls.fontSize.oninput = () => block.style.fontSize = `${controls.fontSize.value}px`;
    controls.textColor.oninput = () => block.style.color = controls.textColor.value;
    controls.textAlign.onchange = () => block.style.textAlign = controls.textAlign.value;

    controls.useParentStyle.onchange = () => {
        if (controls.useParentStyle.checked) {
            block.classList.add('parent-style');
        } else {
            block.classList.remove('parent-style');
        }
    };

    controls.boldBtn?.addEventListener('click', () =>
        block.style.fontWeight = block.style.fontWeight === 'bold' ? 'normal' : 'bold');

    controls.italicBtn?.addEventListener('click', () =>
        block.style.fontStyle = block.style.fontStyle === 'italic' ? 'normal' : 'italic');

    controls.underlineBtn?.addEventListener('click', () =>
        block.style.textDecoration = block.style.textDecoration.includes('underline') ? 'none' : 'underline');


    console.log(jm.nodes.get(block.id));
    
}

export function updateImageControls(imgElement) {
    const controls = {
        width: document.getElementById('img-width'),
        height: document.getElementById('img-height'),
        position: document.getElementById('img-position'),
        selectButton: document.getElementById('img-select')
    };

    if (!imgElement || !controls.width) return;

    updateInputValue(controls.width, parseInt(imgElement.style.width) || 100);
    updateInputValue(controls.height, parseInt(imgElement.style.height) || 100);
    updateInputValue(controls.path, imgElement.src || '');

    controls.width.oninput = () => {
        imgElement.style.width = `${controls.width.value}px`;
        saveBlockChanges(imgElement);
    };

    controls.height.oninput = () => {
        imgElement.style.height = `${controls.height.value}px`;
        saveBlockChanges(imgElement);
    };

    controls.position.onchange = () => {
        updateImagePosition(imgElement, controls.position.value);
        saveBlockChanges(imgElement);
    };

    controls.selectButton.addEventListener('click', async () => {
        debugger
        const filePath = await window.electron.openFileDialog();
        if (filePath) {
            imgElement.src = filePath;
            saveBlockChanges(imgElement);
        }
    });
}

export function updateHeaderControls(headerElement) {
    const controls = {
        fontFamily: document.getElementById('header-font-family'),
        textColor: document.getElementById('header-text-color'),
        textAlign: document.getElementById('header-text-align'),
        useParentStyle: document.getElementById('header-use-parent-style'),
        italicBtn: document.getElementById('header-italic-btn'),
        underlineBtn: document.getElementById('header-underline-btn')
    };

    if (!headerElement || !controls.fontFamily) return;

    const computedStyle = window.getComputedStyle(headerElement);

    updateInputValue(controls.fontFamily, headerElement.style.fontFamily || computedStyle.fontFamily || 'Arial');
    updateInputValue(controls.textColor, rgbToHex(headerElement.style.color || computedStyle.color) || '#000000');
    updateInputValue(controls.textAlign, headerElement.style.textAlign || computedStyle.textAlign || 'left');

    if (controls.useParentStyle) {
        controls.useParentStyle.checked = headerElement.classList.contains('parent-style');
    }

    controls.fontFamily.onchange = () => {
        headerElement.style.fontFamily = controls.fontFamily.value;
        saveBlockChanges(headerElement);
    };

    controls.textColor.oninput = () => {
        headerElement.style.color = controls.textColor.value;
        saveBlockChanges(headerElement);
    };

    controls.textAlign.onchange = () => {
        headerElement.style.textAlign = controls.textAlign.value;
        saveBlockChanges(headerElement);
    };

    controls.useParentStyle.onchange = () => {
        if (controls.useParentStyle.checked) {
            headerElement.classList.add('parent-style');
        } else {
            headerElement.classList.remove('parent-style');
        }
        saveBlockChanges(headerElement);
    };

    controls.italicBtn?.addEventListener('click', () => {
        headerElement.style.fontStyle = headerElement.style.fontStyle === 'italic' ? 'normal' : 'italic';
        saveBlockChanges(headerElement);
    });

    controls.underlineBtn?.addEventListener('click', () => {
        headerElement.style.textDecoration = headerElement.style.textDecoration.includes('underline') ? 'none' : 'underline';
        saveBlockChanges(headerElement);
    });
}

function updateButtonStates(block, controls) {
    if (!controls) return;

    const computedStyle = window.getComputedStyle(block);
    
    if (controls.boldBtn) {
        controls.boldBtn.classList.toggle('active', 
            computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 700);
    }
    if (controls.italicBtn) {
        controls.italicBtn.classList.toggle('active', 
            computedStyle.fontStyle === 'italic');
    }
    if (controls.underlineBtn) {
        controls.underlineBtn.classList.toggle('active', 
            computedStyle.textDecoration.includes('underline'));
    }
}

function updateImagePosition(imgElement, position) {
    imgElement.style.float = '';
    imgElement.style.display = 'block';
    imgElement.style.marginLeft = '';
    imgElement.style.marginRight = '';

    switch (position) {
        case 'left':
            imgElement.style.marginLeft = '0';
            imgElement.style.marginRight = 'auto';
            break;
        case 'right':
            imgElement.style.marginLeft = 'auto';
            imgElement.style.marginRight = '0';
            break;
        case 'center':
            imgElement.style.marginLeft = 'auto';
            imgElement.style.marginRight = 'auto';
            break;
    }
}

function saveBlockChanges(block) {
    const node = block.closest('.jsmind-node');
    if (node) {
        const topic = node.querySelector('.node-topic');
        window.jm.saveNodeContent(node.id, topic);
    }
}

function rgbToHex(rgb) {
    if (!rgb) return '#000000';
    const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!rgbMatch) return rgb;
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}