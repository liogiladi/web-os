import readFileContents from "/utils/readFileContents.js";
import TasksData from "/utils/tasksData.js";

/**
 * @typedef TaskInfo
 * @prop {string} name
 * @prop {string} iconSrc
 * @prop {number} count
 */

export default class Taskbar extends HTMLElement {
	/** @type {ShadowRoot} */
	static shadowRoot;

	/** @type {Taskbar} */
	static instance;

	/** @type {TasksData}  */
	static tasks = new TasksData();

	constructor() {
		super();
		Taskbar.instance = this;
	}

	async connectedCallback() {
		const container = document.createElement("footer");
		container.id = "taskbar";

		const style = document.createElement("style");
		style.innerHTML = await readFileContents("/custom-elements/taskbar/taskbar.css");

		this.append(style);

		// Move all child elements to .content
		while (this.childNodes.length > 0) {
			container.appendChild(this.childNodes[0]);
		}

		// Observe childList such that every child that is appended to <desktop-window> goes to .content
		this.observer = new MutationObserver((mutationList) => {
			for (const mutation of mutationList) {
				if (mutation.type === "childList" && this.childNodes.length > 0) {
					while (this.childNodes.length > 0) {
						container.appendChild(this.childNodes[0]);
					}
				}
			}
		});

		this.observer.observe(this, { childList: true });

		const shadowRoot = this.attachShadow({ mode: "open" });
		shadowRoot.append(container);

		Taskbar.shadowRoot = shadowRoot;
	}
}
