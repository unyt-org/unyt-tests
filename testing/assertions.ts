import { Datex, expose, scope } from "unyt_core";


@scope("assert") export class Assert {

	@expose static equals = Datex.Assertion.get(undefined, function (value1:any, value2:any){
		if (value1 == value2) return true;
		return `${Datex.Runtime.valueToDatexString(value1)} does not equal ${Datex.Runtime.valueToDatexString(value2)}`;
	}, false /* is sync function*/)

	@expose static equalsStrict = Datex.Assertion.get(undefined, function (value1:any, value2:any){
		if (value1 === value2) return true;
		return `${Datex.Runtime.valueToDatexString(value1)} does not strictly equal ${Datex.Runtime.valueToDatexString(value2)}`;
	}, false /* is sync function*/)

	@expose static true = Datex.Assertion.get(undefined, function (value:any) {
		if (value === true) return true;
		return `evaluation is ${Datex.Runtime.valueToDatexString(value)} expected true`;
	}, false /* is sync function*/)

	@expose static false = Datex.Assertion.get(undefined, function (value:any){
		if (value === false) return true;
		return `evaluation is ${Datex.Runtime.valueToDatexString(value)} expected false`;
	}, false /* is sync function*/)

	@expose static hasProperty = Datex.Assertion.get(undefined, function (value:any, key:any){
		if (key in value) return true;
		return `${Datex.Runtime.valueToDatexString(value)} does not have property ${Datex.Runtime.valueToDatexString(key)}`;
	}, false /* is sync function*/)

	
	
	@expose static throws = Datex.Assertion.get(undefined, function (fun:Function, type?:any){
		try {
			fun()
		}
		catch (e) {
			if (type == null || e instanceof type || (type instanceof Datex.Type && type.matches(e))) return true;
		}
		return `Did not throw`;
	}, false /* is sync function*/)


	@expose static throwsAsync = Datex.Assertion.get(undefined, async function (fun:Function, type?:any){
		try {
			await fun()
		}
		catch (e) {
			if (type == null || e instanceof type || (type instanceof Datex.Type && type.matches(e))) return true;
		}
		return `Did not throw`;
	})

	@expose static sameValueAsync = Datex.Assertion.get(undefined, async function (value1:any, value2:any){
		if (await Datex.Runtime.equalValues(value1, value2)) return true;
		return `${Datex.Runtime.valueToDatexString(value1)} is not the same value as ${Datex.Runtime.valueToDatexString(value2)}`;
	})

}
