import { TestRunner } from "./test_runner.js";
import { Datex } from "../../unyt_core/datex.js";
import { client_type, logger } from "./utils.js";

const Worker = globalThis.Worker ? globalThis.Worker : (await import('node:worker_threads')).Worker;
/**
 * Runs tests in node.js/browser Worker environment
 */

const loaded = w => new Promise(r => w.addEventListener("message", r, { once: true }));

export class WorkerTestRunner extends TestRunner {

	protected async handleLoad(path: URL, endpoint:Datex.Endpoint) {
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

		if (client_type == "browser") {
			await loaded(worker); // worker emits "loaded" message
			worker.postMessage(env); // set env data
		}
		
		else {
			// @ts-ignore
			worker.on('error', err => {
				logger.error `Error in ${path}:\n${err}`
				process.exit(1);
			});
		}

	}

	
}