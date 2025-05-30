import { updateNodeMenu, updateTextControls, updateImageControls, updateHeaderControls } from './menuUpdates.js';

export function initMenuSystem() {
    requestAnimationFrame(() => {
        const menus = {
            node: document.querySelector('.menu.floating-menu'),
            content: document.querySelector('.menu.content-menu'),
            text: document.querySelector('.text-controls'),
            image: document.querySelector('.image-controls'),
            list: document.querySelector('.list-controls'),
            textBlock: document.querySelector('.text-block-controls'),
            header: document.querySelector('.header-controls'),
        };

        if (!validateMenus(menus)) return;

        setupInitialMenuState(menus);
        setupMenuEventListeners(menus);
    });
}

export function validateMenus(menus) {
    const missingMenus = Object.entries(menus)
        .filter(([key, element]) => !element)
        .map(([key]) => key);

    if (missingMenus.length > 0) {
        console.error('Missing menus:', missingMenus);
        return false;
    }
    return true;
}

export function setupInitialMenuState(menus) {
    Object.values(menus).forEach(menu => {
        menu.style.display = 'none';
    });
}

export function setupMenuEventListeners(menus) {
    jm.setActiveNodeCallback = (hasActiveNodes) => {
        if (hasActiveNodes && !jm.editableNodes) {
            menus.node.style.display = 'block';
            menus.content.style.display = 'none';
            updateNodeMenu();
        } else {
            menus.node.style.display = 'none';
        }
    };

    const observer = new MutationObserver(() => {
        if (!jm.editableNodes) {
            menus.content.style.display = 'none';
            menus.text.style.display = 'none';
            menus.image.style.display = 'none';
            if (jm.activeNode.size > 0) {
                menus.node.style.display = 'block';
                updateNodeMenu();
            }
        }
    });

    observer.observe(jm.container, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true
    });

    document.addEventListener('editable-mode-change', (e) => {
        const isEditable = e.detail.editable;
        if (isEditable) {
            menus.node.style.display = 'none';
            menus.content.style.display = 'block';
            
            if (jm.selectedBlockContent) {
                const isImage = jm.selectedBlockContent.tagName === 'IMG';
                const isList = jm.selectedBlockContent.tagName === 'UL' || jm.selectedBlockContent.tagName === 'OL';
                const isTextBlock = !isImage && !isList;
                
                menus.text.style.display = 'none';
                menus.image.style.display = 'none';
                document.querySelector('.menu-section-toggle.text').parentElement.style.display = 'none';
                document.querySelector('.menu-section-toggle.list').parentElement.style.display = 'none';

                if (isImage) {
                    menus.image.style.display = 'block';
                } else if (isList) {
                    menus.text.style.display = 'block';
                    document.querySelector('.menu-section-toggle.list').parentElement.style.display = 'block';
                } else if (isTextBlock) {
                    menus.text.style.display = 'block';
                    document.querySelector('.menu-section-toggle.text').parentElement.style.display = 'block';
                }
            }
        }
    });

    document.addEventListener('block-selected', (e) => {
        const block = e.detail.block;
        const isHeader = block.tagName === 'H1' || block.tagName === 'H2' || block.tagName === 'H3';
        const isImage = block.tagName === 'IMG';
        const isList = block.tagName === 'UL' || block.tagName === 'OL';
        const isItemMenu = block.tagName === 'LI';
        const isTextBlock = !isImage && !isList && !isItemMenu && !isHeader;

        menus.text.style.display = 'none';
        menus.image.style.display = 'none';
        menus.list.style.display = 'none';
        menus.textBlock.style.display = 'none';
        menus.header.style.display = 'none';

        if (isHeader) {
            menus.header.style.display = 'block';
            updateHeaderControls(block);
        } else if (isImage) {
            menus.image.style.display = 'block';
            updateImageControls(block);
        } else if (isList) {
            menus.list.style.display = 'block';
            updateTextControls(block);
        } else if (isItemMenu) {
            menus.text.style.display = 'block';
            updateTextControls(block);
        } else if (isTextBlock) {
            menus.text.style.display = 'block';
            menus.textBlock.style.display = 'block';
            updateTextControls(block);
        }
    });
}

export function initButtonMenu() {
    document.querySelectorAll('.menu-section-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const content = button.nextElementSibling;
            content.classList.toggle('hidden');
            
            if (content.classList.contains('hidden')) {
                button.textContent = button.textContent.replace('▼', '▶');
            } else {
                button.textContent = button.textContent.replace('▶', '▼');
            }
        });
    });

    document.getElementById('expand-all').addEventListener('click', () => {
        document.querySelectorAll('.menu-section-toggle').forEach(button => {
            const content = button.nextElementSibling;
            content.classList.remove('hidden');
            button.textContent = button.textContent.replace('▶', '▼');
        });
    });

    document.getElementById('collapse-all').addEventListener('click', () => {
        document.querySelectorAll('.menu-section-toggle').forEach(button => {
            const content = button.nextElementSibling;
            content.classList.add('hidden');
            button.textContent = button.textContent.replace('▼', '▶');
        });
    });

    const cascadeDeleteToggle = document.getElementById('cascade-delete');
    if (cascadeDeleteToggle) {
        cascadeDeleteToggle.checked = jm.settings.cascadeRemove || false;

        cascadeDeleteToggle.addEventListener('change', (e) => {
            e.stopPropagation();
            jm.settings.cascadeRemove = e.target.checked;
        });

        const slider = cascadeDeleteToggle.nextElementSibling;
        if (slider && slider.classList.contains('slider')) {
            slider.addEventListener('mousedown', (e) => e.stopPropagation());
            slider.addEventListener('mouseup', (e) => e.stopPropagation());
            slider.addEventListener('click', (e) => e.stopPropagation());
        }
    } else {
        console.error('Переключатель #cascade-delete не найден');
    }
}