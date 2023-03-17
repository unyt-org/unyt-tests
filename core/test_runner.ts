import { Path } from "unyt_node/path.ts";
import { Datex } from "unyt_core";
import { logger, getPath } from "./utils.ts";
import { Class } from "unyt_core/datex_all.ts";
import { TestManager } from "./test_manager.ts";

// deno-lint-ignore no-namespace
export namespace TestRunner {

	export interface Options {
		watch?:boolean
	}	

	export type loadOptions = {
		initLive?: boolean, // if true, the test context (file) is loaded (but the tests are not yet executed)
		analyizeStatic?: boolean // if true, the test file is statically analyized to register the available tests
	}
}

export abstract class TestRunner {

	protected file_paths:Set<URL>
	protected options:TestRunner.Options

	public static getDefaultLoadOptions(){
		return {
			initLive: false,
			analyizeStatic: true
		}
	}

	constructor(file_paths: (string|URL)[] = [], options:TestRunner.Options = {}) {
		for (let i=0; i<file_paths.length;i++) {
			if (typeof file_paths[i] == "string") file_paths[i] = getPath(<string>file_paths[i]);
		}
		this.file_paths = new Set(<URL[]>file_paths);
		this.options = options;
	}

	public loadAll(options: TestRunner.loadOptions = TestRunner.getDefaultLoadOptions()){
		const promises = [];
		for (const path of this.file_paths) promises.push(this.load(path, options));
		return Promise.all(promises);
	}

	public async load(path:URL, options: TestRunner.loadOptions = TestRunner.getDefaultLoadOptions()){
		this.file_paths.add(path);
		try {
			if (options.analyizeStatic) await this.handleLoadStatic(path);
			if (options.initLive) await this.initLive(path);
		} catch (e)  {
			logger.error("Error starting test environment", e)
		}
	}

	#liveContexts = new Set<string>()

	public initLive(path:URL, reloadIfAlreadyLive = false) {
		// already live?
		if (!reloadIfAlreadyLive && this.#liveContexts.has(path.toString())) return;

		// load context live
		const endpoint = Datex.Runtime.endpoint.getInstance(Math.floor(Math.random()*0xffff))
		logger.debug `loading test context: ${path}`;
		this.#liveContexts.add(path.toString())
		return this.handleLoad(path, endpoint);
	}

	/**
	 * Initialize all tests for a specific context (path) by registering the available test groups and test cases on
	 * the TestManager (registerContext, registerTestGroup, bindTestCase) and call TestManager.contextLoaded when
	 * all test cases for the context are registered.
	 * When the tests run in a separate context, the provided endpoint can be used in this context to send back
	 * data to the main TestManager endpoint
	 * @param context context path
	 * @param endpoint can be used when a standalone context with an endpoint is required
	 */
	protected abstract handleLoad(context:URL, endpoint:Datex.Endpoint):void|Promise<void>

	/**
	 * Statically analyze a context (path) and register all available test groups and test cases (registerContext,
	 * registerTestGroup, registerTestCase) on the TestManager
	 * @param context context path
	 */
	protected abstract handleLoadStatic(context:URL):void|Promise<void>
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