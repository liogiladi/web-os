import readFileContents from "../utils/readFileContents.js";

/**
 * @typedef {object} Theme
 * @prop {string} [name]
 * @prop {string} [filter]
 * @prop {string} windowBg
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
    },
    blue: {
        filter: "hue-rotate(264deg)",
        windowBg: `linear-gradient(
            0deg,
            rgb(90 154 209 / 80%) 0%,
            rgb(167 194 250 / 80%) 100%
        )`,
    },
    red: {
        filter: "hue-rotate(50deg)",
        windowBg: `linear-gradient(
            0deg,
            rgb(209 90 102 / 80%) 0%,
            rgb(250 167 188 / 80%) 100%
        )`,
    },
    yellow: {
        filter: "hue-rotate(111deg) brightness(1.5)",
        windowBg: `linear-gradient(
            0deg, rgb(209 195 90 / 80%) 0%,
            rgb(250 227 167 / 80%) 100%
        )`,
    },
});

export default class Settings extends HTMLElement {
    /** @type {HTMLImageElement} */
    #profileImg;

    constructor() {
        super();
        this.initialized = false;
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
            bg.src = `/media/${key}-theme.png`;

            themeButton.append(bg);
            themeButton.onclick = () =>
                this.#changeTheme.bind(this)(key, theme);

            if (key === currentTheme) themeButton.dataset.selected = "";
            themes.append(themeButton);
        }

        themeSettings.append(themes);

        // Account
        const accountInfo = localStorage.getItem("accountInfo");

        const accountSettings = document.createElement("section");
        accountSettings.className = "settings";
        accountSettings.id = "account-settings";

        const accountTitle = document.createElement("h2");
        accountTitle.innerHTML = "Account";

        const form = document.createElement("form");
        form.onsubmit = this.#onAccountInfoSubmit.bind(this);

        //Profile
        const profilePictureInput = document.createElement("input");
        Object.assign(profilePictureInput, {
            type: "file",
            onchange: this.#onProfilePictureChange.bind(this),
            hidden: true,
        });

        const profileImgWrapper = document.createElement("div");
        profileImgWrapper.id = "profile-img-wrapper";
        profileImgWrapper.onclick = () => profilePictureInput.click();

        this.#profileImg = document.createElement("img");
        this.#profileImg.src = "/media/default-profile-pic.png";
        profileImgWrapper.append(this.#profileImg);

        // Fields
        const nameInput = document.createElement("input");
        Object.assign(nameInput, {
            type: "text",
            name: "name",
            placeholder: "Enter a name...",
        });

        const passInput = document.createElement("input");
        Object.assign(passInput, {
            type: "password",
            name: "name",
            placeholder: "Enter a password...",
        });

        const inputs = document.createElement("div");
        inputs.id = "inputs";
        inputs.append(nameInput, passInput);

        if (accountInfo) {
            this.#profileImg.src = accountInfo.profilePicSrc;
            nameInput.value = accountInfo.name;
            passInput.value = "password";
        }

        const submitButton = document.createElement("input");
        Object.assign(submitButton, {
            type: "submit",
            value: "save",
        });

        form.append(
            profilePictureInput,
            profileImgWrapper,
            inputs,
            submitButton
        );

        accountSettings.append(accountTitle, form);

        // Resolution
        const resoultionSettings = document.createElement("section");
        resoultionSettings.className = "settings";
        resoultionSettings.id = "resolution-settings";

        const resolutionTitle = document.createElement("h2");
        resolutionTitle.innerHTML = "Resolution";

        const slider = document.createElement("input");
        Object.assign(slider, {
            type: "range",
            min: 1,
            max: 100,
            value: 50,
            step: 9.9,
            oninput: ((e) => this.#changeResolution(e.target.value)).bind(this),
        });

        resoultionSettings.append(resolutionTitle, slider);

        const style = document.createElement("style");
        style.innerHTML = await readFileContents(
            "/custom-elements/settings.css"
        );

        this.append(style, themeSettings, accountSettings, resoultionSettings);
    }

    /**
     * @param {string} key
     * @param {Theme} theme
     */
    #changeTheme(key, theme) {
        //TODO: theme
        delete this.querySelector("#theme-settings button[data-selected]")
            .dataset.selected;
        this.querySelector(`#${key}-theme`).dataset.selected = "";

        localStorage.setItem("theme", JSON.stringify({ name: key, ...theme }));
        const root = document.querySelector(":root");
        root.style.setProperty("--theme-filter", theme.filter);
        root.style.setProperty("--window-bg", theme.windowBg);
    }

    #changeResolution(value) {
        //TODO: resolution
        console.log(value);
    }

    #onProfilePictureChange(e) {
        //TODO: update img by file select
    }

    /**
     *
     * @param {Event} e
     */
    #onAccountInfoSubmit(e) {
        //TODO: account submit
        e.preventDefault();
    }
}
