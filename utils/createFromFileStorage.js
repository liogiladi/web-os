import { FileStorage } from "../utils/fileStorage.js";
import playAudioSnapshot from "./playAudioSnapshot.js";
import AlertDialog from "../custom-elements/alertDialog.mjs";

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
        AlertDialog.showModal(
            "Warning!",
            "This item will be permanently deleted.",
            {
                positive: "Delete",
                negative: "Cancel",
            },
            () => {
                FileStorage.deletePicture(info.id);

                playAudioSnapshot("/media/audio/delete.mp3          ");
                shortcut.remove();
            }
        );
    };

    const shortcutsParent = document.getElementById("shortcuts");
    shortcutsParent.append(shortcut);
}
