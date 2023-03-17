import { Datex } from "unyt_core";
import "unyt_core";
import { Logger, LOG_LEVEL } from 'unyt_core/datex_all.ts';
import { JUnitReportGenerator } from './report_generators/junit_report_generator.ts';
import { getCommandLineOptions } from './core/command_line_args.ts';
import { TestManager } from './core/test_manager.ts';
import { getTestFiles, getPath, logger, printHeaderInfo, getTestFilesFromPaths } from './core/utils.ts';

// enabled test runners
import "./runners/typescript_test_runner.ts";
import "./runners/datex_test_runner.ts";

const options = getCommandLineOptions();

// debug mode
if (options.verbose) {
	Logger.development_log_level = LOG_LEVEL.VERBOSE; // show verbose debug logs 
	Logger.production_log_level = LOG_LEVEL.VERBOSE; // show verbose production logs 
	// Datex.MessageLogger.enable(); // log all datex messages
}

// get files (command line argument path)
const files = await getTestFilesFromPaths(options.paths);

await TestManager.connect();

printHeaderInfo(files);

// run
await TestManager.loadTests(files, {initLive: false, analyizeStatic: false}); // init test contexts for all test files
await TestManager.runTests(files);

// export report?
if (options.reportfile) {
	if (options.reporttype == "junit") new JUnitReportGenerator(files).generateReport(getPath(options.reportfile))
}
 
// print report
if (options.watch) {
	TestManager.printReport(files);
	// TODO
}

else {
	TestManager.printReportAndExit(files); // print to stdout
}
