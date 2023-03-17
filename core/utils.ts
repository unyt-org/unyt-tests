import { Datex } from "unyt_core";
import { Logger, LOG_FORMATTING } from 'unyt_core/datex_all.ts';
import { BOX_WIDTH, VERSION } from "./constants.ts";
import { Path } from "unyt_node/path.ts";
import { TestRunner } from "./test_runner.ts";

export const logger = new Logger("Test Runner", true, LOG_FORMATTING.PLAINTEXT);

export function getPath(path:string, is_dir = false){
	const pathObj = new Path(path, "file://" + Deno.cwd()+ "/");
	if (is_dir) return pathObj.asDir();
	else return pathObj;
}


export async function getTestFilesFromPaths(paths:string[]) {
	const files:Path[] = [];
	for (const path of paths) {
		try {
			for (const file of await getTestFiles(path))
				files.push(file);
		}
		catch (e){
			logger.error("Invalid path for test files: " + getPath(path, true))
			Deno.exit();
		}
	}
	return files;
}


export async function getTestFiles(path:string|Path){
	path = path instanceof Path ? path : getPath(path);

	// does path exist?
	if (!await path.exists()) {
		if (path.is_web) throw new Error("URL " + path + " returned an invalid status code");
		else throw new Error("Path " + path + " does not exist");
	}
	
	// get directory
	if (path.fs_is_dir) {
		path = path.asDir();
		// const dir = getUrlFromPath(path, true)
		return await getTestFilesInDirectory(path);
	}
	
	// is single file
	else return [path]
}

export async function getTestFilesInDirectory(dirPath:Path) {
	const files:Path[] = [];
	await searchDirectory(dirPath, files);
	return files;
}
async function searchDirectory(dirPath:Path, files:Path[]) {
	if (!globalThis.Deno) throw new Error("Extended file utilities are not supported");

	for await (const entry of Deno.readDir(dirPath)) {
		// directory
		if (entry.isDirectory) await searchDirectory(dirPath.getChildPath(entry.name).asDir(), files);
	  	// .test file?
		else {
			const path = dirPath.getChildPath(entry.name);
			if (path.hasFileExtension(...TestRunner.availableTestSpecificExtensions)) {
				files.push(path);
			}
		}
	}
  
}


export function printHeaderInfo(files:URL[]){

	logger.plain `
#color(white)╔═ [[ unyt tests ]]#reset ${(VERSION + ' ').padEnd(BOX_WIDTH-17, '═')}╗
#color(white)║${' '.repeat(BOX_WIDTH-2)}║
#color(white)║    Endpoint: #color(grey)${Datex.Runtime.endpoint.toString().padEnd(BOX_WIDTH-16, ' ')}║
#color(white)║    Test Files:${' '.repeat(BOX_WIDTH-17)}║`

	for (const file of files) {
		logger.plain `#color(white)║       #color(grey)${file.toString().replace("file://","").padEnd(BOX_WIDTH-9, ' ')}#color(white)║`
	}

	logger.plain `#color(white)║${' '.repeat(BOX_WIDTH-2)}║`
	logger.plain `#color(white)╚${'═'.repeat(BOX_WIDTH-2)}╝`
}

export function exitWithError(message:string) {
	logger.plain('#color(red)'+message);
	Deno.exit(1);
}