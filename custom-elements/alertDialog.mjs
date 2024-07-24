import readFileContents from "/utils/readFileContents.js";

export default class AlertDialog extends HTMLDialogElement {
    /** @type {AlertDialog} */
    static #instance;

    /** @type {HTMLHeadingElement} */
    #heading;

    /** @type {HTMLDivElement} */
    #messageContainer;

    /** @type {HTMLButtonElement} */
    #positiveButton;

    /** @type {HTMLButtonElement} */
    #negativeButton;

    constructor() {
        super();
        AlertDialog.#instance = this;
    }

    async connectedCallback() {
        this.#heading = document.createElement("h2");
        this.#heading.innerHTML = "Default dialog Heading";

        this.#messageContainer = document.createElement("div");
        this.#messageContainer.className = "dialog-message";
        this.#messageContainer.innerHTML = "Default dialog message";

        const buttonsWrapper = document.createElement("div");
        buttonsWrapper.className = "dialog-buttons";

        this.#negativeButton = document.createElement("button");
        this.#negativeButton.innerHTML = "cancel";

        this.#positiveButton = document.createElement("button");
        this.#positiveButton.innerHTML = "okay";

        buttonsWrapper.append(this.#negativeButton, this.#positiveButton);

        const style = document.createElement("style");
        style.innerHTML = await readFileContents(
            "/custom-elements/alert-dialog.css"
        );

        this.append(style,this.#heading, this.#messageContainer, buttonsWrapper);
    }

    /**
     * @param {string} title 
     * @param {string} message 
     * @param {{ positive: string, negative: string } | null} customButtons 
     * @param {()=>void} onPositive 
     * @param {()=>void} [onNegative] 
     */
    static showModal(title, message, customButtons, onPositive, onNegative) {
        if(!customButtons) {
            customButtons = { positive: "okay", negative: "cancel" };
        }

        const alertDialog = AlertDialog.#instance;

        alertDialog.#heading.innerHTML = title;
        alertDialog.#messageContainer.innerHTML = message;

        alertDialog.#positiveButton.innerHTML = customButtons.positive;
        
        alertDialog.#positiveButton.onclick = () => {
            onPositive();
            alertDialog.close();

        }

        alertDialog.#negativeButton.innerHTML = customButtons.negative;
        alertDialog.#negativeButton.onclick = () => {
            onNegative?.();
            alertDialog.close();
        }
        
        alertDialog.showModal();
    }
}
