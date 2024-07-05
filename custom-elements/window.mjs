import Queue from "/utils/queue.js";
import makeId from "/utils/makeId.js";
import makeDraggable from "/utils/makeDraggable.js";
import readFileContents from "/utils/readFileContents.js";
import reorderedDraggableElements from "/utils/reorderdDraggableElements.js";
import Taskbar from "/custom-elements/taskbar/taskbar.mjs";
import { TASKBAR_HEIGHT } from "/utils/constants.js";

const sizeTransition =
    "width 0.3s, height 0.3s, transform 0.3s, border-radius 0.3s";

export default class Window extends HTMLElement {
    static observedAttributes = ["header-title", "icon-src"];
    static orderedWindowIds = new Queue();
    _content;

    constructor() {
        super();
        this.observer = null;
        this._content = null;
        this._fullscreen = false;
        this.minimized = false;
    }

    async connectedCallback() {
        if (!this.headerTitle) {
            throw new Error(
                "<desktop-window> is missing 'header-title' attribute"
            );
        }

        if (!this.id) this.id = makeId(10);

        this.tabIndex = 1;

        Window.orderedWindowIds.enqueue(this.id);

        this.windowedStyles = {
            width: "min(500px, 100vw)",
            height: `min(200px, calc(100vh - ${TASKBAR_HEIGHT}))`,
            transform: "translate(0,0)",
            left: 0,
            top: 0,
			border: "1px solid #ffffff69"
        };

        this.style.zIndex = 1000;
        this.style.borderRadius = "4px";

        /* ------------ buttons ------------- */
        const buttons = document.createElement("div");
        buttons.className = "buttons";

        const closeButton = document.createElement("button");
        closeButton.textContent = "x";
        closeButton.onclick = this.remove.bind(this);

        const sizeButton = document.createElement("button");
        sizeButton.textContent = "o";
        sizeButton.onclick = this.toggleFullscreen.bind(this);

        const minimizeButton = document.createElement("button");
        minimizeButton.textContent = "_";
        minimizeButton.onclick = () => this.minimize.bind(this)(false);

        buttons.append(closeButton, sizeButton, minimizeButton);

        /* ------------ title ------------- */
        const span = document.createElement("span");
        span.textContent = this.headerTitle;

        const icon = document.createElement("img");
        icon.src = this.iconSrc;

        const title = document.createElement("div");
        title.className = "title";
        title.append(icon, span);

        /* ------------ header ------------- */
        const header = document.createElement("header");
        header.append(title, buttons);
        header.ondblclick = (event) => {
            if (event.target !== header) return;
            this.toggleFullscreen.bind(this)();
        };

        /* ------------ content ------------- */
        const content = document.createElement("div");
        content.className = "content";
        this._content = content;

        // Move all child elements to .content
        while (this.childNodes.length > 1) {
            content.appendChild(this.childNodes[1]);
        }

        // Observe childList such that every child that is appended to <desktop-window> goes to .content
        this.observer = new MutationObserver((mutationList) => {
            for (const mutation of mutationList) {
                if (
                    mutation.type == "childList" &&
                    this.childNodes.length > 0
                ) {
                    while (this.childNodes.length > 1) {
                        content.append(this.childNodes[1]);
                    }
                }
            }
        });

        this.observer.observe(this, { childList: true });

        /* ------------ template ------------- */
        const template = document.createElement("template");
        template.className = "window";

        const style = document.createElement("style");
        style.innerHTML = await readFileContents("/custom-elements/window.css");

        template.append(style, header, content);

        /* ------------ attach elements ------------- */
        //const shadowRoot = this.shadowRoot || this.attachShadow({ mode: "open" });
        //shadowRoot.append(template);

        if (this.childNodes.length === 0) this.appendChild(template);

        makeDraggable(this, header, {
            customStyles: { position: "absolute", ...this.windowedStyles },
        });

        this.addEventListener("focusin", () => {
            reorderedDraggableElements(Window.orderedWindowIds, this.id, 1000);
        });

        this.ondragstart = () => false;
    }

    disconnectedCallback() {
        this.observer.disconnect();
    }

    toggleFullscreen() {
        this._fullscreen = !this._fullscreen;
        this._content.dataset.fullscreen = this._fullscreen;

        if (this._fullscreen) {
            this.windowedStyles = {
                width: this.style.width,
                height: this.style.height,
                transform: this.style.transform,
            };
            this.style.transition = sizeTransition;
        } else {
            setTimeout(() => {
                this.style.transition = null;
            }, 300);
        }

        this.style.width = this._fullscreen
            ? "100vw"
            : this.windowedStyles.width;
        this.style.height = this._fullscreen
            ? `calc(100vh - ${TASKBAR_HEIGHT})`
            : this.windowedStyles.height;
        this.style.transform = this._fullscreen
            ? "translate(0,0)"
            : this.windowedStyles.transform;
        this.style.borderRadius = this._fullscreen ? "0px" : "4px";
    }

    /**
     *
     * @param {boolean} temporary
     */
    minimize(temporary) {
		if (!temporary) this.minimized = true;
		
        /** @type {HTMLEletemporaryment} */
        const task = Taskbar.shadowRoot.querySelector(
			`#task-${this.headerTitle} img`
        );
        const rect = task.getBoundingClientRect();
		
        const windowTransformMatrix = new DOMMatrix(
			getComputedStyle(this).transform
        );
		
        if (!temporary) {
			this.style.transition = "0.2s ease-in";
			this.tempTransform = `translate(${windowTransformMatrix.m41}px, ${windowTransformMatrix.m42}px) scale(1)`;
        }
		
        this.style.transformOrigin = "bottom left";
        this.style.transform = `translate(${rect.left}px, ${rect.top}px) scale(0)`;
        this.style.opacity = 0;
    }

    /**
     * @param {boolean} temporary
     */
    unminimize(temporary) {
        if (!temporary) this.minimized = false;

        if (temporary) {
            this.style.transition = "unset";
        } else {
            setTimeout(() => {
                this.style.transition = "unset";
            }, 200);
        }

        this.style.transformOrigin = "unset";
        this.style.transform = this.tempTransform;
        this.style.opacity = 1;
    }

    remove() {
        Taskbar.tasks.remove(this.headerTitle);
        Window.orderedWindowIds.removeFirstFromEnd(this.id);
        super.remove();
    }

    get headerTitle() {
        return this.getAttribute("header-title");
    }

    set headerTitle(value) {
        this.setAttribute("header-title", value);
    }

    get iconSrc() {
        return this.getAttribute("icon-src");
    }

    set iconSrc(value) {
        this.setAttribute("icon-src", value);
    }
}
