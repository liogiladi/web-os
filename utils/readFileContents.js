export default async function readFileContents(path) {
	const res = await fetch(path);
	return await res.text();
}