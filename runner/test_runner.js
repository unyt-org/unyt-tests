import { logger } from "../run.js";
import { getUrlFromPath } from "./utils.js";
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
    runAll() {
        for (let path of this.file_paths)
            this.run(path);
    }
    run(path) {
        logger.info("running test: " + path);
        try {
            this.handleRun(path);
        }
        catch (e) {
            logger.error("Error starting test environment");
        }
    }
}
