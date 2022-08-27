
export namespace TestRunner {

	export interface Options {
		watch?:boolean
	}
	
}

export abstract class TestRunner {

	protected file_paths:Set<string>
	protected options:TestRunner.Options

	constructor(file_paths:string[], options:TestRunner.Options = {}) {
		this.file_paths = new Set(file_paths);
		this.options = options;
	}

	public runAll(){
		for (let path of this.file_paths) this.run(path);
	}

	public run(path:string){
		console.log("running test: " + path);
		this.handleRun(path);
	}

	protected abstract handleRun(path:string)
	
}
