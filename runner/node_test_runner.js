import { TestRunner } from "./test_runner.js";
import { Worker } from 'node:worker_threads';
import { Datex } from "../../unyt_core/datex.js";
export class NodeTestRunner extends TestRunner {
    handleLoad(path, endpoint) {
        new Worker(path, {
            env: {
                test_manager: Datex.Runtime.endpoint.toString(),
                endpoint: endpoint.toString(),
                context: path.toString()
            },
        });
    }
}
