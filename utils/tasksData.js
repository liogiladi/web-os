/**
 * @typedef {import("../custom-elements/taskbar.mjs").TaskInfo} TaskInfo
 */

import Taskbar from "../custom-elements/taskbar/taskbar.mjs";

export default class TasksData {
	/** @type {Map<string, TaskInfo>} */
	data;

	constructor() {
		this.data = new Map();
	}

	/**
	 * @param {TaskInfo} task
	 */
	add(task) {
		if (this.data.has(task.name)) {
			this.data.get(task.name).count++;
		} else {
			const taskElement = document.createElement("desktop-task");
			taskElement.id = `task-${task.name}`;
			taskElement.setAttribute("name", task.name);
			taskElement.setAttribute("icon-src", task.iconSrc);

			Taskbar.instance.appendChild(taskElement);
			this.data.set(task.name, task);
		}
	}

	/**
	 * @param {string} task
	 */
	remove(taskName) {
		if (!this.data.has(taskName)) {
			throw new Error(`can't remove non existant task: ${taskName}`);
		}

		if (this.data.get(taskName).count > 1) {
			this.data.get(taskName).count--;
		} else {
			this.data.delete(taskName);

			const taskElement = Taskbar.shadowRoot.getElementById(`task-${taskName}`);
			console.log(taskName);

			taskElement.classList.add("unload-animation");

			setTimeout(() => {
				taskElement.remove();
			}, 500);
		}
	}

	/** @param {string} */
	get(taskName) {
		if (!this.data.has(taskName)) throw new Error(`can't get non existant task: ${name}`);

		return this.data.get(taskName);
	}

	[Symbol.iterator]() {
		return this.data;
	}
}
