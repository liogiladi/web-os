import readFileContents from "/utils/readFileContents.js";
import TasksData from "/utils/tasksData.js";
import playAudioSnapshot from "/utils/playAudioSnapshot.js";

/**
 * @typedef TaskInfo
 * @prop {string} name
 * @prop {string} iconSrc
 * @prop {number} count
 */

const notificationsIconsSrcs = [
    "/media/audio-icon.svg",
    "/media/wifi-icon.svg",
];

export default class Taskbar extends HTMLElement {
    /** @type {ShadowRoot} */
    static shadowRoot;

    /** @type {Taskbar} */
    static instance;

    /** @type {HTMLElement} */
    container;

    /** @type {Settings} */
    settings;

    /** @type {HTMLElement} */
    settingsButtons;

    /** @type {HTMLElement} */
    tasksWrapper;

    /** @type {TasksData}  */
    static tasks = new TasksData();

    /** @type {number} */
    #timeIntervalId;

    height;

    constructor() {
        super();
        Taskbar.instance = this;
    }

    async connectedCallback() {
        this.container = document.createElement("footer");
        this.container.id = "taskbar";

        this.taskbarContent = document.createElement("div");
        this.taskbarContent.id = "taskbar-content";
        this.container.append(this.taskbarContent);

        const style = document.createElement("style");
        style.innerHTML = await readFileContents(
            "/custom-elements/taskbar/taskbar.css"
        );

        // Right area - notifications
        const notifications = document.createElement("div");
        notifications.id = "taskbar-notifications";

        const timeInfo = document.createElement("div");
        timeInfo.id = "taskbar-time-info";

        let currDate = new Date();

        const time = document.createElement("span");
        time.innerHTML = currDate.toTimeString().slice(0, 5);

        const date = document.createElement("span");
        date.innerHTML = currDate.toLocaleDateString().slice(0, 9);
        timeInfo.append(time, date);

        notifications.append(timeInfo);

        for (const src of notificationsIconsSrcs) {
            const notification = document.createElement("img");
            notification.src = src;
            notification.className = "notification";

            if (src.includes("audio")) {
                const audioDisabled = localStorage.getItem("disable-audio");
                notification.setAttribute("muted", audioDisabled);
                notification.onclick = this.#toggleAudio.bind(this);
            }

            notifications.append(notification);
        }

        this.taskbarContent.append(notifications);

        // Left area - social links
        const socialLinks = document.createElement("div");
        socialLinks.id = "taskbar-social-links";

        const github = document.createElement("a");
        const githubIcon = document.createElement("img");
        githubIcon.src = "/media/github-icon.svg";
        github.href = "https://github.com/liogiladi";
        github.target = "_blank";
        github.append(githubIcon);

        const linkedIn = document.createElement("a");
        const linkedInIcon = document.createElement("img");
        linkedInIcon.src = "/media/linkedin-icon.svg";
        linkedIn.href = "https://www.linkedin.com/in/lio-giladi/";
        linkedIn.target = "_blank";
        linkedIn.append(linkedInIcon);

        socialLinks.append(linkedIn, github);
        this.taskbarContent.append(socialLinks);

        // Settings
        this.settings = document.createElement("desktop-settings");
        this.container.append(this.settings);

        this.settingsButtons = document.createElement("div");
        this.settingsButtons.id = "settings-buttons";

        const powerOffButton = document.createElement("button");
        powerOffButton.style.backgroundImage = `url("/media/off-button.png")`;
        powerOffButton.onclick = this.#powerOff.bind(this);

        const closeButton = document.createElement("button");
        closeButton.style.backgroundImage = `url("/media/close-button.png")`;
        closeButton.onclick = () => {
            this.settings.classList.remove("settings-load-animation");
            this.settings.classList.add("settings-unload-animation");

            this.settingsButtons.classList.remove("settings-load-animation");
            this.settingsButtons.classList.add("settings-unload-animation");

            setTimeout(() => {
                this.container.dataset.settingsOpen = false;
                this.settings.classList.remove("settings-unload-animation");
                this.settingsButtons.classList.remove(
                    "settings-unload-animation"
                );

                this.tasksWrapper.style.opacity = 1;
                this.tasksWrapper.style.pointerEvents = "all";
            }, 300);
        };

        const signOutButton = document.createElement("button");
        signOutButton.style.backgroundImage = `url("/media/out-button.png")`;
        signOutButton.onclick = this.#logout.bind(this);

        this.settingsButtons.append(powerOffButton, closeButton, signOutButton);
        this.taskbarContent.append(this.settingsButtons);

        // Tasks
        this.tasksWrapper = document.createElement("div");
        this.tasksWrapper.id = "taskbar-tasks";
        this.taskbarContent.append(this.tasksWrapper);

        this.append(this.container);

        // Observe childList such that every child that is appended to <desktop-window> goes to tasks wrapper
        this.observer = new MutationObserver((mutationList) => {
            for (const mutation of mutationList) {
                if (
                    mutation.type === "childList" &&
                    this.childNodes.length > 0
                ) {
                    while (this.childNodes.length > 0) {
                        this.tasksWrapper.appendChild(this.childNodes[0]);
                    }
                }
            }
        });

        this.observer.observe(this, { childList: true });

        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.append(style, this.container);

        Taskbar.shadowRoot = shadowRoot;

        this.#timeIntervalId = setInterval(() => {
            currDate = new Date();

            time.innerHTML = currDate.toTimeString().slice(0, 5);
            date.innerHTML = currDate.toLocaleDateString().slice(0, 9);
        }, 2000);
    }

    disconnectedCallback() {
        clearInterval(this.#timeIntervalId);
    }

    /**
     * @param {MouseEvent} e
     */
    #toggleAudio(e) {
        const audioDisabled = localStorage.getItem("disable-audio");
        if (audioDisabled) localStorage.removeItem("disable-audio");
        else localStorage.setItem("disable-audio", "true");
        e.target.setAttribute("muted", !audioDisabled);
    }

    #logout() {
        const transitionLayer = document.querySelector("#transition-layer");
        transitionLayer.style.opacity = 1;
        transitionLayer.style.pointerEvents = "all";
        localStorage.setItem("logout", "true");
        localStorage.setItem(
            "logo-width-from-login",
            getComputedStyle(document.querySelector("#transition-layer img"))
                .width
        );
        localStorage.removeItem("logged");

        playAudioSnapshot("/media/audio/logout.mp3");

        setTimeout(() => {
            window.location.replace("../login.html");
        }, 1500);
    }

    #powerOff() {
        if (
            window.confirm(
                "Shutting down the machine will delete usaved data. Capiche?"
            )
        ) {
            const transitionLayer = document.querySelector("#transition-layer");
            transitionLayer.querySelector("img").remove();
            transitionLayer.style.opacity = 1;
            transitionLayer.style.pointerEvents = "all";
            transitionLayer.style.background = "black";

            localStorage.removeItem("logged");

            playAudioSnapshot("/media/audio/poweroff.mp3");

            setTimeout(() => {
                window.location.replace("../index.html");
            }, 1500);
        }
    }

    static getHeight() {
        if (!this.instance.height) {
            this.instance.height =
                this.instance.taskbarContent.getBoundingClientRect().height;
            return this.instance.height;
        }

        return this.instance.height;
    }
}
