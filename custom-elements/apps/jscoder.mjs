import Window from "../window.mjs";
import readFileContents from "/utils/readFileContents.js";
import playAudioSnapshot from "../../utils/playAudioSnapshot.js";

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
    "return",
    "break",
    "continue",
    "throw",
    "try",
    "catch",
];

const blueKeywords = [
    "class",
    "async",
    "constructor",
    "const",
    "let",
    "of",
    "in",
    "var",
    "this",
    "new",
    "void",
    "true",
    "false",
    "super",
    "NaN",
    "null",
    "undefined",
];

String.prototype.replaceAt = function (startIndex, endIndex, replacement) {
    return (
        this.substring(0, startIndex) +
        replacement +
        this.substring(endIndex + 1)
    );
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
        this.setAttribute("icon-src", "/media/images/app-icons/editor.png");
        await super.connectedCallback();

        this._content.className += " jscoder-content";

        const style = document.createElement("style");
        style.innerHTML = await readFileContents(
            "/custom-elements/apps/jscoder.css"
        );
        //this.appendChild(style);

        const editor = document.createElement("code");
        editor.className = "editor";
        editor.contentEditable = "true";
        //this.appendChild(editor);

        const editorView = document.createElement("code");
        editorView.className = "editorView";
        //this.appendChild(editorView);

        const runButton = document.createElement("button");
        runButton.className = "run-button";
        runButton.textContent = "▶";
		runButton.title = "run script";

        const output = document.createElement("span");
        output.className = "output";

        const footer = document.createElement("footer");
        footer.appendChild(output);
        footer.appendChild(runButton);

        //this.appendChild(footer);

        this.append(style, editor, editorView, footer);

        editor.onpaste = (e) => {
            e.preventDefault();
            document.execCommand(
                "insertText",
                false,
                e.clipboardData.getData("text/plain")
            );
        };
        editor.oninput = () =>
            (editorView.innerHTML = highlightText(editor.innerHTML));
        editor.onscroll = () => (editorView.scrollTop = editor.scrollTop);
        editor.onclick = () => editor.focus();
        editor.onkeydown = (e) => {
            if (e.key === "Tab") {
                e.preventDefault();
                document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;");
            }
        };

        runButton.onclick = () => {
            try {
                const preConditions = `
					const logs = [];
					const oldLog = console.log;
					console.log = (value) => {
						logs.push(value + "\\n");
					};
				`;

                const returnStatement = `
					console.log = oldLog;
					return logs.join("");
				`;

                const result = new Function(
                    [preConditions, editor.innerText, returnStatement].join(
                        " "
                    )
                )();
                output.innerText = result;
                output.dataset.error = "false";

                playAudioSnapshot("/media/audio/jscoder/run.wav");
            } catch (error) {
                output.dataset.error = "true";
                output.innerText = `${error.name}: ${error.message}`;

                playAudioSnapshot("/media/audio/error.wav");
            }
        };

        output.addEventListener("click", () => {
            if (this._fullscreen) return;

            if (footer.clientHeight < footer.scrollHeight) {
                // Expand if there's an overflow
                const brs = (footer.innerHTML.match(/<br>/g) || []).length;
                footer.style.maxHeight = brs > 0 ? `${brs * 35}px` : "100%";
            } else {
                footer.style.maxHeight = "2.188rem";
            }
        });
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

		// Block comments
		if(char === "/" && text[i + 1] === "*") {
			if(currentWord) {
				words.push(currentWord);
			}

			currentStringOpener = "/*";
            currentWord = "/";
            continue;
		}else if (currentStringOpener === "/*") {
			if(char == "*" && text[i+1] === "/") {
				words.push(currentWord + "*/");
                currentWord = "";
                currentStringOpener = null;
                i += 1;
			} else if (i === text.length - 1) {
                currentWord += char;
                words.push(currentWord);
            } else {
                currentWord += char;
            }

			continue
		}

        // Inline comments
        if (char === "/" && text[i + 1] === "/") {
			if(currentWord) {
				words.push(currentWord);
			}

            currentStringOpener = "//";
            currentWord = "/";
            continue;
        } else if (currentStringOpener === "//") {
            if (char == "<" && text.substring(i, i + 4) == "<br>") {
                words.push(currentWord, "<br>");
                currentWord = "";
                currentStringOpener = null;
                i += 3;
            } else if (char == "<" && text.substring(i, i + 5) == "<div>") {
                words.push(currentWord, "<br>");
                currentWord = "";
                currentStringOpener = null;
                i += 4;
            } else if (char == "<" && text.substring(i, i + 6) == "</div>") {
                words.push(currentWord, "<br>");
                currentWord = "";
                currentStringOpener = null;
                i += 5;
            } else if (i === text.length - 1) {
                currentWord += char;
                words.push(currentWord);
            } else {
                currentWord += char;
            }

            continue;
        }

        // Strings
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

            currentWord += char;
            continue;
        }

        const space =
            char == " "
                ? " "
                : char == "&" && text.substring(i, i + 6) == "&nbsp;"
                ? "&nbsp;"
                : null;

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
        } else if (char == "<" && text.substring(i, i + 5) == "<div>") {
            words.push(currentWord, "<br>");
            currentWord = "";
            i += 4;
        } else if (
            /\(|\)|\[|\]|\{|\}|\*|\+|-|,|!|\.|\/|%|>|>=|=|<|<=/.test(char)
        ) {
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

	console.log(words);

    words = words.map((word, i) => {
        let className = null;

        if (!isNaN(Number(word))) className = "num";
        else if (purpleKeywords.includes(word)) className = "p";
        else if (blueKeywords.includes(word)) className = "b";
        else if (words[i + 1] === "(") className = "f";

        if (
            ['"', "'", "`"].some(
                (stringOpener) =>
                    word.startsWith(stringOpener) && word.endsWith(stringOpener)
            )
        )
            className = "str";
        else if (
            ['"', "'", "`"].some(
                (stringOpener) => word.search(stringOpener) == 0
            )
        )
            className = "error";
        else if (word.startsWith("//") || word.startsWith("/*")) className = "comment";
        else if (
            /\s|;|!|\^|&|\(|\)|\[|\]|\{|\}|\*|\+|-|\.|\/|%|<|,|>|>=|=|<|<=/.test(
                word
            )
        )
            className = "w";

        return getHighlightedResult(word, className);
    });

    return words.join("");
}

function getHighlightedResult(word, className) {
    return className ? `<span class="hg-${className}">${word}</span>` : word;
}
