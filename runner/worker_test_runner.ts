import { TestRunner } from "./test_runner.ts";
import { Datex } from "../../unyt_core/datex.ts";
import { TestManager } from "./test_manager.ts";

/**
 * Runs tests in node.js/browser Worker environment
 */

const loaded = (w:Worker) => new Promise(r => w.addEventListener("message", r, { once: true }));

export class WorkerTestRunner extends TestRunner {

	protected async handleLoad(path: URL, endpoint:Datex.Endpoint) {
		const env = {
			test_manager: Datex.Runtime.endpoint.toString(), 
			endpoint: endpoint.toString(),
			context: path.toString(),
			supranet_connect: TestManager.SUPRANET_CONNECT.toString()
		};

		const worker = new Worker(path, {
			type: "module"
		});

		await loaded(worker); // worker emits "loaded" message
		worker.postMessage(env); // set env data
		
	}
	
}