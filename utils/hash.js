/**
 * Dummy hashing
 * @param {string} str 
 * @returns {string} hashed string
 */
export default function hash(str) {
    const encoder = new TextEncoder();
    const encodedPassword = encoder.encode(str);

    encodedPassword.forEach((value, index) => {
        encodedPassword[index] = (value ^ (value >>> value)) << value;
    });

    const decoder = new TextDecoder();

    return decoder.decode(encodedPassword);
}
