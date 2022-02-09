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
import { TestResourceManager } from "./uix_component.js";
import { handleDecoratorArgs, context_kind, context_meta_getter, context_meta_setter, context_name, METADATA } from "./legacy_decorators.js";

const logger = new Logger("unyt_tests");

const META_PARAMS = Symbol("params");

// @Test (legacy decorators support)
export function Test(name:string)
export function Test(...test_paramters:any[][])
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
        
        UnytTests.runTests(group_name);
    }
    else if (kind == 'method') {
        setMetadata(META_PARAMS, params);
    }

}


export class UnytTests {

    static SUCCESSFUL = Symbol("successful");
    static UNKNOWN = Symbol("unknown");

    static #test_groups = new Map<string, object>(); // contains the actual test classes
    static #tests = new Map<string, (Map<string, any[][]>)>() // contains test functions with different parameters for each test class/group
    static #test_case_results = new Map<string, (Map<string, (typeof UnytTests.SUCCESSFUL|any)[]>)>() // contains test results for each test case
    static #test_results = new Map<string, (Map<string, (typeof UnytTests.SUCCESSFUL|any)>)>() // contains test results for each test case
    static #test_group_results = new Map<string, (typeof UnytTests.SUCCESSFUL|any)>() // contains test results for each test case

    static resource_manager: TestResourceManager

    static #initialized = false;
    static init(){
        if (this.#initialized) return;
        this.resource_manager = new TestResourceManager()

        this.#initialized = true;
        logger.success("initialized")
    }

    static addTestGroup(name:string, test_group:object){
        this.#test_groups.set(name, test_group);
        this.#test_case_results.set(name, new Map());
        this.#test_results.set(name, new Map());
        this.#test_group_results.set(name, new Map());
    }

    static addTest(group_name:string, name:string, parameters:any[][]){
        logger.info("create test: " + name)

        if (!this.#tests.has(group_name)) this.#tests.set(group_name, new Map())
        if (!this.#tests.get(group_name).has(name)) this.#tests.get(group_name).set(name, parameters); // no parameters yet
        else this.#tests.get(group_name).get(name).push(...parameters) // append parameters

        if (!this.#test_results.get(group_name).has(name)) this.#test_results.get(group_name).set(name, UnytTests.UNKNOWN);
        if (!this.#test_case_results.get(group_name).has(name)) this.#test_case_results.get(group_name).set(name, Array(parameters.length));
    }

    static getTestsGroups(){
        return this.#tests;
    }

    static getTests(group_name:string): Map<string, any[][]>{
        return this.#tests.get(group_name);
    }

    static getTestCases(group_name:string, test_name:string): any[][]{
        return this.#tests.get(group_name).get(test_name);
    }

    // get current state of a test group / test / test case
    static getTestResult(group_name:string, test_name?:string, index?:number) {
        if (group_name!=undefined && test_name!=undefined && index!=undefined) return this.#test_case_results.get(group_name).get(test_name)[index];
        if (group_name!=undefined && test_name!=undefined ) return this.#test_results.get(group_name).get(test_name);
        return this.#test_group_results.get(group_name);
    }

    static async runTests(group_name:string) {
        let promises = [];
        for (let name of this.#tests.get(group_name).keys()) promises.push(this.runTest(group_name, name));
        await Promise.all(promises);

        // check if all tests were successful
        for (let result of this.#test_results.get(group_name).values()) {
            if (result != UnytTests.SUCCESSFUL) {
                return this.failedTestGroup(group_name, result);
            }
        }
        this.successfulTestGroup(group_name);
    }

    static async runTest(group_name:string, test_name:string) {
        let promises = [];
        let index = 0;
        for (let parameters of this.#tests.get(group_name).get(test_name)) {
            promises.push(this.runTestCase(group_name, test_name, parameters, index++));
        }
        await Promise.all(promises);

        // check if all test cases were successful
        for (let result of this.#test_case_results.get(group_name).get(test_name)) {
            if (result != UnytTests.SUCCESSFUL) return this.failedTest(group_name, test_name, result);
        }
        this.successfulTest(group_name, test_name);
    }

    static async runTestCase(group_name:string, test_name:string, parameters:any[], index:number) {        
        try {
            await this.#test_groups.get(group_name)[test_name](...parameters); // call test method with parameters
            this.successfulTestCase(group_name, test_name, index)
        } catch (error) {
            this.failedTestCase(group_name, test_name, index, error);
        }
    }
    

    // update on test result:
    
    private static successfulTestCase(group_name:string, test_name:string, index:number){
        this.#test_case_results.get(group_name).get(test_name)[index] = UnytTests.SUCCESSFUL;
        logger.success("test case '" + group_name + "." + test_name + "' succeeded with parameters", this.#tests.get(group_name).get(test_name)[index])
        for (let l of this.#test_case_result_listeners) l(group_name, test_name, index, UnytTests.SUCCESSFUL);
    }
    private static failedTestCase(group_name:string, test_name:string, index:number, error:any){
        logger.error("test case '" + group_name + "." + test_name + "' failed with parameters", this.#tests.get(group_name).get(test_name)[index], error)
        this.#test_case_results.get(group_name).get(test_name)[index] = error;
        for (let l of this.#test_case_result_listeners) l(group_name, test_name, index, error);
    }

    private static successfulTest(group_name:string, test_name:string){
        this.#test_results.get(group_name).set(test_name, UnytTests.SUCCESSFUL);
        for (let l of this.#test_result_listeners) l(group_name, test_name, UnytTests.SUCCESSFUL);
    }

    private static failedTest(group_name:string, test_name:string, error:any){
        this.#test_results.get(group_name).set(test_name, error);
        for (let l of this.#test_result_listeners) l(group_name, test_name, error);
    }

    private static successfulTestGroup(group_name:string){
        this.#test_group_results.set(group_name, UnytTests.SUCCESSFUL);
        for (let l of this.#test_group_result_listeners) l(group_name, UnytTests.SUCCESSFUL);
    }

    private static failedTestGroup(group_name:string,  error:any){
        this.#test_group_results.set(group_name, error);
        for (let l of this.#test_group_result_listeners) l(group_name, error);
    }


    // test result listeners
    static #test_case_result_listeners = new Set<(group_name:string, test_name:string, index:number, result:typeof UnytTests.SUCCESSFUL|any)=>void>();
    static #test_result_listeners = new Set<(group_name:string, test_name:string, result:typeof UnytTests.SUCCESSFUL|any)=>void>();
    static #test_group_result_listeners = new Set<(group_name:string, result:typeof UnytTests.SUCCESSFUL|any)=>void>();

    static onTestCaseResult(listener:(group_name:string, test_name:string, index:number, result:typeof UnytTests.SUCCESSFUL|any)=>void) {
        this.#test_case_result_listeners.add(listener)
    }

    static onTestResult(listener:(group_name:string, test_name:string, result:typeof UnytTests.SUCCESSFUL|any)=>void) {
        this.#test_result_listeners.add(listener)
    }

    static onTestGroupResult(listener:(group_name:string, result:typeof UnytTests.SUCCESSFUL|any)=>void) {
        this.#test_group_result_listeners.add(listener)
    }

}

globalThis.UnytTests = UnytTests;