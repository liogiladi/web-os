import Window from "./window.mjs";
import readFileContents from "/utils/readFileContents.js";

const purpleKeywords = ["export", "import", "from", "for", "while", "do", "default", "await", "function"];

const blueKeywords = ["class", "async", "constructor", "const", "let", "var", "this", "null", ""]

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

		editor.oninput = () =>
			editorView.innerHTML = highlightText(editor.innerHTML);
	}
}

/**
 * @param {string} text from innerHTML 
 * @returns {string} highlited innerHtml
 */
function highlightText(text) {
	let words = [];

	let currentWord = "";
	let currentStringOpener = null;
	for (let i = 0; i < text.length; i++) {
		const char = text[i];

		if (/"|'|`/.test(char)) {
			if (i == text.length - 1) {
				words.push(currentWord + char);
				continue;
			}

			if (currentStringOpener == null) {
				currentStringOpener = char;
				if (currentWord) {
					words.push(currentWord);
					currentWord = "";
				}
			} else if (currentStringOpener == char) {
				words.push(currentWord + char);
				currentWord = "";
				currentStringOpener = null;
				continue;
			}
		}

		// Numbers
		if (!isNaN(parseFloat(char))) {
			if (i == text.length - 1 || isNaN(parseInt(text[i + 1]))) {
				words.push(currentWord + char);
				currentWord = "";
				continue;
			}

			if (currentWord) {
				words.push(currentWord);
				currentWord = "";
			}
		}

		// Parantheses
		if (/\(|\)|\[|\]|\{|\}|\*|\+|-|\.|\/|%|>|>=|=|<|<=/.test(char)) {
			if (currentWord) {
				words.push(currentWord);
				currentWord = "";
			}
			words.push(char);
			continue
		}

		const space =
			char == " "
				? " "
				: char == "&" && text.substring(i, i + 6) == "&nbsp;"
					? "&nbsp;"
					: null;

		if (space && !currentStringOpener) {
			if (currentWord) {
				words.push(currentWord, space);
			} else words.push(space);
			if (space == "&nbsp;") {
				i += 5;
			}
			currentWord = "";
			continue;
		} else if (char == "<" && text.substring(i, i + 4) == "<br>") {
			words.push(currentWord, "<br>");
			currentWord = "";
			i += 3;
		} else if (i == text.length - 1) {
			currentWord += char;
			words.push(currentWord);
		} else currentWord += char;
	}

	let purpleOpeningBlock = false;

	words = words.map((word, i) => {
		let className = null;

		if (["for", "switch", "while", "if"].includes(word)) purpleOpeningBlock = true;

		if (purpleKeywords.includes(word)) className = "p";
		else if (purpleOpeningBlock && ["(", ")"].includes(word)) {
			className = "p";
			if (word == ")") purpleOpeningBlock = false;
		}
		else if (blueKeywords.includes(word)) className = "b";
		else if (['\"', '\'', '`'].some(stringOpener => word.startsWith(stringOpener) && word.endsWith(stringOpener))) className = "str";
		else if (['\"', '\'', '`'].some(stringOpener => word.search(stringOpener) == 0)) className = "error";
		else if (!/\s|;|\(|\)|\[|\]|\{|\}|\*|\+|-|\.|\/|%|>|>=|=|<|<=/.test(word)) className = "lb";

		return className ? `<span class="hg-${className}">${word}</span>` : word;
	});

	return words.join("");
}