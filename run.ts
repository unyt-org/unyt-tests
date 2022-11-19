import { Datex } from "unyt_core";
import { Logger, LOG_LEVEL } from 'unyt_core/datex_all.ts';
import { JUnitReportGenerator } from './reports/junit.ts';
import { getCommandLineOptions } from './runner/command_line_args.ts';
import { WorkerTestRunner } from "./runner/worker_test_runner.ts";
import { TestManager } from './runner/test_manager.ts';
import { getTestFiles, getUrlFromPath, logger, printHeaderInfo } from './runner/utils.ts';

const options = getCommandLineOptions();

// debug mode
if (options.verbose) {
	Logger.development_log_level = LOG_LEVEL.VERBOSE; // show verbose debug logs 
	Datex.MessageLogger.enable(); // log all datex messages
}

// console.log(options);

// get files (command line argument path)
const files:URL[] = [];
for (const path of options.paths) {
	try {
		for (const file of await getTestFiles(path))
			files.push(file);
	}
	catch (e){
		console.log(e);
		logger.error("Invalid path for test files: " + getUrlFromPath(path, true))
		Deno.exit();
	}
}

await TestManager.connect();

printHeaderInfo(files);

// run

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
