import { TestRunner } from "./test_runner.js";
import { Worker } from 'node:worker_threads';
import { Datex } from "../../unyt_core/datex.js";
import { logger } from "../run.js";
export class NodeTestRunner extends TestRunner {
    handleLoad(path, endpoint) {
        const worker = new Worker(path, {
            env: {
                test_manager: Datex.Runtime.endpoint.toString(),
                endpoint: endpoint.toString(),
                context: path.toString()
            },
            stdout: true,
            stderr: true
        });
        worker.on('error', err => {
            logger.error `Error in ${path}:
${err}
			`;
            process.exit(1);
        });
    }
}
