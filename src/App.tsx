import * as React from "react"
import * as PeerJs from "peerjs"
import { WebviewTag } from "electron"
import { MessageEvent, Message, NavigateEvent } from "./types"
import EventBlocker from "./EventBlocker"

interface AppProps {}

interface AppState {
	urlInputValue: string
	currentUrl: string
	peerId: string | undefined
	peerConnections: {
		[key: string]: PeerJs.DataConnection
	}
	peerInputValue: string
}

export default class App extends React.PureComponent<AppProps, AppState> {
	state: AppState = {
		urlInputValue: "",
		currentUrl: "http://www.chetcorcos.com",
		peerId: undefined,
		peerConnections: {},
		peerInputValue: "",
	}

	private webview: React.RefObject<WebviewTag> = React.createRef()
	private peer: PeerJs
	private syntheticNavigate = new EventBlocker()

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
		this.handleBroadcastMessage(event.args[0])
	}

	private handleBroadcastMessage = (message: Message) => {
		Object.keys(this.state.peerConnections).map(peerId => {
			const connection = this.state.peerConnections[peerId]
			connection.send(message)
		})
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
			this.handleNavigate({ url: this.state.urlInputValue })
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
		event: { url: string }
		// event: Electron.WillNavigateEvent | Electron.NewWindowEvent | NavigateEvent
	) => {
		this.setState({ currentUrl: event.url })
		if (!this.syntheticNavigate.isBlocking()) {
			this.handleBroadcastMessage({
				type: "navigate",
				url: event.url,
			})
		}
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
					this.handleMessageEvent(message)
				}
			})
		})
	}

	private handleMessageEvent = (event: MessageEvent) => {
		if (event.message.type === "navigate") {
			this.syntheticNavigate.block()
			this.handleNavigate(event.message)
			setTimeout(this.syntheticNavigate.unblock)
		}
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
			</div>
		)
	}
}
