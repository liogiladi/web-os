import Window from "./window.mjs";
import readFileContents from "/utils/readFileContents.js";

const purpleKeywords = ["export", "import"];

export default class JSCoder extends Window {
	constructor() {
		super();
		this.observer = null;
	}

	async connectedCallback() {
		this.setAttribute("header-title", "JSCoder");
		this.setAttribute("icon-src", "/media/editor-icon.svg");
		await super.connectedCallback();

		const editor = document.createElement("code");
		editor.className = "editor";
		//editor.contentEditable = "true";

		const style = document.createElement("style");
		style.innerHTML = await readFileContents("/custom-elements/jscoder.css");

		this.appendChild(style);
		this.appendChild(editor);

		editor.addEventListener("keydown", function (e) {
			this.innerHTML += e.key;
			let word = "";
			for (let i = 0; i < this.textContent.length; i++) {
				const char = this.textContent.charAt(i);

				if (char == " ") {
					word = "";
					continue;
				} else word += char;

				if (purpleKeywords.includes(word)) {
					this.innerHTML =
						this.innerHTML.slice(0, i - word.length) +
						`<span class="keyword p">${word}</span>` +
						this.innerHTML.slice(i + word.length);
				}
			}
		});
	}
}
