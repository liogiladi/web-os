import Window from "./window.mjs";
import readFileContents from "/utils/readFileContents.js";

const purpleKeywords = ["export", "import", "from"];

String.prototype.replaceAt = function (startIndex, endIndex, replacement) {
	return this.substring(0, startIndex) + replacement + this.substring(endIndex + 1);
};

String.prototype.insertAt = function (index, str) {
	return this.substring(0, index) + str + this.substring(index);
};

export default class JSCoder extends Window {
	constructor() {
		super();
		this.observer = null;
	}

	async connectedCallback() {
		this.setAttribute("header-title", "JSCoder");
		this.setAttribute("icon-src", "/media/editor-icon.svg");
		await super.connectedCallback();

		const style = document.createElement("style");
		style.innerHTML = await readFileContents("/custom-elements/jscoder.css");
		this.appendChild(style);

		const editor = document.createElement("code");
		editor.id = "edit-or";
		editor.className = "editor";
		editor.contentEditable = "true";
		this.appendChild(editor);

		const editorView = document.createElement("code");
		editorView.className = "editorView";
		this.appendChild(editorView);

		editor.oninput = () => {
			let words = [];
			let innerHTML = editor.innerHTML;

			let currentWord = "";
			let currentStringOpener = null;
			for (let i = 0; i < innerHTML.length; i++) {
				const char = innerHTML.charAt(i);


				if (/"|'|`/.test(char)) {
					if(i == innerHTML.length - 1) {
						words.push(currentWord + char);
						continue;
					}
					
					if (currentStringOpener == null) {
						currentStringOpener = char;
						if (currentWord) words.push(currentWord);
					} else if (currentStringOpener == char) {
						words.push(currentWord);
						currentWord = "";
						currentStringOpener = null;
					}
				}

				const space =
					char == " "
						? " "
						: char == "&" && innerHTML.substring(i, i + 7) == "&nbsp;"
						? "&nbsp;"
						: null;

				if (space && !currentStringOpener) {
					if (currentWord) {
						words.push(currentWord, space);
						currentWord = "";
					} else words.push(space);
					if (space == "&nbsp;") i += 6;
				} else if (char == "<" && innerHTML.substring(i, i + 4) == "<br>") {
					words.push(currentWord, "<br>");
					currentWord = "";
					i += 3;
				} else if (i == innerHTML.length - 1) {
					currentWord += char;
					words.push(currentWord);
				} else currentWord += char;
			}

			words = words.map((word) => {
				if (purpleKeywords.includes(word)) {
					return `<span class="hg-p">${word}</span>`;
				}

				return word;
			});

			editorView.innerHTML = words.join("");

			/* for (let i = 0; i < output.length; i++) {
				const char = output.charAt(i);

				/* if(char == '"') {
					console.log({
						char,
					});
					console.log("is this if evil?");
					if(!isString) {
						isString = true;
						output = output.insertAt(i, ` <span class="hg-str">`);
					} else {
						isString = false;
						output = output.insertAt(i + 1, `</span> `);
					}
					continue;
				} 

				if (char == " ") {
					word = "";
					continue;
				} else word += char;

				console.log("word",word);

				if (purpleKeywords.includes(word)) {
					const replacement = `<span class="hg-p">${word}</span>`;
					console.log(i, replacement);
					output = output.replaceAt(i - word.length + 1, i, replacement);
					word = "";
					i += replacement.length;
				}
			} */

			//editorView.editor.innerHTML = words.join(" ");
		};
	}
}
