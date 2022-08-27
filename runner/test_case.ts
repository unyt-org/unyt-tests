import { sync, property, constructor } from "../../unyt_core/datex.js";

export enum TEST_CASE_STATE {
	INITIALIZED,
	RUNNING,
	SUCCESSFUL,
	FAILED
}

@sync export class TestCase {

	#func:(...args:any)=>void|Promise<void>

	set func(func:(...args:any)=>void|Promise<void>) {
		this.#func = func;
	}

	@property name:string
	@property state = TEST_CASE_STATE.INITIALIZED;
	@property params:any[][] = []
	@property results:any[] = []

	@property async run(){
		console.log("running test " + this.name);
		this.state = TEST_CASE_STATE.INITIALIZED;

		for (let variation of this.params) {
			try {
				await this.#func(...variation);
			}
			catch (e) {

			}
		}
	}

	constructor(name:string, params:any[][], func:(...args:any)=>void|Promise<void>) {}
	@constructor construct(name:string, params:any[][], func:(...args:any)=>void|Promise<void>) {
		this.name = name;
		this.params = params;
		this.#func = func;
	}
}