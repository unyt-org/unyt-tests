import { TestRunner } from "./test_runner.js";
import { Datex } from "../../unyt_core/datex.js";

// @ts-ignore
import puppeteer from "puppeteer"
// @ts-ignore
import express from "express"

/**
 * Runs tests in Chromium browser environment (puppeteer)
 */
console.log(puppeteer)

export class ChromiumTestRunner extends TestRunner {

	protected async handleLoad(path: URL, endpoint:Datex.Endpoint) {

		await this.startServer(path);

		const browser = await puppeteer.launch({headless: false});
		const page = await browser.newPage();
		await page.goto("http://localhost:5200");

		const unyt_test_config = {
			test_manager: Datex.Runtime.endpoint.toString(), 
			endpoint: endpoint.toString(),
			context: path.toString()
		}

		await page.evaluate((unyt_test_config)=>{
			globalThis.unyt_test = unyt_test_config
		}, unyt_test_config)

		await page.addScriptTag({url:'http://localhost:5200/test/test/base/accounts.test.js', type: 'module'})

		// new Worker(path, {
		// 	env: {
		// 		test_manager:Datex.Runtime.endpoint.toString(), 
		// 		endpoint:endpoint.toString(),
		// 		context: path.toString()
		// 	},
		// 	// enable to suppress stdout 
		// 	// stdout:true, 
		// 	// stderr:true
		// });
	}

	private startServer(path: URL){
		const main_dir = new URL("chromium_index",import.meta.url).toString().replace("file://","");
		const test_dir = new URL("../../", path).toString().replace("file://","");

		const app = express()

		app.use("/", express.static(main_dir));
		app.use("/test", express.static(test_dir));

		return new Promise<void>(resolve=>{
			app.listen(5200, () => {
				console.log('server is listening on port 5200....',main_dir,test_dir)
				resolve()
			})
		})
		
	}
	
}