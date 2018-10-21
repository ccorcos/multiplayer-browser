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

export interface NavigateEvent {
	type: "navigate"
	url: string
}

// TODO: better naming here.
export type Message = MouseMoveEvent | ClickEvent | ScrollEvent | NavigateEvent

export interface MessageEvent {
	peerId: string
	message: Message
}
