import { Path } from "unyt_node/path.ts";
import { Datex } from "unyt_core";
import { logger, getPath } from "./utils.ts";
import { Class } from "unyt_core/datex_all.ts";
import { TestManager } from "./test_manager.ts";
import { TestGroup } from "./test_case.ts";

// deno-lint-ignore no-namespace
export namespace TestRunner {

	export interface Options {

	}	

	export type LoadOptions = {
		initLive?: boolean, // if true, the test context (file) is loaded (but the tests are not yet executed)
		analyizeStatic?: boolean // if true, the test file is statically analyized to register the available tests
	}

	export type TestGroupOptions = {
		flags: string[]
	}

	export type InitializationOptions = {
		testGroupOptions: {[groupName:string]: TestGroupOptions},
		endpoint: Datex.Endpoint,
		commonFlags: string[],
		allFlags: string[]
	}
}

export abstract class TestRunner {

	protected file_paths:Set<URL>
	protected options:TestRunner.Options

	public static getDefaultLoadOptions(): TestRunner.LoadOptions{
		return {
			initLive: false,
			analyizeStatic: true
		}
	}

	public static getNewEndpoint() {
		return Datex.Runtime.endpoint.getInstance(Math.floor(Math.random()*0xffff));
	}

	public static getDefaultInitOptions(): TestRunner.InitializationOptions{
		return {
			testGroupOptions: {},
			endpoint: this.getNewEndpoint(),
			commonFlags: [],
			allFlags: []
		}
	}

	constructor(file_paths: (string|URL)[] = [], options:TestRunner.Options = {}) {
		for (let i=0; i<file_paths.length;i++) {
			if (typeof file_paths[i] == "string") file_paths[i] = getPath(<string>file_paths[i]);
		}
		this.file_paths = new Set(<URL[]>file_paths);
		this.options = options;
	}

	public async loadAll(options: TestRunner.LoadOptions = TestRunner.getDefaultLoadOptions(), reloadIfAlreadyLive = false){
		const promises = [];
		for (const path of this.file_paths) promises.push(this.load(path, options, reloadIfAlreadyLive));
		await Promise.all(promises);
	}

	public async load(context:URL, options: TestRunner.LoadOptions = TestRunner.getDefaultLoadOptions(), reloadIfAlreadyLive = false){
		this.file_paths.add(context);
		try {
			if (options.analyizeStatic) {
				const loaded = await this.handleLoadStatic(context);
				if (!loaded) {
					logger.error("could not statically analyze " + context);
					globalThis.Deno?.exit(1);
					throw new Error("could not statically analyze " + context);
				}
			}
			if (options.initLive) {
				await this.initLive(context, reloadIfAlreadyLive);
				return;
			}
		} catch (e)  {
			logger.error("Error starting test environment", e)
		}
	}

	#liveContexts = new Set<string>()

	public async initLive(context:URL, reloadIfAlreadyLive = false) {
		// already live?
		if (!reloadIfAlreadyLive && this.#liveContexts.has(context.toString())) return;

		// load context live
		logger.debug `loading test context: ${context}`;
		this.#liveContexts.add(context.toString())
		const loaded = await this.handleLoad(context, TestManager.getInitOptionsForContext(context) ?? TestRunner.getDefaultInitOptions());
		if (!loaded) {
			logger.error("could not load test file " + context);
			globalThis.Deno?.exit(1);
			throw new Error("could not load test file " + context);
		}
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
	protected abstract handleLoad(context:URL, initOptions:TestRunner.InitializationOptions):boolean|Promise<boolean>

	/**
	 * Statically analyze a context (path) and register all available test groups and test cases (registerContext,
	 * registerTestGroup, registerTestCase) on the TestManager
	 * @param context context path
	 */
	protected abstract handleLoadStatic(context:URL):boolean|Promise<boolean>
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
	
	// .test.xy extensions that are allowed when scanning a directory
	export const availableTestSpecificExtensions:string[] = []
	export const availableExtensions:string[] = []

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
				if (availableExtensions.includes(ext)) {
					logger.warn(`File extension "${ext}" was registered by multiple test runners`);
				}
				availableExtensions.push(ext);
				availableTestSpecificExtensions.push("test."+ext);
				runnersByExtension.set(ext, runnerData);
			}
		}
	}

	export function getRunnerForFile(file:URL|string) {
		const path = new Path(file);
		const ext = path.hasFileExtension(...availableExtensions)
		if (ext) {
			const runner = runnersByExtension.get(ext)!;
			if (!runner.instance) runner!.instance = new runner.class();
			return runner.instance;
		}
		else return null;
	}

}