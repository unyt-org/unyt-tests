/**
 * unyt Test library
 * 
 * decorators:
 * - currently using legacy typescript decorators, TODO migrate to JS decorators in the future (https://github.com/tc39/proposal-decorators)
 * - decorator functions assume that all static method decorators are called before the class decorator..
 *   otherwise the program breaks !!... 
 *   not sure about the order in the decorator proposal (but static methods before class decorator would make sense)
 */

import { Datex, remote, scope, to } from "unyt_core";
import { AssertionError, Disjunction, Endpoint, Logger, LOG_LEVEL, logger } from "unyt_core/datex_all.ts";
import { handleDecoratorArgs, METADATA } from "./legacy_decorators.ts";
import type { context_kind, context_meta_getter, context_meta_setter, context_name } from "./legacy_decorators.ts";
import { TestGroupOptions } from "../core/test_case.ts";

export * from "./assertions.ts";

// @ts-ignore check not duplicate test libraries
if (globalThis._unyt_test) {
    logger.error(`Two conflicting versions of the unyt-tests library were imported from different sources: ${globalThis._unyt_test} and ${import.meta.url.replace('testing/test.ts', '')}`)
    throw new Error(`unyt-test library conflict`)
}
// @ts-ignore
globalThis._unyt_test = import.meta.url.replace('testing/test.ts', '');

Logger.development_log_level = LOG_LEVEL.WARNING;
Logger.production_log_level = LOG_LEVEL.DEFAULT;


const manager_out = new Disjunction<Endpoint>();

const ENV: {
    endpoint?: Endpoint,
    test_manager?: Endpoint,
    context: URL,
    supranet_connect?:boolean
} = {
    context: new URL(import.meta.url)
};

let isSameProcess = true;

let init_resolve:Function;
const initialized= new Promise(resolve=>init_resolve=resolve);

export async function init(env?:Partial<typeof ENV>){
    if (env) Object.assign(ENV, env);

    if (ENV.test_manager) manager_out.add(ENV.test_manager);
    if (ENV.supranet_connect) await Datex.Supranet.connect(ENV.endpoint, false);
    else if (ENV.endpoint) await Datex.Supranet.init(ENV.endpoint, false);
    await TestManager.registerContext(ENV.context);
    init_resolve(); // init ready
}


/** handle init depending on context */

// // @ts-ignore nodejs
// if (globalThis.process) {
//     isSameProcess = false;
//     import("./init_node.ts")
// }

// service worker
if (!globalThis.window) {
    isSameProcess = false;
    import("./init_worker.ts")
}


async function registerTests(group_name:string, value:Function){
    await initialized; // wait for init

    // check group options ('worker' flag)

    const [name, group_options] = <[string, TestGroupOptions]> ((<any>value)[METADATA]?.[TEST_GROUP_DATA]?.constructor) ?? [];
    if (!group_options?.flags?.includes("worker")) return;
    if (name) group_name = name;

    await TestManager.registerTestGroup(ENV.context!, group_name);

    const test_case_promises:Promise<void>[] = []

    for (const k of Object.getOwnPropertyNames(value.prototype)) {
        if (k == "constructor") continue;
        const test_case_data = <[test_name:string, params:any[][], options:TestGroupOptions, value:(...args: any) => void | Promise<void>]>value.prototype[METADATA]?.[TEST_CASE_DATA]?.public?.[k];

        // @ts-ignore handle constructor
        if (test_case_data == Object) continue;

        const timeout = value.prototype[METADATA]?.[TIMEOUT]?.public?.[k] ?? DEFAULT_TIMEOUT;
        if (test_case_data) {
            test_case_promises.push(TestManager.bindTestCase(
            ENV.context!,
            group_name, 
            test_case_data[0],
            test_case_data[1],
            Datex.Pointer.proxifyValue(Datex.Function.createFromJSFunction(function (...args:any[]){
                // either timeout rejects or test case resolves first
                return Promise.race([
                    test_case_data[3](...args),
                    new Promise<any>((_,reject)=>setTimeout(()=>reject(new AssertionError("Exceeded maximum allowed execution time of "+timeout+"s")), timeout*1000)) // reject after timeout
                ])
            }, undefined, undefined, undefined, undefined, undefined, Datex.Function.getFunctionParams(test_case_data[3])))
            
        ));
        }
    }

    await Promise.all(test_case_promises);

    await TestManager.testGroupLoaded(ENV.context!, group_name);


    // @ts-ignore
    postMessage("ready");
    // setTimeout(()=>TestManager.contextLoaded(ENV.context), 1000)
}





export const TEST_GROUP_DATA = Symbol("test_group_data");
export const TEST_CASE_DATA = Symbol("test_case");
export const TIMEOUT = Symbol("timeout");
export const DEFAULT_TIMEOUT = 60; // 60s

type decorator_target = {[key: string]: any} & Partial<Record<keyof Array<any>, never>>;


// @Test (legacy decorators support)
export function Test(name:string):any
export function Test(options:TestGroupOptions):any
export function Test(name:string, options:TestGroupOptions):any

export function Test(test_parameters:(unknown|unknown[])[]):any
export function Test(name:string, test_parameters:(unknown|unknown[])[]):any
// export function Test(name:string, test_parameters:(unknown|unknown[])[], options:TestGroupOptions):any

// export function Test(...test_paramters:any[]):any
export function Test(target: any, name?: string, method?:any):any
export function Test(target: Function, options:any):any
export function Test(...args:any[]) {return handleDecoratorArgs(args, _Test)}

// @ts-ignore global Test
// globalThis.Test = Test;
// const GlobalTest = Test;
// declare global {
//     const Test: typeof GlobalTest
// }

function _Test(value:any, name:context_name, kind:context_kind, _is_static:boolean, _is_private:boolean, setMetadata:context_meta_setter, getMetadata:context_meta_getter, params:[string?]|any[][] = []) {

    // options
    let options: TestGroupOptions|undefined;
    if (typeof params[0] == "object" && !(params[0] instanceof Array)) options = params[0]
    else if (typeof params[1] == "object" && !(params[1] instanceof Array)) options = params[1]
    else if (typeof params[2] == "object" && !(params[2] instanceof Array)) options = params[2]

    // name
    const test_name = typeof params[0] == "string" ? params[0] : ((<string>name)?.replace(/[0-9]$/, ''))
    
    if (kind == 'class') {
        // workaround: deno compiler sometimes adds random numbers to function names
        const group_name = (<string> test_name);;

        setMetadata(TEST_GROUP_DATA, [group_name, options]);

        // handle tests via DATEX, if not in same process
        if (!isSameProcess) registerTests(group_name, value);
    }

    else if (kind == 'method') {

        // params
        let parameters: any[] = [];
        if (params[0] instanceof Array) parameters = params[0];
        else if (params[1] instanceof Array) parameters = params[1];
        // convert single parameters to parameter arrays
        for (let i=0;i<parameters?.length;i++) {
            if (!(parameters[i] instanceof Array)) parameters[i] = [parameters[i]] 
        }
                
        setMetadata(TEST_CASE_DATA, [test_name, parameters, options, value]);
    }

}


// @Timeout (legacy decorators support) - DEFAULT Timeout is 60s, MAX depends on test manager timeout, currently 10min
export function Timeout(seconds:number):any
export function Timeout(target: Function):any
export function Timeout(target: Function, options:any):any
export function Timeout(...args:any[]) {return handleDecoratorArgs(args, <any>_Timeout)}

function _Timeout(value:any, name:context_name, kind:context_kind, _is_static:boolean, _is_private:boolean, setMetadata:context_meta_setter, getMetadata:context_meta_getter, params:[number]) {

   if (kind == 'method') {
        if (!params || typeof params[0] != "number")  throw new Error("The @Timeout requires a timeout value (in seconds) as a parameter"); 
        
        const test_name = name;
        setMetadata(TIMEOUT, params[0]);
    }

    else {
        throw new Error("The @Timeout decorator can only be used on test case methods");
    }

}

// interface TestManager in main process - ignored if isSameProcess == true
if (isSameProcess) manager_out.add(Datex.LOCAL_ENDPOINT);
@scope @to(manager_out) class TestManager {

    @remote static registerContext(context:URL|void):Promise<URL|void>{return Promise.resolve(undefined)}
    @remote static contextLoaded(context:URL|void):Promise<URL|void>{return Promise.resolve(undefined)}
    @remote static registerTestGroup(context:URL, group_name:string):Promise<void>{return Promise.resolve(undefined)}
    @remote static registerTestCase(context:URL, group_name:string, test_name:string, params:any[][]):Promise<void>{return Promise.resolve(undefined)}
    @remote static testGroupLoaded(context:URL, group_name:string):Promise<void>{return Promise.resolve(undefined)}
    @remote static bindTestCase(context:URL, group_name:string, test_name:string, params:any[][], func:(...args: any) => void | Promise<void>):Promise<void>{return Promise.resolve(undefined)}

}