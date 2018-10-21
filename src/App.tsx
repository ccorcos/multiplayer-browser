import * as React from "react"
import * as PeerJs from "peerjs"
import { WebviewTag } from "electron"
import { WebViewMessage } from "./types"

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
		}
	}

	componentWillUnmount() {
		if (this.webview.current) {
			this.webview.current.removeEventListener(
				"ipc-message",
				this.handleWebViewMessage
			)
		}
	}

	private handleWebViewMessage = (event: Electron.IpcMessageEvent) => {
		// console.log(event.channel, event.args)
		Object.keys(this.state.peerConnections).map(peerId => {
			const connection = this.state.peerConnections[peerId]
			connection.send(event.args[0])
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

	private initializeConnection(connection: PeerJs.DataConnection) {
		connection.on("open", () => {
			connection.on("data", data => {
				const message: WebViewMessage = {
					peerId: connection.peer,
					message: data,
				}
				if (this.webview.current) {
					this.webview.current.send("mouseevents", message)
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
			</div>
		)
	}
}
