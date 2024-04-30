import Queue from "/utils/queue.js"
import makeId from "/utils/makeId.js";
import makeDraggable from "/utils/makeDraggable.js";
import readFileContents from "/utils/readFileContents.js";
import reorderdDraggableElements from "/utils/reorderdDraggableElements.js";

const sizeTransition = "width 0.3s, height 0.3s, transform 0.3s, border-radius 0.3s";

export default class Window extends HTMLElement {
	static observedAttributes = ["header-title"];
	static orderedWindowIds = new Queue();

	constructor() {
		super();
	}
	
	async connectedCallback() {
		if (!this.headerTitle) {
			throw new Error("<dessktop-window> is missing 'title' attribute");
		}

		if (!this.id) this.id = makeId(10);

		Window.orderedWindowIds.enqueue(this.id);

		this.fullscreen = false;
		this.windowedStyles = { width: "min(500px, 100vw)", height: "min(200px, 100vh)", transform: "translate(0,0)", left: 0, top: 0 };
		
		this.style.zIndex = 1000;
		this.style.borderRadius = "4px";
		this.style.overflow = "auto";

		/* ------------ buttons ------------- */
		const buttons = document.createElement("div");
		buttons.className = "buttons";

		const closeButton = document.createElement("button");
		closeButton.textContent = "x";
		closeButton.onclick = () => this.remove();

		const sizeButton = document.createElement("button");
		sizeButton.textContent = "o";
		sizeButton.onclick = () => this.toggleFullscreen(this);

		const minimizeButton = document.createElement("button");
		minimizeButton.textContent = "_";

		buttons.append(closeButton, sizeButton, minimizeButton);

		/* ------------ title ------------- */
		const span = document.createElement("span");
		span.textContent = this.headerTitle;

		/* ------------ header ------------- */
		const header = document.createElement("header");
		header.append(span, buttons);
		header.ondblclick = (event) => {
			if(event.target !== header) return;
			this.toggleFullscreen(this);
		}

		/* ------------ content ------------- */
		const content = document.createElement("div");
		content.className = "content";
		
		// Move all child elements to .content
		while(this.childNodes.length > 0) {
			content.appendChild(this.childNodes[0]);
		}

		// TODO: Add MutationObserver such that every child that is appended to <desktop-window> goes to .contnet

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
		
		
		makeDraggable(this, { position: "absolute", ...this.windowedStyles }, () => this.fullscreen);
		this.onfocus = () => reorderdDraggableElements(Window.orderedWindowIds, this.id, 1000);
	}

	toggleFullscreen(windowElement) {
		windowElement.fullscreen = !windowElement.fullscreen;

		if (windowElement.fullscreen) {
			windowElement.windowedStyles = {
				width: windowElement.style.width,
				height: windowElement.style.height,
				transform: windowElement.style.transform
			};
			windowElement.style.transition = sizeTransition;
		} else {
			setTimeout(() => {
				windowElement.style.transition = null;
			}, 300);
		}

		windowElement.style.width = windowElement.fullscreen ? "100vw" : windowElement.windowedStyles.width;
		windowElement.style.height = windowElement.fullscreen ? "100vh" : windowElement.windowedStyles.height;
		windowElement.style.transform = windowElement.fullscreen ? "translate(0,0)" : windowElement.windowedStyles.transform;
		windowElement.style.borderRadius = windowElement.fullscreen ? "0px" : "4px";
	}

	get headerTitle() {
		return this.getAttribute("header-title");
	}

	set headerTitle(value) {
		this.setAttribute("header-title", value);
	}
}
