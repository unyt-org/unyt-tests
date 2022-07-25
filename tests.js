var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UnytTests_1;
import Logger from "../unyt_web/unyt_core/logger.js";
import DatexCloud from "../unyt_web/unyt_core/datex_cloud.js";
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
    }
    else if (kind == 'method') {
        for (let i = 0; i < params.length; i++) {
            if (!(params[i] instanceof Array))
                params[i] = [params[i]];
        }
        setMetadata(META_PARAMS, params.length ? params : UnytTests.NO_PARAMS);
    }
}
let UnytTests = UnytTests_1 = class UnytTests {
    static init() {
        if (this.initialized)
            return;
        this.initialized = true;
        logger.success("initialized");
    }
    static async expose(endpoint) {
        logger.info("exposing tests as " + endpoint);
        await DatexCloud.connectTemporary(f(endpoint));
        UnytTests_1.to(f(endpoint));
    }
    static async local() {
        logger.info("running local tests");
        await DatexCloud.connectAnonymous();
        UnytTests_1.to(Datex.Runtime.endpoint);
        new TestResourceManager;
    }
    static useLocal() {
        logger.info("running local tests");
        UnytTests_1.to(Datex.Runtime.endpoint);
        new TestResourceManager;
    }
    static async remote(endpoint, url) {
        if (url) {
            this.url = url;
            await this.updateIframe();
        }
        logger.info("getting remote tests from " + endpoint);
        await DatexCloud.connectAnonymous();
        UnytTests_1.to(f(endpoint));
        new TestResourceManager;
    }
    static async updateIframe() {
        if (this.iframe)
            this.iframe.remove();
        this.iframe = document.createElement("iframe");
        this.iframe.src = this.url;
        this.iframe.style.position = "absolute";
        this.iframe.style.zIndex = "1000";
        this.iframe.style.visibility = "hidden";
        document.body.appendChild(this.iframe);
        return new Promise(resolve => {
            this.iframe.addEventListener('load', () => setTimeout(resolve, 2000), true);
        });
    }
    static addTestGroup(name, test_group) {
        this.test_groups.set(name, test_group);
        this.test_case_results.set(name, new Map());
        this.test_results.set(name, new Map());
        this.test_group_results.set(name, UnytTests_1.PENDING);
        this.tests.set(name, new Map());
    }
    static addTest(group_name, name, parameters) {
        if (!this.tests.has(group_name))
            this.tests.set(group_name, new Map());
        if (!this.tests.get(group_name).has(name))
            this.tests.get(group_name).set(name, parameters);
        else if (parameters instanceof Array) {
            const test_cases = this.tests.get(group_name).get(name);
            if (test_cases instanceof Array)
                test_cases.push(...parameters);
        }
        if (!this.test_results.get(group_name).has(name))
            this.test_results.get(group_name).set(name, UnytTests_1.PENDING);
        if (!this.test_case_results.get(group_name).has(name))
            this.test_case_results.get(group_name).set(name, Array(parameters instanceof Array ? parameters.length : 1).fill(UnytTests_1.PENDING));
    }
    static getTestsGroups() {
        return this.tests;
    }
    static getTests(group_name) {
        return this.tests.get(group_name);
    }
    static getTestCases(group_name, test_name) {
        return this.tests.get(group_name).get(test_name);
    }
    static getTestResult(group_name, test_name, index) {
        if (group_name != undefined && test_name != undefined && index != undefined)
            return this.test_case_results.get(group_name).get(test_name)[index];
        if (group_name != undefined && test_name != undefined)
            return this.test_results.get(group_name).get(test_name);
        if (group_name != undefined)
            return this.test_group_results.get(group_name);
        return this.all_tests_result;
    }
    static async runAllTests() {
        let promises = [];
        for (let group_name of this.tests.keys())
            promises.push(this.runTests(group_name, false));
        await Promise.all(promises);
        this.updateAllTestGroups();
    }
    static async runTests(group_name, update_recursive_from_buttom = true) {
        let promises = [];
        for (let name of this.tests.get(group_name).keys())
            promises.push(this.runTest(group_name, name, false));
        await Promise.all(promises);
        this.updateAllTests(group_name, update_recursive_from_buttom);
    }
    static async runTest(group_name, test_name, update_recursive_from_buttom = true) {
        let promises = [];
        let index = 0;
        const test_cases = this.tests.get(group_name).get(test_name);
        if (test_cases instanceof Array) {
            for (let parameters of test_cases) {
                promises.push(this.runTestCase(group_name, test_name, parameters, index++, false));
            }
            await Promise.all(promises);
        }
        else
            await this.runTestCase(group_name, test_name, [], 0, false);
        this.updateAllTestCases(group_name, test_name, update_recursive_from_buttom);
    }
    static async runTestCase(group_name, test_name, parameters, index, update_recursive_from_buttom = true) {
        this.pendingTestCase(group_name, test_name, index, update_recursive_from_buttom);
        try {
            await this.test_groups.get(group_name)[test_name](...parameters);
            this.successfulTestCase(group_name, test_name, index, update_recursive_from_buttom);
        }
        catch (error) {
            this.failedTestCase(group_name, test_name, index, error, update_recursive_from_buttom);
        }
    }
    static successfulTestCase(group_name, test_name, index, update_recursive_from_buttom = true) {
        this.test_case_results.get(group_name).get(test_name)[index] = UnytTests_1.SUCCESSFUL;
        logger.success("test case '" + group_name + "." + test_name + "' succeeded with parameters #" + index);
        for (let l of this.test_case_result_listeners)
            l(group_name, test_name, index, UnytTests_1.SUCCESSFUL);
        if (update_recursive_from_buttom)
            this.updateAllTestCases(group_name, test_name);
    }
    static failedTestCase(group_name, test_name, index, error, update_recursive_from_buttom = true) {
        logger.error("test case '" + group_name + "." + test_name + "' failed with parameters #" + index);
        this.test_case_results.get(group_name).get(test_name)[index] = error;
        for (let l of this.test_case_result_listeners)
            l(group_name, test_name, index, error);
        if (update_recursive_from_buttom)
            this.updateAllTestCases(group_name, test_name);
    }
    static pendingTestCase(group_name, test_name, index, update_recursive_from_buttom = true) {
        this.test_case_results.get(group_name).get(test_name)[index] = UnytTests_1.PENDING;
        for (let l of this.test_case_result_listeners)
            l(group_name, test_name, index, UnytTests_1.PENDING);
        if (update_recursive_from_buttom)
            this.updateAllTestCases(group_name, test_name);
    }
    static successfulTest(group_name, test_name, update_recursive_from_buttom = true) {
        this.test_results.get(group_name).set(test_name, UnytTests_1.SUCCESSFUL);
        for (let l of this.test_result_listeners)
            l(group_name, test_name, UnytTests_1.SUCCESSFUL);
        if (update_recursive_from_buttom)
            this.updateAllTests(group_name);
    }
    static failedTest(group_name, test_name, error, update_recursive_from_buttom = true) {
        this.test_results.get(group_name).set(test_name, error);
        for (let l of this.test_result_listeners)
            l(group_name, test_name, error);
        if (update_recursive_from_buttom)
            this.updateAllTests(group_name);
    }
    static pendingTest(group_name, test_name, update_recursive_from_buttom = true) {
        this.test_results.get(group_name).set(test_name, UnytTests_1.PENDING);
        for (let l of this.test_result_listeners)
            l(group_name, test_name, UnytTests_1.PENDING);
        if (update_recursive_from_buttom)
            this.updateAllTests(group_name);
    }
    static successfulTestGroup(group_name, update_recursive_from_buttom = true) {
        this.test_group_results.set(group_name, UnytTests_1.SUCCESSFUL);
        for (let l of this.test_group_result_listeners)
            l(group_name, UnytTests_1.SUCCESSFUL);
        if (update_recursive_from_buttom)
            this.updateAllTestGroups();
    }
    static failedTestGroup(group_name, error, update_recursive_from_buttom = true) {
        this.test_group_results.set(group_name, error);
        for (let l of this.test_group_result_listeners)
            l(group_name, error);
        if (update_recursive_from_buttom)
            this.updateAllTestGroups();
    }
    static pendingTestGroup(group_name, update_recursive_from_buttom = true) {
        this.test_group_results.set(group_name, UnytTests_1.PENDING);
        for (let l of this.test_group_result_listeners)
            l(group_name, UnytTests_1.PENDING);
        if (update_recursive_from_buttom)
            this.updateAllTestGroups();
    }
    static successfulAllTests() {
        this.all_tests_result = UnytTests_1.SUCCESSFUL;
        for (let l of this.all_test_result_listeners)
            l(UnytTests_1.SUCCESSFUL);
    }
    static failedAllTests(error) {
        this.all_tests_result = error;
        for (let l of this.all_test_result_listeners)
            l(error);
    }
    static pendingAllTests() {
        this.all_tests_result = UnytTests_1.PENDING;
        for (let l of this.all_test_result_listeners)
            l(UnytTests_1.PENDING);
    }
    static updateAllTestGroups() {
        for (let result of this.test_group_results.values()) {
            if (result == UnytTests_1.PENDING)
                return this.pendingAllTests();
            if (result != UnytTests_1.SUCCESSFUL)
                return this.failedAllTests(result);
        }
        this.successfulAllTests();
    }
    static updateAllTests(group_name, update_recursive_from_buttom = true) {
        for (let result of this.test_results.get(group_name).values()) {
            if (result == UnytTests_1.PENDING)
                return this.pendingTestGroup(group_name, update_recursive_from_buttom);
            if (result != UnytTests_1.SUCCESSFUL)
                return this.failedTestGroup(group_name, result, update_recursive_from_buttom);
        }
        this.successfulTestGroup(group_name, update_recursive_from_buttom);
    }
    static updateAllTestCases(group_name, test_name, update_recursive_from_buttom = true) {
        for (let result of this.test_case_results.get(group_name).get(test_name)) {
            if (result == UnytTests_1.PENDING)
                return this.pendingTest(group_name, test_name, update_recursive_from_buttom);
            if (result != UnytTests_1.SUCCESSFUL)
                return this.failedTest(group_name, test_name, result, update_recursive_from_buttom);
        }
        this.successfulTest(group_name, test_name, update_recursive_from_buttom);
    }
    static onTestCaseResult(listener) {
        this.test_case_result_listeners.add(listener);
    }
    static onTestResult(listener) {
        this.test_result_listeners.add(listener);
    }
    static onTestGroupResult(listener) {
        this.test_group_result_listeners.add(listener);
    }
    static onAllTestsResult(listener) {
        this.all_test_result_listeners.add(listener);
    }
};
Object.defineProperty(UnytTests, "SUCCESSFUL", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: "successful"
});
Object.defineProperty(UnytTests, "PENDING", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: "pending"
});
Object.defineProperty(UnytTests, "NO_PARAMS", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: "no_params"
});
Object.defineProperty(UnytTests, "test_groups", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
Object.defineProperty(UnytTests, "tests", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
Object.defineProperty(UnytTests, "test_case_results", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
Object.defineProperty(UnytTests, "test_results", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
Object.defineProperty(UnytTests, "test_group_results", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
Object.defineProperty(UnytTests, "initialized", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: false
});
Object.defineProperty(UnytTests, "test_case_result_listeners", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Set()
});
Object.defineProperty(UnytTests, "test_result_listeners", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Set()
});
Object.defineProperty(UnytTests, "test_group_result_listeners", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Set()
});
Object.defineProperty(UnytTests, "all_test_result_listeners", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Set()
});
__decorate([
    expose,
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UnytTests, "getTestsGroups", null);
__decorate([
    expose,
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Map)
], UnytTests, "getTests", null);
__decorate([
    expose,
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Object)
], UnytTests, "getTestCases", null);
__decorate([
    expose,
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", void 0)
], UnytTests, "getTestResult", null);
__decorate([
    expose,
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UnytTests, "runAllTests", null);
__decorate([
    expose,
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UnytTests, "runTests", null);
__decorate([
    expose,
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UnytTests, "runTest", null);
__decorate([
    expose,
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array, Number, Object]),
    __metadata("design:returntype", Promise)
], UnytTests, "runTestCase", null);
__decorate([
    expose,
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], UnytTests, "onTestCaseResult", null);
__decorate([
    expose,
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], UnytTests, "onTestResult", null);
__decorate([
    expose,
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], UnytTests, "onTestGroupResult", null);
__decorate([
    expose,
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], UnytTests, "onAllTestsResult", null);
UnytTests = UnytTests_1 = __decorate([
    root_extension
], UnytTests);
export { UnytTests };
UnytTests.all_tests_result = UnytTests.PENDING;
globalThis.UnytTests = UnytTests;
import Assert from './unytassert/src/Assert.js';
import { Datex, f } from "../unyt_web/unyt_core/datex_runtime.js";
import { expose, remote, root_extension } from "../unyt_web/unyt_core/legacy_decorators.js";
import { TestResourceManager } from "./uix_component.js";
export class TestAssert extends Assert {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "_NAME", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "TestAssert"
        });
    }
    static equals(value1, value2) {
        let error = new Error(`${Datex.Runtime.valueToDatexString(value1)} does not equal ${Datex.Runtime.valueToDatexString(value2)}`);
        return this.check(value1 === value2, error);
    }
    static true(value) {
        let error = new Error(`${Datex.Runtime.valueToDatexString(value)} is not true`);
        return this.check(value, error);
    }
    static async throws(expression) {
        try {
            if (expression instanceof Promise)
                await expression;
            else if (typeof expression == "function")
                await expression();
        }
        catch (e) {
            return true;
        }
        throw Error(`did not throw an error`);
    }
}
