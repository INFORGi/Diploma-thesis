export class StyleManager {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.currentNode = null;
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
    }

    setNode(node) {
        if (this.currentNode !== node) {
            this.clearForm();
            this.currentNode = node;
            if (node) {
                this.form.classList.add('active');
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
        const topicStyle = nodeData.topicStyle || {};
        const nodeStyle = nodeData.nodeStyle || {};

        this.setValue('width', parseInt(nodeComputedStyle.width));
        this.setValue('height', parseInt(nodeComputedStyle.height));
        this.setValue('backgroundColor', nodeStyle.backgroundColor || nodeComputedStyle.backgroundColor);
        this.setValue('borderWidth', parseInt(nodeStyle.borderWidth) || parseInt(nodeComputedStyle.borderWidth));
        this.setValue('borderStyle', nodeStyle.borderStyle || nodeComputedStyle.borderStyle);
        this.setValue('borderColor', nodeStyle.borderColor || nodeComputedStyle.borderColor);
        this.setValue('borderRadius', parseInt(nodeStyle.borderRadius) || parseInt(nodeComputedStyle.borderRadius));

        if (topicComputedStyle) {
            this.setValue('color', topicStyle.color || topicComputedStyle.color);
            this.setValue('fontFamily', topicStyle.fontFamily || topicComputedStyle.fontFamily);
            this.setValue('fontSize', parseInt(topicStyle.fontSize) || parseInt(topicComputedStyle.fontSize));
            this.setValue('textBold', topicComputedStyle.fontWeight === 'bold' || parseInt(topicComputedStyle.fontWeight) >= 700);
            this.setValue('textItalic', topicComputedStyle.fontStyle === 'italic');
            this.setValue('textStrike', topicComputedStyle.textDecoration.includes('line-through'));
            this.setValue('textAlign', topicStyle.textAlign || topicComputedStyle.textAlign);
        }

        this.setValue('verticalAlign', nodeStyle.alignItems || nodeComputedStyle.alignItems || 'center');
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
        if (!this.currentNode) return;

        const nodeStyle = {
            width: `${this.form.width.value}px`,
            height: `${this.form.height.value}px`,
            backgroundColor: this.form.backgroundColor.value,
            borderWidth: `${this.form.borderWidth.value}px`,
            borderStyle: this.form.borderStyle.value,
            borderColor: this.form.borderColor.value,
            borderRadius: `${this.form.borderRadius.value}px`,
            display: 'flex',
            alignItems: this.form.verticalAlign.value,
            justifyContent: 'flex-start'
        };

        const topicStyle = {
            color: this.form.color.value,
            fontFamily: this.form.fontFamily.value,
            fontSize: `${this.form.fontSize.value}px`,
            fontWeight: this.form.textBold.checked ? 'bold' : 'normal',
            fontStyle: this.form.textItalic.checked ? 'italic' : 'normal',
            textDecoration: this.form.textStrike.checked ? 'line-through' : 'none',
            textAlign: this.form.textAlign.value,
            whiteSpace: 'normal',
            width: '100%'
        };

        if (!this.currentNode.nodeData) {
            this.currentNode.nodeData = {};
        }
        this.currentNode.nodeData.nodeStyle = nodeStyle;
        this.currentNode.nodeData.topicStyle = topicStyle;

        Object.assign(this.currentNode.style, nodeStyle);

        const topic = this.currentNode.querySelector('.node-topic');
        if (topic) {
            Object.assign(topic.style, topicStyle);
        }

        this.updateChildrenStyles(this.currentNode);
    }

    updateChildrenStyles(parentNode) {
        if (!parentNode.nodeData) return;

        const children = Array.from(document.querySelectorAll('.jsmind-node'))
            .filter(node => node.dataset.parent === parentNode.id);

        children.forEach(child => {
            if (!child.nodeData) child.nodeData = {};

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
