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
        const style = nodeData.style || {};
        
        
        this.setValue('width', parseInt(style.width) || 120);
        this.setValue('height', parseInt(style.height) || 40);
        this.setValue('backgroundColor', style.backgroundColor || '#ffffff');
        this.setValue('color', style.color || '#333333');
        this.setValue('borderWidth', parseInt(style.borderWidth) || 1);
        this.setValue('borderStyle', style.borderStyle || 'solid');
        this.setValue('borderColor', style.borderColor || '#cccccc');
        this.setValue('borderRadius', parseInt(style.borderRadius) || 5);
        this.setValue('fontFamily', style.fontFamily || 'Arial, sans-serif');
        this.setValue('fontSize', parseInt(style.fontSize) || 14);
        
        
        this.setValue('textBold', style.fontWeight === 'bold');
        this.setValue('textItalic', style.fontStyle === 'italic');
        this.setValue('textStrike', style.textDecoration === 'line-through');
        
        this.setValue('textAlign', style.textAlign || 'center');
        this.setValue('lineHeight', parseFloat(style.lineHeight) || 1.4);
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

        const newStyle = {
            width: `${this.form.width.value}px`,
            height: `${this.form.height.value}px`,
            backgroundColor: this.form.backgroundColor.value,
            color: this.form.color.value,
            borderWidth: `${this.form.borderWidth.value}px`,
            borderStyle: this.form.borderStyle.value,
            borderColor: this.form.borderColor.value,
            borderRadius: `${this.form.borderRadius.value}px`,
            fontFamily: this.form.fontFamily.value,
            fontSize: `${this.form.fontSize.value}px`,
            fontWeight: this.form.textBold.checked ? 'bold' : 'normal',
            fontStyle: this.form.textItalic.checked ? 'italic' : 'normal',
            textDecoration: this.form.textStrike.checked ? 'line-through' : 'none',
            textAlign: this.form.textAlign.value,
            lineHeight: this.form.lineHeight.value,
            whiteSpace: 'normal'
        };

        
        if (!this.currentNode.nodeData) {
            this.currentNode.nodeData = {};
        }
        this.currentNode.nodeData.style = newStyle;

        
        Object.assign(this.currentNode.style, newStyle);

        
        this.updateChildrenStyles(this.currentNode);
    }

    updateChildrenStyles(parentNode) {
        const nodeId = parentNode.id;
        const parentStyle = parentNode.nodeData.style;
        
        
        const children = Array.from(document.querySelectorAll('.jsmind-node'))
            .filter(node => node.dataset.parent === nodeId);

        children.forEach(child => {
            if (!child.nodeData) {
                child.nodeData = {};
            }
            
            child.nodeData.style = { ...parentStyle };
            
            Object.assign(child.style, parentStyle);
            
            
            this.updateChildrenStyles(child);
        });
    }
}
