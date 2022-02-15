/**
 * unyt Test library with UIX viewer
 * 
 * decorators:
 * - currently using legacy typescript decorators, TODO migrate to JS decorators in the future (https://github.com/tc39/proposal-decorators)
 * - decorator functions assume that all static method decorators are called before the class decorator..
 *   otherwise the program breaks !!... 
 *   not sure about the order in the decorator proposal (but static methods before class decorator would make sense)
 */

import Logger from "../unyt_web/unyt_core/logger.js";
import DatexCloud from "../unyt_web/unyt_core/datex_cloud.js";
import { handleDecoratorArgs, context_kind, context_meta_getter, context_meta_setter, context_name, METADATA } from "./legacy_decorators.js";

const logger = new Logger("unyt_tests");

const META_PARAMS = Symbol("params");

// @Test (legacy decorators support)
export function Test(name:string)
export function Test(...test_paramters:any[][])
export function Test(...test_paramters:any[])
export function Test(target: Function)
export function Test(target: Function, options)
export function Test(...args) {return handleDecoratorArgs(args, _Test)}

function _Test(value:any, name:context_name, kind:context_kind, is_static:boolean, is_private:boolean, setMetadata:context_meta_setter, getMetadata:context_meta_getter, params:[string?]|any[][] = []) {
    UnytTests.init();

    if (kind == 'class') {
        if (!(typeof params[0] == "string")) throw Error("Invalid @Test name, must be a string")
        
        const group_name = params[0]??<string>name;
        UnytTests.addTestGroup(group_name, value);

        for (let k of Object.getOwnPropertyNames(value)) {
            const params = value[METADATA]?.[META_PARAMS]?.public?.[k];
            if (params) UnytTests.addTest(group_name, k, params);
        }
        
        //UnytTests.runTests(group_name); // immediately run tests for this class when created
    }
    else if (kind == 'method') {
        // convert single parameters to parameter arrays
        for (let i=0;i<params.length;i++) {
            if (!(params[i] instanceof Array)) params[i] = [params[i]] 
        }
        setMetadata(META_PARAMS, params.length?params:UnytTests.NO_PARAMS);
    }

}

type successful = "successful";
type pending = "pending";
type result_value = successful|pending|Error;

type no_params = "no_params";

@default_scope export class UnytTests {

    static readonly SUCCESSFUL:successful = "successful"
    static readonly PENDING:pending = "pending"
    static readonly NO_PARAMS:no_params = "no_params"

    static all_tests_result:typeof UnytTests.SUCCESSFUL|typeof UnytTests.PENDING|any = UnytTests.PENDING;

    static test_groups = new Map<string, object>(); // contains the actual test classes
    static tests = new Map<string, (Map<string, any[][]|no_params>)>() // contains test functions with different parameters for each test class/group
    static test_case_results = new Map<string, (Map<string, result_value[]>)>() // contains test results for each test case
    static test_results = new Map<string, (Map<string, result_value>)>() // contains test results for each test case
    static test_group_results = new Map<string, result_value>() // contains test results for each test case

    static initialized = false;
    static init(){
        if (this.initialized) return;
        this.initialized = true;
        logger.success("initialized")
    }


    // connect to DATEX cloud and expose tests from this endpoint
    static async expose(endpoint:endpoint_name) {
        logger.info("exposing tests as " + endpoint);
        await DatexCloud.connectTemporary(f(endpoint));
        // @ts-ignore
        UnytTests.to(f(endpoint));
    }

    static async local() {
        logger.info("running local tests");
        await DatexCloud.connectAnonymous();
        // @ts-ignore
        UnytTests.to(DatexRuntime.endpoint);
        // initalize tests:// resource manager with listeners
        new TestResourceManager
    }

    private static iframe:HTMLIFrameElement
    private static url:string


    // connect to DATEX cloud and get tests from this endpoint
    static async remote(endpoint:endpoint_name, url?:string) {
        if (url) {
            this.url = url;
            await this.updateIframe();
        }

        logger.info("getting remote tests from " + endpoint);
        await DatexCloud.connectAnonymous();
        // @ts-ignore
        UnytTests.to(f(endpoint));

        // initalize tests:// resource manager with listeners
        new TestResourceManager
    }


    // reload iframe with current url
    private static async updateIframe() {
        if (this.iframe) this.iframe.remove(); // remove old iframe

        this.iframe = document.createElement("iframe");
        this.iframe.src = this.url;
        this.iframe.style.position = "absolute";
        this.iframe.style.zIndex = "1000";
        this.iframe.style.visibility = "hidden"

        document.body.appendChild(this.iframe);
        return new Promise(resolve=>{
            this.iframe.addEventListener('load', ()=>setTimeout(resolve, 2000), true)
        })
    }


    static addTestGroup(name:string, test_group:object){
        this.test_groups.set(name, test_group);
        this.test_case_results.set(name, new Map());
        this.test_results.set(name, new Map());
        this.test_group_results.set(name, UnytTests.PENDING);
        this.tests.set(name, new Map())
    }

    static addTest(group_name:string, name:string, parameters:any[][]|no_params){
        if (!this.tests.has(group_name)) this.tests.set(group_name, new Map())
        if (!this.tests.get(group_name).has(name)) this.tests.get(group_name).set(name, parameters); // no parameters yet
        else if (parameters instanceof Array) {
            const test_cases = this.tests.get(group_name).get(name);
            if (test_cases instanceof Array) test_cases.push(...parameters) // append parameters
        }
        if (!this.test_results.get(group_name).has(name)) this.test_results.get(group_name).set(name, UnytTests.PENDING);
        if (!this.test_case_results.get(group_name).has(name)) this.test_case_results.get(group_name).set(name, Array(parameters instanceof Array ? parameters.length : 1).fill(UnytTests.PENDING));
    }

    @expose @remote static getTestsGroups(){
        return this.tests;
    }

    @expose @remote static getTests(group_name:string): Map<string, any[][]|no_params>{
        return this.tests.get(group_name);
    }

    @expose @remote static getTestCases(group_name:string, test_name:string): any[][]|no_params{
        return this.tests.get(group_name).get(test_name);
    }

    // get current state of a test group / test / test case
    @expose @remote static getTestResult(group_name?:string, test_name?:string, index?:number) {
        if (group_name!=undefined && test_name!=undefined && index!=undefined) return this.test_case_results.get(group_name).get(test_name)[index];
        if (group_name!=undefined && test_name!=undefined ) return this.test_results.get(group_name).get(test_name);
        if (group_name!=undefined) return this.test_group_results.get(group_name);
        return this.all_tests_result;
    }

    @expose @remote static async runAllTests(){
        let promises = [];
        for (let group_name of this.tests.keys()) promises.push(this.runTests(group_name, false));
        await Promise.all(promises);

        // check if all tests were successful
        this.updateAllTestGroups();
    }

    @expose @remote static async runTests(group_name:string, update_recursive_from_buttom = true) {
        let promises = [];
        for (let name of this.tests.get(group_name).keys()) promises.push(this.runTest(group_name, name, false));
        await Promise.all(promises);

        // check if all tests were successful
        this.updateAllTests(group_name, update_recursive_from_buttom);
    }

    @expose @remote static async runTest(group_name:string, test_name:string, update_recursive_from_buttom = true) {
        let promises = [];
        let index = 0;
        const test_cases = this.tests.get(group_name).get(test_name);

        // has different test case parameters
        if (test_cases instanceof Array) {
            for (let parameters of test_cases) {
                promises.push(this.runTestCase(group_name, test_name, parameters, index++, false));
            }
            await Promise.all(promises);
        } 
        // single test
        else await this.runTestCase(group_name, test_name, [], 0, false);
       
        // check if all test cases were successful
        this.updateAllTestCases(group_name, test_name, update_recursive_from_buttom);
    }

    @expose @remote static async runTestCase(group_name:string, test_name:string, parameters:any[], index:number, update_recursive_from_buttom = true) {        
        this.pendingTestCase(group_name, test_name, index, update_recursive_from_buttom);
        try {
            await this.test_groups.get(group_name)[test_name](...parameters); // call test method with parameters
            this.successfulTestCase(group_name, test_name, index, update_recursive_from_buttom)
        } catch (error) {
            this.failedTestCase(group_name, test_name, index, error, update_recursive_from_buttom);
        }
    }
    

    // update on test result:
    
    private static successfulTestCase(group_name:string, test_name:string, index:number, update_recursive_from_buttom = true){
        this.test_case_results.get(group_name).get(test_name)[index] = UnytTests.SUCCESSFUL;
        logger.success("test case '" + group_name + "." + test_name + "' succeeded with parameters #"+index)
        for (let l of this.test_case_result_listeners) l(group_name, test_name, index, UnytTests.SUCCESSFUL);
        // update recursively to top
        if (update_recursive_from_buttom) this.updateAllTestCases(group_name, test_name);
    }
    private static failedTestCase(group_name:string, test_name:string, index:number, error:any, update_recursive_from_buttom = true){
        logger.error("test case '" + group_name + "." + test_name + "' failed with parameters #"+index)
        this.test_case_results.get(group_name).get(test_name)[index] = error;
        for (let l of this.test_case_result_listeners) l(group_name, test_name, index, error);
        // update recursively to top
        if (update_recursive_from_buttom) this.updateAllTestCases(group_name, test_name);
    }
    private static pendingTestCase(group_name:string, test_name:string, index:number, update_recursive_from_buttom = true){
        this.test_case_results.get(group_name).get(test_name)[index] = UnytTests.PENDING;
        for (let l of this.test_case_result_listeners) l(group_name, test_name, index, UnytTests.PENDING);
        // update recursively to top
        if (update_recursive_from_buttom) this.updateAllTestCases(group_name, test_name);
    }

    private static successfulTest(group_name:string, test_name:string, update_recursive_from_buttom = true){
        this.test_results.get(group_name).set(test_name, UnytTests.SUCCESSFUL);
        for (let l of this.test_result_listeners) l(group_name, test_name, UnytTests.SUCCESSFUL);
        // update recursively to top
        if (update_recursive_from_buttom) this.updateAllTests(group_name);
    }
    private static failedTest(group_name:string, test_name:string, error:any, update_recursive_from_buttom = true){
        this.test_results.get(group_name).set(test_name, error);
        for (let l of this.test_result_listeners) l(group_name, test_name, error);
        // update recursively to top
        if (update_recursive_from_buttom) this.updateAllTests(group_name);
    }
    private static pendingTest(group_name:string, test_name:string, update_recursive_from_buttom = true){
        this.test_results.get(group_name).set(test_name, UnytTests.PENDING);
        for (let l of this.test_result_listeners) l(group_name, test_name, UnytTests.PENDING);
        // update recursively to top
        if (update_recursive_from_buttom) this.updateAllTests(group_name);
    }


    private static successfulTestGroup(group_name:string, update_recursive_from_buttom = true){
        this.test_group_results.set(group_name, UnytTests.SUCCESSFUL);
        for (let l of this.test_group_result_listeners) l(group_name, UnytTests.SUCCESSFUL);
        // update recursively to top
        if (update_recursive_from_buttom) this.updateAllTestGroups();
    }
    private static failedTestGroup(group_name:string, error:any, update_recursive_from_buttom = true){
        this.test_group_results.set(group_name, error);
        for (let l of this.test_group_result_listeners) l(group_name, error);
        // update recursively to top
        if (update_recursive_from_buttom) this.updateAllTestGroups();
    }
    private static pendingTestGroup(group_name:string, update_recursive_from_buttom = true){
        this.test_group_results.set(group_name, UnytTests.PENDING);
        for (let l of this.test_group_result_listeners) l(group_name, UnytTests.PENDING);
        // update recursively to top
        if (update_recursive_from_buttom) this.updateAllTestGroups();
    }


    private static successfulAllTests(){
        this.all_tests_result = UnytTests.SUCCESSFUL;
        for (let l of this.all_test_result_listeners) l(UnytTests.SUCCESSFUL);
    }
    private static failedAllTests(error:any){
        this.all_tests_result = error;
        for (let l of this.all_test_result_listeners) l(error);
    }
    private static pendingAllTests(){
        this.all_tests_result = UnytTests.PENDING;
        for (let l of this.all_test_result_listeners) l(UnytTests.PENDING);
    }

    // check children for recursive parent update ---------------

    private static updateAllTestGroups(){
        // check if all tests were successful
        for (let result of this.test_group_results.values()) {
            if (result == UnytTests.PENDING) return this.pendingAllTests();
            if (result != UnytTests.SUCCESSFUL) return this.failedAllTests(result);
        }
        this.successfulAllTests();
    }

    private static updateAllTests(group_name: string, update_recursive_from_buttom = true) {
        // check if all tests were successful
        for (let result of this.test_results.get(group_name).values()) {
            if (result == UnytTests.PENDING) return this.pendingTestGroup(group_name, update_recursive_from_buttom);
            if (result != UnytTests.SUCCESSFUL) return this.failedTestGroup(group_name, result, update_recursive_from_buttom);
        }
        this.successfulTestGroup(group_name, update_recursive_from_buttom);
    }

    private static updateAllTestCases(group_name: string, test_name: string, update_recursive_from_buttom = true) {
        // check if all test cases were successful
        for (let result of this.test_case_results.get(group_name).get(test_name)) {
            if (result == UnytTests.PENDING) return this.pendingTest(group_name, test_name, update_recursive_from_buttom);
            if (result != UnytTests.SUCCESSFUL) return this.failedTest(group_name, test_name, result, update_recursive_from_buttom);
        }
        this.successfulTest(group_name, test_name, update_recursive_from_buttom);
    }


    // test result listeners
    static test_case_result_listeners = new Set<(group_name:string, test_name:string, index:number, result:typeof UnytTests.SUCCESSFUL|any)=>void>();
    static test_result_listeners = new Set<(group_name:string, test_name:string, result:typeof UnytTests.SUCCESSFUL|any)=>void>();
    static test_group_result_listeners = new Set<(group_name:string, result:typeof UnytTests.SUCCESSFUL|any)=>void>();
    static all_test_result_listeners = new Set<(result:typeof UnytTests.SUCCESSFUL|any)=>void>();

    @expose @remote static onTestCaseResult(listener:(group_name:string, test_name:string, index:number, result:typeof UnytTests.SUCCESSFUL|any)=>void) {
        this.test_case_result_listeners.add(listener)
    }

    @expose @remote static onTestResult(listener:(group_name:string, test_name:string, result:typeof UnytTests.SUCCESSFUL|any)=>void) {
        this.test_result_listeners.add(listener)
    }

    @expose @remote static onTestGroupResult(listener:(group_name:string, result:typeof UnytTests.SUCCESSFUL|any)=>void) {
        this.test_group_result_listeners.add(listener)
    }

    @expose @remote static onAllTestsResult(listener:(result:typeof UnytTests.SUCCESSFUL|any)=>void) {
        this.all_test_result_listeners.add(listener)
    }

}

globalThis.UnytTests = UnytTests;



// Assert extensions
import Assert from './unytassert/src/Assert.js';
import { DatexEndpoint, DatexRuntime, endpoint_name, f, filter_target_name_alias } from "../unyt_web/unyt_core/datex_runtime.js";
import { default_scope, expose, remote } from "../unyt_web/unyt_core/legacy_decorators.js";
import { TestResourceManager } from "./uix_component.js";

export class TestAssert extends Assert {
    protected _NAME = "TestAssert";

    static equals(value1:any, value2:any) {
        let error = new Error(`${DatexRuntime.valueToDatexString(value1)} does not equal ${DatexRuntime.valueToDatexString(value2)}`) 
        return this.check(value1===value2, error);
    }

    static true(value:any) {
        let error = new Error(`${DatexRuntime.valueToDatexString(value)} is not true`) 
        return this.check(value, error);
    }

    static async throws(expression:Function|Promise<any>) {
        try {
            if (expression instanceof Promise) await expression;
            else if (typeof expression == "function") await expression();
        }
        catch (e) {
            return true; // error was thrown
        }
        throw Error(`did not throw an error`); // no error was thrown
    }
}
