import { sync, property, constructor } from "../../unyt_core/datex.js";
import { logger } from "../run.js";

export enum TEST_CASE_STATE {
	INITIALIZED,
	RUNNING,
	SUCCESSFUL,
	FAILED
}

@sync export class TestCase {

	func:(...args:any)=>void|Promise<void>

	@property name:string
	@property state = TEST_CASE_STATE.INITIALIZED;
	@property params:any[][] = []
	@property results:any[] = []

	@property async run(){
		logger.debug("running test ?: ?", this.name, this.params);
		this.state = TEST_CASE_STATE.INITIALIZED;

		for (let variation of (this.params.length == 0 ? [[]] : this.params)) {
			try {
				await this.func(...variation);
				logger.success(this.name);
			}
			catch (e) {
				logger.error(this.name+ ": " + e.message);
			}
		}
	}

	constructor(name:string, params:any[][], func:(...args:any)=>void|Promise<void>) {}
	@constructor construct(name:string, params:any[][], func:(...args:any)=>void|Promise<void>) {
		this.name = name;
		this.params = params;
		this.func = func;
	}
}