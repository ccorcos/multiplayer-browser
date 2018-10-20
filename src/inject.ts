import { ipcRenderer } from "electron"

window.addEventListener(
	"mousemove",
	event => {
		ipcRenderer.sendToHost("mousemove", event)
	},
	true
)

window.addEventListener(
	"click",
	event => {
		ipcRenderer.sendToHost("click", event)
	},
	true
)
