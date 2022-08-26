import { eternal } from "../unyt_core/datex.js";
import { handleDecoratorArgs, METADATA } from "./legacy_decorators.js";
const tests = (await eternal((Map))).setAutoDefault(Set);
export function Test(...args) { return handleDecoratorArgs(args, _Test); }
function _Test(value, name, kind, is_static, is_private, setMetadata, getMetadata, params = []) {
    if (kind == 'class') {
        if (!(typeof params[0] == "string"))
            params[0] = name;
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
