var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { sync, property, constructor } from "../../unyt_core/datex.js";
import { logger } from "../run.js";
export var TEST_CASE_STATE;
(function (TEST_CASE_STATE) {
    TEST_CASE_STATE[TEST_CASE_STATE["INITIALIZED"] = 0] = "INITIALIZED";
    TEST_CASE_STATE[TEST_CASE_STATE["RUNNING"] = 1] = "RUNNING";
    TEST_CASE_STATE[TEST_CASE_STATE["SUCCESSFUL"] = 2] = "SUCCESSFUL";
    TEST_CASE_STATE[TEST_CASE_STATE["FAILED"] = 3] = "FAILED";
})(TEST_CASE_STATE || (TEST_CASE_STATE = {}));
let TestCase = class TestCase {
    func;
    name;
    state = TEST_CASE_STATE.INITIALIZED;
    params = [];
    results = [];
    async run() {
        logger.debug("running test ?: ?", this.name, this.params);
        this.state = TEST_CASE_STATE.INITIALIZED;
        for (let variation of (this.params.length == 0 ? [[]] : this.params)) {
            try {
                await this.func(...variation);
                logger.success(this.name);
            }
            catch (e) {
                logger.error(this.name + ": " + e.message);
            }
        }
    }
    constructor(name, params, func) { }
    construct(name, params, func) {
        this.name = name;
        this.params = params;
        this.func = func;
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
