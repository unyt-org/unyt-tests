import { Datex } from '../unyt_core/datex.js';
import { Logger, LOG_FORMATTING, LOG_LEVEL } from '../unyt_core/datex_all.js';
import { JUnitReportGenerator } from './reports/junit.js';
import { getCommandLineOptions } from './runner/command_line_args.js';
import { NodeTestRunner } from "./runner/node_test_runner.js";
import { TestManager } from './runner/test_manager.js';
import { getTestFiles, getUrlFromPath, printHeaderInfo } from './runner/utils.js';
export const logger = new Logger("Test Runner", true, LOG_FORMATTING.PLAINTEXT);
const options = getCommandLineOptions();
if (options.verbose) {
    Logger.development_log_level = LOG_LEVEL.VERBOSE;
    Datex.MessageLogger.enable();
}
let files;
try {
    files = await getTestFiles(options.path);
}
catch (e) {
    console.log(e);
    logger.error("Invalid path for test files: " + getUrlFromPath(options.path, true));
    process.exit();
}
printHeaderInfo(files);
TestManager.RUN_TESTS_IMMEDIATELY = true;
new NodeTestRunner(files).loadAll();
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
