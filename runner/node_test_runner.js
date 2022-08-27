import { TestRunner } from "./test_runner.js";
import { Worker } from 'node:worker_threads';
import { Datex } from "../../unyt_core/datex.js";
export class NodeTestRunner extends TestRunner {
    handleRun(path) {
        const worker = new Worker(path, { env: { test_manager: Datex.Runtime.endpoint.toString() }, stdout: false, stderr: false });
    }
}
