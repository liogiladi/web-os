
/**
 * reorders draggable element such that given item is forwarded to front 
 * @param {import("./queue").Queue} queue elements to reorder
 * @param {string} queueElementToForwardId element's id from queue to forward
 * @param {number} minZindex set the zIndex minumum for the queue 
 */
export default function reorderdDraggableElements(queue, queueElementToForwardId, minZindex) {
	if (queue.length == 1) return;

	queue.removeFirstFromEnd(queueElementToForwardId);
	queue.enqueue(queueElementToForwardId);

	let pointer = queue.start;
	for (let i = 0; pointer !== null; pointer = pointer.prev, i++) {
		const el = document.getElementById(pointer.value);
		if (el) el.style.zIndex = minZindex + i;
	}
}
