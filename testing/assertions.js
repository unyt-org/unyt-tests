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
    });
};
__decorate([
    expose,
    __metadata("design:type", Object)
], Assert, "equals", void 0);
Assert = __decorate([
    scope("asssert")
], Assert);
export { Assert };
