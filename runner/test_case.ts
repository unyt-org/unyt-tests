import { sync, property, constructor, Datex } from "../../unyt_core/datex.js";
import { AssertionError } from "../../unyt_core/datex_all.js";
import { logger } from "./utils.js";
import { BOX_WIDTH } from "./constants.js";

export enum TEST_CASE_STATE {
	INITIALIZED,
	RUNNING,
	SUCCESSFUL,
	FAILED
}

const BOX_DOUBLE = {
	HORIZONTAL: '═',
	VERTICAL: '║',
	TOP_LEFT: '╔',
	TOP_RIGHT: '╗',
	BOTTOM_LEFT: '╚',
	BOTTOM_RIGHT: '╝',
	T_DOWN: '╦',
	T_UP: '╩',
	T_LEFT: '╣',
	T_RIGHT: '╠',
}


const BOX_SINGLE = {
	HORIZONTAL: '─',
	VERTICAL: '│',
	TOP_LEFT: '┌',
	TOP_RIGHT: '┐',
	BOTTOM_LEFT: '└',
	BOTTOM_RIGHT: '┘',
	T_DOWN: '┬',
	T_UP: '┴',
	T_LEFT: '┤',
	T_RIGHT: '├',
}

const NOBOX = {
	HORIZONTAL: '',
	VERTICAL: '',
	TOP_LEFT: '',
	TOP_RIGHT: '',
	BOTTOM_LEFT: '',
	BOTTOM_RIGHT: '',
	T_DOWN: '',
	T_UP: '',
	T_LEFT: '',
	T_RIGHT: '',
}

@sync export class TestCase {

	func:(...args:any)=>void|Promise<void>

	@property name:string
	@property state = TEST_CASE_STATE.INITIALIZED;
	@property params:any[][] = []
	@property results:[boolean, number, any?][] = [] // successful, run time, error message

	@property tests_count = 0;
	@property failed_tests = 0;

	@property duration:number

	#finish_resolve:Function
	#await_finished:Promise<void>

	get formatted_name(){
		if (!this.name.includes(" ")) {
			// snake case
			if (this.name.includes("_")) return this.name.replace(/_/g, ' ').trim().toLowerCase()
			// is camel case name
			else if (/[A-Z]/.test(this.name) && /[a-z]/.test(this.name)) return this.name.replace(/([^A-Z0-9])([A-Z0-9])/g, '$1 $2').replace(/([A-Z0-9])([A-Z0-9])([^A-Z0-9])/g, '$1 $2$3').trim().toLowerCase()
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
		this.failed_tests = 0;
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
				this.failed_tests ++;
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
		this.tests_count = this.params.length == 0 ? 1 : this.params.length;
		this.failed_tests = 0;
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


	get duration() {
		let duration = 0;
		for (let test of this.test_cases.values()) duration += test.duration;
		return duration;
	}

	// total number of failures (can be multiple for each test case)
	get failed_tests() {
		let failed_tests = 0;
		for (let test of this.test_cases.values()) failed_tests += test.failed_tests;
		return failed_tests;
	}

	// total number of tests (can be more than number of test cases)
	get test_count() {
		let count = 0;
		for (let test of this.test_cases.values()) count += test.tests_count;
		return count;
	}

	get formatted_name(){
		if (!this.name.includes(" ")) {
			// snake case
			if (this.name.includes("_")) return this.name.replace(/_/g, ' ').trim()
			// is camel case name
			else if (/[A-Z]/.test(this.name) && /[a-z]/.test(this.name)) return this.name.replace(/([^A-Z0-9])([A-Z0-9])/g, '$1 $2').replace(/([A-Z0-9])([A-Z0-9])([^A-Z0-9])/g, '$1 $2$3').trim()
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
			// set big timeout (actual timeout is handled on test endpoint)
			if (func instanceof Datex.Function) func.datex_timeout = 10*60*1000; // 10min 
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

	#trimText(text:string, max_length:number) {
		if (text.length <= max_length) return text.padEnd(max_length, " ");
		else return (text.slice(0, max_length-3) + "...").padEnd(max_length, " ");
	}


	printReport(){

		const box = BOX_SINGLE;

		const width = BOX_WIDTH;
		const innerWidth = width-2;
		const rightCellWidth = 7;
		const runtimeWidth = 10
		const leftCellWidth = innerWidth-rightCellWidth-12;
		const normalTextWidth = leftCellWidth-runtimeWidth;

		logger.plain("")

		// group name
		if (this.state  == TEST_CASE_STATE.SUCCESSFUL) logger.plain `#color(white)${box.TOP_LEFT}${box.HORIZONTAL} [[#bold#color(green) PASS ]]#bold#color(green) ${(this.formatted_name)} #color(white)${box.HORIZONTAL.repeat(innerWidth-this.formatted_name.length-10)}${box.TOP_RIGHT}`
		else if (this.state  == TEST_CASE_STATE.FAILED) logger.plain  `#color(white)${box.TOP_LEFT}${box.HORIZONTAL} [[#bold#color(red) FAIL ]]#bold#color(red) ${(this.formatted_name)} #color(white)${box.HORIZONTAL.repeat(innerWidth-this.formatted_name.length-10)}${box.TOP_RIGHT}`
		
		// top box with file name
		logger.plain `#color(white)${box.VERTICAL}${' '.repeat(innerWidth)}${box.VERTICAL}`
		logger.plain `#color(white)${box.VERTICAL}   File: #color(grey)${this.context.toString().replace("file://","").padEnd(innerWidth-9)}#color(white)${box.VERTICAL}`
		logger.plain `#color(white)${box.VERTICAL}${' '.repeat(innerWidth)}${box.VERTICAL}`
		logger.plain `#color(white)${box.T_RIGHT}${box.HORIZONTAL.repeat(leftCellWidth+8)}${box.T_DOWN}${box.HORIZONTAL.repeat(rightCellWidth+3)}${box.T_LEFT}`
		logger.plain `#color(white)${box.VERTICAL}${' '.repeat(leftCellWidth+8)}${box.VERTICAL}${' '.repeat(rightCellWidth+3)}${box.VERTICAL}`

		// test cases
		for (let test of this.test_cases.values()) {
			const dur = `${test.duration.toFixed(2)}ms`;

			let right = 0;
			for (let result of test.results) right += Number(result[0]);
			let success_rate = `${right}/${test.results.length}`;

			if (test.state == TEST_CASE_STATE.SUCCESSFUL) logger.plain `#color(white)${box.VERTICAL}#color(green)   ✓ ${test.formatted_name.padEnd(normalTextWidth, " ")} #color(13,93,47)${dur.padStart(runtimeWidth, " ")}  ${box.VERTICAL} #color(white)${success_rate.padStart(rightCellWidth, ' ')}  ${box.VERTICAL}`
			else if (test.state == TEST_CASE_STATE.FAILED) {
			
				logger.plain  `#color(white)${box.VERTICAL}#color(red)   ☓ ${test.formatted_name.padEnd(normalTextWidth, " ")} #color(103,22,38)${dur.padStart(runtimeWidth, " ")}  ${box.VERTICAL} #color(white)${success_rate.padStart(rightCellWidth, ' ')}  ${box.VERTICAL}`
				for (let result of test.results) {
					if (result[0] == false) {
						if (result[2] instanceof AssertionError) logger.plain  `#color(white)${box.VERTICAL}#color(103,22,38)       • ${this.#trimText(result[2].message, leftCellWidth-1)}#color(white)${box.VERTICAL}${" ".repeat(rightCellWidth+3)}${box.VERTICAL}`
						else if (result[2] instanceof Error) logger.plain  `#color(white)${box.VERTICAL}#color(103,22,38)       • ${this.#trimText(result[2].constructor.name + ': ' + result[2].message, leftCellWidth-1)}#color(white)${box.VERTICAL}${" ".repeat(rightCellWidth+3)}${box.VERTICAL}`
						else logger.plain  `#color(white)${box.VERTICAL}#color(103,22,38)       • ${Datex.Runtime.valueToDatexString(result[2],false).padEnd(leftCellWidth-1, " ")}#color(white)${box.VERTICAL}${" ".repeat(rightCellWidth+3)}${box.VERTICAL}`
					}
				}
			}
		}

		logger.plain `#color(white)${box.VERTICAL}${' '.repeat(leftCellWidth+8)}${box.VERTICAL}${' '.repeat(rightCellWidth+3)}${box.VERTICAL}`
		logger.plain `#color(white)${box.BOTTOM_LEFT}${box.HORIZONTAL.repeat(leftCellWidth+8)}${box.T_UP}${box.HORIZONTAL.repeat(rightCellWidth+3)}${box.BOTTOM_RIGHT}`

	}

}