import Window from "./window.mjs";
import readFileContents from "/utils/readFileContents.js";

const purpleKeywords = [
	"export",
	"import",
	"from",
	"for",
	"while",
	"do",
	"default",
	"await",
	"function",
	"if",
	"switch",
	"else",
	"static",
];

const blueKeywords = [
	"class",
	"async",
	"constructor",
	"const",
	"let",
	"var",
	"this",
	"void",
	"true",
	"false",
	"super",
	"NaN",
	"null",
	"undefined",
];

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
		editor.className = "editor";
		editor.contentEditable = "true";
		this.appendChild(editor);

		const editorView = document.createElement("code");
		editorView.className = "editorView";
		this.appendChild(editorView);

		const runButton = document.createElement("button");
		runButton.className = "run-button";
		runButton.textContent = ">";
		this.appendChild(runButton);

		//editor.oninput = () => (editorView.innerHTML = highlightText(editor.innerHTML));
		editor.onscroll = () => (editorView.scrollTop = editor.scrollTop);
		runButton.onclick = () => {
			const result = new Function(editor.textContent)();
			console.log(result);
		};
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
		} else if (currentStringOpener != null && i != text.length - 1) {
			currentWord += char;
			continue;
		}

		if (char == ";") {
			if (/&lt|&gt/.test(text.substring(i - 3, i + 1))) {
				words.push(currentWord + char);
				currentWord = "";
				continue;
			} else {
				if (currentWord) {
					words.push(currentWord);
					currentWord = "";
				}
				words.push(";");
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

		const space =
			char == " " ? " " : char == "&" && text.substring(i, i + 6) == "&nbsp;" ? "&nbsp;" : null;

		if (space) {
			if (currentWord) {
				words.push(currentWord, space);
			} else words.push(space);
			if (space == "&nbsp;") {
				i += 5;
			}
			currentWord = "";
		} else if (char == "<" && text.substring(i, i + 4) == "<br>") {
			words.push(currentWord, "<br>");
			currentWord = "";
			i += 3;
		} else if (/\(|\)|\[|\]|\{|\}|\*|\+|-|\!|\.|\/|%|>|>=|=|<|<=/.test(char)) {
			if (currentWord) {
				words.push(currentWord);
				currentWord = "";
			}
			words.push(char);
			continue;
		} else if (i == text.length - 1) {
			currentWord += char;
			words.push(currentWord);
		} else currentWord += char;
	}

	let purpleOpeningBlock = false;
	let purpleOpeningCurlyBlock = false;

	let blueOpeningBlock = false;
	let blueOpeningCurlyBlock = false;

	/** @type {Array<{ className: 'p' | "b", counter: number }>} */
	let blockCounters = [];

	/** @type {Array<{ className: 'p' | "b", counter: number }>} */
	let curlyblockCounters = [];

	words = words.map((word, i) => {
		let className = null;

		if (["for", "switch", "while", "if"].includes(word)) {
			blockCounters.push({ className: "p", counter: 0 });
			curlyblockCounters.push({ className: "p", counter: 0 });
		} else if (["super", "constructor"].includes(word)) {
			blockCounters.push({ className: "b", counter: 0 });
			curlyblockCounters.push({ className: "b", counter: 0 });
		}

		if (word === "(") {
			blockCounters.forEach((block) => block.counter++);
			const closest = blockCounters[blockCounters.length - 1];
			if (closest.counter == 1) return getHighlightResult(word, closest.className);
		} else if (word === ")") {
			blockCounters.forEach((block) => block.counter--);
			const closest = blockCounters[blockCounters.length - 1];
			if (closest.counter == 0) {
				blockCounters.pop();
				return getHighlightResult(word, closest.className);
			}
		}

		if (word === "{") {
			curlyblockCounters.forEach((block) => block.counter++);
			const closest = curlyblockCounters[curlyblockCounters.length - 1];
			if (closest.counter == 1) return getHighlightResult(word, closest.className);
		} else if (word === "}") {
			curlyblockCounters.forEach((block) => block.counter--);
			const closest = curlyblockCounters[curlyblockCounters.length - 1];
			if (closest.counter == 0) {
				curlyblockCounters.pop();
				return getHighlightResult(word, closest.className);
			}
		}

		if (purpleKeywords.includes(word)) className = "p";
		if (
			['"', "'", "`"].some(
				(stringOpener) => word.startsWith(stringOpener) && word.endsWith(stringOpener),
			)
		)
			className = "str";
		else if (['"', "'", "`"].some((stringOpener) => word.search(stringOpener) == 0)) className = "error";
		else if (/\s|;|\!|\^|\&|\(|\)|\[|\]|\{|\}|\*|\+|-|\.|\/|\%|>|>=|=|<|<=/.test(word)) className = "w";

		return getHighlightResult(word, className);
	});

	return words.join("");
}

function getHighlightResult(word, className) {
	return className ? `<span class="hg-${className}">${word}</span>` : word;
}

/**
 * words = words.map((word, i) => {
		let className = null;

		if (["for", "switch", "while", "if"].includes(word)) {
			purpleOpeningBlock = true;
			purpleOpeningCurlyBlock = true;
		} else if (["super", "constructor", "while", "if"].includes(word)) {
			blueOpeningBlock = true;
			blueOpeningCurlyBlock = true;
		}

		if (purpleKeywords.includes(word)) className = "p";
		else if (purpleOpeningBlock && ["(", ")"].includes(word)) {
			className = "p";
			if (word == ")") purpleOpeningBlock = false;
		} else if (purpleOpeningCurlyBlock && ["{", "}"].includes(word)) {
			className = "p";
			if (word == "}") purpleOpeningCurlyBlock = false;
		} else if (blueKeywords.includes(word)) className = "b";
		else if (blueOpeningBlock && ["(", ")"].includes(word)) {
			className = "b";
			if (word == ")") blueOpeningBlock = false;
		} else if (blueOpeningCurlyBlock && ["{", "}"].includes(word)) {
			className = "b";
			if (word == "}") blueOpeningCurlyBlock = false;
		} else if (
			['"', "'", "`"].some(
				(stringOpener) => word.startsWith(stringOpener) && word.endsWith(stringOpener),
			)
		)
			className = "str";
		else if (['"', "'", "`"].some((stringOpener) => word.search(stringOpener) == 0)) className = "error";
		else if (/\s|;|\!|\^|\&|\(|\)|\[|\]|\{|\}|\*|\+|-|\.|\/|\%|>|>=|=|<|<=/.test(word)) className = "w";

		return getHighlightResult(word, className);
	});

 */
