// ipcRenderer.sendToHost("mousemove", event)
// ipcRenderer.sendToHost("click", event)

export interface MouseMoveEvent {
	type: "mousemove"
	clientX: number
	clientY: number
}

export interface ClickEvent {
	type: "click"
	clientX: number
	clientY: number
}

export type Message = MouseMoveEvent | ClickEvent
