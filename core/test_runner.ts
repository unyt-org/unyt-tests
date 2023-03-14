import { Path } from "unyt_node/path.ts";
import { Datex } from "unyt_core";
import { logger, getPath } from "./utils.ts";
import { Class } from "unyt_core/datex_all.ts";

// deno-lint-ignore no-namespace
export namespace TestRunner {

	export interface Options {
		watch?:boolean
	}	
}

export abstract class TestRunner {

	protected file_paths:Set<URL>
	protected options:TestRunner.Options

	constructor(file_paths: (string|URL)[] = [], options:TestRunner.Options = {}) {
		for (let i=0; i<file_paths.length;i++) {
			if (typeof file_paths[i] == "string") file_paths[i] = getPath(<string>file_paths[i]);
		}
		this.file_paths = new Set(<URL[]>file_paths);
		this.options = options;
	}

	public loadAll(){
		for (const path of this.file_paths) this.load(path);
	}

	public load(path:URL){
		this.file_paths.add(path);
		const endpoint = Datex.Runtime.endpoint.getInstance(Math.floor(Math.random()*0xffff))
		logger.debug `running ${path} on ${endpoint}`;
		try {
			this.handleLoad(path, endpoint);
		} catch  {
			logger.error("Error starting test environment")
		}
	}

	protected abstract handleLoad(path:URL, endpoint:Datex.Endpoint):void
	
}



// deno-lint-ignore no-namespace
export namespace TestRunner {

	export type testRunnerConfigOptions = {
		fileExtensions: string[]
	}
	type runnerData<T extends TestRunner = TestRunner> = {
		options:testRunnerConfigOptions,
		class:Class<T>, 
		instance?:T
	}
	
	export const supportedExtensions:string[] = []
	
	const runners = new Set<runnerData>()
	const runnersByExtension = new Map<string, runnerData>();
	
	export function Config(options:testRunnerConfigOptions) {
	
		return function(target:Class<TestRunner>) {
			const runnerData = {options, class:target}
			runners.add(runnerData);

			if (!options.fileExtensions || options.fileExtensions.length == 0) {
				logger.warn(`Test runner ${target.name} has not registered any file extensions`);
			}
			for (const ext of options.fileExtensions) {
				if (supportedExtensions.includes(ext)) {
					logger.warn(`File extension "${ext}" was registered by multiple test runners`);
				}
				supportedExtensions.push(ext);
				runnersByExtension.set(ext, runnerData);
			}
		}
	}

	export function getRunnerForFile(file:URL|string) {
		const path = new Path(file);
		const ext = path.hasFileExtension(...supportedExtensions)
		if (ext) {
			const runner = runnersByExtension.get(ext)!;
			if (!runner.instance) runner!.instance = new runner.class();
			return runner.instance;
		}
		else return null;
	}

}