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
            width: "56.25rem",
            height: "37.5rem",
        };
    }

    async connectedCallback() {
        this.headerTitle = "Browser";
		this.setAttribute("icon-src", "/media/images/app-icons/browser.png");

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

        const searchBarForm = document.createElement("form");
        this.#searchBar = document.createElement("input");
        this.#searchBar.value = `http://www.browser.com`;
        searchBarForm.onsubmit = this.#onSearchBarSubmit.bind(this);
        searchBarForm.append(this.#searchBar);

        const topBar = document.createElement("div");
        topBar.className = "top-bar";
        topBar.append(this.#backButton, this.#forwardButton, searchBarForm);

        this.#iframe = this.#createIframe();

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
     * @param {Event} e
     */
    async #onSearchBarSubmit(e) {
        e.preventDefault();

        let src;
        let errorCode = "404";

        if (this.#searchBar.value.startsWith("http://")) {
            if (this.#searchBar.value === "http://www.browser.com") {
                src = `https://${window.location.hostname}${
                    isDev ? ":3000" : ""
                }/pages/desktop/browser/index.html`;
            } else if (
                this.#searchBar.value.startsWith("http://www.browser.com/search?q")
            ) {
                src = `https://${window.location.hostname}${
                    isDev ? ":3000" : ""
                }/pages/desktop/browser/search.html?q=${this.#searchBar.value.split(/\?q=(.*)/s)[1]}`;
            } else if (this.#searchBar.value.startsWith("http://www.site.com/")) {
                errorCode = "403";
            }
        } else if (this.#searchBar.value.includes("/")) {
            src = `https://${window.location.hostname}${
                isDev ? ":3000" : ""
            }/pages/desktop/browser/error.html?url=${this.#searchBar.value}`;
        } else {
            src = `https://${window.location.hostname}${
                isDev ? ":3000" : ""
            }/pages/desktop/browser/search.html?q=${this.#searchBar.value}`;
        }

        const urlExists = await checkURL(src);

        if (!urlExists) {
            src = `https://${window.location.hostname}${
                isDev ? ":3000" : ""
            }/pages/desktop/browser/error.html?url=${this.#searchBar.value}&code=${errorCode}`;
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

        iframe.src = `https://${window.location.hostname}${
            isDev ? ":3000" : ""
        }/pages/desktop/browser/index.html`;

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
            `https://${window.location.hostname}${
                isDev ? ":3000" : ""
            }/pages/desktop/browser/index.html`
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
