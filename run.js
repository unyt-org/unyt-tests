import { Logger } from '../unyt_core/datex_all.js';
import { JUnitReportGenerator } from './reports/junit.js';
import { getCommandLineOptions } from './runner/command_line_args.js';
import { NodeTestRunner } from "./runner/node_test_runner.js";
import { TestManager } from './runner/test_manager.js';
import { getTestFiles, getUrlFromPath, printHeaderInfo } from './runner/utils.js';
export const logger = new Logger("Test Runner", true);
const options = getCommandLineOptions();
let files;
try {
    files = await getTestFiles(options.path);
}
catch (e) {
    logger.error("Invalid path for test files");
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
