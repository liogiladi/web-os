export default function downloadFromHref(src, fileName) {
    const a = document.createElement("a");
    a.href = src;
    a.download = fileName;
    a.file;
    a.click();
}
