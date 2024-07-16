import readFileContents from "../../utils/readFileContents.js";
import makeDraggable from "../../utils/makeDraggable.js";

export default class Clock extends HTMLElement {
    /** @type {HTMLElement} */
    #secondsHand;

    /** @type {HTMLElement} */
    #minutesHand;

    /** @type {HTMLElement} */
    #hoursHand;

    constructor() {
        super();
    }

    async connectedCallback() {
        const container = document.createElement("article");
        container.className = "clock-container";

        const marks = document.createElement("div");
        marks.className = "marks";

        const minutes = [];
        for (let i = 0; i < 60; i++) {
            const mark = document.createElement("div");
            mark.className = "mark minute-mark";
            mark.style.rotate = `${i * 6}deg`;
            minutes.push(mark);
        }

        const hours = [];
        for (let i = 0; i < 12; i++) {
            const mark = document.createElement("div");
            mark.className = "mark hour-mark";
            mark.style.rotate = `${i * 30}deg`;
            hours.push(mark);
        }

        marks.append(...minutes, ...hours);

        this.#secondsHand = document.createElement("div");
        this.#secondsHand.className = "hand seconds-hand";

        this.#minutesHand = document.createElement("div");
        this.#minutesHand.className = "hand minutes-hand";

        this.#hoursHand = document.createElement("div");
        this.#hoursHand.className = "hand hours-hand";

        container.append(
            marks,
            this.#secondsHand,
            this.#minutesHand,
            this.#hoursHand
        );

        const style = document.createElement("style");
        style.innerHTML = await readFileContents(
            "/custom-elements/widgets/clock.css"
        );

        this.#updateClock();

        this.append(style, container);

        setInterval(() => {
            this.#updateClock();
        }, 1000);

        /* TODO: Decide if to keep this or not (maybe in an edit mode).
        makeDraggable(this, container, {
            bubbleThroughController: true,
            customStyles: {
                width: "10rem",
                height: "10rem",
                position: "fixed",
                right: "0",
                top: "0",
                transform: "translate(-1.5rem, 1.5rem)",
            },
        }); */
    }

    #updateClock() {
        const currentDate = new Date();
        this.#secondsHand.style.rotate = `${currentDate.getSeconds() * 6}deg`;
        this.#minutesHand.style.rotate = `${currentDate.getMinutes() * 6}deg`;
        this.#hoursHand.style.rotate = `${currentDate.getHours() * 30}deg`;
    }
}
