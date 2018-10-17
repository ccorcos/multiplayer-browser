// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

import * as React from "react"
import * as ReactDOM from "react-dom"

const root = document.getElementById("root")

class App extends React.Component {
	render() {
		return <div>hey there</div>
	}
}

ReactDOM.render(<App />, root)
