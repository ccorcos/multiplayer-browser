import * as React from "react"
import * as PeerJs from "peerjs"
import { WebviewTag } from "electron"
import { Message, MessageEvent, MouseMoveEvent } from "./types"

interface AppProps {}

interface AppState {
	urlInputValue: string
	currentUrl: string
	peerId: string | undefined
	peerConnections: {
		[peerId: string]: PeerJs.DataConnection
	}
	peerCursors: {
		[peerId: string]: { pageX: number; pageY: number }
	}
	peerInputValue: string
}

// const cursorDivs: { [peerId: string]: HTMLDivElement | undefined } = {}

// ipcRenderer.on("mouseevents", (sender, event: WebViewMessage) => {
// 	let cursorDiv = cursorDivs[event.peerId]
// 	if (!cursorDiv) {
// 		cursorDiv = document.createElement("div")
// 		cursorDiv.style.position = "absolute"
// 		cursorDiv.style.height = "5px"
// 		cursorDiv.style.width = "5px"
// 		cursorDiv.style.borderRadius = "5px"
// 		cursorDiv.style.background = "red"
// 		cursorDiv.style.pointerEvents = "none"
// 		cursorDiv.classList.add(cursorClassName)
// 		// cursorDiv.style.border = "1px solid red"
// 		// cursorDiv.innerText = event.peerId
// 		document.body.appendChild(cursorDiv)
// 		cursorDivs[event.peerId] = cursorDiv
// 	}

// 	if (event.message.type === "mousemove") {
// 		cursorDiv.style.top = event.message.pageY + "px"
// 		cursorDiv.style.left = event.message.pageX + "px"
// 	}

export default class App extends React.PureComponent<AppProps, AppState> {
	state: AppState = {
		urlInputValue: "",
		currentUrl: "http://www.chetcorcos.com",
		peerId: undefined,
		peerConnections: {},
		peerCursors: {},
		peerInputValue: "",
	}

	private webview: React.RefObject<WebviewTag> = React.createRef()
	private peer: PeerJs

	constructor(props: AppProps) {
		super(props)
		// Connects to the cloud peer server using their api key.
		// We can host our own. https://peerjs.com/docs/#start
		this.peer = new PeerJs({ key: "lwjd5qra8257b9" })
		this.peer.on("open", id => {
			this.setState({ peerId: id })
		})

		// Called when another call peer.connect()
		this.peer.on("connection", connection => {
			this.setState({
				peerConnections: {
					...this.state.peerConnections,
					[connection.peer]: connection,
				},
			})
			this.initializeConnection(connection)
		})

		window.addEventListener(
			"mousemove",
			event => {
				const mouseMoveEvent: MouseMoveEvent = {
					type: "mousemove",
					pageX: event.pageX,
					pageY: event.pageY,
				}
				this.broadcastMessage(mouseMoveEvent)
			},
			true
		)
	}

	componentDidMount() {
		if (this.webview.current) {
			this.webview.current.addEventListener(
				"ipc-message",
				this.handleWebViewMessage
			)
			this.webview.current.addEventListener(
				"will-navigate",
				this.handleNavigate
			)
			this.webview.current.addEventListener("new-window", this.handleNavigate)
		}
	}

	componentWillUnmount() {
		if (this.webview.current) {
			this.webview.current.removeEventListener(
				"ipc-message",
				this.handleWebViewMessage
			)
			this.webview.current.removeEventListener(
				"will-navigate",
				this.handleNavigate
			)
			this.webview.current.removeEventListener(
				"new-window",
				this.handleNavigate
			)
		}
	}

	private handleWebViewMessage = (event: Electron.IpcMessageEvent) => {
		this.broadcastMessage(event.args[0])
	}

	private broadcastMessage = (event: Message) => {
		Object.keys(this.state.peerConnections).map(peerId => {
			const connection = this.state.peerConnections[peerId]
			connection.send(event)
		})
	}

	private handleEvent = (event: MessageEvent) => {
		if (event.message.type === "mousemove") {
			this.setState({
				peerCursors: {
					...this.state.peerCursors,
					[event.peerId]: event.message,
				},
			})
		}
	}

	private handleUrlInputChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const target = event.target as HTMLInputElement
		this.setState({ urlInputValue: target.value })
	}

	private handleUrlInputKeyPress = (
		event: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (event.key === "Enter") {
			this.setState({ currentUrl: this.state.urlInputValue })
		}
	}

	private handlePeerInputChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const target = event.target as HTMLInputElement
		this.setState({ peerInputValue: target.value })
	}

	private handlePeerInputKeyPress = (
		event: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (event.key === "Enter") {
			const peerId = this.state.peerInputValue
			const connection = this.peer.connect(peerId)
			this.setState({
				peerInputValue: "",
				peerConnections: {
					...this.state.peerConnections,
					[peerId]: connection,
				},
			})

			this.initializeConnection(connection)
		}
	}

	private handleNavigate = (
		event: Electron.WillNavigateEvent | Electron.NewWindowEvent
	) => {
		this.setState({ currentUrl: event.url })
	}

	private initializeConnection(connection: PeerJs.DataConnection) {
		connection.on("open", () => {
			connection.on("data", data => {
				const message: MessageEvent = {
					peerId: connection.peer,
					message: data,
				}
				if (this.webview.current) {
					this.webview.current.send("mouseevents", message)
					this.handleEvent(message)
				}
			})
		})
	}

	render() {
		return (
			<div style={{ display: "flex", height: "100%" }}>
				<div style={{ width: 200 }}>
					<div style={{ padding: 8 }}>
						<div>PeerId: {this.state.peerId}</div>
					</div>
					<div style={{ padding: 8 }}>
						<div>Connections:</div>
						{Object.keys(this.state.peerConnections).map(peerId => (
							<div key={peerId}>{peerId}</div>
						))}
						<input
							type="text"
							placeholder="Add connection..."
							value={this.state.peerInputValue}
							onKeyPress={this.handlePeerInputKeyPress}
							onChange={this.handlePeerInputChange}
						/>
					</div>
				</div>
				<div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
					<div style={{ padding: 8 }}>
						<input
							type="text"
							placeholder="https://"
							value={this.state.urlInputValue}
							onKeyPress={this.handleUrlInputKeyPress}
							onChange={this.handleUrlInputChange}
						/>
					</div>
					<webview
						ref={this.webview}
						style={{ flex: 1 }}
						src={this.state.currentUrl}
						preload={`file://${__dirname}/inject.js`}
					/>
				</div>

				{Object.keys(this.state.peerCursors).map(peerId => {
					const { pageX, pageY } = this.state.peerCursors[peerId]
					return (
						<div
							key={peerId}
							style={{
								position: "absolute",
								height: 5,
								width: 5,
								borderRadius: 5,
								background: "red",
								pointerEvents: "none",
								top: pageY,
								left: pageX,
							}}
						/>
					)
				})}
			</div>
		)
	}
}
