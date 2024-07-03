import readFileContents from "/utils/readFileContents.js";

const requiredAttributes = ["iconSrc", "name"];

export default class Task extends HTMLElement {
	static observedAttributes = [...requiredAttributes];

	constructor() {
		super();
		this.loaded = false;
	}

	async connectedCallback() {
		if (this.loaded) return;
		this.loaded = true;

		for (const attribute of requiredAttributes) {
			if (!this[attribute])
				throw new Error(
					`<desktop-task> is missing '${attribute
						.replace(/([a-z])([A-Z])/g, "$1-$2")
						.toLowerCase()}' attribute`,
				);
		}

		this.id = `task-${this.name}`;

		const container = document.createElement("template");
		container.className = "task load-animation";

		const img = document.createElement("img");
		console.log(this.iconSrc);
		img.src = this.iconSrc || "/media/folder.svg";
		img.alt = "task icon";
		img.draggable = false;

		this.span = document.createElement("span");
		this.span.innerText = this.name;
		this.span.style.pointerEvents = "none";
		this.span.onclick = this.selectInput;

		const style = document.createElement("style");
		style.innerHTML = await readFileContents("/custom-elements/task.css");

		container.append(style, img);

		this.appendChild(container);

		setTimeout(() => {
			container.classList.remove("load-animation");
		}, 500);
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
}
