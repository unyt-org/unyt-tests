/**
 * unyt Test library
 * 
 * decorators:
 * - currently using legacy typescript decorators, TODO migrate to JS decorators in the future (https://github.com/tc39/proposal-decorators)
 * - decorator functions assume that all static method decorators are called before the class decorator..
 *   otherwise the program breaks !!... 
 *   not sure about the order in the decorator proposal (but static methods before class decorator would make sense)
 */

// @ts-ignore
import type { Class } from "../../unyt_core/datex.js";
import { f } from "../../unyt_core/datex.js";
import { Datex, remote, scope, to } from "../../unyt_core/datex.js";
import { endpoint_name, Logger, LOG_LEVEL } from "../../unyt_core/datex_all.js";
import { handleDecoratorArgs, context_kind, context_meta_getter, context_meta_setter, context_name, METADATA } from "./legacy_decorators.js";

Logger.development_log_level = LOG_LEVEL.WARNING;
Logger.production_log_level = LOG_LEVEL.DEFAULT;

await Datex.Cloud.connectTemporary(f(<endpoint_name>process.env.endpoint));


const TEST_CASE_DATA = Symbol("test_case");

const context = new URL(process.env.context);

// @Test (legacy decorators support)
export function Test(name:string)
export function Test(...test_paramters:any[][])
export function Test(...test_paramters:any[])
export function Test(target: Function)
export function Test(target: Function, options)
export function Test(...args) {return handleDecoratorArgs(args, _Test)}

function _Test(value:any, name:context_name, kind:context_kind, is_static:boolean, is_private:boolean, setMetadata:context_meta_setter, getMetadata:context_meta_getter, params:[string?]|any[][] = []) {

    if (kind == 'class') {
        // use class name as default test group name
        if (!(typeof params[0] == "string")) params[0] = <string>name;
        
        const group_name = params[0]??<string>name;

        (async ()=>{
            await TestManager.registerTestGroup(context, group_name);

            const test_case_promises:Promise<void>[] = []

            for (let k of Object.getOwnPropertyNames(value)) {
                const test_case_data = <[test_name:string, params:any[][], value:(...args: any) => void | Promise<void>]>value[METADATA]?.[TEST_CASE_DATA]?.public?.[k];
                            
                if (test_case_data) test_case_promises.push(TestManager.bindTestCase(
                    context,
                    group_name, 
                    test_case_data[0],
                    test_case_data[1],
                    test_case_data[2]//Datex.Function.get(null, test_case_data[2]) // convert to DATEX function
                ));
            }

            await Promise.all(test_case_promises);

            await TestManager.testGroupLoaded(context, group_name);
            setTimeout(()=>TestManager.contextLoaded(context), 1000)
        })()
   
    }
    else if (kind == 'method') {
        // convert single parameters to parameter arrays
        for (let i=0;i<params.length;i++) {
            if (!(params[i] instanceof Array)) params[i] = [params[i]] 
        }

        const test_name = name;

        setMetadata(TEST_CASE_DATA, [test_name, params, value]);
    }

}

// TestManager in main process
@scope @to(process.env.test_manager??Datex.LOCAL_ENDPOINT) class TestManager {

    @remote static registerContext(context:URL):Promise<void>{return null}
    @remote static contextLoaded(context:URL):Promise<void>{return null}
    @remote static registerTestGroup(context:URL, group_name:string):Promise<void>{return null}
    @remote static testGroupLoaded(context:URL, group_name:string):Promise<void>{return null}
    @remote static bindTestCase(context:URL, group_name:string, test_name:string, params:any[][], func:(...args: any) => void | Promise<void>):Promise<void>{return null}

}

await TestManager.registerContext(context);