import { parse } from "https://deno.land/std@0.165.0/flags/mod.ts"
import { LOG_FORMATTING } from 'unyt_core/datex_all.ts';
import { logger } from './utils.ts';
import { SUPPORTED_REPORT_TYPES } from './constants.ts';
import { exitWithError } from './utils.ts';

type command_line_options = {
	reporttype?: string,
	reportfile?: string,
	watch: boolean,
	paths: string[],
	color: 'rgb'|'simple'|'none',
	verbose: boolean
}

const default_paths:string[] = []

const optionDefinitions = {
	boolean: ["w", "v"],
	string: ["c", "reporttype", "r", "p"],

	alias: {
		c: "color",
		w: "watch",
		v: "verbose",
		p: "paths",
		r: "reportfile",
	},
	
	default: {
		reporttype: 'junit',
		c: 'rgb',
	},
	
	collect: ["p"],

	// paths as default args without explicit key
	unknown: (arg: string, key?:string, value?:unknown) => {
		if (key == undefined && value == undefined)  {
			default_paths.push(arg)
		}
		return false;
	}
} as const;


export function getCommandLineOptions(): command_line_options {
	const options = parse(Deno.args, optionDefinitions)

	options.paths = [...default_paths, ...options.paths];

	// default current directory
	if (!options.paths.length) options.paths = ["."]

	// logger color type
	if (!['rgb','simple','none'].includes(options.color)) exitWithError("Unsupported color type: " + options.color)
	else logger.formatting = {
		rgb: LOG_FORMATTING.COLOR_RGB,
		simple: LOG_FORMATTING.COLOR_4_BIT,
		none: LOG_FORMATTING.PLAINTEXT
	}[options.color]!;

	// path
	if (!options.paths) exitWithError("Please provide a directory or a test file ('run.js mytest.test.js')")
	// report type
	if (options.reporttype && !SUPPORTED_REPORT_TYPES.includes(options.reporttype)) exitWithError("Unsupported report type: " + options.reporttype)
	
	return options
}
