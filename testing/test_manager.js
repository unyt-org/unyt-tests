import { handleDecoratorArgs, METADATA } from "./legacy_decorators.js";
import { TestCase } from "./test_case.js";
const TEST_CASE_DATA = Symbol("test_case");
export function Test(...args) { return handleDecoratorArgs(args, _Test); }
function _Test(value, name, kind, is_static, is_private, setMetadata, getMetadata, params = []) {
    if (kind == 'class') {
        if (!(typeof params[0] == "string"))
            params[0] = name;
        const group_name = params[0] ?? name;
        TestManager.bindTestGroup(group_name, value);
        for (let k of Object.getOwnPropertyNames(value)) {
            const test_case_data = value[METADATA]?.[TEST_CASE_DATA]?.public?.[k];
            if (test_case_data)
                TestManager.bindTestCase(group_name, ...test_case_data);
        }
    }
    else if (kind == 'method') {
        for (let i = 0; i < params.length; i++) {
            if (!(params[i] instanceof Array))
                params[i] = [params[i]];
        }
        const test_name = name;
        setMetadata(TEST_CASE_DATA, [test_name, params, value]);
    }
}
const tests = new Map().setAutoDefault(Map);
export class TestManager {
    static bindTestGroup(group_name, target) {
        console.log("new test group", group_name);
        tests.set(group_name, new Map());
    }
    static bindTestCase(group_name, test_name, params, func) {
        if (tests.getAuto(group_name).has(test_name)) {
            console.log("update existing test case", test_name, params);
            tests.get(group_name).get(test_name).func = func;
        }
        else {
            console.log("new test case", test_name, params);
            const test_case = new TestCase(test_name, params, func);
            tests.getAuto(group_name).set(test_name, test_case);
        }
    }
    static runAll() {
        for (let [group_name, group] of tests) {
            console.log("running test group: " + group_name);
            for (let [test_name, test] of group) {
                console.log("running test: " + test_name);
                test.run();
            }
        }
    }
}
