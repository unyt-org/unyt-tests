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
import { logger } from "./utils.js";
import { TestGroup, TEST_CASE_STATE } from "./test_case.js";
Logger.production_log_level = LOG_LEVEL.DEFAULT;
const tests = new Map();
let TestManager = class TestManager {
    static RUN_TESTS_IMMEDIATELY = false;
    static async init() {
        await Datex.Supranet.connect(undefined, undefined, false);
    }
    static async connect() {
        await Datex.Supranet.connect(undefined, undefined, false);
    }
    static printReportAndExit(contexts) {
        let successful = this.printReport(contexts);
        if (globalThis.process) {
            if (successful)
                process.exit();
            else
                process.exit(1);
        }
    }
    static printReport(contexts) {
        let successful = true;
        for (let context of contexts) {
            for (let group of tests.get(context.toString()).values()) {
                group.printReport();
                if (group.state != TEST_CASE_STATE.SUCCESSFUL)
                    successful = false;
            }
        }
        return successful;
    }
    static getGroupsForContext(context) {
        return tests.get(context.toString()).values();
    }
    static async finishContexts(contexts) {
        return Promise.all(contexts.map(context => this.finishContext(context)));
    }
    static async finishContext(context) {
        await this.waitForContextLoad(context);
        logger.debug("finished context " + context);
        for (let group of tests.get(context.toString()).values()) {
            await group.finishAllTests();
        }
    }
    static context_promises = new Map();
    static context_resolves = new Map();
    static waitForContextLoad(context) {
        let context_string = context.toString();
        if (this.context_promises.has(context_string))
            return this.context_promises.get(context_string);
        else {
            const promise = new Promise(resolve => this.context_resolves.set(context_string, resolve));
            this.context_promises.set(context_string, promise);
            return promise;
        }
    }
    static registerContext(context) {
        logger.debug("registered context: " + context);
        tests.set(context.toString(), new Map());
    }
    static registerTestGroup(context, group_name) {
        if (!tests.has(context.toString()))
            tests.set(context.toString(), new Map());
        logger.debug("new test group ? ?", group_name, context);
        tests.get(context.toString()).set(group_name, new TestGroup(group_name, context));
    }
    static async testGroupLoaded(context, group_name) {
    }
    static async contextLoaded(context) {
        let context_string = context.toString();
        logger.debug("context loaded: " + context_string);
        if (this.context_resolves.has(context_string)) {
            this.context_resolves.get(context_string)();
            this.context_resolves.delete(context_string);
        }
    }
    static bindTestCase(context, group_name, test_name, params, func) {
        let context_string = context.toString();
        if (!tests.has(context_string)) {
            logger.error("trying to bind test case to unknown context " + context);
            return;
        }
        else if (!tests.get(context_string).has(group_name)) {
            logger.error("trying to bind test case to unknown test group " + group_name);
            return;
        }
        else {
            const test_case = tests.get(context_string).get(group_name).setTestCase(test_name, params, func);
            if (this.RUN_TESTS_IMMEDIATELY)
                test_case.run();
        }
    }
};
__decorate([
    expose,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [URL]),
    __metadata("design:returntype", void 0)
], TestManager, "registerContext", null);
__decorate([
    expose,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [URL, String]),
    __metadata("design:returntype", void 0)
], TestManager, "registerTestGroup", null);
__decorate([
    expose,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [URL, String]),
    __metadata("design:returntype", Promise)
], TestManager, "testGroupLoaded", null);
__decorate([
    expose,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [URL]),
    __metadata("design:returntype", Promise)
], TestManager, "contextLoaded", null);
__decorate([
    expose,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [URL, String, String, Array, Function]),
    __metadata("design:returntype", void 0)
], TestManager, "bindTestCase", null);
TestManager = __decorate([
    scope
], TestManager);
export { TestManager };
