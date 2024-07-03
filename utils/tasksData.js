/**
 * @typedef {import("../custom-elements/taskbar.mjs").TaskInfo} TaskInfo
 */

import Taskbar from "../custom-elements/taskbar/taskbar.mjs";

export default class TasksData {
	constructor() {
		/** @type {Record<string, TaskInfo>} */
		this.tasks = {};
	}

	/**
	 * @param {TaskInfo} task
	 */
	add(task) {
		if (task.name in this.tasks) {
			this.tasks[task.name].count++;
		} else {
			const taskElement = document.createElement("desktop-task");
			taskElement.id = `task-${task.name}`;
			taskElement.setAttribute("name", task.name);
			taskElement.setAttribute("icon-src", task.iconSrc);

			Taskbar.instance.appendChild(taskElement);
			this.tasks[task.name] = task;
		}
	}

	/**
	 * @param {string} task
	 */
	remove(taskName) {
		if (!(taskName in this.tasks)) {
			throw new Error(`can't remove non existant task: ${taskName}`);
		}

		if (this.tasks[taskName].count > 1) {
			this.tasks[taskName].count--;
		} else {
			delete this.tasks[taskName];

			const taskElement = Taskbar.shadowRoot.getElementById(`task-${taskName}`);
			taskElement.classList.add("unload-animation");

			setTimeout(() => {
				taskElement.remove();
			}, 500);
		}
	}

	/** @param {string} */
	get(name) {
		if (!(name in this.tasks)) throw new Error(`can't get non existant task: ${name}`);

		return this.tasks[name];
	}
}
