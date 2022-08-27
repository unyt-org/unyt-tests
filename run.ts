import { NodeTestRunner } from "./runner/node_test_runner.js";
import "./runner/test_manager.js";


declare let process:any;

async function run(){
	const path = process.argv[2];
	const runner = new NodeTestRunner([path])
	runner.runAll();
	setTimeout(()=>{
		runner.runAll();
	}, 4000);
}



await run();