import { Datex } from "unyt_core";
import { Logger, LOG_LEVEL } from 'unyt_core/datex_all.ts';
import { JUnitReportGenerator } from './report_generators/junit_report_generator.ts';
import { getCommandLineOptions } from './core/command_line_args.ts';
import { TestManager } from './core/test_manager.ts';
import { getTestFiles, getPath, logger, printHeaderInfo } from './core/utils.ts';
import { Path } from "unyt_node/path.ts";

// enabled test runners
import "./runners/typescript_test_runner.ts";
import "./runners/datex_test_runner.ts";

const options = getCommandLineOptions();

// debug mode
if (options.verbose) {
	Logger.development_log_level = LOG_LEVEL.VERBOSE; // show verbose debug logs 
	Logger.production_log_level = LOG_LEVEL.VERBOSE; // show verbose production logs 
	Datex.MessageLogger.enable(); // log all datex messages
}

// console.log(options);

// get files (command line argument path)
const files:Path[] = [];
for (const path of options.paths) {
	try {
		for (const file of await getTestFiles(path))
			files.push(file);
	}
	catch (e){
		console.log(e);
		logger.error("Invalid path for test files: " + getPath(path, true))
		Deno.exit();
	}
}

await TestManager.connect();

printHeaderInfo(files);

// run

TestManager.RUN_TESTS_IMMEDIATELY = true; // start running tests when they are available
TestManager.loadFiles(files); // start up test contexts for all test files
await TestManager.finishContexts(files); // wait until all tests for the loaded files are finished

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
