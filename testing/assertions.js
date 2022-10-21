var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Datex, expose, scope } from "../../unyt_core/datex.js";
let Assert = class Assert {
    static equals = Datex.Assertion.get(null, function (value1, value2) {
        if (value1 == value2)
            return true;
        return `${Datex.Runtime.valueToDatexString(value1)} does not equal ${Datex.Runtime.valueToDatexString(value2)}`;
    }, false);
    static equalsStrict = Datex.Assertion.get(null, function (value1, value2) {
        if (value1 === value2)
            return true;
        return `${Datex.Runtime.valueToDatexString(value1)} does not strictly equal ${Datex.Runtime.valueToDatexString(value2)}`;
    }, false);
    static true = Datex.Assertion.get(null, function (value) {
        if (value === true)
            return true;
        return `${Datex.Runtime.valueToDatexString(value)} is not true`;
    }, false);
    static false = Datex.Assertion.get(null, function (value) {
        if (value === false)
            return true;
        return `${Datex.Runtime.valueToDatexString(value)} is not false`;
    }, false);
    static throws = Datex.Assertion.get(null, function (fun, type) {
        try {
            fun();
        }
        catch (e) {
            if (type == null || e instanceof type || (type instanceof Datex.Type && type.matches(e)))
                return true;
        }
        return `Did not throw`;
    }, false);
    static throwsAsync = Datex.Assertion.get(null, async function (fun, type) {
        try {
            await fun();
        }
        catch (e) {
            if (type == null || e instanceof type || (type instanceof Datex.Type && type.matches(e)))
                return true;
        }
        return `Did not throw`;
    });
    static sameValueAsync = Datex.Assertion.get(null, async function (value1, value2) {
        if (await Datex.Runtime.equalValues(value1, value2))
            return true;
        return `${Datex.Runtime.valueToDatexString(value1)} is not the same value as ${Datex.Runtime.valueToDatexString(value2)}`;
    });
};
__decorate([
    expose,
    __metadata("design:type", Object)
], Assert, "equals", void 0);
__decorate([
    expose,
    __metadata("design:type", Object)
], Assert, "equalsStrict", void 0);
__decorate([
    expose,
    __metadata("design:type", Object)
], Assert, "true", void 0);
__decorate([
    expose,
    __metadata("design:type", Object)
], Assert, "false", void 0);
__decorate([
    expose,
    __metadata("design:type", Object)
], Assert, "throws", void 0);
__decorate([
    expose,
    __metadata("design:type", Object)
], Assert, "throwsAsync", void 0);
__decorate([
    expose,
    __metadata("design:type", Object)
], Assert, "sameValueAsync", void 0);
Assert = __decorate([
    scope("assert")
], Assert);
export { Assert };
