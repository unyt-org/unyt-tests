var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { sync, property, constructor, Datex } from "../../unyt_core/datex.js";
import { AssertionError } from "../../unyt_core/datex_all.js";
import { logger } from "../run.js";
import { BOX_WIDTH } from "./constants.js";
export var TEST_CASE_STATE;
(function (TEST_CASE_STATE) {
    TEST_CASE_STATE[TEST_CASE_STATE["INITIALIZED"] = 0] = "INITIALIZED";
    TEST_CASE_STATE[TEST_CASE_STATE["RUNNING"] = 1] = "RUNNING";
    TEST_CASE_STATE[TEST_CASE_STATE["SUCCESSFUL"] = 2] = "SUCCESSFUL";
    TEST_CASE_STATE[TEST_CASE_STATE["FAILED"] = 3] = "FAILED";
})(TEST_CASE_STATE || (TEST_CASE_STATE = {}));
const BOX_DOUBLE = {
    HORIZONTAL: '═',
    VERTICAL: '║',
    TOP_LEFT: '╔',
    TOP_RIGHT: '╗',
    BOTTOM_LEFT: '╚',
    BOTTOM_RIGHT: '╝',
    T_DOWN: '╦',
    T_UP: '╩',
    T_LEFT: '╣',
    T_RIGHT: '╠',
};
const BOX_SINGLE = {
    HORIZONTAL: '─',
    VERTICAL: '│',
    TOP_LEFT: '┌',
    TOP_RIGHT: '┐',
    BOTTOM_LEFT: '└',
    BOTTOM_RIGHT: '┘',
    T_DOWN: '┬',
    T_UP: '┴',
    T_LEFT: '┤',
    T_RIGHT: '├',
};
const NOBOX = {
    HORIZONTAL: '',
    VERTICAL: '',
    TOP_LEFT: '',
    TOP_RIGHT: '',
    BOTTOM_LEFT: '',
    BOTTOM_RIGHT: '',
    T_DOWN: '',
    T_UP: '',
    T_LEFT: '',
    T_RIGHT: '',
};
let TestCase = class TestCase {
    func;
    name;
    state = TEST_CASE_STATE.INITIALIZED;
    params = [];
    results = [];
    duration;
    #finish_resolve;
    #await_finished;
    get formatted_name() {
        if (!this.name.includes(" ")) {
            if (this.name.includes("_"))
                return this.name.replace(/_/g, ' ').trim().toLowerCase();
            else if (/[A-Z]/.test(this.name) && /[a-z]/.test(this.name))
                return this.name.replace(/([A-Z0-9])/g, ' $1').trim().toLowerCase();
            else
                return this.name.toLowerCase();
        }
        else
            return this.name;
    }
    get await_finished() {
        if (this.state == TEST_CASE_STATE.SUCCESSFUL || this.state == TEST_CASE_STATE.FAILED)
            return;
        if (!this.#await_finished) {
            return this.run();
        }
        return this.#await_finished;
    }
    async run() {
        this.#await_finished = new Promise(resolve => this.#finish_resolve = resolve);
        this.state = TEST_CASE_STATE.RUNNING;
        let duration = 0;
        let had_failure = false;
        for (let variation of (this.params.length == 0 ? [[]] : this.params)) {
            logger.debug("running test ?", this.name);
            const t0 = performance.now();
            try {
                await this.func(...variation);
                const t1 = performance.now();
                duration += t1 - t0;
                this.results.push([true, t1 - t0]);
            }
            catch (e) {
                const t1 = performance.now();
                duration += t1 - t0;
                this.results.push([false, t1 - t0, e]);
                had_failure = true;
            }
        }
        this.duration = duration;
        this.state = had_failure ? TEST_CASE_STATE.FAILED : TEST_CASE_STATE.SUCCESSFUL;
        if (this.#finish_resolve)
            this.#finish_resolve();
    }
    constructor(name, params, func) { }
    construct(name, params, func) {
        this.name = name;
        this.reset(params, func);
    }
    reset(params, func) {
        this.params = params;
        this.func = func;
        this.#await_finished = null;
        this.state = TEST_CASE_STATE.INITIALIZED;
    }
};
__decorate([
    property,
    __metadata("design:type", String)
], TestCase.prototype, "name", void 0);
__decorate([
    property,
    __metadata("design:type", Object)
], TestCase.prototype, "state", void 0);
__decorate([
    property,
    __metadata("design:type", Array)
], TestCase.prototype, "params", void 0);
__decorate([
    property,
    __metadata("design:type", Array)
], TestCase.prototype, "results", void 0);
__decorate([
    property,
    __metadata("design:type", Number)
], TestCase.prototype, "duration", void 0);
__decorate([
    property,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestCase.prototype, "run", null);
__decorate([
    constructor,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Function]),
    __metadata("design:returntype", void 0)
], TestCase.prototype, "construct", null);
TestCase = __decorate([
    sync,
    __metadata("design:paramtypes", [String, Array, Function])
], TestCase);
export { TestCase };
let TestGroup = class TestGroup {
    name;
    context;
    test_cases = new Map();
    get state() {
        let has_failed = false, has_running = false, has_initialized = false;
        for (let test of this.test_cases.values()) {
            if (test.state == TEST_CASE_STATE.FAILED)
                has_failed = true;
            else if (test.state == TEST_CASE_STATE.RUNNING)
                has_running = true;
            else if (test.state == TEST_CASE_STATE.INITIALIZED)
                has_initialized = true;
        }
        if (has_initialized)
            return TEST_CASE_STATE.INITIALIZED;
        else if (has_running)
            return TEST_CASE_STATE.RUNNING;
        else if (has_failed)
            return TEST_CASE_STATE.FAILED;
        else
            return TEST_CASE_STATE.SUCCESSFUL;
    }
    get formatted_name() {
        if (!this.name.includes(" ")) {
            if (this.name.includes("_"))
                return this.name.replace(/_/g, ' ').trim();
            else if (/[A-Z]/.test(this.name) && /[a-z]/.test(this.name))
                return this.name.replace(/([A-Z0-9])/g, ' $1').trim();
            else
                return this.name;
        }
        else
            return this.name;
    }
    constructor(name, context) { }
    construc(name, context) {
        this.name = name;
        this.context = context;
    }
    setTestCase(name, params, func) {
        if (this.test_cases.has(name)) {
            logger.debug("update existing test case ?", name);
            let test_case = this.test_cases.get(name);
            test_case.reset(params, func);
            return test_case;
        }
        else {
            logger.debug("new test case ?", name);
            let test_case = new TestCase(name, params, func);
            this.test_cases.set(name, test_case);
            return test_case;
        }
    }
    async run() {
        for (let test of this.test_cases.values())
            test.run();
        await this.finishAllTests();
    }
    finishAllTests() {
        return Promise.all([...this.test_cases.values()].map(test => test.await_finished));
    }
    printReport() {
        const box = BOX_SINGLE;
        const width = BOX_WIDTH;
        const innerWidth = width - 2;
        const rightCellWidth = 7;
        const runtimeWidth = 10;
        const leftCellWidth = innerWidth - rightCellWidth - 12;
        const normalTextWidth = leftCellWidth - runtimeWidth;
        logger.plain("");
        if (this.state == TEST_CASE_STATE.SUCCESSFUL)
            logger.plain `#color(white)${box.TOP_LEFT}${box.HORIZONTAL} [[#bold#color(green) PASS ]]#bold#color(green) ${(this.formatted_name)} #color(white)${box.HORIZONTAL.repeat(innerWidth - this.formatted_name.length - 10)}${box.TOP_RIGHT}`;
        else if (this.state == TEST_CASE_STATE.FAILED)
            logger.plain `#color(white)${box.TOP_LEFT}${box.HORIZONTAL} [[#bold#color(red) FAIL ]]#bold#color(red) ${(this.formatted_name)} #color(white)${box.HORIZONTAL.repeat(innerWidth - this.formatted_name.length - 10)}${box.TOP_RIGHT}`;
        logger.plain `#color(white)${box.VERTICAL}${' '.repeat(innerWidth)}${box.VERTICAL}`;
        logger.plain `#color(white)${box.VERTICAL}   File: #color(grey)${this.context.toString().replace("file://", "").padEnd(innerWidth - 9)}#color(white)${box.VERTICAL}`;
        logger.plain `#color(white)${box.VERTICAL}${' '.repeat(innerWidth)}${box.VERTICAL}`;
        logger.plain `#color(white)${box.T_RIGHT}${box.HORIZONTAL.repeat(leftCellWidth + 8)}${box.T_DOWN}${box.HORIZONTAL.repeat(rightCellWidth + 3)}${box.T_LEFT}`;
        logger.plain `#color(white)${box.VERTICAL}${' '.repeat(leftCellWidth + 8)}${box.VERTICAL}${' '.repeat(rightCellWidth + 3)}${box.VERTICAL}`;
        for (let test of this.test_cases.values()) {
            const dur = `${test.duration.toFixed(2)}ms`;
            let right = 0;
            for (let result of test.results)
                right += Number(result[0]);
            let success_rate = `${right}/${test.results.length}`;
            if (test.state == TEST_CASE_STATE.SUCCESSFUL)
                logger.plain `#color(white)${box.VERTICAL}#color(green)   ✓ ${test.formatted_name.padEnd(normalTextWidth, " ")} #color(13,93,47)${dur.padStart(runtimeWidth, " ")}  ${box.VERTICAL} #color(white)${success_rate.padStart(rightCellWidth, ' ')}  ${box.VERTICAL}`;
            else if (test.state == TEST_CASE_STATE.FAILED) {
                logger.plain `#color(white)${box.VERTICAL}#color(red)   ☓ ${test.formatted_name.padEnd(normalTextWidth, " ")} #color(103,22,38)${dur.padStart(runtimeWidth, " ")}  ${box.VERTICAL} #color(white)${success_rate.padStart(rightCellWidth, ' ')}  ${box.VERTICAL}`;
                for (let result of test.results) {
                    if (result[0] == false) {
                        if (result[2] instanceof AssertionError)
                            logger.plain `#color(white)${box.VERTICAL}#color(103,22,38)       • ${result[2].message.padEnd(leftCellWidth - 1, " ")}#color(white)${box.VERTICAL}${" ".repeat(rightCellWidth + 3)}${box.VERTICAL}`;
                        else
                            logger.plain `#color(white)${box.VERTICAL}#color(103,22,38)       • ${Datex.Runtime.valueToDatexString(result[2], false).padEnd(leftCellWidth - 1, " ")}#color(white)${box.VERTICAL}${" ".repeat(rightCellWidth + 3)}${box.VERTICAL}`;
                    }
                }
            }
        }
        logger.plain `#color(white)${box.VERTICAL}${' '.repeat(leftCellWidth + 8)}${box.VERTICAL}${' '.repeat(rightCellWidth + 3)}${box.VERTICAL}`;
        logger.plain `#color(white)${box.BOTTOM_LEFT}${box.HORIZONTAL.repeat(leftCellWidth + 8)}${box.T_UP}${box.HORIZONTAL.repeat(rightCellWidth + 3)}${box.BOTTOM_RIGHT}`;
    }
};
__decorate([
    property,
    __metadata("design:type", String)
], TestGroup.prototype, "name", void 0);
__decorate([
    property,
    __metadata("design:type", URL)
], TestGroup.prototype, "context", void 0);
__decorate([
    property,
    __metadata("design:type", Map)
], TestGroup.prototype, "test_cases", void 0);
__decorate([
    property,
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], TestGroup.prototype, "state", null);
__decorate([
    constructor,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, URL]),
    __metadata("design:returntype", void 0)
], TestGroup.prototype, "construc", null);
__decorate([
    property,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Function]),
    __metadata("design:returntype", TestCase)
], TestGroup.prototype, "setTestCase", null);
__decorate([
    property,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestGroup.prototype, "run", null);
TestGroup = __decorate([
    sync,
    __metadata("design:paramtypes", [String, URL])
], TestGroup);
export { TestGroup };
