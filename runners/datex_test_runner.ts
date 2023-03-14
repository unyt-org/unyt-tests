import { TestRunner } from "../core/test_runner.ts";
import { Datex } from "unyt_core";
import { TestManager } from "../core/test_manager.ts";

// make sure assertions are loaded
import "../testing/assertions.ts";

/**
 * Runs DATEX Script tests
 */


@TestRunner.Config({
	fileExtensions: ['test.dx']
})
export class DatexTestRunner extends TestRunner {

	protected async handleLoad(context: URL, _endpoint:Datex.Endpoint) {
		const dx = await Deno.readTextFile(context);

		// execute DATEX Script with 'test' extension
		const tests = (<any> await Datex.Runtime.executeDatexLocally(dx, [], {
			required_extensions: ['test']
		}, context))?.test;

		TestManager.registerContext(context)

		// load tests
		if (tests) {
			for (const [groupName, testGroup] of Datex.DatexObject.entries(tests)) {
				TestManager.registerTestGroup(context, groupName.toString())
				if (testGroup) {
					for (const [name, test] of Datex.DatexObject.entries(testGroup)) {
						await TestManager.bindTestCase(context, groupName.toString(), name.toString(), [], test);
					}
				}
	
			}
		}
		

		TestManager.contextLoaded(context)
	}
	
}