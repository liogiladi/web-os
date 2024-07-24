import makeId from "./makeId.js";

export const VARIABLES = Object.freeze({
    PICTURES: "pictures",
    VIDEOS: "videos",
    AUDIOS: "audios",
});

export const FileStorage = {
    VARIABLES,
    init,
    addPicture,
    getPictures,
    deletePicture
};

function init() {
    for (const key in VARIABLES) {
        if (!localStorage.getItem(VARIABLES[key])) {
            localStorage.setItem(VARIABLES[key], JSON.stringify([]));
        }
    }
}

/**
 * @typedef {Object} Picture
 * @prop {string} id
 * @prop {string} src
 * @prop {string} dateISOString
 */

/**
 * @param {string} src
 * @returns {Picture} picture data
 */
function addPicture(src) {
    const currentPicturesArray = JSON.parse(
        localStorage.getItem(VARIABLES.PICTURES)
    );

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
        VARIABLES.PICTURES,
        JSON.stringify(currentPicturesMap.entries().toArray())
    );

    return data;
}

function deletePicture(id) {
    const currentPicturesArray = JSON.parse(
        localStorage.getItem(VARIABLES.PICTURES)
    );

    /** @type {Map<string, Picture>} */
    const currentPicturesMap = new Map(currentPicturesArray);

    currentPicturesMap.delete(id);

    localStorage.setItem(
        VARIABLES.PICTURES,
        JSON.stringify(currentPicturesMap.entries().toArray())
    );
}

/**
 * @returns {Picture[]} srcs
 */
function getPictures() {
    const currentPicturesArray = JSON.parse(
        localStorage.getItem(VARIABLES.PICTURES)
    );
    console.assert(Array.isArray(currentPicturesArray));

    return currentPicturesArray;
}
