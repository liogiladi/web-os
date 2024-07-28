import makeId from "./makeId.js";
import playAudioSnapshot from "./playAudioSnapshot.js";
import AlertDialog from "../custom-elements/alertDialog.mjs";

export default {
    init,
    addPicture,
    getPictures,
    deletePicture,
};

/**
 * Initializes pictures in local storage
 */
function init() {
    localStorage.setItem("pictures", JSON.stringify([]));
}

/**
 * @typedef {Object} Picture
 * @prop {string} id
 * @prop {string} src
 * @prop {string} dateISOString
 */

/**
 * Adds a picture to local storage

 * @param {string} src
 * @returns {Picture} picture data
 */
function addPicture(src) {
    const currentPicturesArray = JSON.parse(localStorage.getItem("pictures"));

    /** @type {Map<string, Picture>} */
    const currentPicturesMap = new Map(currentPicturesArray);

    const id = makeId(10);

    const data = {
        id,
        src,
        dateISOString: new Date().toISOString(),
    };

    currentPicturesMap.set(id, data);

    localStorage.setItem(
        "pictures",
        JSON.stringify(currentPicturesMap.entries().toArray())
    );

    return data;
}

/**
 * Deletes a picture from local storage
 * @param {string} id 
 */
function deletePicture(id) {
    const currentPicturesArray = JSON.parse(localStorage.getItem("pictures"));

    /** @type {Map<string, Picture>} */
    const currentPicturesMap = new Map(currentPicturesArray);

    currentPicturesMap.delete(id);

    localStorage.setItem(
        "pictures",
        JSON.stringify(currentPicturesMap.entries().toArray())
    );
}

/**
 * @returns {Picture[]} srcs
 */
function getPictures() {
    const currentPicturesArray = JSON.parse(localStorage.getItem("pictures"));

    return currentPicturesArray;
}

/**
 * Creates a picture shortcut from given info
 * @param {import("./pictureStorage.js").Picture} info
 */
export function createPictureShortcut(info) {
    /** @type {import("../custom-elements/shortcut.mjs").Shortcut} */
    const shortcut = document.createElement("desktop-shortcut");

    Object.assign(shortcut, {
        id: info.id,
        name: `picture-${info.dateISOString}.jpg`,
        wcTagName: "desktop-gallery",
        iconSrc: "/media/images/app-icons/gallery.png",
        uniqueIconSrc: info.src,
        intermediateData: { imgSrc: info.src },
        deletetable: true,
        delete() {
            AlertDialog.showModal(
                "Warning!",
                "This item will be permanently deleted.",
                {
                    positive: "Delete",
                    negative: "Cancel",
                },
                () => {
                    deletePicture(info.id);

                    playAudioSnapshot("/media/audio/delete.mp3");
                    shortcut.remove();

                    const relatedWindows = document.querySelectorAll(
                        `desktop-gallery[data-shortcut-id='${info.id}']`
                    );
                    relatedWindows.forEach((el) => el.remove());
                }
            );
        },
    });

    const shortcutsParent = document.getElementById("shortcuts");
    shortcutsParent.append(shortcut);
}
