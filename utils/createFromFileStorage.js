import { FileStorage } from "../utils/fileStorage.js";
import playAudioSnapshot from "./playAudioSnapshot.js";

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
        imgSrc: info.src,
    };
    shortcut.deletetable = true;
    shortcut.delete = () => {
        if (confirm("This item will be permanently deleted")) {
            FileStorage.deletePicture(info.id);

            playAudioSnapshot("/media/audio/delete.mp3          ");
            shortcut.remove();
        }
    };

    const shortcutsParent = document.getElementById("shortcuts");
    shortcutsParent.append(shortcut);
}
