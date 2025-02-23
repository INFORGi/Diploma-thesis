/**
 * Находит узел по его ID в дереве.
 * @param {string} nodeId - ID искомого узла.
 * @param {Node} node - Корневой узел дерева.
 * @returns {Node|null} - Найденный узел или null, если узел не найден.
 */
export function findNodeById(nodeId, node) {
    if (!node) return null;

    const stack = [node];
    while (stack.length > 0) {
        const currentNode = stack.pop();
        if (currentNode.id === nodeId) return currentNode;
        if (currentNode.children && Array.isArray(currentNode.children)) {
            stack.push(...currentNode.children);
        }
    }
    return null;
}

/**
 * Находит родительский узел для указанного узла.
 * @param {string} nodeId - ID искомого узла.
 * @param {Node} node - Корневой узел дерева.
 * @returns {Node|null} - Родительский узел или null, если узел не найден.
 */
export function findParentNode(nodeId, node) {
    if (!node || !node.children || !Array.isArray(node.children)) return null;

    const stack = [{ currentNode: node, parent: null }];
    while (stack.length > 0) {
        const { currentNode, parent } = stack.pop();
        if (currentNode.id === nodeId) return parent;
        if (currentNode.children && Array.isArray(currentNode.children)) {
            for (const child of currentNode.children) {
                stack.push({ currentNode: child, parent: currentNode });
            }
        }
    }
    return null;
}

/**
 * Рекурсивно обходит дерево и вызывает callback для каждого узла.
 * @param {Node} node - Корневой узел дерева.
 * @param {Function} callback - Функция, вызываемая для каждого узла.
 * @returns Возвращает сам узел и дочерние узлы.
 */
export function traverseNodes(node, callback) {
    if (!node) return;

    const stack = [node];
    while (stack.length > 0) {
        const currentNode = stack.pop();
        callback(currentNode);
        if (currentNode.children && Array.isArray(currentNode.children)) {
            stack.push(...currentNode.children.reverse());
        }
    }
}