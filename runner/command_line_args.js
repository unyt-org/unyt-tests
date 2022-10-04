import commandLineArgs from 'command-line-args';
import { SUPPORTED_REPORT_TYPES } from './constants.js';
import { exitWithError } from './utils.js';
const optionDefinitions = [
    { name: 'reporttype', type: String, defaultValue: 'junit' },
    { name: 'reportfile', alias: 'r', type: String },
    { name: 'watch', alias: 'w', type: Boolean },
    { name: 'path', alias: 'p', type: String, defaultOption: true }
];
export function getCommandLineOptions() {
    const options = commandLineArgs(optionDefinitions);
    if (!options.path)
        exitWithError("Please provide a directory or a test file ('run.js mytest.test.js')");
    if (options.reporttype && !SUPPORTED_REPORT_TYPES.includes(options.reporttype))
        exitWithError("Unsupported report type: " + options.reporttype);
    return options;
}
