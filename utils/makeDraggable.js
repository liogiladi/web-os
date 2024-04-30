var _previousMouseEvent = null;

/**
 * @param {HTMLElement} element 
 * @param {object} customStyles
 * @param {(event: MouseEvent) => boolean} preventDrag 
 */
export default function makeDraggable(element, customStyles = {}, preventDrag = null) {
	element.style.transform = "translate(0,0)"
	element.style.display = "block";
	element.style.userSelect = "none";
	element.style.width = "fit-content";
	element.style.height = "fit-content";
	
	for(const key in customStyles) {
		element.style[key] = customStyles[key];
	}

	element.onmousedown = (event) => {
		if(preventDrag && preventDrag(event)) return;
		
		event.target.focus();
		document.onmousemove = event => drag(event, element);
		document.onmouseup = stopDrag;
	};
}

function drag(event, element) {
	if (_previousMouseEvent) {
		const deltaX = event.pageX - _previousMouseEvent.pageX;
		const deltaY = event.pageY - _previousMouseEvent.pageY;

		const computedTransformMatrix = new WebKitCSSMatrix(window.getComputedStyle(element).transform);
		const computedTranslation = {
			x: computedTransformMatrix.m41,
			y: computedTransformMatrix.m42,
		}

		const newTranslation = {
			x: computedTranslation.x + deltaX,
			y: computedTranslation.y + deltaY,
		};

		// Prevent drag if element is exiting viewport
		const rect = element.getBoundingClientRect();
		const exceedsViewport = {
			left: rect.x + deltaX <= 0,
			right: rect.x + rect.width + deltaX >= window.innerWidth,
			top: rect.y + deltaY <= 0,
			bottom: rect.y + rect.height + deltaY >= window.innerHeight,
		};
		
		if (exceedsViewport.left || event.pageX <= 0 || exceedsViewport.right || event.pageX >= window.innerWidth) {
			newTranslation.x = computedTranslation.x;
		}
		if (exceedsViewport.top || event.pageY <= 0 || exceedsViewport.bottom || event.pageY >= window.innerHeight) {
			newTranslation.y = computedTranslation.y;
		}

		element.style.transform = `translate(${newTranslation.x}px,${newTranslation.y}px)`;
	}

	_previousMouseEvent = event;
}

function stopDrag() {
	_previousMouseEvent = null;
	document.onmousemove = null;
	document.onmouseup = null;
}
	