import { sync, property, constructor, Datex } from "../../unyt_core/datex.js";
import { AssertionError } from "../../unyt_core/datex_all.js";
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
	@property results:[boolean, number, any?][] = [] // successful, run time, error message

	@property duration:number

	#finish_resolve:Function
	#await_finished:Promise<void>

	get formatted_name(){
		if (!this.name.includes(" ")) {
			// snake case
			if (this.name.includes("_")) return this.name.replace(/_/g, ' ').trim().toLowerCase()
			// is camel case name
			else if (/[A-Z]/.test(this.name) && /[a-z]/.test(this.name)) return this.name.replace(/([A-Z0-9])/g, ' $1').trim().toLowerCase()
			// just make lowercase for consitency
			else return this.name.toLowerCase()
		}
		// already formatted
		else return this.name;
	}
	
	// test is definitely executed after this promise
	get await_finished():Promise<void>{

		// already finished
		if (this.state == TEST_CASE_STATE.SUCCESSFUL || this.state == TEST_CASE_STATE.FAILED) return;

		// not yet running, just await run
		if (!this.#await_finished) {
			return this.run(); 
		}
	
		// already running, promise resolves after run
		return this.#await_finished;
	}

	@property async run(){

		// set up promise
		this.#await_finished = new Promise(resolve=>this.#finish_resolve=resolve)
	
		this.state = TEST_CASE_STATE.RUNNING;
		let duration = 0

		let had_failure = false;

		for (let variation of (this.params.length == 0 ? [[]] : this.params)) {
			logger.debug("running test ?", this.name);
			const t0 = performance.now(); // TODO execution time without DATEX transmission duration?

			try {
				await this.func(...variation);
				const t1 = performance.now();
				duration += t1 - t0
				this.results.push([true, t1 - t0]);
			}
			catch (e) {
				const t1 = performance.now();
				duration += t1 - t0
				this.results.push([false, t1 - t0, e]);
				had_failure = true;
			}
		}

		this.duration = duration;

		// update state
		this.state = had_failure ? TEST_CASE_STATE.FAILED : TEST_CASE_STATE.SUCCESSFUL;

		// resolve finish promise
		if (this.#finish_resolve) this.#finish_resolve();
	}

	constructor(name:string, params:any[][], func:(...args:any)=>void|Promise<void>) {}
	@constructor construct(name:string, params:any[][], func:(...args:any)=>void|Promise<void>) {
		this.name = name;
		this.reset(params, func)
	}

	reset(params:any[][], func:(...args:any)=>void|Promise<void>) {
		this.params = params;
		this.func = func;
		this.#await_finished = null;
		this.state = TEST_CASE_STATE.INITIALIZED;
	}
}



@sync export class TestGroup {

	@property name: string
	@property context: URL
	@property test_cases:Map<string,TestCase> = new Map()

	@property get state() {
		let has_failed = false,
			has_running = false,
			has_initialized = false;

		for (let test of this.test_cases.values()) {
			if (test.state == TEST_CASE_STATE.FAILED) has_failed = true;
			else if (test.state == TEST_CASE_STATE.RUNNING) has_running = true;
			else if (test.state == TEST_CASE_STATE.INITIALIZED) has_initialized = true;
		}

		if (has_initialized) return TEST_CASE_STATE.INITIALIZED;
		else if (has_running) return TEST_CASE_STATE.RUNNING;
		else if (has_failed) return TEST_CASE_STATE.FAILED;
		else return TEST_CASE_STATE.SUCCESSFUL;
	}

	get formatted_name(){
		if (!this.name.includes(" ")) {
			// snake case
			if (this.name.includes("_")) return this.name.replace(/_/g, ' ').trim()
			// is camel case name
			else if (/[A-Z]/.test(this.name) && /[a-z]/.test(this.name)) return this.name.replace(/([A-Z0-9])/g, ' $1').trim()
			else return this.name
		}
		// already formatted
		else return this.name;
	}


	constructor(name:string, context:URL){}
	@constructor construc(name:string, context:URL){
		this.name = name;
		this.context = context;
	}


	@property setTestCase(name: string, params: any[][], func: (...args: any) => void | Promise<void>):TestCase {

		// test case already exists

		if (this.test_cases.has(name)) {
            logger.debug("update existing test case ?",name);
			let test_case = this.test_cases.get(name);
            test_case.reset(params, func);
			return test_case;
        }
        // create new test case
        else {
			logger.debug("new test case ?",name);
			let test_case = new TestCase(name, params, func);
            this.test_cases.set(name, test_case)
            return test_case;
        }

	}

	@property async run(){
        for (let test of this.test_cases.values()) test.run();
		await this.finishAllTests();
    }


	finishAllTests():Promise<void[]> {
		return Promise.all([...this.test_cases.values()].map(test=>test.await_finished))
	}

	printReport(){

		const width = 85;
		const innerWidth = width-2;
		const rightCellWidth = 7;
		const runtimeWidth = 10
		const leftCellWidth = innerWidth-rightCellWidth-12;
		const normalTextWidth = leftCellWidth-runtimeWidth;

		logger.plain("")

		// group name
		if (this.state  == TEST_CASE_STATE.SUCCESSFUL) logger.plain `#color(white)╔═ [[#bold#color(green) SUCCESS ]]#bold#color(green) ${(this.formatted_name)} #color(white)${"═".repeat(innerWidth-this.formatted_name.length-13)}╗`
		else if (this.state  == TEST_CASE_STATE.FAILED) logger.plain  `#color(white)╔═ [[#bold#color(red) FAILURE ]]#bold#color(red) ${(this.formatted_name)} #color(white)${"═".repeat(innerWidth-this.formatted_name.length-13)}╗`
		
		// top box with file name
		logger.plain `#color(white)║${' '.repeat(innerWidth)}║`
		logger.plain `#color(white)║   File: #color(grey)${this.context.toString().replace("file://","").padEnd(innerWidth-9)}#color(white)║`
		logger.plain `#color(white)║${' '.repeat(innerWidth)}║`
		logger.plain `#color(white)╠${'═'.repeat(leftCellWidth+8)}╦${'═'.repeat(rightCellWidth+3)}╣`
		logger.plain `#color(white)║${' '.repeat(leftCellWidth+8)}║${' '.repeat(rightCellWidth+3)}║`

		// test cases
		for (let test of this.test_cases.values()) {
			const dur = `${test.duration.toFixed(2)}ms`;

			let right = 0;
			for (let result of test.results) right += Number(result[0]);
			let success_rate = `${right}/${test.results.length}`;

			if (test.state == TEST_CASE_STATE.SUCCESSFUL) logger.plain `#color(white)║#color(green)   ✓ ${test.formatted_name.padEnd(normalTextWidth, " ")} #color(13,93,47)${dur.padStart(runtimeWidth, " ")}  ║ #color(white)${success_rate.padStart(rightCellWidth, ' ')}  ║`
			else if (test.state == TEST_CASE_STATE.FAILED) {
			
				logger.plain  `#color(white)║#color(red)   ☓ ${test.formatted_name.padEnd(normalTextWidth, " ")} #color(103,22,38)${dur.padStart(runtimeWidth, " ")}  ║ #color(white)${success_rate.padStart(rightCellWidth, ' ')}  ║`
				for (let result of test.results) {
					if (result[0] == false) {
						if (result[2] instanceof AssertionError) logger.plain  `#color(white)║#color(103,22,38)       • ${result[2].message.padEnd(leftCellWidth-1, " ")}#color(white)║${" ".repeat(rightCellWidth+3)}║`
						else logger.plain  `#color(white)║#color(103,22,38)       • ${Datex.Runtime.valueToDatexString(result[2],false).padEnd(leftCellWidth-1, " ")}#color(white)║${" ".repeat(rightCellWidth+3)}║`
					}
				}
			}
		}

		logger.plain `#color(white)║${' '.repeat(leftCellWidth+8)}║${' '.repeat(rightCellWidth+3)}║`
		logger.plain `#color(white)╚${'═'.repeat(leftCellWidth+8)}╩${'═'.repeat(rightCellWidth+3)}╝`
		logger.plain('');

	}

}