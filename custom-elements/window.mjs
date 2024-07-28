import Queue from "/utils/queue.js";
import makeId from "/utils/makeId.js";
import makeDraggable from "/utils/makeDraggable.js";
import readFileContents from "/utils/readFileContents.js";
import reorderedDraggableElements from "/utils/reorderdDraggableElements.js";
import Taskbar from "/custom-elements/taskbar/taskbar.mjs";

const SIZE_TRANSITION =
    "width 0.3s, height 0.3s, transform 0.3s, border-radius 0.3s";

const RESIZERS = Object.freeze([
    "nw-resize",
    "ne-resize",
    "se-resize",
    "sw-resize",
    "n-resize",
    "w-resize",
    "e-resize",
    "s-resize",
]);

export default class Window extends HTMLElement {
    static observedAttributes = ["header-title", "icon-src"];
    static orderedWindowIds = new Queue();

    /** @type {HTMLElement} */
    _content;

    /** @type {{ width: number, height: number }} */
    _defaultWindowSize;

    temporary;
    transformCallback;

    /** @type {object} */
    intermediateData;

    /** @type {(e: UIEvent) => void} */
    onResize;

    /** @type {() => void} */
    onToggleFullscreen;

    /** @type {HTMLElement | undefined} */
    customTaskPreview;

    constructor() {
        super();
        this.observer = null;
        this._content = null;
        this._fullscreen = false;
        this.minimized = false;
        this._defaultWindowSize = { width: "31.25rem", height: "12.5rem" };
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

        const taskbarHeight = Taskbar.getHeight();

        this.windowedStyles = {
            width: `min(${this._defaultWindowSize.width}, 100vw)`,
            height: `min(${this._defaultWindowSize.height}, calc(100vh - ${taskbarHeight}px))`,
            transform: `translate(0,0)`,
            left: 0,
            top: 0,
            border: "1px solid #ffffff69",
        };

        this.style.display = "block";
        this.style.zIndex = 1000;
        this.style.borderRadius = "0.25rem";
        this.style.minWidth = this._defaultWindowSize.width;
        this.style.minHeight = this._defaultWindowSize.height;

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
        minimizeButton.onclick = () => this.minimize(false);

        buttons.append(closeButton, sizeButton, minimizeButton);

        /* ------------ Resizers ------------- */
        const resizerElements = [];
        for (const resizer of RESIZERS) {
            const resizerElement = document.createElement("div");
            resizerElement.className = "dragger";
            resizerElement.classList.add(resizer);
            resizerElement.onmousedown = () => {
                document.body.classList.add("cursor-override");
                document.body.style.cursor = resizer;
                this.style.pointerEvents = "none";

                window.onmousemove = (e) => this.#resize(e, resizerElement);
                window.onmouseup = () => {
                    document.body.classList.remove("cursor-override");
                    document.body.style.cursor = "unset";
                    this.style.pointerEvents = "all";

                    this.#lastMouseClient = undefined;

                    window.onmousemove = null;
                    window.onmouseup = null;
                };
            };

            resizerElements.push(resizerElement);
        }

        /* ------------ Title ------------- */
        const span = document.createElement("span");
        span.textContent = this.headerTitle;

        const icon = document.createElement("img");
        icon.src = this.iconSrc;

        const title = document.createElement("div");
        title.className = "title";
        title.append(icon, span);

        /* ------------ Header ------------- */
        const header = document.createElement("header");
        header.append(title, buttons);
        header.ondblclick = (event) => {
            if (event.target !== header) return;
            this.toggleFullscreen();
        };

        /* ------------ Content ------------- */
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

        /* ------------ Template ------------- */
        const template = document.createElement("template");
        template.className = "window";

        const style = document.createElement("style");
        style.innerHTML = await readFileContents("/custom-elements/window.css");

        template.append(style, header, content, ...resizerElements);

        /* ------------ Attach elements ------------- */
        if (this.childNodes.length === 0) this.appendChild(template);

        if (!this.temporary && !globalThis.isMobile) {
            makeDraggable(this, header, {
                customStyles: { position: "absolute", ...this.windowedStyles },
                preventDrag: () => this._fullscreen,
            });

            this.addEventListener("focusin", (e) => {
                // We don't wan't to reorder if pressed on any of these buttons
                if ([closeButton, minimizeButton].includes(e.target)) {
                    return;
                }

                reorderedDraggableElements(
                    Window.orderedWindowIds,
                    this.id,
                    1000
                );
            });

            reorderedDraggableElements(Window.orderedWindowIds, this.id, 1000);

            this.ondragstart = () => false;
        }

        if (globalThis.isMobile) {
            Object.assign(this.windowedStyles, {
                width: "100%",
                height: "100%",
            });

            this.style.minWidth = "100%";
            this.style.minHeight = "100%";
            this.style.boxSizing = "border-box";

            sizeButton.remove();
            closeButton.remove();
            minimizeButton.remove();
            resizerElements.forEach((el) => el.remove());

            this.scrollIntoView();
        }

        this.transformCallback?.(this);
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

            this.style.transition = SIZE_TRANSITION;
        } else {
            setTimeout(() => {
                this.style.transition = null;
            }, 300);
        }

        this.style.width = this._fullscreen
            ? "calc(100vw - 2px)"
            : this.windowedStyles.width;

        const taskbarHeight = Taskbar.getHeight();

        this.style.height = this._fullscreen
            ? `calc(100vh - ${taskbarHeight + 2}px)`
            : this.windowedStyles.height;

        this.style.transform = this._fullscreen
            ? "translate(0,0)"
            : this.windowedStyles.transform;
        this.style.borderRadius = this._fullscreen ? "0px" : "0.25rem";

        // Disable draggers
        this.querySelectorAll(".dragger").forEach((el) => {
            el.style.display = this._fullscreen ? "none" : "unset";
        });

        this.onToggleFullscreen?.();
    }

    /**
     * @param {boolean} temporary for previewing the window from taskbar
     */
    minimize(temporary) {
        if (!temporary) {
            this.minimized = true;
        }

        /** @type {HTMLEletemporaryment} */
        const task = Taskbar.shadowRoot.querySelector(
            `#task-${this.tagName.toLowerCase()} img`
        );
        const rect = task.getBoundingClientRect();

        const windowTransformMatrix = new DOMMatrix(
            getComputedStyle(this).transform
        );

        if (!temporary) {
            this.style.transition =
                "transform 0.2s ease-in, opacity 0.2s ease-in, scale 0.4s ease-in";
            this.tempTransform = `translate(${windowTransformMatrix.m41}px, ${windowTransformMatrix.m42}px) scale(1)`;
        }

        this.style.transformOrigin = "bottom left";
        this.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
        this.style.scale = 0;
        this.style.opacity = 0;
    }

    /**
     * @param {boolean} temporary for previewing the window from taskbar
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
        if (!globalThis.isMobile && !this.temporary) {
            Taskbar.tasks.remove(this.tagName.toLowerCase());
            Window.orderedWindowIds.removeFirstFromEnd(this.id);
        }

        super.remove();
    }

    /** @type {{ x?: number, y?: number }} */
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
            y: 0,
        };

        let difference;
        let newDimensions;

        switch (resizerElement.classList.item(1)) {
            case "s-resize": {
                difference = {
                    x: 0,
                    y: e.clientY - rect.y,
                };

                newDimensions = {
                    width: Number.parseFloat(currentStyles.width),
                    height:
                        Number.parseFloat(currentStyles.height) + difference.y,
                };

                break;
            }
            case "n-resize": {
                difference = {
                    x: 0,
                    y: e.clientY - this.#lastMouseClient.y,
                };

                newDimensions = {
                    width: Number.parseFloat(currentStyles.width),
                    height:
                        Number.parseFloat(currentStyles.height) - difference.y,
                };

                translatesFactors.y = 1;

                break;
            }
            case "w-resize": {
                difference = {
                    x: e.clientX - this.#lastMouseClient.x,
                    y: 0,
                };

                newDimensions = {
                    width:
                        Number.parseFloat(currentStyles.width) - difference.x,
                    height: Number.parseFloat(currentStyles.height),
                };

                translatesFactors.x = 1;

                break;
            }
            case "e-resize": {
                difference = {
                    x: e.clientX - rect.x,
                    y: 0,
                };

                newDimensions = {
                    width:
                        Number.parseFloat(currentStyles.width) + difference.x,
                    height: Number.parseFloat(currentStyles.height),
                };

                break;
            }
            case "se-resize": {
                difference = {
                    x: e.clientX - rect.x,
                    y: e.clientY - rect.y,
                };

                newDimensions = {
                    width:
                        Number.parseFloat(currentStyles.width) + difference.x,
                    height:
                        Number.parseFloat(currentStyles.height) + difference.y,
                };

                break;
            }
            case "sw-resize": {
                difference = {
                    x: e.clientX - this.#lastMouseClient.x,
                    y: e.clientY - rect.y,
                };

                newDimensions = {
                    width:
                        Number.parseFloat(currentStyles.width) - difference.x,
                    height:
                        Number.parseFloat(currentStyles.height) + difference.y,
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
                    width:
                        Number.parseFloat(currentStyles.width) + difference.x,
                    height:
                        Number.parseFloat(currentStyles.height) - difference.y,
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
                    width:
                        Number.parseFloat(currentStyles.width) - difference.x,
                    height:
                        Number.parseFloat(currentStyles.height) - difference.y,
                };

                translatesFactors.x = 1;
                translatesFactors.y = 1;

                break;
            }
        }

        const oneRemInPixels = Number.parseFloat(
            getComputedStyle(document.documentElement).fontSize
        );

        if (
            newDimensions.width >=
                Number.parseFloat(this._defaultWindowSize.width) *
                    oneRemInPixels &&
            e.clientX <= window.innerWidth - 11 &&
            e.clientX >= 0
        ) {
            this.style.width = newDimensions.width + "px";
            translates[0] += difference.x * translatesFactors.x;
        }

        const taskbarHeight = Taskbar.getHeight();

        if (
            newDimensions.height >=
                Number.parseFloat(this._defaultWindowSize.height) *
                    oneRemInPixels &&
            e.clientY <= window.innerHeight - taskbarHeight - 10 &&
            e.clientY >= 0
        ) {
            this.style.height = newDimensions.height + "px";
            translates[1] += difference.y * translatesFactors.y;
        }

        this.style.transform = `translate(${translates[0]}px,${translates[1]}px)`;

        this.#lastMouseClient = {
            x: e.clientX,
            y: e.clientY,
        };

        this.onResize?.(e);
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
