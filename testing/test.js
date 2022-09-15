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
import { handleDecoratorArgs, METADATA } from "./legacy_decorators.js";
console.log("inside test, endpoint = " + process.env.endpoint);
await Datex.Cloud.connectTemporary(f(process.env.endpoint));
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
                TestManager.bindTestCase(group_name, test_case_data[0], test_case_data[1], test_case_data[2]);
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
let TestManager = class TestManager {
    static bindTestGroup(group_name, target) { }
    static bindTestCase(group_name, test_name, params, func) { }
};
__decorate([
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestManager, "bindTestGroup", null);
__decorate([
    remote,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array, Function]),
    __metadata("design:returntype", void 0)
], TestManager, "bindTestCase", null);
TestManager = __decorate([
    scope,
    to(process.env.test_manager ?? Datex.LOCAL_ENDPOINT)
], TestManager);
