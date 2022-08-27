export class TestRunner {
    file_paths;
    options;
    constructor(file_paths, options = {}) {
        this.file_paths = new Set(file_paths);
        this.options = options;
    }
    runAll() {
        for (let path of this.file_paths)
            this.run(path);
    }
    run(path) {
        console.log("running test: " + path);
        this.handleRun(path);
    }
}
