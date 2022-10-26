import { Datex, expose, scope } from "../../unyt_core/datex.js";


@scope("assert") export class Assert {

	@expose static equals = Datex.Assertion.get(null, function (value1:any, value2:any){
		if (value1 == value2) return true;
		return `${Datex.Runtime.valueToDatexString(value1)} does not equal ${Datex.Runtime.valueToDatexString(value2)}`;
	}, false /* is sync function*/)

	@expose static equalsStrict = Datex.Assertion.get(null, function (value1:any, value2:any){
		if (value1 === value2) return true;
		return `${Datex.Runtime.valueToDatexString(value1)} does not strictly equal ${Datex.Runtime.valueToDatexString(value2)}`;
	}, false /* is sync function*/)

	@expose static true = Datex.Assertion.get(null, function (value:any) {
		if (value === true) return true;
		return `${Datex.Runtime.valueToDatexString(value)} is not true`;
	}, false /* is sync function*/)

	@expose static false = Datex.Assertion.get(null, function (value:any){
		if (value === false) return true;
		return `${Datex.Runtime.valueToDatexString(value)} is not false`;
	}, false /* is sync function*/)

	@expose static hasProperty = Datex.Assertion.get(null, function (value:any, key:any){
		if (key in value) return true;
		return `${Datex.Runtime.valueToDatexString(value)} does not have property ${Datex.Runtime.valueToDatexString(key)}`;
	}, false /* is sync function*/)

	
	
	@expose static throws = Datex.Assertion.get(null, function (fun:Function, type?:any){
		try {
			fun()
		}
		catch (e) {
			if (type == null || e instanceof type || (type instanceof Datex.Type && type.matches(e))) return true;
		}
		return `Did not throw`;
	}, false /* is sync function*/)


	@expose static throwsAsync = Datex.Assertion.get(null, async function (fun:Function, type?:any){
		try {
			await fun()
		}
		catch (e) {
			if (type == null || e instanceof type || (type instanceof Datex.Type && type.matches(e))) return true;
		}
		return `Did not throw`;
	})

	@expose static sameValueAsync = Datex.Assertion.get(null, async function (value1:any, value2:any){
		if (await Datex.Runtime.equalValues(value1, value2)) return true;
		return `${Datex.Runtime.valueToDatexString(value1)} is not the same value as ${Datex.Runtime.valueToDatexString(value2)}`;
	})

}
