var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { f } from "../../unyt_core/datex.js";
import { Datex, remote, scope, to } from "../../unyt_core/datex.js";
import { Disjunction, Logger, LOG_LEVEL } from "../../unyt_core/datex_all.js";
import { handleDecoratorArgs, METADATA } from "./legacy_decorators.js";
Logger.development_log_level = LOG_LEVEL.WARNING;
Logger.production_log_level = LOG_LEVEL.DEFAULT;
const manager_out = new Disjunction();
let ENV = {};
let init_resolve;
const initialized = new Promise(resolve => init_resolve = resolve);
async function init() {
    await Datex.Supranet.connect(ENV.endpoint, undefined, false);
    await TestManager.registerContext(ENV.context);
    init_resolve();
}
async function registerTests(group_name, value) {
    await initialized;
    await TestManager.registerTestGroup(ENV.context, group_name);
    const test_case_promises = [];
    for (let k of Object.getOwnPropertyNames(value)) {
        const test_case_data = value[METADATA]?.[TEST_CASE_DATA]?.public?.[k];
        if (test_case_data)
            test_case_promises.push(TestManager.bindTestCase(ENV.context, group_name, test_case_data[0], test_case_data[1], test_case_data[2]));
    }
    await Promise.all(test_case_promises);
    await TestManager.testGroupLoaded(ENV.context, group_name);
    setTimeout(() => TestManager.contextLoaded(ENV.context), 1000);
}
if (globalThis.self) {
    self.onmessage = async (e) => {
        ENV.endpoint = f(e.data.endpoint);
        ENV.test_manager = f(e.data.test_manager ?? Datex.LOCAL_ENDPOINT);
        manager_out.add(ENV.test_manager);
        ENV.context = new URL(e.data.context);
        init();
    };
}
else if (globalThis.process) {
    ENV.endpoint = f(process.env.endpoint);
    ENV.test_manager = f((process.env.test_manager ?? Datex.LOCAL_ENDPOINT));
    manager_out.add(ENV.test_manager);
    ENV.context = new URL(process.env.context);
    init();
}
else {
    throw new Error("Cannot get environment data for test worker");
}
const TEST_CASE_DATA = Symbol("test_case");
export function Test(...args) { return handleDecoratorArgs(args, _Test); }
function _Test(value, name, kind, is_static, is_private, setMetadata, getMetadata, params = []) {
    if (kind == 'class') {
        if (!(typeof params[0] == "string"))
            params[0] = name;
        const group_name = params[0] ?? name;
        registerTests(group_name, value);
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
let TestManager = class TestManager {
    static registerContext(context) { return null; }
    static contextLoaded(context) { return null; }
    static registerTestGroup(context, group_name) { return null; }
    static testGroupLoaded(context, group_name) { return null; }
    static bindTestCase(context, group_name, test_name, params, func) { return null; }
};
__decorate([
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [URL]),
    __metadata("design:returntype", Promise)
], TestManager, "registerContext", null);
__decorate([
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [URL]),
    __metadata("design:returntype", Promise)
], TestManager, "contextLoaded", null);
__decorate([
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [URL, String]),
    __metadata("design:returntype", Promise)
], TestManager, "registerTestGroup", null);
__decorate([
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [URL, String]),
    __metadata("design:returntype", Promise)
], TestManager, "testGroupLoaded", null);
__decorate([
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [URL, String, String, Array, Function]),
    __metadata("design:returntype", Promise)
], TestManager, "bindTestCase", null);
TestManager = __decorate([
    scope,
    to(manager_out)
], TestManager);
