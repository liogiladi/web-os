/**
 * Converts file contents to string
 * @param {string} path file's path 
 * @returns {Promise<string>} file's contents
 */
export default async function readFileContents(path) {
	const res = await fetch(path);
	return await res.text();
}