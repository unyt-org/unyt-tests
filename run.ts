import { Datex } from '../unyt_core/datex.js';
import { Logger, LOG_FORMATTING, LOG_LEVEL } from '../unyt_core/datex_all.js';
import { JUnitReportGenerator } from './reports/junit.js';
import { ChromiumTestRunner } from './runner/chromium_test_runner.js';
import { getCommandLineOptions } from './runner/command_line_args.js';
import { WorkerTestRunner } from "./runner/worker_test_runner.js";
import { TestManager } from './runner/test_manager.js';
import { getTestFiles, getUrlFromPath, logger, printHeaderInfo } from './runner/utils.js';

const options = getCommandLineOptions();

// debug mode
if (options.verbose) {
	Logger.development_log_level = LOG_LEVEL.VERBOSE; // show verbose debug logs 
	Datex.MessageLogger.enable(); // log all datex messages
}

//console.log(options);

// get files (command line argument path)
let files:URL[] = [];
console.log(options.paths)
for (let path of options.paths) {
	try {
		for (let file of await getTestFiles(path))
			files.push(file);
	}
	catch (e){
		console.log(e);
		logger.error("Invalid path for test files: " + getUrlFromPath(path, true))
		process.exit();
	}
}


printHeaderInfo(files);

// run

await TestManager.init();

TestManager.RUN_TESTS_IMMEDIATELY = true; // start running tests when they are available
new WorkerTestRunner(files).loadAll(); // start up test environments for all test files
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
