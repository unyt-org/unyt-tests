import { TestRunner } from "./test_runner.js";
import { Datex } from "../../unyt_core/datex.js";
import { logger } from "./utils.js";

const Worker = globalThis.Worker ? globalThis.Worker : (await import('node:worker_threads')).Worker;
/**
 * Runs tests in node.js/browser Worker environment
 */

export class WorkerTestRunner extends TestRunner {

	protected handleLoad(path: URL, endpoint:Datex.Endpoint) {
		const env = {
			test_manager: Datex.Runtime.endpoint.toString(), 
			endpoint: endpoint.toString(),
			context: path.toString()
		};

		const worker = new Worker(path, {
			type: "module", // required for browser
			env, // node.js env

			// disable to show stdout 
			stdout:true, 
			stderr:true,
		});

		
		// timeout required?!
		setTimeout(()=>{
			worker.postMessage(env);
		}, 1000);

		// @ts-ignore
		if (worker.on) {
		// @ts-ignore
			worker.on('error', err => {
				logger.error `Error in ${path}:
${err}
				`
				process.exit(1);
			});
		}
		}

	
}