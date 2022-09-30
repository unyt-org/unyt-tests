import { Datex, expose, scope } from "../../unyt_core/datex.js";


@scope("assert") export class Assert {

	@expose static equals = Datex.Assertion.get(null, function (value1:any, value2:any){
		if (value1 == value2) return true;
	})

	@expose static equalsStrict = Datex.Assertion.get(null, function (value1:any, value2:any){
		if (value1 === value2) return true;
	})

	@expose static throws = Datex.Assertion.get(null, function (fun:Function, type?:any){
		try {
			fun()
		}
		catch (e) {
			if (type == null || e instanceof type || (type instanceof Datex.Type && type.matches(e))) return true;
		}
		return false;
	})

	@expose static throwsAsync = Datex.Assertion.get(null, async function (fun:Function, type?:any){
		try {
			await fun()
		}
		catch (e) {
			if (type == null || e instanceof type || (type instanceof Datex.Type && type.matches(e))) return true;
		}
		return false;
	})

}
