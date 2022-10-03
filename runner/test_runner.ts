import { Datex } from "../../unyt_core/datex.js";
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

	public loadAll(){
		for (let path of this.file_paths) this.load(path);
	}

	public load(path:URL){
		const endpoint = Datex.Runtime.endpoint.getInstance("t"+Math.floor(Math.random()*10000))
		logger.info `running ${path} on ${endpoint}`;
		try {
			this.handleLoad(path, endpoint);
		} catch (e) {
			logger.error("Error starting test environment")
		}
	}

	protected abstract handleLoad(path:URL, endpoint:Datex.Endpoint)
	
}