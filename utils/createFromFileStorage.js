/**
 * 
 * @param {import("../utils/fileStorage.js").Picture} info 
 */
export function createPictureShortcut(info) {
    console.log(info);
    /** @type {Shortcut} */
    const shortcut = document.createElement("desktop-shortcut");
    shortcut.id = info.id;
    shortcut.name = `picture-${info.dateISOString}.jpg`;
    shortcut.wcTagName = "desktop-gallery";
    shortcut.iconSrc = info.src;

    const shortcutsParent = document.getElementById("shortcuts");
    shortcutsParent.append(shortcut);
}
