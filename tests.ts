/**
 * unyt Test library with UIX viewer
 * 
 * decorators:
 * - currently using legacy typescript decorators, TODO migrate to JS decorators in the future (https://github.com/tc39/proposal-decorators)
 * - decorator functions assume that all static method decorators are called before the class decorator..
 *   otherwise the program breaks !!... 
 *   not sure about the order in the decorator proposal (but static methods before class decorator would make sense)
 */
import { eternal } from "../unyt_core/datex.js";
import { handleDecoratorArgs, context_kind, context_meta_getter, context_meta_setter, context_name, METADATA } from "./legacy_decorators.js";
import { TestCase } from "./test_case.js";

// store all tests
const tests = (await eternal(Map<string, Set<TestCase>>)).setAutoDefault(Set);




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
