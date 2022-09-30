import { lstat, readdir } from 'node:fs/promises';
import { supported_test_extensions } from "./constants.js";
export async function isPathDirectory(path) {
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
    await Promise.all((await readdir(dirPath)).map(async (entity) => {
        const path = new URL(entity, dirPath);
        if ((await lstat(path)).isDirectory())
            await searchDirectory(new URL(entity + '/', dirPath), files);
        else {
            for (let ext of supported_test_extensions) {
                if (entity.endsWith(ext)) {
                    files.push(path);
                    break;
                }
            }
        }
    }));
}
