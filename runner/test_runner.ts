import { Datex } from "unyt_core";
import { logger, getUrlFromPath } from "./utils.ts";

// deno-lint-ignore no-namespace
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
		for (const path of this.file_paths) this.load(path);
	}

	public load(path:URL){
		const endpoint = Datex.Runtime.endpoint.getInstance("t"+Math.floor(Math.random()*10000))
		logger.debug `running ${path} on ${endpoint}`;
		try {
			this.handleLoad(path, endpoint);
		} catch  {
			logger.error("Error starting test environment")
		}
	}

	protected abstract handleLoad(path:URL, endpoint:Datex.Endpoint):void
	
}
