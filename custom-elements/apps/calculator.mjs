import Window from "../window.mjs";
import readFileContents from "/utils/readFileContents.js";

const OPERATORS = Object.freeze({
    "+": (a, b) => {
        return a + b;
    },
    "-": (a, b) => {
        return a - b;
    },
    "×": (a, b) => {
        return a * b;
    },
    "÷": (a, b) => {
        return a / b;
    },
});

const FUNCTIONS = Object.freeze({
    exponent: {
        symbol: "x<sup>y</sup>",
        calc: (a, b) => Math.pow(a, b),
    },
    sqrt: {
        symbol: "√",
        calc: (n) => Math.sqrt(n),
    },
    ln: {
        calc: (a, b) => Math.pow(a, b),
    },
    factorial: {
        symbol: "x!",
        calc: function factorial(n) {
            if (n == 0) return 0;
            return n * factorial(n - 1);
        },
    },
    sin: {
        calc: (n) => Math.sin(n),
    },
    cos: {
        calc: (n) => Math.cos(n),
    },
    tan: {
        calc: (n) => Math.tan(n),
    },
    "⌋x⌊": {
        calc: (n) => Math.floor(n),
    },
});

const CONSTANTS = Object.freeze({
    π: Math.PI,
    e: Math.E,
    φ: (1 + Math.sqrt(5)) / 2,
});

export default class Calculator extends Window {
    #operator;
    #answer;
    #calculationString;

    constructor() {
        super();
        this._defaultWindowSize = {
            width: "500px",
            height: "460px",
        };
    }

    async connectedCallback() {
        this.headerTitle = "Calcs";
        //this.setAttribute("icon-src", "/media/browser-icon.png");

        await super.connectedCallback();

        this._content.classList.add("calcs-content");

        const operatorsWrapper = document.createElement("div");
        operatorsWrapper.className = "operators";

        for (const symbol in OPERATORS) {
            const operatorElement = document.createElement("button");
            operatorElement.innerHTML = symbol;
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
            functionButton.onclick = this.#handleFunctionClick.bind(this);
            functionsWrapper.appendChild(functionButton);
        }

        const constantsWrapper = document.createElement("div");
        constantsWrapper.className = "constants";
        for (const symbol in CONSTANTS) {
            const constantButton = document.createElement("button");
            constantButton.innerHTML = symbol;
            constantButton.onclick = this.#handleNumberClick.bind(this);
            constantsWrapper.appendChild(constantButton);
        }

        const answerButton = document.createElement("button");
        answerButton.innerHTML = "ANS";
        answerButton.onclick = this.#handleNumberClick.bind(this);
        constantsWrapper.appendChild(answerButton);

        const buttonsWrapper = document.createElement("div");
        buttonsWrapper.className = "buttons";
        buttonsWrapper.append(
            operatorsWrapper,
            numberButtonsWrapper,
            functionsWrapper,
            constantsWrapper
        );

        const miscWrapper = document.createElement("div");
        miscWrapper.className = "misc";

        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = "CE";
        deleteButton.onclick = this.#handleDeleteClick.bind(this);

        const closeParenthesesButton = document.createElement("button");
        closeParenthesesButton.innerHTML = ")";
        closeParenthesesButton.onclick =
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

        nameAndModel.append(h2, h3);

        miscWrapper.append(
            deleteButton,
            closeParenthesesButton,
            openParenthesesButton,
            nameAndModel
        );

        const style = document.createElement("style");
        style.innerHTML = await readFileContents(
            "/custom-elements/apps/calculator.css"
        );

        this.append(style, miscWrapper, buttonsWrapper);

        this.onResize = () => {
            const gap = 6;

            this._content.style.setProperty("--gap", `${gap}px`);

            this._content.style.setProperty(
                "--width",
                `calc(${
                    Number.parseFloat(getComputedStyle(buttonsWrapper).width) -
                    gap * 6
                }px / 7)`
            );
            this._content.style.setProperty(
                "--height",
                `calc(${
                    Number.parseFloat(getComputedStyle(buttonsWrapper).height) -
                    gap * 3
                }px / 4)`
            );
        };

        this.onToggleFullscreen = () => {
            this._content.style.opacity = 0;

            setTimeout(() => {
                this._content.style.opacity = 1;
                this.onResize();
            }, 900);
        };

        setTimeout(() => {
            this.onResize();
        }, 0);
    }

    /**
     * @param {MouseEvent} e
     */
    #handleNumberClick(e) {}

    /**
     * @param {MouseEvent} e
     */
    #handleFunctionClick(e) {}

    /**
     * @param {MouseEvent} e
     */
    #handleOperatorClick(e) {}

    /**
     * @param {MouseEvent} e
     */
    #handleEqualClick(e) {}

    /**
     * @param {MouseEvent} e
     */
    #handleDecimalPointClick(e) {}

    /**
     * @param {MouseEvent} e
     */
    #handleDeleteClick(e) {}

    /**
     * @param {MouseEvent} e
     */
    #handleOpenParenthesesClick(e) {}

    /**
     * @param {MouseEvent} e
     */
    #handleCloseParenthesesClick(e) {}
}
