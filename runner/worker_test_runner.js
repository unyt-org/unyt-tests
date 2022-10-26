import { TestRunner } from "./test_runner.js";
import { Datex } from "../../unyt_core/datex.js";
import { logger } from "./utils.js";
const Worker = globalThis.Worker ? globalThis.Worker : (await import('node:worker_threads')).Worker;
export class WorkerTestRunner extends TestRunner {
    handleLoad(path, endpoint) {
        const env = {
            test_manager: Datex.Runtime.endpoint.toString(),
            endpoint: endpoint.toString(),
            context: path.toString()
        };
        const worker = new Worker(path, {
            type: "module",
            env,
            stdout: true,
            stderr: true,
        });
        setTimeout(() => {
            worker.postMessage(env);
        }, 500);
        if (worker.on) {
            worker.on('error', err => {
                logger.error `Error in ${path}:
${err}
				`;
                process.exit(1);
            });
        }
    }
}
