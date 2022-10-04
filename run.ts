import { Logger } from '../unyt_core/datex_all.js';
import { ChromiumTestRunner } from './runner/chromium_test_runner.js';
import { NodeTestRunner } from "./runner/node_test_runner.js";
import { TestManager } from './runner/test_manager.js';
import { getTestFiles, printHeaderInfo } from './runner/utils.js';

export const logger = new Logger("Test Runner", true);


// get files (command line argument path)
let files:URL[];

try {
	files = await getTestFiles(process.argv[2]);
}
catch (e){
	logger.error("Invalid path for test files")
	process.exit();
}

printHeaderInfo(files);

TestManager.RUN_TESTS_IMMEDIATELY = true; // start running tests when they are available
new NodeTestRunner(files).loadAll(); // start up test environments for all test files
await TestManager.finishContexts(files); // wait until all tests for the loaded files are finished
TestManager.printReportAndExit(files); // print to stdout