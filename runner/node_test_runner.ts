import { TestRunner } from "./test_runner.js";
import { Worker } from 'node:worker_threads';
import { Datex } from "../../unyt_core/datex.js";

export class NodeTestRunner extends TestRunner {

	protected handleLoad(path: URL, endpoint:Datex.Endpoint) {
		new Worker(path, {
			env: {
				test_manager:Datex.Runtime.endpoint.toString(), 
				endpoint:endpoint.toString(),
				context: path.toString()
			},
			// enable to suppress stdout 
			// stdout:true, 
			// stderr:true
		});
	}
	
}