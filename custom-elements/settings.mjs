import readFileContents from "../utils/readFileContents.js";
import Taskbar from "./taskbar/taskbar.mjs";
import convertFileToBase64 from "../utils/convertFileToBase64.js";
import hash from "../utils/hash.js";

/**
 * @typedef {object} Theme
 * @prop {string} [name]
 * @prop {string} [filter]
 * @prop {string} windowBg
 * @prop {string} plainColor
 */

/**
 * @type {Readonly<Record<string, Theme>>}
 */
export const THEMES_FILTERS = Object.freeze({
    purple: {
        windowBg: `linear-gradient(
            0deg,
            rgba(209, 90, 207, 0.8) 0%,
            rgba(250, 167, 249, 0.8) 100%
        )`,
        plainColor: "#ff3fff",
    },
    blue: {
        filter: "hue-rotate(264deg)",
        windowBg: `linear-gradient(
            0deg,
            rgb(90 154 209 / 80%) 0%,
            rgb(167 194 250 / 80%) 100%
        )`,
        plainColor: "#1f8bff",
    },
    red: {
        filter: "hue-rotate(50deg)",
        windowBg: `linear-gradient(
            0deg,
            rgb(209 90 102 / 80%) 0%,
            rgb(250 167 188 / 80%) 100%
        )`,
        plainColor: "#ff2e54",
    },
    yellow: {
        filter: "hue-rotate(111deg) brightness(1.5)",
        windowBg: `linear-gradient(
            0deg, rgb(209 195 90 / 80%) 0%,
            rgb(250 227 167 / 80%) 100%
        )`,
        plainColor: "#ffe055",
    },
});

export default class Settings extends HTMLElement {
    /** @type {Settings} */
    static instance;

    /** @type {HTMLImageElement} */
    #profileImg;

    /** @type {HTMLInputElement} */
    #nameInput;

    /** @type {HTMLInputElement} */
    #passInput;

    /** @type {HTMLInputElement} */
    #submitButton;

    constructor() {
        super();
        this.initialized = false;
        Settings.instance = this;
    }

    async connectedCallback() {
        if (this.initialized) return;

        this.initialized = true;

        // Theme
        const themeSettings = document.createElement("section");
        themeSettings.className = "settings";
        themeSettings.id = "theme-settings";

        const themeTitle = document.createElement("h2");
        themeTitle.innerHTML = "Theme";

        themeSettings.append(themeTitle);

        const themes = document.createElement("div");
        themes.id = "themes";

        const currentTheme = localStorage.getItem("theme")
            ? JSON.parse(localStorage.getItem("theme")).name
            : "purple";

        for (const [key, theme] of Object.entries(THEMES_FILTERS)) {
            const themeButton = document.createElement("button");
            themeButton.id = `${key}-theme`;

            const bg = document.createElement("img");
            bg.src = `/media/images/themes/${key}.png`;

            themeButton.append(bg);
            themeButton.onclick = () =>
                this.#changeTheme.call(this, key, theme);

            if (key === currentTheme) themeButton.dataset.selected = "";
            themes.append(themeButton);
        }

        themeSettings.append(themes);

        // Account
        const accountInfo = localStorage.getItem("account-info");

        const accountSettings = document.createElement("section");
        accountSettings.className = "settings";
        accountSettings.id = "account-settings";

        const accountTitle = document.createElement("h2");
        accountTitle.innerHTML = "Account";

        const form = document.createElement("form");
        form.onsubmit = this.#handleAccountInfoSubmit.bind(this);

        //Profile
        const profilePictureInput = document.createElement("input");
        Object.assign(profilePictureInput, {
            type: "file",
            name: "profilePicture",
            onchange: this.#handleProfilePictureChange.bind(this),
            hidden: true,
            accept: "image/*",
        });

        const profileImgWrapper = document.createElement("div");
        profileImgWrapper.id = "profile-img-wrapper";
        profileImgWrapper.onclick = () => profilePictureInput.click();

        this.#profileImg = document.createElement("img");
        this.#profileImg.src = "/media/default-profile-pic.png";
        profileImgWrapper.append(this.#profileImg);

        // Fields
        this.#nameInput = document.createElement("input");
        Object.assign(this.#nameInput, {
            type: "text",
            name: "username",
            placeholder: "Enter a name...",
            required: true,
            pattern: "^(?:[a-zA-Zds]*)[a-zA-Z]+(?:[a-zA-Zds]*)$",
            minLength: 4,
            maxLength: 12,
            oninvalid: (e) =>
                e.target.setCustomValidity(
                    "Username should consist of:\n* 4-12 letters\n* English letters\n- (optional) 0-9\n- (optional) spaces"
                ),
            oninput: (e) => e.target.setCustomValidity(""),
        });

        this.#passInput = document.createElement("input");
        Object.assign(this.#passInput, {
            type: "password",
            name: "password",
            placeholder: "Enter a password...",
            onfocus: (e) => (e.target.value = ""),
        });

        const inputs = document.createElement("div");
        inputs.id = "inputs";
        inputs.append(this.#nameInput, this.#passInput);

        if (accountInfo) {
            this.#profileImg.src = accountInfo.profilePicSrc;
            this.#nameInput.value = accountInfo.name;
            this.#passInput.value = "password";
        }

        this.#submitButton = document.createElement("input");
        Object.assign(this.#submitButton, {
            type: "submit",
            value: "save",
        });

        form.append(
            profilePictureInput,
            profileImgWrapper,
            inputs,
            this.#submitButton
        );

        accountSettings.append(accountTitle, form);

        // Account info
        this.updateDefaultUserInfo();

        // scale
        const scaleSettings = document.createElement("section");
        scaleSettings.className = "settings";
        scaleSettings.id = "scale-settings";

        const scaleTitle = document.createElement("h2");
        scaleTitle.innerHTML = "scale";

        const scale = localStorage.getItem("scale");

        const slider = document.createElement("input");
        Object.assign(slider, {
            type: "range",
            min: 20,
            max: 60,
            value: scale ? (50 / 16) * Number.parseFloat(scale) : 40,
            step: 9.9,
            oninput: (e) => this.#changeScale(e.target.value),
        });

        scaleSettings.append(scaleTitle, slider);

        const style = document.createElement("style");
        style.innerHTML = await readFileContents(
            "/custom-elements/settings.css"
        );

        this.append(style, themeSettings, accountSettings, scaleSettings);
    }

    /**
     * @param {string} key
     * @param {Theme} theme
     */
    #changeTheme(key, theme) {
        delete this.querySelector("#theme-settings button[data-selected]")
            .dataset.selected;
        this.querySelector(`#${key}-theme`).dataset.selected = "";

        localStorage.setItem("theme", JSON.stringify({ name: key, ...theme }));
        document.documentElement.style.setProperty(
            "--theme-filter",
            theme.filter
        );
        document.documentElement.style.setProperty(
            "--window-bg",
            theme.windowBg
        );
    }

    #changeScale(value) {
        const scale = `${value * (16 / 50)}px`;
        localStorage.setItem("scale", scale);

        document.documentElement.style.setProperty("--scale", scale);

        Taskbar.instance.height = undefined;
        Taskbar.instance.height = Taskbar.getHeight();

        if (!globalThis.isMobile) {
            document
                .querySelector("#transition-layer img")
                .removeAttribute("style");
            (
                document.querySelector("#os-logo") ||
                Taskbar.instance.shadowRoot.querySelector("#os-logo")
            ).removeAttribute("style");
        }
    }

    /**
     * @param {Event} e
     * @returns
     */
    #handleProfilePictureChange(e) {
        const file = e.target.files[0];
        if (!file) return alert("error durring file selection!");

        const url = URL.createObjectURL(file);
        this.#profileImg.src = url;
    }

    /**
     *
     * @param {Event} e
     */
    async #handleAccountInfoSubmit(e) {
        e.preventDefault();
        this.#passInput.blur();

        const currentUserInfo = JSON.parse(
            localStorage.getItem("user-info") || "false"
        );

        const data = new FormData(e.target);
        const givenPassword = data.get("password");
        const givenProfilePicture = data.get("profilePicture");

        const sameHash =
            givenPassword ===
            JSON.parse(localStorage.getItem("user-info") || "false")
                .passwordHash;

        const userInfo = {
            username: data.get("username"),
            passwordHash: sameHash
                ? currentUserInfo?.passwordHash
                : hash(givenPassword),
            profilePic:
                givenProfilePicture?.size === 0
                    ? currentUserInfo?.profilePic
                    : await convertFileToBase64(givenProfilePicture),
        };

        localStorage.setItem("user-info", JSON.stringify(userInfo));

        this.#submitButton.style.transition = "unset";
        this.#submitButton.style.color = "white";
        this.#submitButton.style.backgroundColor = "#9dc728";

        setTimeout(() => {
            this.#submitButton.style.transition = "0.3s";
            this.#submitButton.style.color = "black";
            this.#submitButton.style.backgroundColor = "white";
        }, 300);
    }

    updateDefaultUserInfo() {
        const userInfo = JSON.parse(
            localStorage.getItem("user-info") || "false"
        );
        if (userInfo) {
            this.#profileImg.src =
                userInfo.profilePic || "/media/default-profile-pic.png";
            this.#nameInput.value = userInfo.username;
            this.#passInput.value = userInfo.passwordHash;
        }
    }
}
