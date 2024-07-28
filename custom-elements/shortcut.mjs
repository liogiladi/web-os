import Queue from "/utils/queue.js";
import makeId from "/utils/makeId.js";
import makeDraggable from "/utils/makeDraggable.js";
import readFileContents from "/utils/readFileContents.js";
import reorderdDraggableElements from "/utils/reorderdDraggableElements.js";
import Taskbar from "/custom-elements/taskbar/taskbar.mjs";

const requiredAttributes = ["wcTagName", "name"];

/**
 * @typedef {Shortcut} Shortcut
 */
export default class Shortcut extends HTMLElement {
    static observedAttributes = [
        "iconSrc",
        "uniqueIconSrc",
        ...requiredAttributes,
    ];
    static orderedFolderIds = new Queue();

    /** @type {HTMLSpanElement} */
    span;

    /** @type {HTMLTextAreaElement} */
    textarea;

    /** @type {HTMLButtonElement} */
    #deleteButton;

    /** @type {object} */
    intermediateData;

    /** @type {boolean} */
    deletetable;

    /** @type {() => void} */
    delete;

    constructor() {
        super();
    }

    async connectedCallback() {
        for (const attribute of requiredAttributes) {
            if (!this[attribute])
                throw new Error(
                    `<desktop-shortcut> is missing '${attribute
                        .replace(/([a-z])([A-Z])/g, "$1-$2")
                        .toLowerCase()}' attribute`
                );
        }
        if (this.textContent)
            throw new Error("<desktop-shortcut> cannot have innerHTML");

        if (!this.id) this.id = makeId(10);

        Shortcut.orderedFolderIds.enqueue(this.id);

        const shadowRoot = this.attachShadow({ mode: "open" });

        const template = document.createElement("template");
        template.className = "shortcut";
        template.tabIndex = 0;

        const img = document.createElement("img");
        img.src = this.uniqueIconSrc || this.iconSrc || "/media/svgs/folder.svg";
        img.alt = "shortcut icon";
        img.draggable = false;

        this.span = document.createElement("span");
        this.span.innerText = this.name;
        this.span.style.pointerEvents = "none";

        if (!globalThis.isMobile) {
            this.span.onclick = this.selectInput.bind(this);
        }

        this.textarea = document.createElement("textarea");
        this.textarea.onblur = this.deselectInput.bind(this);

        this.#deleteButton = document.createElement("button");
        this.#deleteButton.className = "delete-button";
        this.#deleteButton.innerHTML = `<img src='/media/svgs/x.svg'></img>`;

        if (!this.deletetable) {
            this.#deleteButton.disabled = true;
            this.#deleteButton.title = "This core item cannot be deleted";
        } else {
            this.#deleteButton.onclick = this.delete;
        }

        const style = document.createElement("style");
        style.innerHTML = await readFileContents(
            "/custom-elements/shortcut.css"
        );

        template.append(
            style,
            img,
            this.span,
            this.textarea,
            this.#deleteButton
        );
        for (const attribute of Shortcut.observedAttributes) {
            template.setAttribute(attribute, this[attribute]);
        }

        if (globalThis.isMobile) {
            this.onclick = this.dblClick.bind(this);
        } else {
            this.ondblclick = this.dblClick.bind(this);
        }

        this.ondragstart = () => false;

        shadowRoot.append(template);

        if (!globalThis.isMobile) {
            makeDraggable(this, template, {
                customStyles: { position: "relative" },
                bubbleThroughController: true,
                preventDrag: (event) => event.target === this.textarea,
            });

            this.onfocus = this.focus;
            this.onblur = this.blur;
            this.oncontextmenu = (e) => {
                e.stopPropagation();
                this.#deleteButton.style.display = "block";
                return false;
            };
        }

        this.style.userSelect = "none";
        this.isMobile = globalThis.isMobile;
    }

    attributeChangedCallback(_name, _oldValue, newValue) {
        if (_name == "name") this.name = newValue;
        else if (_name == "icon-src") this.iconSrc = newValue;
        else if (_name == "wc-tag-name") this.wcTagName = newValue;
    }

    /**
     * @param {MouseEvent} e
     */
    selectInput({ target }) {
        if (document.activeElement === target) return;
        target.style.opacity = 0;
        target.style.pointerEvents = "none";

        this.textarea.value = target.innerHTML;
        this.textarea.style.display = "unset";
        this.textarea.focus();
        this.textarea.scrollTop = 0;
        this.textarea.style.bottom =
            target.innerHTML.length < 8 ? "calc(1.25rem - 1rem)" : "-1rem";
        this.textarea.style.height =
            target.innerHTML.length > 8 ? "unset" : "1.25rem";
    }

    deselectInput({ target }) {
        target.style.display = "none";
        target.parentNode;

        this.span.innerHTML = target.value;
        this.span.style.opacity = 1;
        this.span.style.pointerEvents = "all";
    }

    focus() {
        this.span.style.pointerEvents = "all";
        reorderdDraggableElements(Shortcut.orderedFolderIds, this.id, 100);
    }

    blur() {
        this.span.style.pointerEvents = "none";
        this.#deleteButton.style.display = "none";
    }

    dblClick() {
        const windowsContainer = document.getElementById("windows");
        const window = document.createElement(this.wcTagName);
        window.headerTitle = this.name;
        window.iconSrc = this.iconSrc;
        window.dataset.shortcutId = this.id;

        if (this.isMobile) {
            document
                .querySelector("[data-viewed-window]")
                ?.removeAttribute("data-viewed-window");
            window.dataset.viewedWindow = "";
            windowsContainer.style.overflowX = "hidden";

            Taskbar.instance.container.dataset.settingsOpen = false;
            Taskbar.instance.container.dataset.navOpen = false;
            Taskbar.instance.currentMobileState = "window";
        } else {
            Taskbar.tasks.add({
                name: this.wcTagName,
                iconSrc: this.iconSrc,
                count: 1,
            });
        }

        if (this.intermediateData) {
            window.intermediateData = this.intermediateData;
        }

        windowsContainer.appendChild(window);
    }

    get iconSrc() {
        return this.getAttribute("icon-src");
    }

    set iconSrc(value) {
        this.setAttribute("icon-src", value);
    }

    get wcTagName() {
        return this.getAttribute("wc-tag-name");
    }

    set wcTagName(value) {
        this.setAttribute("wc-tag-name", value);
    }

    get uniqueIconSrc() {
        return this.getAttribute("unique-icon-src");
    }

    set uniqueIconSrc(value) {
        this.setAttribute("unique-icon-src", value);
    }
}
