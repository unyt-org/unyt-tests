import { logger } from "../run.js";
import { getUrlFromPath } from "./utils.js";

export namespace TestRunner {

	export interface Options {
		watch?:boolean
	}
	
}

export abstract class TestRunner {

	protected file_paths:Set<URL>
	protected options:TestRunner.Options

	constructor(file_paths:(string|URL)[], options:TestRunner.Options = {}) {
		for (let i=0; i<file_paths.length;i++) {
			if (typeof file_paths[i] == "string") file_paths[i] = getUrlFromPath(<string>file_paths[i]);
		}
		this.file_paths = new Set(<URL[]>file_paths);
		this.options = options;
	}

	public runAll(){
		for (let path of this.file_paths) this.run(path);
	}

	public run(path:URL){
		logger.info("running test: " + path);
		try {
			this.handleRun(path);
		} catch (e) {
			logger.error("Error starting test environment")
		}
	}

	protected abstract handleRun(path:URL)
	
}
