/**
 * @param {File} file 
 * @returns {Promise<string>} base x64 representaion of a file
 */
export default async function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });
}
