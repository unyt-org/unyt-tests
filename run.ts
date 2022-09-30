import { Logger } from '../unyt_core/datex_all.js';

import { NodeTestRunner } from "./runner/node_test_runner.js";
import "./runner/test_manager.js";
import { getTestFiles, getTestFilesInDirectory, getUrlFromPath, isPathDirectory } from './runner/utils.js';

export const logger = new Logger("Test Runner", true);


declare let process:any;

async function run(){

	let files:URL[];

	try {
		files = await getTestFiles(process.argv[2]);
	}
	catch (e){
		logger.error("Invalid path for test files")
		process.exit();
	}

	const runner = new NodeTestRunner(files)
	runner.runAll();
}




await run();