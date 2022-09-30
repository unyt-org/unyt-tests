import { Logger } from '../unyt_core/datex_all.js';
import { NodeTestRunner } from "./runner/node_test_runner.js";
import "./runner/test_manager.js";
import { getTestFiles } from './runner/utils.js';
export const logger = new Logger("Test Runner", true);
async function run() {
    let files;
    try {
        files = await getTestFiles(process.argv[2]);
    }
    catch (e) {
        logger.error("Invalid path for test files");
        process.exit();
    }
    const runner = new NodeTestRunner(files);
    runner.runAll();
}
await run();
