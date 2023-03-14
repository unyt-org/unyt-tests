/**
 ╔══════════════════════════════════════════════════════════════════════════════════════╗
 ║  Typescript Legacy Decorators implementation to simulate new JS decorators            ║
 ║  - Use until the JS decorator proposal (TC39 Stage 2) is fully implemented           ║
 ╠══════════════════════════════════════════════════════════════════════════════════════╣
 ╠═════════════════════════════════════════╦════════════════════════════════════════════╣
 ║  © 2022 Jonas & Benedikt Strehle        ║                                            ║
 ╚═════════════════════════════════════════╩════════════════════════════════════════════╝
 */


type decorator_target = {[key: string]: any} & Partial<Record<any, never>> & Partial<Record<keyof Array<any>, never>>;
type decorator_target_optional_params = decorator_target | Function; // only working for static methods!

// @ts-ignore
if (!Symbol['metadata']) Symbol['metadata'] = Symbol('metadata');
// @ts-ignore
export const METADATA:symbol = Symbol['metadata'];

const __metadataPrivate = new WeakMap();
// @ts-ignore
const createObjectWithPrototype = (obj:object, key:any) => Object.hasOwnProperty.call(obj, key) ? obj[key] : Object.create(obj[key] || Object.prototype);


// get context kind (currently only supports class, method, field)
function getContextKind(args:any[]) {
    if (typeof args[0] == "function" && args[1] == null && args[2] == null) return 'class';
    if ((typeof args[0] == "function" || typeof args[0] == "object") && (typeof args[2] == "function" || typeof args[2]?.value == "function")) return 'method';
    if ((typeof args[0] == "function" || typeof args[0] == "object") && typeof args[1] == "string") return 'field';
}
// is context static field/method?
function isContextStatic(args:any[]):boolean {
    return typeof args[0] == "function" && args[1] != null;
}


// add optional arguments, then call JS Interface decorator handler
export function handleDecoratorArgs(args:any[], method:(value:any, name:any, kind:any, is_static:boolean, is_private:boolean, setMetadata:any, getMetadata:any, params?:any[]) => any):(_invalid_param_0_: decorator_target_optional_params, _invalid_param_1_?: string, _invalid_param_2_?: PropertyDescriptor) => any {
    
    let kind = getContextKind(args);
    // is @decorator(x,y,z)
    if (!kind) { 
        // inject args as decorator params
        const params = args; // x,y,z
        return (...args:any[]) => {
            let kind = getContextKind(args);
            // same as below (in else), + params
            let is_static = isContextStatic(args);
            let target = args[0];
            let name = kind == 'class' ? args[0].name : args[1];
            let value = kind == 'class' ? args[0] : args[2]?.value;
            let meta_setter = createMetadataSetter(target, name, kind == 'class');
            let meta_getter = createMetadataGetter(target, name, kind == 'class');
            //console.log("@"+method.name + " name: " + name + ", kind: " + kind + ", is_static:" + is_static + ", params:", params, value)
            return method(value, name, kind, is_static, false, meta_setter, meta_getter, params);
        }
    }
    // is direct @decorator
    else {
        let is_static = isContextStatic(args);
        let target = args[0];
        let name = kind == 'class' ? args[0].name : args[1];
        let value = kind == 'class' ? args[0] : args[2]?.value;
        let meta_setter = createMetadataSetter(target, name, kind == 'class');
        let meta_getter = createMetadataGetter(target, name, kind == 'class');
        //console.log("@"+method.name + " name: " + name + ", kind: " + kind + ", is_static:" + is_static, value)
        return method(value, name, kind, is_static, false, meta_setter, meta_getter);
    }
}

function createMetadataSetter(target:Function, name:string, is_constructor = false, is_private=false) {
    return (key:symbol, value:unknown)=>{
        if (typeof key !== "symbol") {
            throw new TypeError("the key must be a Symbol");
        }

        // @ts-ignore
        target[METADATA] = createObjectWithPrototype(target, METADATA);
        // @ts-ignore
        target[METADATA][key] = createObjectWithPrototype(target[METADATA], key);
        // @ts-ignore
        target[METADATA][key].public = createObjectWithPrototype(target[METADATA][key], "public");
        
        // @ts-ignore
        if (!Object.hasOwnProperty.call(target[METADATA][key], "private")) {
            // @ts-ignore
            Object.defineProperty(target[METADATA][key], "private", {
                get() {
                    // @ts-ignore
                    return Object.values(__metadataPrivate.get(target[METADATA][key]) || {}).concat(Object.getPrototypeOf(target[METADATA][key])?.private || []);
                }
            });
        }
        // constructor
        if (is_constructor) {
            // @ts-ignore
            target[METADATA][key].constructor = value;
        } 
        // private
        else if (is_private) {
            // @ts-ignore
            if (!__metadataPrivate.has(target[METADATA][key])) {
                // @ts-ignore
                __metadataPrivate.set(target[METADATA][key], {});
            }
            // @ts-ignore
            __metadataPrivate.get(target[METADATA][key])[name] = value;
        } 
        // public
        else {
            // @ts-ignore
            target[METADATA][key].public[name] = value;
        } 
    }
}
function createMetadataGetter(target:Function, name:string, is_constructor = false, is_private=false) {
    return (key:symbol) => {
        // @ts-ignore
        if (target[METADATA] && target[METADATA][key]) {
            // @ts-ignore
            if (is_constructor) return target[METADATA][key]["constructor"]?.[name];
            // @ts-ignore
            else if (is_private) return (__metadataPrivate.has(target[METADATA][key]) ? __metadataPrivate.get(target[METADATA][key])?.[name] : undefined)  
            // @ts-ignore
            else return target[METADATA][key].public?.[name] 
        }
    }
}


// decorator types
export type context_kind = 'class'|'method'|'getter'|'setter'|'field'|'auto-accessor';
export type context_name = string|symbol|undefined;
export type context_meta_setter = (key:symbol, value:any) => void
export type context_meta_getter = (key:symbol ) => any