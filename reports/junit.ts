import { Datex } from "unyt_core";
import { TestGroup } from "../runner/test_case.ts";
import { TestManager } from "../runner/test_manager.ts";
import { ReportGenerator } from "./generator.ts";

function sanitizeArg(string:string) {
	return string.replace(/"/g,'&quot;')
}

export class JUnitReportGenerator extends ReportGenerator {
	generateReportText() {

		const groups:TestGroup[] = [];
		for (const file of this.files) groups.push(...TestManager.getGroupsForContext(file));
		let total_duration = 0;
		let total_tests = 0;
		let total_failures = 0;
		for (const group of groups) {
			total_duration += group.duration;
			total_failures += group.failed_tests;
			total_tests += group.test_count
		}

		let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
		xml += `<testsuites id="${this.formattedTimestampId()}" name="Tests on ${new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString()}" tests="${total_tests}" failures="${total_failures}" time="${total_duration.toFixed(3)}">\n`

		let i = 0;
		for (const group of groups) {
			xml += `  <testsuite id="${i++}" name="${sanitizeArg(group.name)}" tests="${group.test_count}" failures="${group.failed_tests}" time="${group.duration.toFixed(3)}">\n`
			for (const test of group.test_cases.values()) {
				xml += `    <testcase id="${sanitizeArg(test.name)}" name="${sanitizeArg(test.formatted_name)}" time="${test.duration?.toFixed(3)??'?'}">\n`
				for (const result of test.results) {
					if (result[0] == false) {
						xml += `      <failure message="${sanitizeArg(
								result[2] instanceof Error ? (result[2].constructor.name + ": " + result[2].message):
								Datex.Runtime.valueToDatexString(result[2],false)
							)}" type="WARNING">\n`
						xml += result[2] instanceof Error ? result[2].stack : (Datex.Runtime.valueToDatexString(result[2]) + '\n')
						xml += `      </failure>\n`
					}
				}
				xml += `    </testcase>\n`
			}

			xml += `  </testsuite>\n`
		}
		

		xml += `</testsuites>`
		return xml;
	}

	private formattedTimestampId(){
		const date =new Date();
		return date.getFullYear()+(date.getMonth()+1).toString().padStart(2,"0")+(date.getDate()).toString().padStart(2,"0")+"_"+date.getHours().toString().padStart(2,"0")+date.getMinutes().toString().padStart(2,"0")+date.getSeconds().toString().padStart(2,"0")
	}

}