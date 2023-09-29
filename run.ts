import "unyt_core";
import { Logger, LOG_LEVEL } from 'unyt_core/datex_all.ts';
import { JUnitReportGenerator } from './report_generators/junit_report_generator.ts';
import { getCommandLineOptions } from './core/command_line_args.ts';
import { TestManager } from './core/test_manager.ts';
import { getPath, logger, printHeaderInfo, getTestFilesFromPaths, watchFiles } from './core/utils.ts';

// enabled test runners
import "./runners/typescript_test_runner.ts";
import "./runners/datex_test_runner.ts";
import "./runners/rust_test_runner.ts";
import { testLogger } from "./core/logger.ts";

const options = getCommandLineOptions();

if (options.watch) logger.clear(true);
else console.log("")

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

// handle updates
if (options.watch) {
	Deno.addSignalListener("SIGWINCH", () => {
		updateContent(true)
   });
   
   let ongoingUpdate = false;
   TestManager.onUpdate(()=>{
	   if (ongoingUpdate) return;
	   ongoingUpdate = true;
	   setTimeout(()=>{
		   updateContent();
		   ongoingUpdate = false;
	   }, 1000)
   })
}


// run
await TestManager.loadTests(files); // init test contexts for all test files // , {initLive: false, analyizeStatic: false}
await TestManager.runTests();

// export report?
exportReportFile();
 
// print report
if (options.watch) {
	updateContent();
	watchFiles(options.paths, 
		async (path)=> {
			logger.clear(true);
			testLogger.clear(); // TODO: optionally remove to keep history of logs?
			console.log("update " + path)
			printHeaderInfo(TestManager.loadedContexts);
			await TestManager.loadTests([path], {initLive: true, analyizeStatic: true}, true, true); // init test contexts for all test files
			updateContent();
			exportReportFile();
		}, 
		(path)=>{
			TestManager.unloadTest(path);
			printHeaderInfo(TestManager.loadedContexts);
			updateContent();
			exportReportFile();
		}
	)
}

else {
	TestManager.printReportAndExit(TestManager.loadedContexts, options.short); // print to stdout
}


function exportReportFile() {
	// export report?
	if (options.reportfile) {
		if (options.reporttype == "junit") new JUnitReportGenerator(TestManager.loadedContexts).generateReport(getPath(options.reportfile))
	}
}
  


function updateContent() {
	logger.clear(true);
	printHeaderInfo(TestManager.loadedContexts);
	TestManager.printReport(TestManager.loadedContexts, options.short);

	(testLogger as any).render();
}