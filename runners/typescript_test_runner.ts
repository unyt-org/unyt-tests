import { TestRunner } from "../core/test_runner.ts";
import { Datex } from "unyt_core";
import { TestManager } from "../core/test_manager.ts";

/**
 * Runs TypeScript/JavaScript tests in deno/browser worker context
 */


@TestRunner.Config({
	fileExtensions: ['test.ts', 'test.js', 'test.tsx', 'test.jsx']
})
export class TypescriptTestRunner extends TestRunner {

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

const loaded = (w:Worker) => new Promise(r => w.addEventListener("message", r, { once: true }));