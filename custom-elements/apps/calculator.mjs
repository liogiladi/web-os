import Window from "../window.mjs";
import readFileContents from "/utils/readFileContents.js";
import playAudioSnapshot from "/utils/playAudioSnapshot.js";

const OPERATORS = Object.freeze(["+", "-", "×", "÷"]);

const SPECIAL_FUNCTIONS = Object.freeze({
    exponent: {
        symbol: "x<sup>y</sup>",
        js: "Math.pow(",
    },
    abs: {
        symbol: "|x|",
        js: "Math.abs(",
    },
    "⌋x⌊": {
        js: "Math.floor(",
    },
});

const PARENTHESES_FUNCTIONS = Object.freeze({
    sqrt: {
        symbol: "√",
        js: "Math.sqrt(",
    },
    ln: {
        js: "Math.log(",
    },
    sin: {
        js: "Math.sin(",
    },
    cos: {
        js: "Math.cos(",
    },
    tan: {
        js: "Math.tan(",
    },
});

const FUNCTIONS = Object.freeze({
    ...PARENTHESES_FUNCTIONS,
    ...SPECIAL_FUNCTIONS,
});

const CLOSING_TAGS_PAIRS = {
    "⌊": "⌋",
    "]": "[",
    ")": "(",
};

const CONSTANTS = Object.freeze({
    π: "Math.PI",
    e: "Math.E",
    φ: "((1 + Math.sqrt(5)) / 2)",
});

export default class Calculator extends Window {
    #answer;

    /** @type {HTMLElement} */
    #output;

    /** @type {HTMLElement} */
    #outputTop;

    /** @type {HTMLElement} */
    #outputBottom;

    /** @type {string} */
    #outputString;

    /** @type {boolean} */
    #on;

    /** @type {string} */
    #currentInput;

    /** @type {"number" | "function" | "operator" | "constant" | "decimalPoint" | "openingParentheses" | "closingParentheses"} */
    #currentInputType;

    /** @type {string[]} */
    #parenthesesToClose;

    /** @type {HTMLButtonElement} */
    #closeParenthesesButton;

    constructor() {
        super();
        this._defaultWindowSize = {
            width: "31.25rem",
            height: "28.75rem",
        };
        this.#on = false;
        this.#currentInput = "";
        this.#parenthesesToClose = [];
        this.#outputString = "";
    }

    async connectedCallback() {
        this.headerTitle = "Calcs";
        this.setAttribute("icon-src", "/media/images/app-icons/calcs.png");

        await super.connectedCallback();

        this._content.classList.add("calcs-content");

        const operatorsWrapper = document.createElement("div");
        operatorsWrapper.className = "operators";

        for (const operator of OPERATORS) {
            const operatorElement = document.createElement("button");
            operatorElement.innerHTML = operator;
            operatorElement.onclick = this.#handleOperatorClick.bind(this);

            operatorsWrapper.append(operatorElement);
        }

        const numberButtonsWrapper = document.createElement("div");
        numberButtonsWrapper.className = "number-buttons";

        for (let i = 9; i >= 1; i--) {
            const numberButton = document.createElement("button");
            numberButton.innerHTML = i;
            numberButton.onclick = this.#handleNumberClick.bind(this);
            numberButtonsWrapper.appendChild(numberButton);
        }

        const equalButton = document.createElement("button");
        equalButton.innerHTML = "=";
        equalButton.onclick = this.#handleEqualClick.bind(this);
        numberButtonsWrapper.appendChild(equalButton);

        const decimalPointButton = document.createElement("button");
        decimalPointButton.innerHTML = ".";
        decimalPointButton.onclick = this.#handleDecimalPointClick.bind(this);
        numberButtonsWrapper.appendChild(decimalPointButton);

        const zeroButton = document.createElement("button");
        zeroButton.innerHTML = 0;
        zeroButton.onclick = this.#handleNumberClick.bind(this);
        numberButtonsWrapper.appendChild(zeroButton);

        const functionsWrapper = document.createElement("div");
        functionsWrapper.className = "functions";
        for (const symbol in FUNCTIONS) {
            const functionButton = document.createElement("button");
            functionButton.innerHTML = FUNCTIONS[symbol].symbol || symbol;
            functionButton.id = symbol;
            functionButton.onclick = this.#handleFunctionClick.bind(this);
            functionsWrapper.appendChild(functionButton);
        }

        const constantsWrapper = document.createElement("div");
        constantsWrapper.className = "constants";
        for (const symbol in CONSTANTS) {
            const constantButton = document.createElement("button");
            constantButton.innerHTML = symbol;
            constantButton.onclick = this.#handleConstantClick.bind(this);
            constantsWrapper.appendChild(constantButton);
        }

        const answerButton = document.createElement("button");
        answerButton.innerHTML = "ANS";
        answerButton.onclick = this.#handleConstantClick.bind(this);
        constantsWrapper.appendChild(answerButton);

        const buttonsWrapper = document.createElement("div");
        buttonsWrapper.id = `buttons-${this.id}`;
        buttonsWrapper.className = "buttons";
        buttonsWrapper.append(
            constantsWrapper,
            functionsWrapper,
            numberButtonsWrapper,
            operatorsWrapper
        );

        const miscWrapper = document.createElement("div");
        miscWrapper.className = "misc";

        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = "CE";
        deleteButton.onclick = this.#handleDeleteClick.bind(this);

        this.#closeParenthesesButton = document.createElement("button");
        this.#closeParenthesesButton.innerHTML = ")";
        this.#closeParenthesesButton.onclick =
            this.#handleCloseParenthesesClick.bind(this);

        const openParenthesesButton = document.createElement("button");
        openParenthesesButton.innerHTML = "(";
        openParenthesesButton.onclick =
            this.#handleOpenParenthesesClick.bind(this);

        const nameAndModel = document.createElement("div");
        nameAndModel.className = "name-and-model";

        const h2 = document.createElement("h2");
        h2.innerHTML = "Calcs Open Co.";

        const h3 = document.createElement("h3");
        h3.innerHTML = "xQEW23.";

        this.#output = document.createElement("div");
        this.#output.className = "calcs-output";

        this.#outputTop = document.createElement("div");
        this.#outputBottom = document.createElement("div");

        this.#output.append(this.#outputTop, this.#outputBottom);

        nameAndModel.append(this.#output, h2, h3);

        miscWrapper.append(
            deleteButton,
            this.#closeParenthesesButton,
            openParenthesesButton,
            nameAndModel
        );

        const style = document.createElement("style");
        style.innerHTML = await readFileContents(
            "/custom-elements/apps/calculator.css"
        );

        this.append(style, miscWrapper, buttonsWrapper);
    }

    /**
     * @param {MouseEvent} e
     */
    #handleNumberClick(e) {
        if (!this.#on) {
            this.#on = true;
            this.#output.dataset.on = "";
        }

        if (this.#outputString.length === 0 && this.#answer) {
            this.#outputTop.innerHTML = `Ans = ${this.#answer}`;
        }

        this.#currentInput += e.target.innerHTML;

        let newOutputText = "";

        if (!this.#outputString) {
            newOutputText = this.#currentInput;
        } else if (
            this.#currentInputType === "constant" ||
            this.#currentInputType === "closingParentheses"
        ) {
            newOutputText = this.#outputString + "×" + this.#currentInput;
        } else {
            // Make it so that we retain the number in #currentInputType for decimal point check
            newOutputText =
                this.#outputString.slice(
                    0,
                    this.#outputString.lastIndexOf(
                        this.#currentInput.slice(0, -1)
                    )
                ) + this.#currentInput;
        }

        this.#updateBottomOutput(newOutputText);

        if (this.#currentInputType !== "number") {
            this.#currentInputType = "number";
        }

        playAudioSnapshot("/media/audio/calcs/numbers.wav");
    }

    /**
     * @param {MouseEvent} e
     */
    #handleConstantClick(e) {
        if (!this.#on) {
            this.#on = true;
            this.#output.dataset.on = "";
        }

        if (this.#outputString.length === 0 && this.#answer) {
            this.#outputTop.innerHTML = `Ans = ${this.#answer}`;
        }

        this.#currentInput = "";

        if (
            this.#currentInputType === "number" ||
            this.#currentInputType === "constant"
        ) {
            this.#currentInput += OPERATORS[2];
        }

        this.#currentInputType = "constant";
        this.#currentInput += e.target.innerHTML;

        this.#updateBottomOutput(this.#currentInput, true);

        this.#currentInput = "";
    }

    /**
     * @param {MouseEvent} e
     */
    #handleFunctionClick(e) {
        if (this.#outputString.length === 0 && this.#answer) {
            this.#outputTop.innerHTML = `Ans = ${this.#answer}`;
            this.#on = true;
        }

        if (!this.#on) {
            this.#on = true;
            this.#output.dataset.on = "";
        } else if (this.#currentInputType === "decimalPoint") return;

        this.#currentInput = "";

        const key = e.target.id;

        if (
            this.#currentInputType !== "operator" &&
            this.#currentInputType !== "function" &&
            this.#currentInputType !== "openingParentheses" &&
            key !== "exponent" &&
            this.#outputString.length > 0
        ) {
            this.#currentInput = OPERATORS[2];
        }

        switch (key) {
            case "sqrt":
            case "ln":
            case "cos":
            case "sin":
            case "tan":
                this.#currentInput += FUNCTIONS[key].symbol || key;
                this.#currentInput += "(";
                this.#parenthesesToClose.push(")");
                this.#closeParenthesesButton.innerHTML = ")";
                this.#closeParenthesesButton.hiddenHTML = undefined;

                break;

            case "abs":
                this.#closeParenthesesButton.innerHTML = "|";
                this.#closeParenthesesButton.hiddenHTML = "]";
                this.#parenthesesToClose.push("]");

                this.#currentInput += "[";

                break;

            case "⌋x⌊":
                this.#closeParenthesesButton.innerHTML = "⌊";
                this.#parenthesesToClose.push("⌊");
                this.#closeParenthesesButton.hiddenHTML = undefined;

                this.#currentInput += "⌋";

                break;

            case "exponent": {
                if (
                    this.#currentInputType === "function" ||
                    this.#currentInputType === "operator" ||
                    !this.#outputString ||
                    this.#outputString.endsWith(">")
                )
                    return;

                this.#closeParenthesesButton.innerHTML = ">";
                this.#closeParenthesesButton.hiddenHTML = ">";
                this.#parenthesesToClose.push(">");

                this.#currentInput += `<`;
                break;
            }
        }

        this.#currentInputType = "function";

        this.#updateBottomOutput(this.#currentInput, true);

        playAudioSnapshot("/media/audio/calcs/functions.wav");
    }

    /**
     * @param {MouseEvent} e
     */
    #handleOperatorClick(e) {
        if (this.#outputString.length === 0 && this.#answer) {
            this.#outputTop.innerHTML = `Ans = ${this.#answer}`;
            this.#outputString = this.#answer;
            this.#currentInputType = "number";
            this.#on = true;
        }

        if (
            !this.#on ||
            !this.#outputString ||
            this.#currentInputType === "decimalPoint"
        ) {
            return;
        }

        if (
            e.target.innerHTML !== "-" &&
            (this.#currentInputType === "openingParentheses" ||
                this.#currentInputType === "function")
        ) {
            return;
        }

        const currentOutputText = this.#outputString;
        this.#currentInput = e.target.innerHTML;

        const negativeNumber =
            this.#currentInput === "-" &&
            (this.#currentInputType === "openingParentheses" ||
                this.#currentInputType === "function" ||
                this.#outputString.length === 0);

        if (this.#currentInputType !== "operator") {
            this.#updateBottomOutput(this.#currentInput, true);
            this.#currentInputType = negativeNumber ? "number" : "operator";
        } else {
            this.#updateBottomOutput(
                currentOutputText.slice(0, -1) + this.#currentInput
            );
        }

        playAudioSnapshot("/media/audio/calcs/operators.wav");
    }

    #handleDecimalPointClick() {
        if (
            !this.#on ||
            !this.#outputString ||
            this.#currentInputType !== "number" ||
            this.#currentInputType === "decimalPoint" ||
            this.#currentInput.includes(".")
        ) {
            return;
        }

        this.#currentInputType = "decimalPoint";

        this.#currentInput += ".";
        this.#updateBottomOutput(".", true);

        playAudioSnapshot("/media/audio/calcs/other.wav");
    }

    #handleDeleteClick() {
        this.#currentInputType = null;

        const functionThatEndsString = this.#outputString.match(
            /(sin\(|cos\(|tan\(|√\(|ln\(|\[|⌋)$/
        )?.[0];

        if (functionThatEndsString) {
            const preceededByOperator = OPERATORS.includes(
                this.#outputString.at(-functionThatEndsString.length - 1)
            );

            this.#parenthesesToClose.pop();

            const next = this.#parenthesesToClose.at(-1);

            this.#closeParenthesesButton.innerHTML = !next
                ? ")"
                : next === "]"
                ? "|"
                : next;

            if (next === "]") this.#closeParenthesesButton.hiddenHTML = "]";

            this.#outputString = this.#outputString.slice(
                0,
                -functionThatEndsString.length + (preceededByOperator ? -1 : 0)
            );
        } else if (this.#outputString.endsWith(">")) {
            this.#closeParenthesesButton.innerHTML = ">";
            this.#parenthesesToClose.push(">");

            const extraLetterToDelete = this.#outputString.at(-2);

            if ([")", "]", ">", "⌊"].includes(extraLetterToDelete)) {
                if (extraLetterToDelete === "]") {
                    this.#closeParenthesesButton.innerHTML = "|";
                    this.#closeParenthesesButton.hiddenHTML = "]";
                    this.#parenthesesToClose.push("]");
                } else {
                    this.#closeParenthesesButton.innerHTML =
                        extraLetterToDelete;
                    this.#parenthesesToClose.push(extraLetterToDelete);
                }
            }

            this.#outputString = this.#outputString.slice(0, -2);
        } else if (this.#outputString.endsWith("ANS")) {
            this.#outputString = this.#outputString.slice(0, -3);
        } else {
            const letterToDelete = this.#outputString.at(-1);

            if (["]", ")", "⌊"].includes(letterToDelete)) {
                if (letterToDelete === "]") {
                    this.#closeParenthesesButton.hiddenHTML = "]";
                }

                this.#closeParenthesesButton.innerHTML =
                    letterToDelete === "]" ? "|" : letterToDelete;
                this.#parenthesesToClose.push(letterToDelete);
            }

            this.#outputString = this.#outputString.slice(0, -1);
        }

        const lastLetter = this.#outputString.at(-1);

        if (!isNaN(Number(lastLetter))) this.#currentInputType = "number";
        else if ([")", ">", "⌊", "]"].includes(lastLetter)) {
            this.#currentInputType = "closingParentheses";
        } else if (lastLetter === "(") {
            this.#currentInputType = "openingParentheses";
        } else if (lastLetter === ".") {
            this.#currentInputType = "decimalPoint";
        } else if (
            Object.keys(CONSTANTS).includes(lastLetter) ||
            this.#outputString.endsWith("ANS")
        ) {
            this.#currentInputType = "constant";
        } else if (OPERATORS.includes(lastLetter)) {
            this.#currentInputType = "operator";
        }

        this.#currentInput = "";

        this.#updateBottomOutput("", true);

        playAudioSnapshot("/media/audio/calcs/other.wav");
    }

    #handleOpenParenthesesClick() {
        this.#currentInput = "";

        if (
            this.#currentInputType !== "operator" &&
            this.#currentInputType !== "openingParentheses" &&
            this.#currentInputType !== "function" &&
            this.#outputString.length > 0
        ) {
            this.#currentInput = OPERATORS[2];
        }

        this.#currentInput += "(";
        this.#parenthesesToClose.push(")");
        this.#closeParenthesesButton.innerHTML = ")";
        this.#closeParenthesesButton.hiddenHTML = undefined;

        this.#currentInputType = "openingParentheses";

        this.#updateBottomOutput(this.#currentInput, true);

        playAudioSnapshot("/media/audio/calcs/other.wav");
    }

    /**
     * @param {MouseEvent} e
     */
    #handleCloseParenthesesClick() {
        if (
            !this.#on ||
            this.#currentInputType === "operator" ||
            this.#currentInputType === "decimalPoint" ||
            this.#parenthesesToClose.length <= 0
        ) {
            return;
        }

        const hiddenHTML = this.#closeParenthesesButton.hiddenHTML;
        if (hiddenHTML) this.#closeParenthesesButton.hiddenHTML = undefined;

        this.#updateBottomOutput(
            hiddenHTML || this.#closeParenthesesButton.innerHTML,
            true
        );

        this.#parenthesesToClose.pop();
        this.#closeParenthesesButton.innerHTML =
            this.#parenthesesToClose.at(-1) || ")";

        this.#currentInput = "";

        this.#currentInputType = "closingParentheses";

        playAudioSnapshot("/media/audio/calcs/other.wav");
    }

    #handleEqualClick() {
        if (!this.#on) return;

        if (
            this.#parenthesesToClose.length === 1 &&
            this.#parenthesesToClose[0] === ">"
        ) {
            this.#outputString += ">";
            this.#parenthesesToClose.pop();
            this.#closeParenthesesButton.innerHTML = ")";
        }

        if (this.#parenthesesToClose.length > 0) {
            this.#outputTop.innerHTML = "Error: Missing parentheses";
            this.#outputTop.dataset.error = "";
            return;
        }

        this.#outputTop.innerHTML = "";
        delete this.#outputTop.dataset.error;

        let runnableString = this.#outputString;
        runnableString = runnableString.replace(/×/g, "*").replace(/÷/g, "/");

        // Functions
        if (runnableString.includes("<")) {
            runnableString = this.#formatExponents(runnableString);
        }

        if (runnableString.includes("[")) {
            runnableString = runnableString
                .replace(/\[/g, FUNCTIONS.abs.js)
                .replace(/\]/g, ")");
        }

        if (runnableString.includes("⌋")) {
            runnableString = runnableString
                .replace(/⌋/g, FUNCTIONS["⌋x⌊"].js)
                .replace(/⌊/g, ")");
        }

        for (const [key, info] of Object.entries(PARENTHESES_FUNCTIONS)) {
            runnableString = runnableString.replace(
                new RegExp(`${info.symbol || key}\\(`, "g"),
                info.js
            );
        }

        // Constants
        for (const [key, js] of Object.entries(CONSTANTS)) {
            runnableString = runnableString.replace(new RegExp(key, "g"), js);
        }

        const answer = Number.parseFloat(
            Function(`
                const ANS = ${this.#answer};
                return ${runnableString};
            `)()
        );

        if (Number.isFinite(answer)) {
            this.#on = false;
            this.#answer = answer;
            this.#outputTop.innerHTML = this.#outputBottom.innerHTML + " =";
            this.#outputBottom.innerHTML = answer;
            this.#outputString = "";
            this.#currentInput = "";
            this.#currentInputType = undefined;

            playAudioSnapshot("/media/audio/calcs/answer.wav");
        } else {
            this.#outputTop.innerHTML = "Error";
            this.#outputTop.dataset.error = "";
            this.#answer = undefined;

            playAudioSnapshot("/media/audio/error.wav");
        }
    }

    /**
     *
     * @param {string} runnableString string to format
     * @returns {string} formatted string
     */
    #formatExponents(runnableString) {
        runnableString = runnableString.replace(/&gt;/g, ">");

        let startIndex = runnableString.indexOf("<");
        while (startIndex !== -1) {
            const preceedingLetter = runnableString.at(startIndex - 1);
            let numOfNestedOccurences = 1;

            const range = {
                valueStart: 0,
                functionStart: startIndex,
                functionEnd: 0,
            };

            findFunctionEnd: for (
                let j = startIndex + 1;
                j < runnableString.length;
                j++
            ) {
                if (runnableString.charAt(j) === "<") {
                    numOfNestedOccurences++;
                    continue findFunctionEnd;
                }

                if (runnableString.charAt(j) === ">") {
                    numOfNestedOccurences--;
                    if (numOfNestedOccurences === 0) {
                        range.functionEnd = j;
                        numOfNestedOccurences = 1;
                        break findFunctionEnd;
                    }
                }
            }

            if (!isNaN(Number(preceedingLetter))) {
                findStart: for (let j = startIndex - 2; j >= 0; j--) {
                    if (isNaN(Number(runnableString.charAt(j)))) {
                        range.valueStart = j + 1;
                        break findStart;
                    }
                }
            } else if ([")", "]", "⌊"].includes(preceedingLetter)) {
                findStart: for (let j = startIndex - 2; j >= 0; j--) {
                    if (runnableString.charAt(j) === preceedingLetter) {
                        numOfNestedOccurences++;
                        continue findStart;
                    }

                    if (
                        runnableString.charAt(j) ===
                        CLOSING_TAGS_PAIRS[preceedingLetter]
                    ) {
                        numOfNestedOccurences--;
                        if (numOfNestedOccurences === 0) {
                            let functionNameBuffer = 0;

                            if (runnableString.slice(j - 2, j) === "ln") {
                                functionNameBuffer = 2;
                            } else if (
                                runnableString.slice(j - 1, j) ===
                                FUNCTIONS.sqrt.symbol
                            ) {
                                functionNameBuffer = 1;
                            } else if (
                                ["sin", "cos", "tan"].includes(
                                    runnableString.slice(j - 3, j)
                                )
                            ) {
                                functionNameBuffer = 3;
                            }

                            range.valueStart = j - functionNameBuffer;

                            numOfNestedOccurences = 0;
                            break findStart;
                        }
                    }
                }
            }

            const base = runnableString.slice(
                range.valueStart,
                range.functionStart
            );
            const exponent = runnableString.slice(
                range.functionStart + 1,
                range.functionEnd
            );

            runnableString =
                runnableString.slice(0, range.valueStart) +
                `Math.pow(${base},${exponent})` +
                runnableString.slice(range.functionEnd + 1);

            startIndex = runnableString.indexOf("<");

            return runnableString;
        }
    }

    /**
     * @param {string} value
     * @param {boolean} append
     */
    #updateBottomOutput(value, append = false) {
        if (!this.#on) return;

        if (append) {
            this.#outputString += value === "&gt;" ? ">" : value;
        } else {
            this.#outputString = value;
        }

        let formatted = this.#outputString;
        formatted = formatted.replace(/<|&lt;/g, "@").replace(/>|&gt;/g, "$");
        formatted = formatted.replace(/\$/g, "</sup>").replace(/@/g, "<sup>");
        formatted = formatted.replace(/\[/g, "|").replace(/\]/g, "|");

        this.#outputBottom.innerHTML = formatted;

        if (this.#outputBottom.scrollLeft < this.#outputBottom.scrollWidth) {
            this.#outputBottom.scrollLeft = this.#outputBottom.scrollWidth;
        }
    }
}
