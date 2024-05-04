const LIGHT = 0, DARK = 1;
const COLORS = Object.freeze({
    body: ["black", "white"],
    primary: ["rgba(255, 255, 255, 0.9)", "#dddddda6"]
});

/**
 * @param {"light" | "dark"} value
 */
export function setTheme(value) {
    localStorage.setItem("theme", value);
    const themeIndex = value == "light" ? LIGHT : DARK;

    for(const key in COLORS) {
        document.documentElement.style.setProperty(`--${key}-color`, COLORS[key][themeIndex]);
    }
}

export function toggleTheme() {
    /**
     * @type {"light" | "dark"}
     */
    const theme = localStorage.getItem("theme");
    setTheme(theme === "light" ? "dark" : "light");
}

export function initTheme() {
    let theme = localStorage.getItem("theme");
    
    if(!theme) {
        // If user has a preference
        if(window.matchMedia) {
            if(window.matchMedia("(prefers-color-scheme: dark)").matches) {
                theme = "dark";
            } else {
                theme = "light";
            }
        } else {
            theme = "dark";
        }

        localStorage.setItem("theme", theme);
    }

    setTheme(theme);
}

