function scale(){
    const shapes = document.querySelectorAll('.shape');

    shapes.forEach(shape => {
        const content = shape.querySelector('.shape-content');
        const scale = Math.max(1, content.offsetWidth / shape.offsetWidth, content.offsetHeight / shape.offsetHeight);
        shape.style.transform = `scale(${scale})`;
    });
}

export { scale };