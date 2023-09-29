class Logger {

	log(...args:unknown[]) {
		this.#history.push(args)
	}

	clear() {
		this.#history = [];
		this.#previousLogs = [];
	}

	#history:any[][] = []
	#previousLogs:any[][] = []

	private render() {
		for (const log of this.#previousLogs??[]) {
			console.log(...log)
		}
		this.#previousLogs.push(...this.flush())
	}

	private flush() {
		for (const entry of this.#history) {
			console.log(...entry);
		}
		const history = this.#history;
		this.#history = []
		return history;
	}
}

export const testLogger = new Logger()