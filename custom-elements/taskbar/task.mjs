import readFileContents from "/utils/readFileContents.js";
import Taskbar from "./taskbar.mjs";

const requiredAttributes = ["iconSrc", "name"];

export default class Task extends HTMLElement {
	static observedAttributes = [...requiredAttributes];

	/** @type {HTMLTemplateElement} */
	container;

	/** @type {HTMLDivElement} */
	previews;

	constructor() {
		super();
		this.loaded = false;
	}

	async connectedCallback() {
		if (this.loaded) return;
		this.loaded = true;

		// Attributes validations
		for (const attribute of requiredAttributes) {
			if (!this[attribute])
				throw new Error(
					`<desktop-task> is missing '${attribute
						.replace(/([a-z])([A-Z])/g, "$1-$2")
						.toLowerCase()}' attribute`,
				);
		}

		this.id = `task-${this.name}`;
		this.tabIndex = 1;

		this.container = document.createElement("template");
		this.container.className = "task load-animation";

		const previewImage = document.createElement("img");
		previewImage.className = "preview-image";
		previewImage.src = this.iconSrc || "/media/folder.svg";
		previewImage.alt = "task icon";
		previewImage.draggable = false;

		this.previews = document.createElement("div");
		this.previews.className = "previews";

		const style = document.createElement("style");
		style.innerHTML = await readFileContents("/custom-elements/taskbar/task.css");

		this.container.append(style, previewImage, this.previews);

		this.appendChild(this.container);

		setTimeout(() => {
			this.container.classList.remove("load-animation");
		}, 500);

		this.container.onmouseenter = () => (this.hovers = true);
		this.container.onmouseleave = () => (this.hovers = false);

		previewImage.onmouseenter = () => {
			// Only update the snapshot if the preview isn't visible
			setTimeout(() => {
				this.previews.style.display = "flex";
			}, 400);

			const previewsChildren = [];

			const windows = document.querySelectorAll(`[header-title="${this.name}"`);

			for (const window of windows) {
				const preview = document.createElement("article");
				preview.id = `window-preview-${window.id}`;
				preview.className = "preview";
				preview.windowId = window.id;
				preview.onclick = this.openWindow(window.id);

				const header = document.createElement("header");

				const title = document.createElement("h2");
				title.innerText = window.getAttribute("header-title");

				const icon = document.createElement("img");
				icon.src = window.iconSrc;

				const infoWrapper = document.createElement("div");
				infoWrapper.append(icon, title);
				infoWrapper.className = "info";

				const closeButton = document.createElement("button");
				closeButton.className = "task-close-button";
				closeButton.innerHTML = "x";
				closeButton.onclick = this.closeWindow(window.id);

				header.append(infoWrapper, closeButton);

				preview.append(header, window.cloneNode(true));
				previewsChildren.push(preview);
			}

			this.previews.replaceChildren(...previewsChildren);
		};

		previewImage.onmouseout = () => {
			if (!("focused" in this.container.dataset)) {
				setTimeout(() => {
					if (!this.hovers) this.previews.style.display = "none";
				}, 400);
			}
		};

		previewImage.onclick = () => {
			if (!("focused" in this.container.dataset)) {
				this.container.dataset.focused = "";
			}
		};

		this.onblur = (e) => {
			if (e.relatedTarget?.className === "task-close-button") return;
			delete this.container.dataset.focused;
			this.previews.style.display = "none";
		};
	}

	attributeChangedCallback(_name, _oldValue, newValue) {
		if (_name == "name") this.name = newValue;
		else if (_name == "icon-src") this.iconSrc = newValue;
	}

	get iconSrc() {
		return this.getAttribute("icon-src");
	}

	set iconSrc(value) {
		this.setAttribute("icon-src", value);
	}

	openWindow(id) {
		/**
		 * @param {Event} e
		 */
		return () => {
			console.log("opening window: " + id);
		};
	}

	closeWindow(id) {
		/**
		 * @param {Event} e
		 */
		return () => {
			this.hovers = true;
			Taskbar.shadowRoot.getElementById(`window-preview-${id}`).remove();
			document.getElementById(id).remove();
		};
	}
}
