import { Datex } from '../unyt_core/datex.js';
import { Logger, LOG_LEVEL } from '../unyt_core/datex_all.js';
import { JUnitReportGenerator } from './reports/junit.js';
import { getCommandLineOptions } from './runner/command_line_args.js';
import { WorkerTestRunner } from "./runner/worker_test_runner.js";
import { TestManager } from './runner/test_manager.js';
import { getTestFiles, getUrlFromPath, logger, printHeaderInfo } from './runner/utils.js';
const options = getCommandLineOptions();
if (options.verbose) {
    Logger.development_log_level = LOG_LEVEL.VERBOSE;
    Datex.MessageLogger.enable();
}
let files = [];
console.log(options.paths);
for (let path of options.paths) {
    try {
        for (let file of await getTestFiles(path))
            files.push(file);
    }
    catch (e) {
        console.log(e);
        logger.error("Invalid path for test files: " + getUrlFromPath(path, true));
        process.exit();
    }
}
printHeaderInfo(files);
await TestManager.init();
TestManager.RUN_TESTS_IMMEDIATELY = true;
new WorkerTestRunner(files).loadAll();
await TestManager.finishContexts(files);
if (options.reportfile) {
    if (options.reporttype == "junit")
        new JUnitReportGenerator(files).generateReport(getUrlFromPath(options.reportfile));
}
if (options.watch) {
    TestManager.printReport(files);
}
else {
    TestManager.printReportAndExit(files);
}
