import { Datex } from "unyt_core";
import { client_type, ESCAPE_SEQUENCES, Logger, LOG_FORMATTING } from 'unyt_core/datex_all.ts';
import { getBoxWidth, VERSION } from "./constants.ts";
import { Path } from "unyt_node/path.ts";
import { TestRunner } from "./test_runner.ts";

export const logger = new Logger("Test Runner", true, client_type == "browser" ? LOG_FORMATTING.COLOR_RGB : LOG_FORMATTING.PLAINTEXT);

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
			Deno.exit(1);
		}
	}
	return files;
}


const lastUpdates = new Map<string, number>()

export async function watchFiles(paths:Path[], handler:(path:Path)=>void) {

	for await (const event of Deno.watchFs(paths.map(p=>p.pathname), {recursive: true})) {
		try {
			for (const path of event.paths) {
				const time = Date.now()
				if (lastUpdates.has(path) && (time - lastUpdates.get(path)! < 200)) {
					continue;
				}
				lastUpdates.set(path, time);
				const src_path = new Path(path);
				logger.debug("file update: " + src_path);
				setTimeout(()=>handler(src_path), 5)
			}
		}
		catch (e) {
			console.log("file update error:",e);
		}
	}
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

	const main_color = ESCAPE_SEQUENCES.WHITE;

	logger.lock();

	logger.plain `${main_color}╔═ [[ unyt tests ]]#reset ${VERSION}${main_color}${' '.padEnd(getBoxWidth()-25, '═')}╗
${main_color}║${' '.repeat(getBoxWidth()-2)}║
${main_color}║  #color(white)Test Files:${' '.repeat(getBoxWidth()-15)}${main_color}║`

	for (const file of files) {
		logger.plain `${main_color}║     #color(grey)${file.toString().replace("file://","").padEnd(getBoxWidth()-7, ' ')}${main_color}║`
	}

	logger.plain `${main_color}║${' '.repeat(getBoxWidth()-2)}${main_color}║`

	logger.plain `${main_color}║  #color(white)Endpoint: #color(grey)${Datex.Runtime.endpoint.toString().padEnd(getBoxWidth()-14, ' ')}${main_color}║`

	logger.plain `${main_color}║${' '.repeat(getBoxWidth()-2)}║`
	logger.plain `${main_color}╚${'═'.repeat(getBoxWidth()-2)}╝`

	logger.flush();
}

export function exitWithError(message:string) {
	logger.plain('#color(red)'+message);
	
	Deno.exit(1);
}