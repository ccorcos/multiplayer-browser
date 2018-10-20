// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

import * as React from "react"
import * as ReactDOM from "react-dom"

const root = document.getElementById("root")

interface AppProps {}

interface AppState {
	inputValue: string
	currentUrl: string
}

class App extends React.PureComponent<AppProps, AppState> {
	state = {
		inputValue: "",
		currentUrl: "http://www.chetcorcos.com",
	}

	webview: React.RefObject<HTMLWebViewElement> = React.createRef()

	componentDidMount() {
		this.webview.current.addEventListener(
			"ipc-message",
			this.handleWebViewMessage
		)
	}

	componentWillUnmount() {
		this.webview.current.removeEventListener(
			"ipc-message",
			this.handleWebViewMessage
		)
	}

	private handleWebViewMessage = (event: Electron.IpcMessageEvent) => {
		console.log(event.channel, event.args)
	}

	private handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const target = event.target as HTMLInputElement
		this.setState({ inputValue: target.value })
	}

	private handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			this.setState({ currentUrl: this.state.inputValue })
		}
	}

	render() {
		return (
			<div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
				<div style={{ padding: 8 }}>
					<input
						type="text"
						value={this.state.inputValue}
						onKeyPress={this.handleKeyPress}
						onChange={this.handleInputChange}
					/>
				</div>
				<webview
					ref={this.webview}
					style={{ flex: 1 }}
					src={this.state.currentUrl}
					preload={`file://${__dirname}/inject.js`}
				/>
			</div>
		)
	}
}

ReactDOM.render(<App />, root)
