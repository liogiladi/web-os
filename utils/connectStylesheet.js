export function connectStylesheet(path) {
	if (!document.head.querySelector(`link[href="${path}"]`)) {
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = path;
		document.head.append(link);
	}
}