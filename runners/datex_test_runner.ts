import { TestRunner } from "../core/test_runner.ts";
import { Datex } from "unyt_core";
import { TestManager } from "../core/test_manager.ts";

// make sure assertions are loaded
import "../testing/assertions.ts";
import { Path } from "unyt_node/path.ts";

/**
 * Runs DATEX Script tests
 */


@TestRunner.Config({
	fileExtensions: ['dx']
})
export class DatexTestRunner extends TestRunner {

	protected handleLoadStatic(context: URL) {
		// TODO: datex static analyizer, currently just loading context
		return this.loadScript(context, false);
	}	

	protected async handleLoad(context: URL, initOptions:TestRunner.InitializationOptions) {
		const loaded = await this.loadScript(context);
		await TestManager.contextLoaded(context);
		return loaded;
	}
	
	private async loadScript(context: URL, bindTestCases = true) {
		const path = new Path(context);
		const dx = await path.getTextContent();

		// execute DATEX Script with 'test' extension
		const tests = (<any> await Datex.Runtime.executeDatexLocally(dx, [], {
			required_extensions: ['test'],
		}, context))?.test;

		await TestManager.registerContext(context)

		// load tests
		if (tests) {
			for (const [groupName, testGroup] of Datex.DatexObject.entries(tests)) {
				TestManager.registerTestGroup(context, groupName.toString())
				if (testGroup) {
					for (const [name, test] of Datex.DatexObject.entries(testGroup)) {
						if (bindTestCases)
							await TestManager.bindTestCase(context, groupName.toString(), name.toString(), [], test);
						else 
							await TestManager.registerTestCase(context, groupName.toString(), name.toString(), []);
					}
				}
	
			}
		}

		return true;
	}
}