// square.js
export class Square {
    constructor(container, size, text) {
        this.container = container;
        this.size = size;
        this.text = text;
        this.element = this.createSquare();
    }

    createSquare() {
        const square = document.createElement('div');
        square.className = 'shape square';
        square.style.width = `${this.size}px`;
        square.style.height = `${this.size}px`;
        square.textContent = this.text;
        this.container.appendChild(square);
        return square;
    }

    setSize(size) {
        this.size = size;
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;
    }
}
