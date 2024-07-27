import Window from "../window.mjs";
import readFileContents from "/utils/readFileContents.js";

const requiredAttributes = ["imgSrc"];

export default class Gallery extends Window {
    static observedAttributes = [...requiredAttributes];

    /** @type {string} */
    #imgSrc;

    constructor() {
        super();
        this._defaultWindowSize = {
            width: "35rem",
            height: "35rem",
        };
    }

    async connectedCallback() {
        this.#imgSrc = this.intermediateData.imgSrc;

        await super.connectedCallback();

        this._content.classList.add("gallery-content");
        
        const img = document.createElement("img");
        img.src = this.#imgSrc;
        img.oncontextmenu = (e) => e.stopPropagation(); 

        const style = document.createElement("style");
        style.innerHTML = await readFileContents("/custom-elements/apps/gallery.css");

        this.append(style, img);
    }

    get imgSrc() {
        return this.getAttribute("img-src");
    }

    set imgSrc(value) {
        this.setAttribute("img-src", value);
    }
}
