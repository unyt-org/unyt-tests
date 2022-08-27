/**
 * unyt Test library with UIX viewer
 * 
 * decorators:
 * - currently using legacy typescript decorators, TODO migrate to JS decorators in the future (https://github.com/tc39/proposal-decorators)
 * - decorator functions assume that all static method decorators are called before the class decorator..
 *   otherwise the program breaks !!... 
 *   not sure about the order in the decorator proposal (but static methods before class decorator would make sense)
 */
// @ts-ignore
import { Datex } from "../../unyt_core/datex.js";
import { Class, expose, scope } from "../../unyt_core/datex_all.js";
import { TestCase } from "./test_case.js";

await Datex.Cloud.connect();

// store all tests
const tests = new Map<string, Map<string,TestCase>>().setAutoDefault(Map); //(await eternal(Map<string, Map<string,TestCase>>)).setAutoDefault(Map);

@scope export class TestManager {

    @expose static bindTestGroup(group_name:string, target:Class){
        console.log("new test group",group_name);
        tests.set(group_name, new Map());
    }

    @expose static bindTestCase(group_name, test_name:string, params:any[][], func:(...args: any) => void | Promise<void>){

        // test case already exists
        if (tests.getAuto(group_name).has(test_name)) {
            console.log("update existing test case",test_name, params);
            tests.get(group_name).get(test_name).func = func;
        }
        // create new test case
        else {
            console.log("new test case",test_name, params);
            const test_case = new TestCase(test_name, params, func);
            tests.getAuto(group_name).set(test_name, test_case);
        }

    }

    static runAll(){

        for (let [group_name, group] of tests) {
            console.log("running test group: " + group_name);
            for (let [test_name, test] of group) {
                console.log("running test: " + test_name);
                test.run();
            }
        }

    }

}