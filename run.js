import { Logger } from '../unyt_core/datex_all.js';
import { NodeTestRunner } from "./runner/node_test_runner.js";
import { TestManager } from './runner/test_manager.js';
import { getTestFiles } from './runner/utils.js';
export const logger = new Logger("Test Runner", true);
let files;
try {
    files = await getTestFiles(process.argv[2]);
}
catch (e) {
    logger.error("Invalid path for test files");
    process.exit();
}
TestManager.RUN_TESTS_IMMEDIATELY = true;
new NodeTestRunner(files).loadAll();
await TestManager.finishContexts(files);
TestManager.printReportAndExit(files);
