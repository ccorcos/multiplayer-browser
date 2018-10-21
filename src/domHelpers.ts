function getElementPath(element: HTMLElement): Array<HTMLElement> {
	const parent = element.parentElement
	if (parent) {
		return [...getElementPath(parent), element]
	} else {
		return [element]
	}
}

function getTagClassIdSelector(element: HTMLElement) {
	if (element.id) {
		return "#" + element.id
	} else {
		return [
			element.tagName.toLowerCase(),
			...Array.from(element.classList),
		].join(",")
	}
}

export function getElementSelector(element: HTMLElement) {
	const path = getElementPath(element)
	// Truncate the path anywhere we have an element with and id.
	const startIndex = path.findIndex(item => Boolean(item.id))
	const [root, ...rest] = path.slice(startIndex, path.length)
	let selector = getTagClassIdSelector(root)
	for (const elm of rest) {
		selector = getChildElementSelector(selector, elm)
	}
	return selector
}

function getChildElementSelector(
	parentSelector: string,
	childElement: HTMLElement
) {
	const tagClassSelector =
		parentSelector + " > " + getTagClassIdSelector(childElement)
	const results = document.querySelectorAll(tagClassSelector)
	if (results.length === 1 && results[0] === childElement) {
		return tagClassSelector
	}

	const parentElement = childElement.parentElement
	if (parentElement) {
		const children = Array.from(parentElement.children)
		const index = children.indexOf(childElement)
		if (index !== -1) {
			const nthChildSelector = tagClassSelector
			":nth-child(" + index + ")"
			const results = document.querySelectorAll(nthChildSelector)
			if (results.length === 1 && results[0] === childElement) {
				return nthChildSelector
			}
		}
	}

	throw new Error("Couldn't create element selector.")
}
