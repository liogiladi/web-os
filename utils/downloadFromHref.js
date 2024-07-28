/**
 * Downloads a file from given src
 * @param {string} src 
 * @param {string} fileName 
 */
export default function downloadFromHref(src, fileName) {
    const a = document.createElement("a");
    a.href = src;
    a.download = fileName;
    a.file;
    a.click();
}
