// rectangle.js
export class Rectangle {
    constructor(container, width, height, x, y, text) {
        this.container = container;
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.text = text;
        this.element = this.createRectangle();
    }

    createRectangle() {
        const rectangle = document.createElement('div');
        rectangle.className = 'shape rectangle';
        rectangle.style.width = `${this.width}px`;
        rectangle.style.height = `${this.height}px`;
        rectangle.style.position = 'absolute';
        rectangle.style.left = `${this.x}px`;
        rectangle.style.top = `${this.y}px`;
        rectangle.textContent = this.text;
        this.container.appendChild(rectangle);
        return rectangle;
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
    }

    
}
