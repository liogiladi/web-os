import Queue from "/utils/queue.js";
import makeId from "/utils/makeId.js";
import { makeDraggable } from "/utils/makeDraggable.js";
import readFileContents from "/utils/readFileContents.js";

export default class Shortcut extends HTMLElement {
	static observedAttributes = ["name", "iconSrc"];
	static orderedFolderIds = new Queue();
	span;
	input;

	constructor() {
		super();
	}
	
	async connectedCallback() {
		if (!this.name) throw new Error("<desktop-shortcut> is missing 'name' attribute");
		if (this.textContent) throw new Error("<desktop-shortcut> cannot have innerHTML");

		if (!this.id) this.id = makeId(10);
		
		Shortcut.orderedFolderIds.enqueue(this.id);

		const shadowRoot = this.attachShadow({ mode: "open" });

		const template = document.createElement("template");
		template.className = "shortcut";
		template.tabIndex = 0;

		const img = document.createElement("img");
		img.src = this.iconSrc || "/media/folder.svg";
		img.alt = "shortcut icon";
		img.draggable = false;

		this.span = document.createElement("span");
		this.span.innerText = this.name;
		this.span.style.pointerEvents = "none";
		this.span.onclick = this.selectInput;

		this.input = document.createElement("input");
		this.input.type = "text";
		this.input.onblur = this.deselectInput;

		const style = document.createElement("style");
		style.innerHTML = await readFileContents("/custom-elements/shortcut.css");

		template.append(style, img, this.span, this.input);
		shadowRoot.append(template);

		makeDraggable(this, { position: "relative" }, (event) => event.target === this.input);
		this.onfocus = this.focus;
		this.onblur = this.blur;
	}

	attributeChangedCallback(_name, _oldValue, newValue) {
		if (_name == "name") this.name = newValue;
		if (_name == "icon-src") this.iconSrc = newValue;
	}

	selectInput({ target }) {
		if (document.activeElement === target) return;
		target.style.display = "none";

		const input = this.parentElement.querySelector("input");
		input.value = target.innerHTML;
		input.style.display = "unset";
		input.focus();
	}

	deselectInput({ target }) {
		target.style.display = "none";
		target.parentNode;

		const span = target.parentNode.querySelector("span");
		span.innerHTML = target.value;
		span.style.display = "unset";
	}

	focus() {
		this.span.style.pointerEvents = "all";

		if (Shortcut.orderedFolderIds.length == 1) return;

		Shortcut.orderedFolderIds.removeFirstFromEnd(this.id);
		Shortcut.orderedFolderIds.enqueue(this.id);

		let pointer = Shortcut.orderedFolderIds.start;
		for (let i = 0; pointer !== null; pointer = pointer.prev, i++) {
			document.getElementById(pointer.value).style.zIndex = 100 + i;
		}
	}

	blur() {
		this.span.style.pointerEvents = "none";
	}

	get iconSrc() {
		return this.getAttribute("icon-src");
	}

	set iconSrc(value) {
		this.setAttribute("icon-src", value)
	}
}
