/**
 * Plays an audio snapshot unless disabled by user 
 * @param {string} src
 */
export default function playAudioSnapshot(src) {
    if (!window.audio) {
        throw new Error("Audio was not defined!");
    }

    if(localStorage.getItem("disable-audio")) {
        return;
    }

    window.audio.src = src;
    Promise.resolve(window.audio.play());
}
