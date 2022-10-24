import { Datex } from "../../unyt_core/datex.js";
import { logger, getUrlFromPath } from "./utils.js";
export class TestRunner {
    file_paths;
    options;
    constructor(file_paths, options = {}) {
        for (let i = 0; i < file_paths.length; i++) {
            if (typeof file_paths[i] == "string")
                file_paths[i] = getUrlFromPath(file_paths[i]);
        }
        this.file_paths = new Set(file_paths);
        this.options = options;
    }
    loadAll() {
        for (let path of this.file_paths)
            this.load(path);
    }
    load(path) {
        const endpoint = Datex.Runtime.endpoint.getInstance("t" + Math.floor(Math.random() * 10000));
        logger.debug `running ${path} on ${endpoint}`;
        try {
            this.handleLoad(path, endpoint);
        }
        catch (e) {
            logger.error("Error starting test environment");
        }
    }
}
