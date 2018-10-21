// ipcRenderer.sendToHost("mousemove", event)
// ipcRenderer.sendToHost("click", event)

export interface MouseMoveEvent {
	type: "mousemove"
	pageX: number
	pageY: number
}

export interface ClickEvent {
	type: "click"
	clientX: number
	clientY: number
}

export interface ScrollEvent {
	type: "scroll"
	scrollTop: number
	scrollLeft: number
	selector: string
}

export type Message = MouseMoveEvent | ClickEvent | ScrollEvent

export interface WebViewMessage {
	peerId: string
	message: Message
}
