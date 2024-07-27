import readFileContents from "/utils/readFileContents.js";
import TasksData from "/utils/tasksData.js";
import playAudioSnapshot from "/utils/playAudioSnapshot.js";
import AlertDialog from "../alertDialog.mjs";

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

        const logo = document.querySelector("#os-logo");

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

                if (globalThis.isMobile) {
                    logo.style.opacity = 1;
                    logo.style.pointerEvents = "all";
                }
            }, 300);

            if (globalThis.isMobile) {
                const windowsWrapper = document.querySelector("#windows");
                windowsWrapper.style.filter = "unset";
                windowsWrapper.style.overflowX = "hidden";
            }
        };

        const lockButton = document.createElement("button");
        lockButton.style.backgroundImage = `url("/media/lock-button.png")`;
        lockButton.onclick = this.#lockUser.bind(this);

        this.settingsButtons.append(powerOffButton, closeButton, lockButton);
        this.taskbarContent.append(this.settingsButtons);

        // Tasks
        this.tasksWrapper = document.createElement("div");
        this.tasksWrapper.id = "taskbar-tasks";
        this.taskbarContent.append(this.tasksWrapper);

        // Mobile adjustments
        if (globalThis.isMobile) {
            this.taskbarContent.dataset.mobile = true;

            this.tasksWrapper.remove();
            notifications.remove();
            socialLinks.remove();

            const homeButton = document.createElement("button");
            homeButton.id = "home-button";
            homeButton.onclick = this.#goHome.bind(this);

            const navigateButton = document.createElement("button");
            navigateButton.id = "navigate-button";

            navigateButton.onclick = this.#navigate.bind(this);

            const windowsWrapper = document.querySelector("#windows");

            const closeAllWindowsButton = document.createElement("button");
            closeAllWindowsButton.id = "close-all-windows-button";
            closeAllWindowsButton.innerHTML = `<img src='/media/x.svg'></img>`;
            closeAllWindowsButton.onclick = this.#closeAllWindows.bind(this);

            windowsWrapper.append(closeAllWindowsButton);

            this.taskbarContent.append(
                logo,
                homeButton,
                navigateButton,
                closeAllWindowsButton
            );
        }

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

    #lockUser() {
        const transitionLayer = document.querySelector("#transition-layer");
        transitionLayer.style.opacity = 1;
        transitionLayer.style.pointerEvents = "all";
        localStorage.setItem("lockUser", "true");
        localStorage.setItem(
            "logo-width-from-login",
            getComputedStyle(document.querySelector("#transition-layer img"))
                .width
        );
        localStorage.removeItem("logged");

        playAudioSnapshot("/media/audio/lock-user.mp3");

        setTimeout(() => {
            window.location.replace("../login.html");
        }, 1600);
    }

    #powerOff() {
        AlertDialog.showModal(
            "Warning!",
            "Shutting down the machine will delete usaved data.\n\nContinue?",
            {
                positive: "Yes",
                negative: "No",
            },
            () => {
                const transitionLayer =
                    document.querySelector("#transition-layer");
                transitionLayer.querySelector("img").remove();
                transitionLayer.style.opacity = 1;
                transitionLayer.style.pointerEvents = "all";
                transitionLayer.style.background = "black";

                localStorage.removeItem("logged");

                playAudioSnapshot("/media/audio/poweroff.mp3");

                setTimeout(() => {
                    window.location.replace("../index.html");
                }, 1600);
            }
        );
    }

    static getHeight() {
        if (!this.instance.height) {
            this.instance.height =
                this.instance.taskbarContent.getBoundingClientRect().height;
            return this.instance.height;
        }

        return this.instance.height;
    }

    /** ----------------- Mobile ----------------- */

    #emptyMessage = "No open activites";

    #navigate() {
        if (JSON.parse(this.container.dataset.navOpen || "false")) {
            this.#closeNavigation.call(this);
        } else {
            this.#openNavigation.call(this);
        }
    }

    #openNavigation() {
        const windowsWrapper = document.querySelector("#windows");

        windowsWrapper.childNodes.forEach((node) => {
            node.addEventListener(
                "touchstart",
                this.#handleWindowNavigateTouchStart.bind(this)
            );
            node.addEventListener(
                "touchcancel",
                this.#handleWindowNavigateTouchCancel.bind(this)
            );
            node.addEventListener(
                "touchmove",
                this.#handleWindowNavigateTouchMove.bind(this)
            );

            node.addEventListener(
                "touchend",
                this.#handleWindowNavigateTouchEnd.bind(this)
            );
        });

        this.container.dataset.navOpen = true;
        windowsWrapper.dataset.navOpen = true;

        if (windowsWrapper.children.length > 1) {
            windowsWrapper.style.overflowX = "auto";
            windowsWrapper.dataset.multipleWindows = true;
            this.container.dataset.multipleWindows = true;
        } else if (windowsWrapper.children.length === 0) {
            windowsWrapper.dataset.multipleWindows = false;
            windowsWrapper.innerHTML = `<span id='empty-windows-message'>${
                this.#emptyMessage
            }</span>`;

            this.container.dataset.multipleWindows = false;
        }
    }

    #closeNavigation() {
        const windowsWrapper = document.querySelector("#windows");

        windowsWrapper.childNodes.forEach((node) => {
            node.removeEventListener("click", this.#goToWindow.bind(this));
            node.removeEventListener(
                "touchstart",
                this.#handleWindowNavigateTouchStart.bind(this)
            );
            node.removeEventListener(
                "touchcancel",
                this.#handleWindowNavigateTouchCancel.bind(this)
            );
            node.removeEventListener(
                "touchmove",
                this.#handleWindowNavigateTouchMove.bind(this)
            );
            node.removeEventListener(
                "touchend",
                this.#handleWindowNavigateTouchEnd.bind(this)
            );
        });

        this.container.dataset.navOpen = false;
        windowsWrapper.dataset.navOpen = false;

        if (windowsWrapper.textContent === this.#emptyMessage) {
            windowsWrapper.innerHTML = "";
        } else {
            windowsWrapper.style.overflowX = "hidden";
        }
    }

    /** @type {Touch} */
    #previousTouch;

    /**
     *
     * @param {TouchEvent} e
     */
    #handleWindowNavigateTouchStart(e) {
        if (e.touches.length === 1) {
            this.#previousTouch = e.targetTouches[0];
        }
    }

    /**
     *
     * @param {TouchEvent} e
     */
    #handleWindowNavigateTouchMove(e) {
        if (!this.#previousTouch) return;

        const touch = e.targetTouches[0];

        const diffX = touch.clientX - this.#previousTouch.clientX;
        const diffY = touch.clientY - this.#previousTouch.clientY;

        if (Math.abs(diffX) > Math.abs(diffY) || diffY === 0) return;

        const currentTransformMatrix = new DOMMatrix(
            getComputedStyle(e.target).transform
        );
        const currentYTranslate = Number.parseFloat(currentTransformMatrix.m42);

        const newYTranslate = currentYTranslate + diffY;

        e.target.style.transform = `translateY(${newYTranslate}px)`;

        this.#previousTouch = touch;
    }

    /**
     *
     * @param {TouchEvent} e
     */
    #handleWindowNavigateTouchEnd(e) {
        if (!this.#previousTouch) return;

        e.target.removeEventListener(
            "touchmove",
            this.#handleWindowNavigateTouchMove.bind(this)
        );
        e.target.removeEventListener(
            "touchend",
            this.#handleWindowNavigateTouchEnd.bind(this)
        );

        const currentTransformMatrix = new DOMMatrix(
            getComputedStyle(e.target).transform
        );
        const currentYTranslate = Number.parseFloat(currentTransformMatrix.m42);

        const direction = Math.sign(currentYTranslate);

        const SWIPE_THERSHOLD = 60;

        if (
            Math.abs(currentYTranslate) > 0 &&
            Math.abs(currentYTranslate) < SWIPE_THERSHOLD
        ) {
            this.#handleWindowNavigateTouchCancel.call(this, e);
            return;
        }

        if (direction === 0) {
            this.#goToWindow.call(this, e);
            return;
        }

        e.target.style.transition = "0.3s";
        e.target.style.transform = `translateY(${direction * 120}vh)`;
        e.target.style.opacity = 0;

        setTimeout(() => {
            e.target.style.transition = "unset";
            e.target.remove();

            const windowsWrapper = document.querySelector("#windows");

            if (windowsWrapper.children.length <= 1) {
                windowsWrapper.dataset.multipleWindows = false;
                this.container.dataset.multipleWindows = false;
            }

            if (windowsWrapper.children.length === 0) {
                this.#closeNavigation.call(this);
            }
        }, 300);
    }

    /**
     *
     * @param {TouchEvent} e
     */
    #handleWindowNavigateTouchCancel(e) {
        if (!this.#previousTouch) return;
        e.target.style.transform = `translateY(0)`;
    }

    /**
     * @param {MouseEvent} e
     */
    #goToWindow(e) {
        // Make sure the window is locked in center for smooth transition
        e.target.scrollIntoView();

        this.container.dataset.navOpen = false;

        const windowsWrapper = document.querySelector("#windows");

        // Prevent click on window blocker from passing to its contents
        setTimeout(() => {
            windowsWrapper.dataset.navOpen = false;
        }, 0);

        if (windowsWrapper.children.length > 1) {
            windowsWrapper.style.overflowX = "hidden";
        }

        document
            .querySelector("[data-viewed-window]")
            ?.removeAttribute("data-viewed-window");
        e.target.dataset.viewedWindow = "";
    }

    #goHome() {
        this.container.dataset.navOpen = false;

        const windowsWrapper = document.querySelector("#windows");
        windowsWrapper.dataset.navOpen = false;
        windowsWrapper.style.overflowX = "hidden";

        document
            .querySelector("[data-viewed-window]")
            ?.removeAttribute("data-viewed-window");
    }

    #closeAllWindows() {
        const transitionDurationMS = 600;

        const windowsWrapper = document.querySelector("#windows");

        // Flex direction 'reverse' negates scrollLeft value
        const scrollRatio =
            -windowsWrapper.scrollLeft / windowsWrapper.scrollWidth;

        const transitionDirection = scrollRatio > 0.5 ? -1 : 1;

        windowsWrapper.style.overflowX = "hidden";

        const windowsCount = windowsWrapper.children.length;

        for (let i = windowsCount - 1, count = 0; i >= 0; i--, count++) {
            const window = windowsWrapper.children[i];

            window.style.transition = `${transitionDurationMS}ms`;
            window.style.transitionDelay = `${count * 0.1}s`;
            window.style.translate = `${
                transitionDirection * 100 * (count + 1)
            }vw`;
            window.style.opacity = 0;
        }

        setTimeout(() => {
            windowsWrapper.innerHTML = "";
            windowsWrapper.dataset.multipleWindows = false;
            this.#closeNavigation.call(this);
        }, windowsCount * 200);
    }
}