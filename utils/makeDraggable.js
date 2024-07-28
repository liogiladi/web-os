import Taskbar from "../custom-elements/taskbar/taskbar.mjs";

/**
 * for calculating mouse positions differences
 * @type {MouseEvent | null}
 */
var _previousMouseEvent = null;

/**
 * @typedef {Object} DragOptions
 * @prop {boolean} bubbleThroughController
 * @prop {CSSStyleDeclaration} customStyles
 * @prop {((event: MouseEvent) => boolean) | null} preventDrag
 */

/**
 * @type {DragOptions}
 */
const initialOptions = {
    bubbleThroughController: false,
    customStyles: {},
    preventDrag: null,
};

/**
 * Make element draggable by mouse.
 * @param {HTMLElement} element to drag
 * @param {HTMLElement} controller to drag with
 * @param {DragOptions} options
 */
export default function makeDraggable(
    element,
    controller,
    options = initialOptions
) {
    element.style.transform = "translate(0,0)";
    element.style.display = "block";
    element.style.width = "fit-content";
    element.style.height = "fit-content";

    for (const key in options.customStyles) {
        element.style[key] = options.customStyles[key];
    }

    controller.onmousedown = (event) => {
        if (!options.bubbleThroughController && event.target !== controller)
            return;
        if (options.preventDrag && options.preventDrag(event)) return;

        event.target.focus();
        document.onmousemove = drag.bind(element);
        document.onmouseup = stopDrag;
    };
}

/**
 * @param {MouseEvent} event 
 */
function drag(event) {
    if (_previousMouseEvent) {
        const deltaX = event.pageX - _previousMouseEvent.pageX;
        const deltaY = event.pageY - _previousMouseEvent.pageY;

        const computedTransformMatrix = new DOMMatrix(
            window.getComputedStyle(this).transform
        );
        const computedTranslation = {
            x: computedTransformMatrix.m41,
            y: computedTransformMatrix.m42,
        };

        const newTranslation = {
            x: computedTranslation.x + deltaX,
            y: computedTranslation.y + deltaY,
        };

        const taskbarHeight = Taskbar.getHeight();

        // Prevent drag if element is exiting viewport
        const rect = this.getBoundingClientRect();
        const exceedsViewport = {
            left: rect.x + deltaX <= -1,
            right: rect.x + rect.width + deltaX >= window.innerWidth + 2,
            top: rect.y + deltaY <= 0,
            bottom:
                rect.y + rect.height + deltaY >=
                window.innerHeight - taskbarHeight,
        };

        if (
            exceedsViewport.left ||
            event.pageX <= 0 ||
            exceedsViewport.right ||
            event.pageX >= window.innerWidth
        ) {
            newTranslation.x = computedTranslation.x;
        }

        if (
            exceedsViewport.top ||
            event.pageY <= 0 ||
            exceedsViewport.bottom ||
            event.pageY >= window.innerHeight - taskbarHeight
        ) {
            newTranslation.y = computedTranslation.y;
        }

        this.style.transform = `translate(${newTranslation.x}px,${newTranslation.y}px)`;
    } else {
        // Grab cursor
        document.body.classList.add("cursor-override");
        document.body.style.cursor = "grabbing";
    }

    _previousMouseEvent = event;
}

function stopDrag() {
    _previousMouseEvent = null;
    document.onmousemove = null;
    document.onmouseup = null;
    document.body.classList.remove("cursor-override");
    document.body.style.cursor = "unset";
}
