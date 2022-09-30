var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Datex } from "../../unyt_core/datex.js";
import { expose, Logger, LOG_LEVEL, scope } from "../../unyt_core/datex_all.js";
import { logger } from "../run.js";
import { TestCase } from "./test_case.js";
Logger.development_log_level = LOG_LEVEL.WARNING;
Logger.production_log_level = LOG_LEVEL.DEFAULT;
await Datex.Cloud.connect();
const tests = new Map().setAutoDefault(Map);
let TestManager = class TestManager {
    static bindTestGroup(group_name, target) {
        if (!tests.has(group_name)) {
            console.log("new test group", group_name);
            tests.set(group_name, new Map());
        }
    }
    static bindTestCase(group_name, test_name, params, func) {
        if (tests.getAuto(group_name).has(test_name)) {
            console.log("update existing test case", test_name, params);
            tests.get(group_name).get(test_name).func = func;
        }
        else {
            const test_case = new TestCase(test_name, params, func);
            logger.info("new test case: ?", test_name);
            tests.getAuto(group_name).set(test_name, test_case);
            test_case.run();
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
};
__decorate([
    expose,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestManager, "bindTestGroup", null);
__decorate([
    expose,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array, Function]),
    __metadata("design:returntype", void 0)
], TestManager, "bindTestCase", null);
TestManager = __decorate([
    scope
], TestManager);
export { TestManager };
