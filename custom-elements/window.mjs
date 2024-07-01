import Queue from "/utils/queue.js";
import makeId from "/utils/makeId.js";
import makeDraggable from "/utils/makeDraggable.js";
import readFileContents from "/utils/readFileContents.js";
import reorderdDraggableElements from "/utils/reorderdDraggableElements.js";

const sizeTransition = "width 0.3s, height 0.3s, transform 0.3s, border-radius 0.3s";

export default class Window extends HTMLElement {
	static observedAttributes = ["header-title", "icon-src"];
	static orderedWindowIds = new Queue();

	constructor() {
		super();
		this.observer = null;
	}

	async connectedCallback() {
		if (!this.headerTitle) {
			throw new Error("<desktop-window> is missing 'header-title' attribute");
		}

		if (!this.id) this.id = makeId(10);

		Window.orderedWindowIds.enqueue(this.id);

		this.fullscreen = false;
		this.windowedStyles = {
			width: "min(500px, 100vw)",
			height: "min(200px, 100vh)",
			transform: "translate(0,0)",
			left: 0,
			top: 0,
		};

		this.style.zIndex = 1000;
		this.style.borderRadius = "4px";

		/* ------------ buttons ------------- */
		const buttons = document.createElement("div");
		buttons.className = "buttons";

		const closeButton = document.createElement("button");
		closeButton.textContent = "x";
		closeButton.onclick = this.close.bind(this);

		const sizeButton = document.createElement("button");
		sizeButton.textContent = "o";
		sizeButton.onclick = () => this.toggleFullscreen(this);

		const minimizeButton = document.createElement("button");
		minimizeButton.textContent = "_";

		buttons.append(closeButton, sizeButton, minimizeButton);

		/* ------------ title ------------- */
		const span = document.createElement("span");
		span.textContent = this.headerTitle;

		const icon = document.createElement("img");
		icon.src = this.iconSrc;

		const title = document.createElement("div");
		title.className = "title";
		title.append(icon, span);

		/* ------------ header ------------- */
		const header = document.createElement("header");
		header.append(title, buttons);
		header.ondblclick = (event) => {
			if (event.target !== header) return;
			this.toggleFullscreen.bind(this)();
		};

		/* ------------ content ------------- */
		const content = document.createElement("div");
		content.className = "content";

		// Move all child elements to .content
		while (this.childNodes.length > 0) {
			content.appendChild(this.childNodes[0]);
		}

		// Observe childList such that every child that is appended to <desktop-window> goes to .content
		this.observer = new MutationObserver((mutationList, _observer) => {
			for (const mutation of mutationList) {
				if (mutation.type == "childList" && this.childNodes.length > 0) {
					while (this.childNodes.length > 0) {
						content.appendChild(this.childNodes[0]);
					}
				}
			}
		});

		this.observer.observe(this, { childList: true });

		/* ------------ template ------------- */
		const template = document.createElement("template");
		template.className = "window";
		template.tabIndex = 0;

		const style = document.createElement("style");
		style.innerHTML = await readFileContents("/custom-elements/window.css");

		template.append(style, header, content);

		/* ------------ attach elements ------------- */
		const shadowRoot = this.shadowRoot || this.attachShadow({ mode: "open" });
		shadowRoot.append(template);

		makeDraggable(this, header, {
			customStyles: { position: "absolute", ...this.windowedStyles },
		});

		this.onfocus = () => reorderdDraggableElements(Window.orderedWindowIds, this.id, 1000);
		this.ondragstart = () => false;
	}

	disconnectedCallback() {
		this.observer.disconnect();
	}

	toggleFullscreen() {
		this.fullscreen = !this.fullscreen;

		if (this.fullscreen) {
			this.windowedStyles = {
				width: this.style.width,
				height: this.style.height,
				transform: this.style.transform,
			};
			this.style.transition = sizeTransition;
		} else {
			setTimeout(() => {
				this.style.transition = null;
			}, 300);
		}

		this.style.width = this.fullscreen ? "100vw" : this.windowedStyles.width;
		this.style.height = this.fullscreen ? "100vh" : this.windowedStyles.height;
		this.style.transform = this.fullscreen ? "translate(0,0)" : this.windowedStyles.transform;
		this.style.borderRadius = this.fullscreen ? "0px" : "4px";
	}

	close() {
		Window.orderedWindowIds.removeFirstFromEnd(this.id);
		this.remove();
	}

	get headerTitle() {
		return this.getAttribute("header-title");
	}

	set headerTitle(value) {
		this.setAttribute("header-title", value);
	}

	get iconSrc() {
		return this.getAttribute("icon-src");
	}

	set iconSrc(value) {
		this.setAttribute("icon-src", value);
	}
}
