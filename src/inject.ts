import { ipcRenderer } from "electron"
import { MouseMoveEvent, ClickEvent, MessageEvent, ScrollEvent } from "./types"
import { getElementSelector } from "./domHelpers"
import EventBlocker from "./EventBlocker"

const cursorClassName = "cursor"

const syntheticClick = new EventBlocker()
const syntheticScroll = new EventBlocker()

window.addEventListener(
	"mousemove",
	event => {
		const mouseMoveEvent: MouseMoveEvent = {
			type: "mousemove",
			pageX: event.pageX,
			pageY: event.pageY,
		}
		ipcRenderer.sendToHost("mouseevents", mouseMoveEvent)
	},
	true
)

window.addEventListener(
	"click",
	event => {
		if (syntheticClick.isBlocking()) {
			return
		}
		const clickEvent: ClickEvent = {
			type: "click",
			clientX: event.clientX,
			clientY: event.clientY,
		}
		ipcRenderer.sendToHost("mouseevents", clickEvent)
	},
	true
)

document.addEventListener(
	"scroll",
	event => {
		if (syntheticScroll.isBlocking()) {
			return
		}
		let elm = event.currentTarget
		if (elm === document) {
			elm = document.scrollingElement
		}

		if (elm instanceof HTMLElement) {
			const mouseMoveEvent: ScrollEvent = {
				type: "scroll",
				scrollTop: elm.scrollTop,
				scrollLeft: elm.scrollLeft,
				selector: getElementSelector(elm),
			}
			ipcRenderer.sendToHost("mouseevents", mouseMoveEvent)
		}
	},
	true
)

const cursorDivs: { [peerId: string]: HTMLDivElement | undefined } = {}

ipcRenderer.on("mouseevents", (sender, event: MessageEvent) => {
	let cursorDiv = cursorDivs[event.peerId]
	if (!cursorDiv) {
		cursorDiv = document.createElement("div")
		cursorDiv.style.position = "absolute"
		cursorDiv.style.height = "5px"
		cursorDiv.style.width = "5px"
		cursorDiv.style.borderRadius = "5px"
		cursorDiv.style.background = "red"
		cursorDiv.style.pointerEvents = "none"
		cursorDiv.classList.add(cursorClassName)
		// cursorDiv.style.border = "1px solid red"
		// cursorDiv.innerText = event.peerId
		document.body.appendChild(cursorDiv)
		cursorDivs[event.peerId] = cursorDiv
	}

	if (event.message.type === "mousemove") {
		cursorDiv.style.top = event.message.pageY + "px"
		cursorDiv.style.left = event.message.pageX + "px"
	}

	// console.log("event", JSON.stringify(event, null, 2))

	if (event.message.type === "click") {
		const elms = document.elementsFromPoint(
			event.message.clientX,
			event.message.clientY
		)

		console.log("click", elms, event.message)

		// There's probably a cursor right where you're clicking so skip that.
		let elm: Element | undefined = elms[0]
		if (elm instanceof HTMLElement && elm.classList.contains(cursorClassName)) {
			elm = elms[1]
		}

		if (elm instanceof HTMLElement) {
			syntheticClick.block()
			elm.click()
			setTimeout(syntheticClick.unblock)
		}
	}

	if (event.message.type === "scroll") {
		const elm = document.querySelector(event.message.selector)
		if (elm && elm instanceof HTMLElement) {
			syntheticScroll.block()
			// if (elm.scrollTop !== event.message.scrollTop) {
			// 	elm.scrollTop = event.message.scrollTop
			// }
			// if (elm.scrollLeft !== event.message.scrollLeft) {
			// 	elm.scrollLeft = event.message.scrollLeft
			// }
			elm.scrollTo({
				left: event.message.scrollLeft,
				top: event.message.scrollTop,
			})
			// Give some time to prevent race conditions.
			setTimeout(syntheticScroll.unblock, 50)
		}
	}
})
