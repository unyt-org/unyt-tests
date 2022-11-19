import { Datex } from '../../unyt_core/datex.ts';
import { Logger, LOG_FORMATTING } from '../../unyt_core/datex_all.ts';
import { BOX_WIDTH, SUPPORTED_EXTENSIONS, VERSION } from "./constants.ts";

export const logger = new Logger("Test Runner", true, LOG_FORMATTING.PLAINTEXT);

export function isPathDirectory(path:string){
	if (!globalThis.Deno) throw new Error("Extended file utilities are not supported");

	try {
		Deno.readDirSync(path);
		return true;
	}
	catch {
		return false;
	}
}

export function getUrlFromPath(path:string, is_dir = false){
	if (is_dir && !path.endsWith('/')) path += '/';
	if (path.startsWith("./")) path = path.slice(2);
	return new URL(path.startsWith("/") ? path : Deno.cwd()+'/'+path, "file://");
}



export async function getTestFiles(path:string){
	// get directory
	if (isPathDirectory(path)) {
		const dir = getUrlFromPath(path, true)
		return await getTestFilesInDirectory(dir);
	}
	// is single file
	else return [getUrlFromPath(path)]
}

export async function getTestFilesInDirectory(dirPath:URL) {
	const files:URL[] = [];
	await searchDirectory(dirPath, files);
	return files;
}
async function searchDirectory(dirPath:URL, files:URL[]) {
	if (!globalThis.Deno) throw new Error("Extended file utilities are not supported");

	for await (const entry of Deno.readDir(dirPath)) {
		// directory
		if (entry.isDirectory) await searchDirectory(new URL(entry.name+'/', dirPath), files);
	  	// .test file?
		else {
			const path = new URL(entry.name, dirPath);
			for (const ext of SUPPORTED_EXTENSIONS) {
				if (entry.name.endsWith(ext)) {
					files.push(path);
					break;
				}
			}
		}
	}
  
}


export function printHeaderInfo(files:URL[]){

	logger.plain `
#color(white)╔═ [[ unyt tests ]]#reset ${(VERSION + ' ').padEnd(BOX_WIDTH-17, '═')}╗
#color(white)║${' '.repeat(BOX_WIDTH-2)}║
#color(white)║    Endpoint: #color(green)${Datex.Runtime.endpoint.toString().padEnd(BOX_WIDTH-16, ' ')}║
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