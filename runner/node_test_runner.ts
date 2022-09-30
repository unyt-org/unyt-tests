import { TestRunner } from "./test_runner.js";
import { Worker } from 'node:worker_threads';
import { Datex } from "../../unyt_core/datex.js";

export class NodeTestRunner extends TestRunner {

	protected handleRun(path: URL) {
		const worker = new Worker(path, {
			env: {
				test_manager:Datex.Runtime.endpoint.toString(), 
				endpoint:Datex.Runtime.endpoint.getInstance("test").toString()
			},
			// enable to suppress stdout 
			// stdout:true, 
			// stderr:true
		});
	}
	
}