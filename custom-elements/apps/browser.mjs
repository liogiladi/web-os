import Window from "../window.mjs";
import readFileContents from "../../utils/readFileContents.js";

const isDev = window.location.hostname === "127.0.0.1";
async function checkURL(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) return false;

        return true;
    } catch {
        return false;
    }
}

const MAX_HISTORY_CHANGE = 15;

export default class Browser extends Window {
    /** @type {HTMLIFrameElement} */
    #iframe;

    /** @type {HTMLInputElement} */
    #searchBar;

    /** @type {HTMLButtonElement} */
    #backButton;
    /** @type {HTMLButtonElement} */
    #forwardButton;

    #historyLength = 0;
    #historyIndex = 0;
    #forwardOrBack = false;

    constructor() {
        super();
        this._defaultWindowSize = {
            width: "900px",
            height: "600px",
        };
    }

    async connectedCallback() {
        this.headerTitle = "Browser";
		this.setAttribute("icon-src", "/media/browser-icon.png");

        await super.connectedCallback();

        this._content.classList.add("browser");

        this.#backButton = document.createElement("button");
        this.#backButton.innerHTML = "<";
        this.#backButton.onclick = this.#back.bind(this);
        this.#backButton.setAttribute("disabled", "");

        this.#forwardButton = document.createElement("button");
        this.#forwardButton.innerHTML = ">";
        this.#forwardButton.onclick = this.#forward.bind(this);
        this.#forwardButton.setAttribute("disabled", "");

        this.#searchBar = document.createElement("input");
        this.#searchBar.value = `http://www.browser.com`;
        this.#searchBar.onkeydown = this.#onSearchBarKeyDown.bind(this);

        const topBar = document.createElement("div");
        topBar.className = "top-bar";
        topBar.append(this.#backButton, this.#forwardButton, this.#searchBar);

        this.#iframe = this.#createIframe.bind(this)();

        const style = document.createElement("style");
        style.innerHTML = await readFileContents(
            "/custom-elements/apps/browser.css"
        );

        this.append(style, topBar, this.#iframe);
    }

    /**
     * @param {boolean} deep
     */
    cloneNode(deep = false) {
        const cloned = super.cloneNode(deep);
        cloned.querySelector("iframe").src = (
            this.#iframe.contentWindow || this.#iframe.contentDocument
        ).location.href;
        return cloned;
    }

    /**
     * @param {KeyboardEvent} e
     */
    async #onSearchBarKeyDown(e) {
        if (e.key !== "Enter") return;

        let src;
        let errorCode = "404";

        if (e.target.value.startsWith("http://")) {
            if (e.target.value === "http://www.browser.com") {
                src = `http://${window.location.hostname}${
                    isDev ? ":3000" : ""
                }/pages/browser.html`;
            } else if (
                e.target.value.startsWith("http://www.browser.com/search?q")
            ) {
                src = `http://${window.location.hostname}${
                    isDev ? ":3000" : ""
                }/pages/search.html?q=${e.target.value.split(/\?q=(.*)/s)[1]}`;
            } else if (e.target.value.startsWith("http://www.site.com/")) {
                errorCode = "403";
            }
        } else if (e.target.value.includes("/")) {
            src = `http://${window.location.hostname}${
                isDev ? ":3000" : ""
            }/pages/browserError.html?url=${e.target.value}`;
        } else {
            src = `http://${window.location.hostname}${
                isDev ? ":3000" : ""
            }/pages/search.html?q=${e.target.value}`;
        }

        const urlExists = await checkURL(src);

        if (!urlExists) {
            src = `http://${window.location.hostname}${
                isDev ? ":3000" : ""
            }/pages/browserError.html?url=${e.target.value}&code=${errorCode}`;
        }

        this.#iframe.src = src;
    }

    /**
     * @param {HTMLInputElement} searchBar
     * @returns {HTMLIFrameElement}
     */
    #createIframe() {
        const iframe = document.createElement("iframe");
        iframe.id = this.id;
        iframe.setAttribute("is", "x-frame-bypass");

        iframe.src = `http://${window.location.hostname}${
            isDev ? ":3000" : ""
        }/pages/browser.html`;

        iframe.onload = this.#updateSearchBarURL.bind(this);

        return iframe;
    }

    /**
     * @param {Event} e
     */
    #back(e) {
        this.#historyIndex--;

        if (this.#historyIndex === 1) {
            e.target.setAttribute("disabled", "");
        }

        if (this.#historyIndex === this.#historyLength - 1) {
            this.#forwardButton.removeAttribute("disabled");
        }

        this.#forwardOrBack = true;
        history.back();
    }

    /**
     * @param {Event} e
     */
    #forward(e) {
        this.#historyIndex++;

        if (this.#historyIndex === this.#historyLength) {
            e.target.setAttribute("disabled", "");
        }

        if (this.#historyIndex === 2) {
            this.#backButton.removeAttribute("disabled");
        }

        this.#forwardOrBack = true;
        history.forward();
    }

    #updateSearchBarURL() {
        const url = new URL(this.#iframe.contentWindow.location.href);
        const params = url.searchParams;
        const searchQuery = params.get("q");
        const siteQuery = params.get("id");
        const errorURLQuery = params.get("url");

        if (searchQuery) {
            this.#searchBar.value = `http://www.browser.com/search?q=${searchQuery}`;
        } else if (siteQuery) {
            this.#searchBar.value = `http://www.site.com/${siteQuery}`;
        } else if (errorURLQuery) {
            this.#searchBar.value = errorURLQuery;
        } else if (
            url.href ===
            `http://${window.location.hostname}${
                isDev ? ":3000" : ""
            }/pages/browser.html`
        ) {
            this.#searchBar.value = `http://www.browser.com`;
        }

        if (!this.#forwardOrBack) {
            // Add to history
            if (this.#historyIndex < this.#historyLength) {
                this.#historyLength = this.#historyIndex + 1;
            } else if (this.#historyLength < MAX_HISTORY_CHANGE) {
                this.#historyLength++;
            }

            if (this.#historyLength >= 2) {
                this.#backButton.removeAttribute("disabled");
            }

            this.#historyIndex = this.#historyLength;
            this.#forwardButton.setAttribute("disabled", "");
        } else {
            this.#forwardOrBack = false;
        }
    }
}
