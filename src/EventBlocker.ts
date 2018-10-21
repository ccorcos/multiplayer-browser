export default class EventBlocker {
	count = 0
	block = () => {
		this.count += 1
	}
	unblock = () => {
		this.count -= 1
	}
	isBlocking = () => {
		return this.count !== 0
	}
}
