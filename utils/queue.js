export default class Queue {
	constructor() {
		this.start = null;
		this.end = null;
		this.length = 0;
	}

	enqueue(value) {
		const newNode = new Node(value);

		if(this.end === null) {
			this.end = newNode;
			this.start = newNode;
		} else {
			newNode.next = this.end;
			newNode.next.prev = newNode;
			this.end = newNode;
		}

		this.length++;
	}

	dequeue() {
		this.start = this.start.prev;
		this.start.next = null;
		this.length--;
	}

	removeFirstFromEnd(value) {
		if(this.end.value == value) {
			this.end = this.end.next;
			this.end.prev = null;
			return;
		}

		let pointer = this.end;
		for(; pointer.value !== value ; pointer = pointer.next);

		if(this.start.value == value) {
			this.dequeue();
			return;
		}

		pointer.next.prev = pointer.prev;
		pointer.prev.next = pointer.next;
		this.length--;
	}

	/**
	 * @returns {Array}
	 */
	toArray() {
		const arr = [];
		let pointer = this.start;

		while(pointer !== null) {
			arr.push(pointer.value);
			pointer = pointer.prev
		}

		return arr;
	}
}

class Node {
	constructor(value) {
		this.value = value;
		this.next = null;
		this.prev = null;
	}
}