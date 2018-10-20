import { ipcRenderer } from "electron"
import { MouseMoveEvent, ClickEvent, Message, WebViewMessage } from "./types"

let syntheticClick = false

window.addEventListener(
	"mousemove",
	event => {
		const mouseMoveEvent: MouseMoveEvent = {
			type: "mousemove",
			clientX: event.clientX,
			clientY: event.clientY,
		}
		ipcRenderer.sendToHost("mouseevents", mouseMoveEvent)
	},
	true
)

window.addEventListener(
	"click",
	event => {
		if (syntheticClick) {
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

const cursorDivs: { [peerId: string]: HTMLDivElement | undefined } = {}

ipcRenderer.on("mouseevents", (sender, event: WebViewMessage) => {
	let cursorDiv = cursorDivs[event.peerId]
	if (!cursorDiv) {
		cursorDiv = document.createElement("div")
		cursorDiv.style.position = "absolute"
		cursorDiv.style.height = "5px"
		cursorDiv.style.width = "5px"
		cursorDiv.style.borderRadius = "5px"
		cursorDiv.style.background = "red"
		cursorDiv.classList.add("cursor")
		// cursorDiv.style.border = "1px solid red"
		// cursorDiv.innerText = event.peerId
		document.body.appendChild(cursorDiv)
		cursorDivs[event.peerId] = cursorDiv
	}

	if (event.message.type === "mousemove") {
		cursorDiv.style.top = event.message.clientY + "px"
		cursorDiv.style.left = event.message.clientX + "px"
	}

	console.log("event", event)

	if (event.message.type === "click") {
		const elm = document.elementsFromPoint(
			event.message.clientX,
			event.message.clientY
		)
		// TODO: Ignore the cursor!
		console.log("click", elm)
		if (elm instanceof HTMLElement) {
			syntheticClick = true
			elm.click()
			syntheticClick = false
		}
	}
})
