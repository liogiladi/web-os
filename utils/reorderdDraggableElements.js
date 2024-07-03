export default function reorderdDraggableElements(queue, thisId, minZindex) {
	if (queue.length == 1) return;

	queue.removeFirstFromEnd(thisId);
	queue.enqueue(thisId);

	let pointer = queue.start;
	for (let i = 0; pointer !== null; pointer = pointer.prev, i++) {
		const el = document.getElementById(pointer.value);
		if (el) el.style.zIndex = minZindex + i;
	}
}
