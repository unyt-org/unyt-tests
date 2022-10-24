import { Datex } from '../../unyt_core/datex.js';
import { Logger, LOG_FORMATTING } from '../../unyt_core/datex_all.js';
import { BOX_WIDTH, SUPPORTED_EXTENSIONS, VERSION } from "./constants.js";
export const logger = new Logger("Test Runner", true, LOG_FORMATTING.PLAINTEXT);
export const client_type = globalThis.process?.release?.name ? 'node' : 'browser';
const { lstat, readdir } = client_type == 'node' ? (await import('node:fs/promises')) : { lstat: null, readdir: null };
export async function isPathDirectory(path) {
    if (!lstat)
        throw new Error("Extended file utilities are not supported");
    const url = getUrlFromPath(path);
    return (await lstat(url)).isDirectory();
}
export function getUrlFromPath(path, is_dir = false) {
    if (is_dir && !path.endsWith('/'))
        path += '/';
    if (path.startsWith("./"))
        path = path.slice(2);
    return new URL(path.startsWith("/") ? path : process.cwd() + '/' + path, "file://");
}
export async function getTestFiles(path) {
    if (await isPathDirectory(path)) {
        const dir = getUrlFromPath(path, true);
        return await getTestFilesInDirectory(dir);
    }
    else
        return [getUrlFromPath(path)];
}
export async function getTestFilesInDirectory(dirPath) {
    const files = [];
    await searchDirectory(dirPath, files);
    return files;
}
export async function searchDirectory(dirPath, files) {
    if (!lstat)
        throw new Error("Extended file utilities are not supported");
    await Promise.all((await readdir(dirPath)).map(async (entity) => {
        const path = new URL(entity, dirPath);
        if ((await lstat(path)).isDirectory())
            await searchDirectory(new URL(entity + '/', dirPath), files);
        else {
            for (let ext of SUPPORTED_EXTENSIONS) {
                if (entity.endsWith(ext)) {
                    files.push(path);
                    break;
                }
            }
        }
    }));
}
export function printHeaderInfo(files) {
    logger.plain `
#color(white)╔═ [[ unyt tests ]]#reset ${(VERSION + ' ').padEnd(BOX_WIDTH - 17, '═')}╗
#color(white)║${' '.repeat(BOX_WIDTH - 2)}║
#color(white)║    Endpoint: #color(green)${Datex.Runtime.endpoint.toString().padEnd(BOX_WIDTH - 16, ' ')}║
#color(white)║    Test Files:${' '.repeat(BOX_WIDTH - 17)}║`;
    for (let file of files) {
        logger.plain `#color(white)║       #color(grey)${file.toString().padEnd(BOX_WIDTH - 9, ' ')}#color(white)║`;
    }
    logger.plain `#color(white)║${' '.repeat(BOX_WIDTH - 2)}║`;
    logger.plain `#color(white)╚${'═'.repeat(BOX_WIDTH - 2)}╝`;
}
export function exitWithError(message) {
    logger.plain('#color(red)' + message);
    process.exit(1);
}
