var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _a, _UnytTests_test_groups, _UnytTests_tests, _UnytTests_test_case_results, _UnytTests_test_results, _UnytTests_test_group_results, _UnytTests_initialized, _UnytTests_test_case_result_listeners, _UnytTests_test_result_listeners, _UnytTests_test_group_result_listeners;
import Logger from "../unyt_web/unyt_core/logger.js";
import { TestResourceManager } from "./uix_component.js";
import { handleDecoratorArgs, METADATA } from "./legacy_decorators.js";
const logger = new Logger("unyt_tests");
const META_PARAMS = Symbol("params");
export function Test(...args) { return handleDecoratorArgs(args, _Test); }
function _Test(value, name, kind, is_static, is_private, setMetadata, getMetadata, params = []) {
    UnytTests.init();
    if (kind == 'class') {
        if (!(typeof params[0] == "string"))
            throw Error("Invalid @Test name, must be a string");
        const group_name = params[0] ?? name;
        UnytTests.addTestGroup(group_name, value);
        for (let k of Object.getOwnPropertyNames(value)) {
            const params = value[METADATA]?.[META_PARAMS]?.public?.[k];
            if (params)
                UnytTests.addTest(group_name, k, params);
        }
        UnytTests.runTests(group_name);
    }
    else if (kind == 'method') {
        setMetadata(META_PARAMS, params);
    }
}
export class UnytTests {
    static init() {
        if (__classPrivateFieldGet(this, _a, "f", _UnytTests_initialized))
            return;
        this.resource_manager = new TestResourceManager();
        __classPrivateFieldSet(this, _a, true, "f", _UnytTests_initialized);
        logger.success("initialized");
    }
    static addTestGroup(name, test_group) {
        __classPrivateFieldGet(this, _a, "f", _UnytTests_test_groups).set(name, test_group);
        __classPrivateFieldGet(this, _a, "f", _UnytTests_test_case_results).set(name, new Map());
        __classPrivateFieldGet(this, _a, "f", _UnytTests_test_results).set(name, new Map());
        __classPrivateFieldGet(this, _a, "f", _UnytTests_test_group_results).set(name, new Map());
    }
    static addTest(group_name, name, parameters) {
        logger.info("create test: " + name);
        if (!__classPrivateFieldGet(this, _a, "f", _UnytTests_tests).has(group_name))
            __classPrivateFieldGet(this, _a, "f", _UnytTests_tests).set(group_name, new Map());
        if (!__classPrivateFieldGet(this, _a, "f", _UnytTests_tests).get(group_name).has(name))
            __classPrivateFieldGet(this, _a, "f", _UnytTests_tests).get(group_name).set(name, parameters);
        else
            __classPrivateFieldGet(this, _a, "f", _UnytTests_tests).get(group_name).get(name).push(...parameters);
        if (!__classPrivateFieldGet(this, _a, "f", _UnytTests_test_results).get(group_name).has(name))
            __classPrivateFieldGet(this, _a, "f", _UnytTests_test_results).get(group_name).set(name, UnytTests.UNKNOWN);
        if (!__classPrivateFieldGet(this, _a, "f", _UnytTests_test_case_results).get(group_name).has(name))
            __classPrivateFieldGet(this, _a, "f", _UnytTests_test_case_results).get(group_name).set(name, Array(parameters.length));
    }
    static getTestsGroups() {
        return __classPrivateFieldGet(this, _a, "f", _UnytTests_tests);
    }
    static getTests(group_name) {
        return __classPrivateFieldGet(this, _a, "f", _UnytTests_tests).get(group_name);
    }
    static getTestCases(group_name, test_name) {
        return __classPrivateFieldGet(this, _a, "f", _UnytTests_tests).get(group_name).get(test_name);
    }
    static getTestResult(group_name, test_name, index) {
        if (group_name != undefined && test_name != undefined && index != undefined)
            return __classPrivateFieldGet(this, _a, "f", _UnytTests_test_case_results).get(group_name).get(test_name)[index];
        if (group_name != undefined && test_name != undefined)
            return __classPrivateFieldGet(this, _a, "f", _UnytTests_test_results).get(group_name).get(test_name);
        return __classPrivateFieldGet(this, _a, "f", _UnytTests_test_group_results).get(group_name);
    }
    static async runTests(group_name) {
        let promises = [];
        for (let name of __classPrivateFieldGet(this, _a, "f", _UnytTests_tests).get(group_name).keys())
            promises.push(this.runTest(group_name, name));
        await Promise.all(promises);
        for (let result of __classPrivateFieldGet(this, _a, "f", _UnytTests_test_results).get(group_name).values()) {
            if (result != UnytTests.SUCCESSFUL) {
                return this.failedTestGroup(group_name, result);
            }
        }
        this.successfulTestGroup(group_name);
    }
    static async runTest(group_name, test_name) {
        let promises = [];
        let index = 0;
        for (let parameters of __classPrivateFieldGet(this, _a, "f", _UnytTests_tests).get(group_name).get(test_name)) {
            promises.push(this.runTestCase(group_name, test_name, parameters, index++));
        }
        await Promise.all(promises);
        for (let result of __classPrivateFieldGet(this, _a, "f", _UnytTests_test_case_results).get(group_name).get(test_name)) {
            if (result != UnytTests.SUCCESSFUL)
                return this.failedTest(group_name, test_name, result);
        }
        this.successfulTest(group_name, test_name);
    }
    static async runTestCase(group_name, test_name, parameters, index) {
        try {
            await __classPrivateFieldGet(this, _a, "f", _UnytTests_test_groups).get(group_name)[test_name](...parameters);
            this.successfulTestCase(group_name, test_name, index);
        }
        catch (error) {
            this.failedTestCase(group_name, test_name, index, error);
        }
    }
    static successfulTestCase(group_name, test_name, index) {
        __classPrivateFieldGet(this, _a, "f", _UnytTests_test_case_results).get(group_name).get(test_name)[index] = UnytTests.SUCCESSFUL;
        logger.success("test case '" + group_name + "." + test_name + "' succeeded with parameters", __classPrivateFieldGet(this, _a, "f", _UnytTests_tests).get(group_name).get(test_name)[index]);
        for (let l of __classPrivateFieldGet(this, _a, "f", _UnytTests_test_case_result_listeners))
            l(group_name, test_name, index, UnytTests.SUCCESSFUL);
    }
    static failedTestCase(group_name, test_name, index, error) {
        logger.error("test case '" + group_name + "." + test_name + "' failed with parameters", __classPrivateFieldGet(this, _a, "f", _UnytTests_tests).get(group_name).get(test_name)[index], error);
        __classPrivateFieldGet(this, _a, "f", _UnytTests_test_case_results).get(group_name).get(test_name)[index] = error;
        for (let l of __classPrivateFieldGet(this, _a, "f", _UnytTests_test_case_result_listeners))
            l(group_name, test_name, index, error);
    }
    static successfulTest(group_name, test_name) {
        __classPrivateFieldGet(this, _a, "f", _UnytTests_test_results).get(group_name).set(test_name, UnytTests.SUCCESSFUL);
        for (let l of __classPrivateFieldGet(this, _a, "f", _UnytTests_test_result_listeners))
            l(group_name, test_name, UnytTests.SUCCESSFUL);
    }
    static failedTest(group_name, test_name, error) {
        __classPrivateFieldGet(this, _a, "f", _UnytTests_test_results).get(group_name).set(test_name, error);
        for (let l of __classPrivateFieldGet(this, _a, "f", _UnytTests_test_result_listeners))
            l(group_name, test_name, error);
    }
    static successfulTestGroup(group_name) {
        __classPrivateFieldGet(this, _a, "f", _UnytTests_test_group_results).set(group_name, UnytTests.SUCCESSFUL);
        for (let l of __classPrivateFieldGet(this, _a, "f", _UnytTests_test_group_result_listeners))
            l(group_name, UnytTests.SUCCESSFUL);
    }
    static failedTestGroup(group_name, error) {
        __classPrivateFieldGet(this, _a, "f", _UnytTests_test_group_results).set(group_name, error);
        for (let l of __classPrivateFieldGet(this, _a, "f", _UnytTests_test_group_result_listeners))
            l(group_name, error);
    }
    static onTestCaseResult(listener) {
        __classPrivateFieldGet(this, _a, "f", _UnytTests_test_case_result_listeners).add(listener);
    }
    static onTestResult(listener) {
        __classPrivateFieldGet(this, _a, "f", _UnytTests_test_result_listeners).add(listener);
    }
    static onTestGroupResult(listener) {
        __classPrivateFieldGet(this, _a, "f", _UnytTests_test_group_result_listeners).add(listener);
    }
}
_a = UnytTests;
Object.defineProperty(UnytTests, "SUCCESSFUL", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: Symbol("successful")
});
Object.defineProperty(UnytTests, "UNKNOWN", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: Symbol("unknown")
});
_UnytTests_test_groups = { value: new Map() };
_UnytTests_tests = { value: new Map() };
_UnytTests_test_case_results = { value: new Map() };
_UnytTests_test_results = { value: new Map() };
_UnytTests_test_group_results = { value: new Map() };
_UnytTests_initialized = { value: false };
_UnytTests_test_case_result_listeners = { value: new Set() };
_UnytTests_test_result_listeners = { value: new Set() };
_UnytTests_test_group_result_listeners = { value: new Set() };
globalThis.UnytTests = UnytTests;
