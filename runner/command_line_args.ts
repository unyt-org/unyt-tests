// @ts-ignore
import commandLineArgs from 'command-line-args';
import { LOG_FORMATTING } from '../../unyt_core/datex_all.js';
import { logger } from '../run.js';
import { SUPPORTED_REPORT_TYPES } from './constants.js';
import { exitWithError } from './utils.js';

type command_line_options = {
	reporttype: string,
	reportfile: string,
	watch: boolean,
	path: string,
	color: 'rgb'|'simple'|'none',
	verbose: boolean
}

const optionDefinitions = [
	{ name: 'reporttype', type: String, defaultValue:'junit' },
	{ name: 'reportfile', alias: 'r', type: String},
	{ name: 'watch', alias: 'w', type: Boolean },
	{ name: 'color', alias: 'c', type: String, defaultValue: 'rgb' },
	{ name: 'path', alias: 'p', type: String, defaultOption: true },
	{ name: 'verbose', alias: 'v', type: Boolean, defaultOption: false }

]

export function getCommandLineOptions(): command_line_options {
	const options = commandLineArgs(optionDefinitions)

	// logger color type
	if (!['rgb','simple','none'].includes(options.color)) exitWithError("Unsupported color type: " + options.color)
	else logger.formatting = {
		rgb: LOG_FORMATTING.COLOR_RGB,
		simple: LOG_FORMATTING.COLOR_4_BIT,
		none: LOG_FORMATTING.PLAINTEXT
	}[options.color];

	// path
	if (!options.path) exitWithError("Please provide a directory or a test file ('run.js mytest.test.js')")
	// report type
	if (options.reporttype && !SUPPORTED_REPORT_TYPES.includes(options.reporttype)) exitWithError("Unsupported report type: " + options.reporttype)
	
	return options
}
