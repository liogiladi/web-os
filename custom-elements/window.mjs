import Queue from "/utils/queue.js";
import makeId from "/utils/makeId.js";
import makeDraggable from "/utils/makeDraggable.js";
import readFileContents from "/utils/readFileContents.js";
import reorderedDraggableElements from "/utils/reorderdDraggableElements.js";
import Taskbar from "/custom-elements/taskbar/taskbar.mjs";
import { TASKBAR_HEIGHT } from "/utils/constants.js";

const sizeTransition =
    "width 0.3s, height 0.3s, transform 0.3s, border-radius 0.3s";

const resizers = ["nw-resize", "ne-resize", "se-resize", "sw-resize"];

export default class Window extends HTMLElement {
    static observedAttributes = ["header-title", "icon-src"];
    static orderedWindowIds = new Queue();

    /** @type {HTMLElement} */
    _content;

    /** @type {{ width: number, height: number }} */
    _defaultWindowSize;

    temporary;
    transformCallback;

    constructor() {
        super();
        this.observer = null;
        this._content = null;
        this._fullscreen = false;
        this.minimized = false;
        this._defaultWindowSize = { width: "500px", height: "200px" };
    }

    async connectedCallback() {
        if (!this.headerTitle) {
            throw new Error(
                "<desktop-window> is missing 'header-title' attribute"
            );
        }

        if (!this.id) this.id = makeId(10);

        this.tabIndex = 1;

        if (!this.temporary) {
            Window.orderedWindowIds.enqueue(this.id);
        }

        this.windowedStyles = {
            width: `min(${this._defaultWindowSize.width}, 100vw)`,
            height: `min(${this._defaultWindowSize.height}, calc(100vh - ${TASKBAR_HEIGHT}))`,
            transform: `translate(0,0)`,
            left: 0,
            top: 0,
            border: "1px solid #ffffff69",
        };

        this.style.zIndex = 1000;
        this.style.borderRadius = "4px";
        this.style.translate = "0 0";

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

        /* ------------ resizers ------------- */
        const resizerElements = [];
        for (const resizer of resizers) {
            const resizerElement = document.createElement("div");
            resizerElement.className = "dragger";
            resizerElement.classList.add(resizer);
            resizerElement.onmousedown = () => {
                document.body.classList.add("cursor-override");
                document.body.style.cursor = resizer;

                window.onmousemove = (e) =>
                    this.#resize.bind(this)(e, resizerElement);
                window.onmouseup = () => {
                    document.body.classList.remove("cursor-override");
                    document.body.style.cursor = "unset";

                    this.#lastMouseClient = undefined;

                    window.onmousemove = null;
                    window.onmouseup = null;
                };
            };

            resizerElements.push(resizerElement);
        }

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

        template.append(style, header, content, ...resizerElements);

        /* ------------ attach elements ------------- */
        //const shadowRoot = this.shadowRoot || this.attachShadow({ mode: "open" });
        //shadowRoot.append(template);

        if (this.childNodes.length === 0) this.appendChild(template);

        if (!this.temporary) {
            makeDraggable(this, header, {
                customStyles: { position: "absolute", ...this.windowedStyles },
            });

            this.addEventListener("focusin", () => {
                reorderedDraggableElements(
                    Window.orderedWindowIds,
                    this.id,
                    1000
                );
            });

            this.ondragstart = () => false;
        }

        if (this.transformCallback) {
            this.transformCallback(this);
        }
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
        if (!temporary) {
            console.log("yay?");
            this.minimized = true;
        }

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
        this.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
        this.style.scale = 0;
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
        this.style.scale = 1;
        this.style.opacity = 1;
    }

    remove() {
        if (!this.temporary) {
            Taskbar.tasks.remove(this.headerTitle);
            Window.orderedWindowIds.removeFirstFromEnd(this.id);
        }

        super.remove();
    }

    /** @type {{ x: number, y: number }} */
    #lastMouseClient;

    /**
     * @param {MouseEvent} e
     * @param {HTMLElement} resizerElement
     */
    #resize(e, resizerElement) {
        if (this.#lastMouseClient === undefined) {
            this.#lastMouseClient = {
                x: e.clientX,
                y: e.clientY,
            };
        }

        const rect = resizerElement.getBoundingClientRect();
        
        const currentStyles = getComputedStyle(this);

        const transformMatrix = new DOMMatrix(currentStyles.transform);
        const translates = [transformMatrix.m41, transformMatrix.m42];
        let translatesFactors = {
            x: 0,
            y:0
        }

        let difference;
        let newDimensions;

        switch (resizerElement.classList.item(1)) {
            case "se-resize": {
                difference = {
                    x: e.clientX - rect.x,
                    y: e.clientY - rect.y,
                };

                newDimensions = {
                    width: Number.parseFloat(currentStyles.width) + difference.x,
                    height: Number.parseFloat(currentStyles.height) + difference.y,
                };

                break;
            }
            case "sw-resize": {
                difference = {
                    x: e.clientX - this.#lastMouseClient.x,
                    y: e.clientY - rect.y,
                };

                newDimensions = {
                    width: Number.parseFloat(currentStyles.width) - difference.x,
                    height: Number.parseFloat(currentStyles.height) + difference.y,
                };

                translatesFactors.x = 1;

                break;
            }
            case "ne-resize": {
                difference = {
                    x: e.clientX - rect.x,
                    y: e.clientY - this.#lastMouseClient.y,
                };

                newDimensions = {
                    width: Number.parseFloat(currentStyles.width) + difference.x,
                    height: Number.parseFloat(currentStyles.height) - difference.y,
                };

                translatesFactors.y = 1;

                break;
            }
            case "nw-resize": {
                difference = {
                    x: e.clientX - this.#lastMouseClient.x,
                    y: e.clientY - this.#lastMouseClient.y,
                };

                newDimensions = {
                    width: Number.parseFloat(currentStyles.width) - difference.x,
                    height: Number.parseFloat(currentStyles.height) - difference.y,
                };

                translatesFactors.x = 1;
                translatesFactors.y = 1;

                break;
            }
        }

        if (
            newDimensions.width >=
                Number.parseFloat(this._defaultWindowSize.width) &&
            e.clientX <= window.innerWidth
        ) {
            this.style.width = newDimensions.width + "px";
            translates[0] += difference.x * translatesFactors.x;
        }

        if (
            newDimensions.height >=
                Number.parseFloat(this._defaultWindowSize.height) &&
            e.clientY <=
                window.innerHeight - Number.parseFloat(TASKBAR_HEIGHT)
        ) {
            this.style.height = newDimensions.height + "px";
            translates[1] += difference.y * translatesFactors.y;

        }

        this.style.transform = `translate(${translates[0]}px,${translates[1]}px)`;
        
        this.#lastMouseClient = {
            x: e.clientX,
            y: e.clientY
        };
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
