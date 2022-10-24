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
import { f } from "../../unyt_core/datex.js";
import { Datex, remote, scope, to } from "../../unyt_core/datex.js";
import { Endpoint, endpoint_name, Logger, LOG_LEVEL } from "../../unyt_core/datex_all.js";
import { handleDecoratorArgs, context_kind, context_meta_getter, context_meta_setter, context_name, METADATA } from "./legacy_decorators.js";

//Logger.development_log_level = LOG_LEVEL.WARNING;
Logger.production_log_level = LOG_LEVEL.DEFAULT;


let ENV: {
    endpoint?: Endpoint,
    test_manager?: Endpoint,
    context?: URL
} = {};

let init_resolve:Function;
const initialized= new Promise(resolve=>init_resolve=resolve);

async function init(){
    await Datex.Supranet.connect(ENV.endpoint, undefined, false);
    await TestManager.to(ENV.test_manager).registerContext(ENV.context);
    init_resolve(); // init ready
}

async function registerTests(group_name:string, value:Function){
    await initialized; // wait for init

    await TestManager.to(ENV.test_manager).registerTestGroup(ENV.context, group_name);

    const test_case_promises:Promise<void>[] = []

    for (let k of Object.getOwnPropertyNames(value)) {
        const test_case_data = <[test_name:string, params:any[][], value:(...args: any) => void | Promise<void>]>value[METADATA]?.[TEST_CASE_DATA]?.public?.[k];
                    
        if (test_case_data) test_case_promises.push(TestManager.to(ENV.test_manager).bindTestCase(
            ENV.context,
            group_name, 
            test_case_data[0],
            test_case_data[1],
            test_case_data[2]//Datex.Function.get(null, test_case_data[2]) // convert to DATEX function
        ));
    }

    await Promise.all(test_case_promises);

    await TestManager.to(ENV.test_manager).testGroupLoaded(ENV.context, group_name);
    setTimeout(()=>TestManager.to(ENV.test_manager).contextLoaded(ENV.context), 1000)
}



// wait for message (web worker)
if (globalThis.self) {
    self.onmessage = async (e) => {
        ENV.endpoint = f(e.data.endpoint);
        ENV.test_manager = f(e.data.test_manager??Datex.LOCAL_ENDPOINT);
        ENV.context = new URL(e.data.context);
        init();
    }    
}
// nodejs process.env
else if (globalThis.process) {
    ENV.endpoint = f(<endpoint_name>process.env.endpoint);
    ENV.test_manager = f(<endpoint_name>(process.env.test_manager??Datex.LOCAL_ENDPOINT));
    ENV.context = new URL(process.env.context);
    init();
}
else {
    throw new Error("Cannot get environment data for test worker")
}


const TEST_CASE_DATA = Symbol("test_case");


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
        registerTests(group_name, value);
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
@scope @to(ENV.test_manager) class TestManager {

    @remote static registerContext(context:URL):Promise<void>{return null}
    @remote static contextLoaded(context:URL):Promise<void>{return null}
    @remote static registerTestGroup(context:URL, group_name:string):Promise<void>{return null}
    @remote static testGroupLoaded(context:URL, group_name:string):Promise<void>{return null}
    @remote static bindTestCase(context:URL, group_name:string, test_name:string, params:any[][], func:(...args: any) => void | Promise<void>):Promise<void>{return null}

}