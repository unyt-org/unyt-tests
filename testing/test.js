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
import { Logger, LOG_LEVEL } from "../../unyt_core/datex_all.js";
import { handleDecoratorArgs, METADATA } from "./legacy_decorators.js";
Logger.development_log_level = LOG_LEVEL.WARNING;
Logger.production_log_level = LOG_LEVEL.DEFAULT;
const VAR_endpoint = globalThis.process ? process.env.endpoint : globalThis.unyt_test.endpoint;
const VAR_test_manager = globalThis.process ? process.env.test_manager : globalThis.unyt_test.test_manager;
const VAR_context = globalThis.process ? process.env.context : globalThis.unyt_test.context;
await Datex.Supranet.init(f(VAR_endpoint));
const TEST_CASE_DATA = Symbol("test_case");
const context = new URL(VAR_context);
const manager = f(VAR_test_manager ?? Datex.LOCAL_ENDPOINT);
export function Test(...args) { return handleDecoratorArgs(args, _Test); }
function _Test(value, name, kind, is_static, is_private, setMetadata, getMetadata, params = []) {
    if (kind == 'class') {
        if (!(typeof params[0] == "string"))
            params[0] = name;
        const group_name = params[0] ?? name;
        (async () => {
            await TestManager.to(manager).registerTestGroup(context, group_name);
            const test_case_promises = [];
            for (let k of Object.getOwnPropertyNames(value)) {
                const test_case_data = value[METADATA]?.[TEST_CASE_DATA]?.public?.[k];
                if (test_case_data)
                    test_case_promises.push(TestManager.to(manager).bindTestCase(context, group_name, test_case_data[0], test_case_data[1], test_case_data[2]));
            }
            await Promise.all(test_case_promises);
            await TestManager.to(manager).testGroupLoaded(context, group_name);
            setTimeout(() => TestManager.to(manager).contextLoaded(context), 1000);
        })();
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
    to(manager)
], TestManager);
await TestManager.to(manager).registerContext(context);
