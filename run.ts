import { Logger } from '../unyt_core/datex_all.js';
import { JUnitReportGenerator } from './reports/junit.js';
import { ChromiumTestRunner } from './runner/chromium_test_runner.js';
import { getCommandLineOptions } from './runner/command_line_args.js';
import { NodeTestRunner } from "./runner/node_test_runner.js";
import { TestManager } from './runner/test_manager.js';
import { getTestFiles, getUrlFromPath, printHeaderInfo } from './runner/utils.js';

export const logger = new Logger("Test Runner", true);

const options = getCommandLineOptions();
//console.log(options);

// get files (command line argument path)
let files:URL[];

try {
	files = await getTestFiles(options.path);
}
catch (e){
	logger.error("Invalid path for test files")
	process.exit();
}

printHeaderInfo(files);

// run
TestManager.RUN_TESTS_IMMEDIATELY = true; // start running tests when they are available
new NodeTestRunner(files).loadAll(); // start up test environments for all test files
await TestManager.finishContexts(files); // wait until all tests for the loaded files are finished


// export report?
if (options.reportfile) {
	if (options.reporttype == "junit") new JUnitReportGenerator(files).generateReport(getUrlFromPath(options.reportfile))
}
 
// print report
if (options.watch) {
	TestManager.printReport(files);
	// TODO
}

else {
	TestManager.printReportAndExit(files); // print to stdout
}
