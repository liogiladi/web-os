import readFileContents from "/utils/readFileContents.js";
import reorderedDraggableElements from "/utils/reorderdDraggableElements.js";
import Taskbar from "./taskbar.mjs";
import Window from "../window.mjs";

const requiredAttributes = ["iconSrc", "name"];

export default class Task extends HTMLElement {
    static observedAttributes = [...requiredAttributes];

    /** @type {HTMLTemplateElement} */
    container;

    /** @type {HTMLDivElement} */
    previews;

    constructor() {
        super();
        this.loaded = false;
    }

    async connectedCallback() {
        if (this.loaded) return;
        this.loaded = true;

        // Attributes validations
        for (const attribute of requiredAttributes) {
            if (!this[attribute])
                throw new Error(
                    `<desktop-task> is missing '${attribute
                        .replace(/([a-z])([A-Z])/g, "$1-$2")
                        .toLowerCase()}' attribute`
                );
        }

        this.id = `task-${this.name}`;
        this.tabIndex = 1;

        this.container = document.createElement("template");
        this.container.className = "task task-load-animation";

        const taskIcon = document.createElement("img");
        taskIcon.className = "task-icon";
        taskIcon.src = this.iconSrc || "/media/folder.svg";
        taskIcon.alt = "task icon";
        taskIcon.draggable = false;

        const amount = document.createElement("div");
        amount.className = "amount";

        this.previews = document.createElement("div");
        this.previews.className = "previews";

        const style = document.createElement("style");
        style.innerHTML = await readFileContents(
            "/custom-elements/taskbar/task.css"
        );

        this.container.append(style, taskIcon, amount, this.previews);

        this.appendChild(this.container);

        setTimeout(() => {
            this.container.classList.remove("task-load-animation");
        }, 500);

        this.container.onmouseenter = () => (this.hovers = true);
        this.container.onmouseleave = () => {
            this.hovers = false;

            setTimeout(() => {
                if (!this.hovers && !this.container.dataset.focused) {
                    this.previews.replaceChildren();
                }
            }, 400);
        };

        taskIcon.onmouseenter = () => {
            if (this.previews.childElementCount > 0) return;

            this.previews.replaceChildren();

            const previewsChildren = [];

            const windows = document.querySelectorAll(this.name);

            for (const window of windows) {
                const preview = this.createPreview(window);
                previewsChildren.push(preview);
            }

            this.previews.replaceChildren(...previewsChildren);
        };

        taskIcon.onmouseout = () => {
            if (!("focused" in this.container.dataset)) {
                setTimeout(() => {
                    if (!this.hovers) {
                        this.previews.replaceChildren();
                    }
                }, 400);
            }
        };

        taskIcon.onclick = () => {
            if (Taskbar.tasks.data.get(this.name).count === 1) {
                /** @type {Window} */
                const window = document.querySelector(this.name);

                if (window.minimized) {
                    window.style.transition = "unset";
                    window.unminimize();
                } else {
                    window.minimize();
                }
                
                Taskbar.instance.blur();
            } else if (!("focused" in this.container.dataset)) {
                this.container.dataset.focused = true;
            }
        };

        this.onblur = (e) => {
            if (e.relatedTarget?.className === "task-close-button") return;
            delete this.container.dataset.focused;
            this.previews.replaceChildren();
        };
    }

    attributeChangedCallback(_name, _oldValue, newValue) {
        if (_name == "name") this.name = newValue;
        else if (_name == "icon-src") this.iconSrc = newValue;
    }

    get iconSrc() {
        return this.getAttribute("icon-src");
    }

    set iconSrc(value) {
        this.setAttribute("icon-src", value);
    }

    /**
     * @param {Window} window
     */
    createPreview(window) {
        const preview = document.createElement("article");

        preview.id = `window-preview-${window.id}`;
        preview.className = "preview";
        preview.windowId = window.id;
        preview.onmouseenter = () => {
            this.previewWindow.bind(preview)(window);
        };
        preview.onmouseleave = () => {
            this.unpreviewWindow(window);
        };
        preview.onclick = this.openWindow(window);

        const header = document.createElement("header");

        const title = document.createElement("h2");
        title.innerText = window.getAttribute("header-title");

        const icon = document.createElement("img");
        icon.src = window.iconSrc;

        const infoWrapper = document.createElement("div");
        infoWrapper.append(icon, title);
        infoWrapper.className = "info";

        const closeButton = document.createElement("button");
        closeButton.className = "task-close-button";
        closeButton.innerHTML = `<img src='/media/svgs/x.svg'></img>`;
        closeButton.onclick = this.closeWindow(window.id);

        header.append(infoWrapper, closeButton);

        /** @type {Window} */
        let windowPreview;

        if (window.customTaskPreview) {
            windowPreview = window.customTaskPreview;
            windowPreview.classList.add("custom-preview");
        } else {
            windowPreview = window.cloneNode(true);
            windowPreview.temporary = true;
            windowPreview.removeAttribute("id");
            windowPreview.style.pointerEvents = "none";
            windowPreview.style.opacity = "1";
            windowPreview.style.transformOrigin = "unset";
            windowPreview.style.transition = "unset";
            windowPreview.style.transform = "unset";
            windowPreview.style.scale = "unset";
            windowPreview.intermediateData = window.intermediateData;
            windowPreview.onResize?.();
            windowPreview.onToggleFullscreen?.();

            windowPreview.transformCallback = (contentElement) => {
                const contentRect = contentElement.getBoundingClientRect();
                const wrappeRect = preview.getBoundingClientRect();

                const factor = -45;
                const scaleAmtX = Math.min(
                    (wrappeRect.width + factor) / contentRect.width,
                    (wrappeRect.height + factor) / contentRect.height
                );
                const scaleAmtY = scaleAmtX;

                contentElement.style.scale = `${scaleAmtX} ${scaleAmtY}`;
            };
        }

        const windowPreviewWrapper = document.createElement("div");
        windowPreviewWrapper.className = "window-preview-wrapper";
        windowPreviewWrapper.append(windowPreview);

        preview.append(header, windowPreviewWrapper);

        return preview;
    }

    /**
     *
     * @param {Window} window
     */
    previewWindow(window) {
        const main = document.querySelector("main");
        main.dataset.previewWindow = "";
        window.dataset.windowToPreview = "";

        if (window.minimized) window.unminimize(true);
    }

    unpreviewWindow(window) {
        const main = document.querySelector("main");
        main.removeAttribute("data-preview-window");
        window.removeAttribute("data-window-to-preview");

        if (window.minimized) window.minimize(true);
    }

    /**
     * @param {Window} window
     */
    openWindow(window) {
        /**
         * @param {Event} e
         */
        return () => {
            this.blur();
            this.unpreviewWindow(window);

            if (window.minimized) window.unminimize(false);

            reorderedDraggableElements(
                Window.orderedWindowIds,
                window.id,
                1000
            );
        };
    }

    closeWindow(id) {
        /**
         * @param {Event} e
         */
        return () => {
            this.hovers = true;
            Taskbar.shadowRoot.getElementById(`window-preview-${id}`).remove();
            document.getElementById(id).remove();
        };
    }
}
