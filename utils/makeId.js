/**
 * Generates a random string for identification
 * @param {number} length
 * @returns
 */
export default function makeId(length) {
    if (length < 1) throw new Error("length must be greater than 1");

    let result = "";

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
    }

    return result;
}
