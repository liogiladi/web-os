/**
 * 
 * @param {import("../utils/fileStorage.js").Picture} info 
 */
export function createPictureShortcut(info) {
    /** @type {import("../custom-elements/shortcut.mjs").Shortcut} */
    const shortcut = document.createElement("desktop-shortcut");
    shortcut.id = info.id;
    shortcut.name = `picture-${info.dateISOString}.jpg`;
    shortcut.wcTagName = "desktop-gallery";
    shortcut.iconSrc = "/media/gallery-icon.png"; 
    shortcut.uniqueIconSrc = info.src;
    shortcut.intermediateData = {
        imgSrc: info.src
    };

    const shortcutsParent = document.getElementById("shortcuts");
    shortcutsParent.append(shortcut);
}
