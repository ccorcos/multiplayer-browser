import { ipcRenderer } from "electron"
import { MouseMoveEvent, ClickEvent, Message } from "./types"

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
		const clickEvent: ClickEvent = {
			type: "click",
			clientX: event.clientX,
			clientY: event.clientY,
		}
		ipcRenderer.sendToHost("mouseevents", clickEvent)
	},
	true
)

ipcRenderer.on("mouseevents", (sender, event: Message) => {
	// TODO: render some dots for each cursor.
	// TODO: need identifiers for which client it is.
})
