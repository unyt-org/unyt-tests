if (!Symbol['metadata'])
    Symbol['metadata'] = Symbol('metadata');
export const METADATA = Symbol['metadata'];
const __metadataPrivate = new WeakMap();
const createObjectWithPrototype = (obj, key) => Object.hasOwnProperty.call(obj, key) ? obj[key] : Object.create(obj[key] || Object.prototype);
function getContextKind(args) {
    if (typeof args[0] == "function" && args[1] == null && args[2] == null)
        return 'class';
    if ((typeof args[0] == "function" || typeof args[0] == "object") && (typeof args[2] == "function" || typeof args[2]?.value == "function"))
        return 'method';
    if ((typeof args[0] == "function" || typeof args[0] == "object") && typeof args[1] == "string")
        return 'field';
}
function isContextStatic(args) {
    return typeof args[0] == "function" && args[1] != null;
}
export function handleDecoratorArgs(args, method) {
    let kind = getContextKind(args);
    if (!kind) {
        const params = args;
        return (...args) => {
            let kind = getContextKind(args);
            let is_static = isContextStatic(args);
            let target = args[0];
            let name = kind == 'class' ? args[0].name : args[1];
            let value = kind == 'class' ? args[0] : args[2]?.value;
            let meta_setter = createMetadataSetter(target, name, kind == 'class');
            let meta_getter = createMetadataGetter(target, name, kind == 'class');
            return method(value, name, kind, is_static, false, meta_setter, meta_getter, params);
        };
    }
    else {
        let is_static = isContextStatic(args);
        let target = args[0];
        let name = kind == 'class' ? args[0].name : args[1];
        let value = kind == 'class' ? args[0] : args[2]?.value;
        let meta_setter = createMetadataSetter(target, name, kind == 'class');
        let meta_getter = createMetadataGetter(target, name, kind == 'class');
        return method(value, name, kind, is_static, false, meta_setter, meta_getter);
    }
}
function createMetadataSetter(target, name, is_constructor = false, is_private = false) {
    return (key, value) => {
        if (typeof key !== "symbol") {
            throw new TypeError("the key must be a Symbol");
        }
        target[METADATA] = createObjectWithPrototype(target, METADATA);
        target[METADATA][key] = createObjectWithPrototype(target[METADATA], key);
        target[METADATA][key].public = createObjectWithPrototype(target[METADATA][key], "public");
        if (!Object.hasOwnProperty.call(target[METADATA][key], "private")) {
            Object.defineProperty(target[METADATA][key], "private", {
                get() {
                    return Object.values(__metadataPrivate.get(target[METADATA][key]) || {}).concat(Object.getPrototypeOf(target[METADATA][key])?.private || []);
                }
            });
        }
        if (is_constructor) {
            target[METADATA][key].constructor = value;
        }
        else if (is_private) {
            if (!__metadataPrivate.has(target[METADATA][key])) {
                __metadataPrivate.set(target[METADATA][key], {});
            }
            __metadataPrivate.get(target[METADATA][key])[name] = value;
        }
        else {
            target[METADATA][key].public[name] = value;
        }
    };
}
function createMetadataGetter(target, name, is_constructor = false, is_private = false) {
    return (key) => {
        if (target[METADATA] && target[METADATA][key]) {
            if (is_constructor)
                return target[METADATA][key]["constructor"]?.[name];
            else if (is_private)
                return (__metadataPrivate.has(target[METADATA][key]) ? __metadataPrivate.get(target[METADATA][key])?.[name] : undefined);
            else
                return target[METADATA][key].public?.[name];
        }
    };
}
