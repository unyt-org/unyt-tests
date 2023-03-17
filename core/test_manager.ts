import { Datex } from "unyt_core";
import { expose, Logger, LOG_LEVEL, scope } from "unyt_core/datex_all.ts";
import { logger } from "./utils.ts";
import { TestGroup, type TestGroupOptions, TEST_CASE_STATE } from "./test_case.ts";
import { TestRunner } from "./test_runner.ts";

Logger.development_log_level = LOG_LEVEL.WARNING; // log level for debug logs (suppresses most)
Logger.production_log_level = LOG_LEVEL.DEFAULT; // log level for normal logs (log all)


// Analyzation
@endpoint export class TestManager {

    // store all tests
    // context -> (group name -> group)
    static tests = new Map<string, Map<string, TestGroup>>(); // eternal TODO?

    static SUPRANET_CONNECT = false;

    private static contextsToRunImmediately = new Set<string>();

    // init local endpoint
    static async init() {
        this.SUPRANET_CONNECT = false;
        await Datex.Supranet.init(undefined, false);
    }

    // supranet connection
    static async connect() {
        this.SUPRANET_CONNECT = true;
        try {
            await Datex.Supranet.connect(undefined, false);
        } catch {
            logger.warn("could not connect to the supranet");
        }
    }

    // load matching test contexts for files
    static async loadTests(files:URL[], loadOptions: TestRunner.LoadOptions = TestRunner.getDefaultLoadOptions(), runImmediately = false, reload = false) {

        if (!loadOptions.initLive && runImmediately) throw new Error("Cannot load test files with runImmediately enabled, but loadOptions.initLive disabled. Tests can only be executed when the test contexts are initialized.")

        if (reload) this.resetContextPromises(files);

        const promises = [];
        for (const file of files) {
            const runner = TestRunner.getRunnerForFile(file)
            if (runner) {
                if (runImmediately) this.contextsToRunImmediately.add(file.toString())
                promises.push(runner.load(file, loadOptions, reload))
            }
            else throw "could not find a test runner for " + file;
        }

        // tests are already executed in the background, wait until finished
        if (runImmediately) await this.finishTestExecutions(files)
        // resolve when all test files are loaded
        else await Promise.all(promises);
    }

    static getInitOptionsForContext(context: URL): TestRunner.InitializationOptions|undefined {
        const context_string = context.toString();
        if (!this.tests.has(context_string)) return;

        const testGroupOptions:Record<string,TestRunner.TestGroupOptions> = {};
        let commonFlags: Set<string>|undefined;
        const allFlags = new Set<string>();

        for (const [name, group] of this.tests.get(context_string)!.entries()) {
            testGroupOptions[name] = {
                flags: group.options?.flags??[]
            };
            // init commonFlags
            if (!commonFlags) {
                if (group.options?.flags) commonFlags = new Set(group.options?.flags);
            } 
            // intersection
            else {
                for (const flag of commonFlags) {
                    if (!group.options?.flags?.includes(flag)) commonFlags.delete(flag);
                }
            }

            // allFlags
            for (const flag of group.options?.flags??[]) allFlags.add(flag)
        }

        return {
            endpoint: TestRunner.getNewEndpoint(),
            testGroupOptions,
            commonFlags: [...commonFlags??[]],
            allFlags: [...allFlags]
        }

    }


    // print all reports for all groups of the contexts and exit with status code
    static printReportAndExit(contexts:URL[], short = false) {
        const successful = this.printReport(contexts, short);
        if (globalThis.Deno) {
            if (successful) Deno.exit()
            else Deno.exit(1);
        }
    }

    // print all reports for all groups of the contexts
    static printReport(contexts:URL[], short = false) {
        if (short) console.log(""); // margin top

        let successful = true;
        for (const context of contexts) {
            logger.debug("groups",this.tests)

            for (const group of this.tests.get(context.toString())?.values()??[]) {
                group.printReport(short);
                if (group.state != TEST_CASE_STATE.SUCCESSFUL) successful = false;
            }
        }
        if (short) console.log(""); // margin top

        return successful;
    }

    static getGroupsForContext(context:URL) {
        return this.tests.get(context.toString())?.values() ?? [];
    }

    /**
     * run all test for the provided contexts
     * automatic live initialization of required test contexts if not yet loaded
     * @param contexts context path array
     * @returns Promise that resolves when all tests were executed
     */
    static async runTests(contexts:URL[]) {
        const promises = [];
        for (const context of contexts) {
            // make sure context gets live
            TestRunner.getRunnerForFile(context)!.initLive(context, false);
            await this.waitForContextLoad(context);
            for (const [_name, group] of this.tests.get(context.toString())??[]) {
                promises.push(group.run())
            }
        }
        await Promise.all(promises);
    }


    // wait for all contexts and run all tests
    static async finishTestExecutions(contexts:URL[]) {
        // wait until all contexts loaded and tests run
        await Promise.all(contexts.map(context => this.finishTestExecution(context)))
    }

    // wait for context and run all tests
    static async finishTestExecution(context:URL) {
        await this.waitForContextLoad(context);

        logger.debug("loaded context " + context)

        // all tests groups in context
        for (const group of this.tests.get(context.toString())?.values()??[]) {
            await group.finishAllTests();
        }
    }

    private static context_promises = new Map<string, Promise<void>>();
    private static context_resolves = new Map<string, Function>();

    // returns promise that resolve when a context is fully loaded
    private static waitForContextLoad(context:URL) {
        return this.getContextPromise(context);
    }

    private static getContextPromise(context: URL) {
        const context_string = context.toString();

        if (this.context_promises.has(context_string)) return this.context_promises.get(context_string);
        else {
            const promise = new Promise<void>(resolve=>this.context_resolves.set(context_string, resolve));
            this.context_promises.set(context_string, promise)
            return promise;
        }
    }

    private static resetContextPromises(contexts: URL[]) {
        for (const context of contexts) {
            const context_string = context.toString();
            this.context_promises.delete(context_string)
        }
    }


    // DATEX interface:


    // register context
    @property static registerContext(context:URL){
        logger.debug("registered context: " + context)
        this.getContextPromise(context); // make sure a context promise exists
        if (!this.tests.has(context.toString())) this.tests.set(context.toString(), new Map());
    }

    // register test group
    @property static registerTestGroup(context:URL, group_name:string, options?: TestGroupOptions){
        if (!this.tests.has(context.toString())) {
            this.tests.set(context.toString(), new Map());
        }

        // update existing TestGroup
        if (this.tests.get(context.toString())!.has(group_name)) {
            const group = this.tests.get(context.toString())!.get(group_name)!;
            group.endpoint = (datex.meta??datex.localMeta).sender;
            if (options) group.options = options;
            return;
        }
        
        else {
            this.tests.get(context.toString())!.set(group_name, new TestGroup(group_name, context, (datex.meta??datex.localMeta).sender, options));
            logger.debug("new test group", group_name, context, (datex.meta??datex.localMeta).sender.toString(), options, this.tests);
        }
    }

    /**
     * Register a dicovered test case for a specific group, with a parameter set
     * To make the test case executable by the TestManager, TestManager.bindTestCase has to be used
     * (in this case, registerTestCase does not have to be called)
     * @param context 
     * @param group_name 
     * @param test_name 
     * @param params parameter set
     */
    @property static registerTestCase(context:URL, group_name:string, test_name:string, params:any[][]){
        const context_string = context.toString();

         // context not registered
         if (!this.tests.has(context_string)) {
            logger.error("trying to bind test case to unknown context " + context);
            return;
        }

        // group not registered
        else if (!this.tests.get(context_string)!.has(group_name)) {
            logger.error("trying to bind test case to unknown test group " + group_name);
            return;
        }

        const group = this.tests.get(context_string)!.get(group_name)!;
        group.setTestCase(test_name, params);
    }


    // all test cases for the group are loaded, can be run
    @property static async testGroupLoaded(context:URL, group_name:string){
        // let context_string = context.toString();
        // if (!tests.has(context_string)) logger.error("loading finished for unknown context " + context);
        // else if (!tests.get(context_string).has(group_name)) logger.error("loading finished for unknown test group " + group_name);
        // else {
        //     const group = tests.get(context_string).get(group_name);
        //     await group.finishAllTests();
        //     group.printReport();
        // }
    }

    // all test groups for a context are loaded
    @property static contextLoaded(context:URL){
        const context_string = context.toString();
        logger.debug("context loaded: " + context_string);

        if (this.context_resolves.has(context_string)) {
            this.context_resolves.get(context_string)!();
            this.context_resolves.delete(context_string); // reset
        } 
    }

    // add test data for an existing test group
    @property static bindTestCase(context:URL, group_name:string, test_name:string, params:any[][], func:(...args: any) => void | Promise<void>){
        const context_string = context.toString();

        // context not registered
        if (!this.tests.has(context_string)) {
            logger.error("trying to bind test case to unknown context " + context);
            return;
        }

        // group not registered
        else if (!this.tests.get(context_string)!.has(group_name)) {
            logger.error("trying to bind test case to unknown test group " + group_name);
            return;
        }

        // bind to group
        else {
            const group = this.tests.get(context_string)!.get(group_name)!;
            const test_case = group.setTestCase(test_name, params, func);
            // start running test case immediately in the background
            if (this.contextsToRunImmediately.has(context_string)) test_case.run()
        }

    }

}