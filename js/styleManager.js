export class StyleManager {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.currentNode = null;
        if (!this.form) {
            console.error('Style form not found:', formId);
            return;
        }
        console.log('StyleManager initialized with form:', this.form);
        this.initializeListeners();
    }

    initializeListeners() {
        
        document.addEventListener('click', (e) => {
            if (!this.form.contains(e.target) && !e.target.closest('.jsmind-node')) {
                this.clearForm();
            }
        });

        this.form.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', () => this.updateNodeStyle());
        });
    }

    clearForm() {
        this.currentNode = null;
        this.form.classList.remove('active');
        this.form.reset();
        console.log('Form cleared and deactivated');
    }

    setNode(node) {
        console.log('Setting node:', node);
        if (this.currentNode !== node) {
            this.clearForm();
            this.currentNode = node;
            if (node) {
                this.form.classList.add('active');
                console.log('Form activated');
                this.updateFormValues();
            }
        }
    }

    updateFormValues() {
        if (!this.currentNode) return;

        const nodeData = this.currentNode.nodeData || {};
        const topic = this.currentNode.querySelector('.node-topic');
        const nodeComputedStyle = window.getComputedStyle(this.currentNode);
        const topicComputedStyle = topic ? window.getComputedStyle(topic) : null;

        const savedNodeStyle = nodeData.nodeStyle || {};
        const savedTopicStyle = nodeData.topicStyle || {};

        if (!this.currentNode.nodeData) {
            this.currentNode.nodeData = {
                nodeStyle: {},
                topicStyle: {}
            };
        }

        this.setValue('width', parseInt(nodeComputedStyle.width));
        this.setValue('height', parseInt(nodeComputedStyle.height));
        this.setValue('backgroundColor', savedNodeStyle.backgroundColor || nodeComputedStyle.backgroundColor);
        this.setValue('borderWidth', parseInt(savedNodeStyle.borderWidth) || parseInt(nodeComputedStyle.borderWidth));
        this.setValue('borderStyle', savedNodeStyle.borderStyle || nodeComputedStyle.borderStyle);
        this.setValue('borderColor', savedNodeStyle.borderColor || nodeComputedStyle.borderColor);
        this.setValue('borderRadius', parseInt(savedNodeStyle.borderRadius) || parseInt(nodeComputedStyle.borderRadius));
        this.setValue('verticalAlign', savedNodeStyle.alignItems || nodeComputedStyle.alignItems || 'center');

        if (topicComputedStyle) {
            this.setValue('color', savedTopicStyle.color || topicComputedStyle.color);
            this.setValue('fontFamily', savedTopicStyle.fontFamily || topicComputedStyle.fontFamily);
            this.setValue('fontSize', parseInt(savedTopicStyle.fontSize) || parseInt(topicComputedStyle.fontSize));
            this.setValue('textBold', topicComputedStyle.fontWeight === 'bold' || parseInt(topicComputedStyle.fontWeight) >= 700);
            this.setValue('textItalic', topicComputedStyle.fontStyle === 'italic');
            this.setValue('textStrike', topicComputedStyle.textDecoration.includes('line-through'));
            this.setValue('textAlign', savedTopicStyle.textAlign || topicComputedStyle.textAlign);
        }
    }

    rgbToHex(rgb) {
        
        if (rgb.startsWith('#')) return rgb;

        
        const matches = rgb.match(/(\d+),\s*(\d+),\s*(\d+)/);
        if (!matches) return '#000000';

        const r = parseInt(matches[1]);
        const g = parseInt(matches[2]);
        const b = parseInt(matches[3]);

        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    setValue(id, value) {
        const input = document.getElementById(id);
        if (!input) return;

        if (input.type === 'checkbox') {
            input.checked = value;
        } else if (input.type === 'color' && !value.startsWith('#')) {
            input.value = this.rgbToHex(value);
        } else {
            input.value = value;
        }
    }

    updateNodeStyle() {
        if (!this.currentNode) {
            console.log('No current node selected');
            return;
        }

        console.log('Updating node style for:', this.currentNode);

        const formElements = {
            width: document.getElementById('width'),
            height: document.getElementById('height'),
            backgroundColor: document.getElementById('backgroundColor'),
            borderWidth: document.getElementById('borderWidth'),
            borderStyle: document.getElementById('borderStyle'),
            borderColor: document.getElementById('borderColor'),
            borderRadius: document.getElementById('borderRadius'),
            verticalAlign: document.getElementById('verticalAlign'),
            color: document.getElementById('color'),
            fontFamily: document.getElementById('fontFamily'),
            fontSize: document.getElementById('fontSize'),
            textBold: document.getElementById('textBold'),
            textItalic: document.getElementById('textItalic'),
            textStrike: document.getElementById('textStrike'),
            textAlign: document.getElementById('textAlign')
        };

        const nodeStyle = {
            minWidth: `${formElements.width.value}px`,
            minHeight: `${formElements.height.value}px`,
            backgroundColor: formElements.backgroundColor.value,
            borderWidth: `${formElements.borderWidth.value}px`,
            borderStyle: formElements.borderStyle.value,
            borderColor: formElements.borderColor.value,
            borderRadius: `${formElements.borderRadius.value}px`,
            display: 'flex',
            alignItems: formElements.verticalAlign.value, 
            justifyContent: 'center',
            width: 'fit-content',
            height: 'fit-content',
            padding: '0'
        };

        const topicStyle = {
            color: formElements.color.value,
            fontFamily: formElements.fontFamily.value,
            fontSize: `${formElements.fontSize.value}px`,
            fontWeight: formElements.textBold.checked ? 'bold' : 'normal',
            fontStyle: formElements.textItalic.checked ? 'italic' : 'normal',
            textDecoration: formElements.textStrike.checked ? 'line-through' : 'none',
            textAlign: formElements.textAlign.value,
            whiteSpace: 'normal',
            width: '100%',
            padding: '8px 15px',
            boxSizing: 'border-box',
            margin: '0',
            height: '100%',
            overflowWrap: 'break-word'
        };

        if (!this.currentNode.nodeData) {
            this.currentNode.nodeData = {};
        }

        this.currentNode.nodeData.nodeStyle = { ...nodeStyle };
        this.currentNode.nodeData.topicStyle = { ...topicStyle };

        Object.assign(this.currentNode.style, nodeStyle);

        const topic = this.currentNode.querySelector('.node-topic');
        if (topic) {
            Object.assign(topic.style, topicStyle);
        }

        if (this.currentNode.dataset.isroot === 'true' || this.form.applyToChildren?.checked) {
            this.updateChildrenStyles(this.currentNode);
        }
    }

    updateChildrenStyles(parentNode) {
        if (!parentNode.nodeData) return;

        const children = Array.from(document.querySelectorAll('.jsmind-node'))
            .filter(node => node.dataset.parent === parentNode.id);

        children.forEach(child => {
            if (!child.nodeData) {
                child.nodeData = {};
            }

            if (parentNode.nodeData.nodeStyle) {
                child.nodeData.nodeStyle = { ...parentNode.nodeData.nodeStyle };
                Object.assign(child.style, child.nodeData.nodeStyle);
            }

            if (parentNode.nodeData.topicStyle) {
                child.nodeData.topicStyle = { ...parentNode.nodeData.topicStyle };
                const childTopic = child.querySelector('.node-topic');
                if (childTopic) {
                    Object.assign(childTopic.style, child.nodeData.topicStyle);
                }
            }

            this.updateChildrenStyles(child);
        });
    }
}
