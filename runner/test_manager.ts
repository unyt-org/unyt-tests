// @ts-ignore
import { Datex } from "../../unyt_core/datex.js";
import { Class, expose, Logger, LOG_LEVEL, scope } from "../../unyt_core/datex_all.js";
import { logger } from "../run.js";
import { TestCase, TestGroup, TEST_CASE_STATE } from "./test_case.js";

Logger.development_log_level = LOG_LEVEL.WARNING; // log level for debug logs (suppresses most)
Logger.production_log_level = LOG_LEVEL.DEFAULT; // log level for normal logs (log all)

await Datex.Cloud.connect();

// store all tests
// context -> (group name -> group)
const tests = new Map<string, Map<string, TestGroup>>(); // eternal TODO?


@scope export class TestManager {

    // options
    static RUN_TESTS_IMMEDIATELY = false;



    // print all reports for all groups of the contexts and exit with status code
    static printReportAndExit(contexts:URL[]) {
        let successful = this.printReport(contexts);
        if (successful) process.exit()
        else process.exit(1);
    }

    // print all reports for all groups of the contexts
    static printReport(contexts:URL[]) {
        let successful = true;
        for (let context of contexts) {
            for (let group of tests.get(context.toString()).values()) {
                group.printReport();
                if (group.state != TEST_CASE_STATE.SUCCESSFUL) successful = false;
            }
        }
        return successful;
    }

    static getGroupsForContext(context:URL) {
        return tests.get(context.toString()).values();
    }


    // wait for all contexts and run all tests
    static async finishContexts(contexts:URL[]) {
        // wait until all contexts loaded and tests run
        return Promise.all(contexts.map(context => this.finishContext(context)))
    }

    // wait for context and run all tests
    static async finishContext(context:URL) {

        await this.waitForContextLoad(context);
        logger.debug("finished context " + context)

        // all tests groups in context
        for (let group of tests.get(context.toString()).values()) {
            await group.finishAllTests();
        }
    }

    private static context_promises = new Map<string, Promise<void>>();
    private static context_resolves = new Map<string, Function>();

    // returns promise that resolve when a context is fully loaded
    private static waitForContextLoad(context:URL) {
        let context_string = context.toString();

        if (this.context_promises.has(context_string)) return this.context_promises.get(context_string);
        else {
            const promise = new Promise<void>(resolve=>this.context_resolves.set(context_string, resolve));
            this.context_promises.set(context_string, promise)
            return promise;
        }
    }


    // DATEX interface:


    // register context
    @expose protected static registerContext(context:URL){
        logger.debug("registered context: " + context)
        tests.set(context.toString(), new Map());
    }

    // register test group
    @expose protected static registerTestGroup(context:URL, group_name:string){
        if (!tests.has(group_name)) {
            logger.debug("new test group ? ?",group_name, context);
            tests.get(context.toString()).set(group_name, new TestGroup(group_name, context));
        }
    }

    // all test cases for the group are loaded, can be run
    @expose protected static async testGroupLoaded( context:URL, group_name:string){
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
    @expose protected static async contextLoaded(context:URL){
        let context_string = context.toString();
        logger.debug("context loaded: " + context_string);

        if (this.context_resolves.has(context_string)) {
            this.context_resolves.get(context_string)();
            this.context_resolves.delete(context_string); // reset
        } 
    }

    // add test data for an existing test group
    @expose protected static bindTestCase(context:URL, group_name:string, test_name:string, params:any[][], func:(...args: any) => void | Promise<void>){
        let context_string = context.toString();

        // context not registered
        if (!tests.has(context_string)) {
            logger.error("trying to bind test case to unknown context " + context);
            return;
        }

        // group not registered
        else if (!tests.get(context_string).has(group_name)) {
            logger.error("trying to bind test case to unknown test group " + group_name);
            return;
        }

        // bind to group
        else {
            const test_case = tests.get(context_string).get(group_name).setTestCase(test_name, params, func);
            // start running test case immediately in the background
            if (this.RUN_TESTS_IMMEDIATELY) test_case.run()
        }

    }

}