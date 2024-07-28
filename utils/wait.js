/**
 * async/await form of `setTimeout`
 * @param {number} durationMS 
 * @returns {Promise<void>}
 */
export default function wait(durationMS) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, durationMS);
    })
}