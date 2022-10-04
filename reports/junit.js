import { Datex } from "../../unyt_core/datex.js";
import { TestManager } from "../runner/test_manager.js";
import { ReportGenerator } from "./generator.js";
function sanitizeArg(string) {
    return string.replace(/"/g, '\\"');
}
export class JUnitReportGenerator extends ReportGenerator {
    generateReportText() {
        const groups = [];
        for (let file of this.files)
            groups.push(...TestManager.getGroupsForContext(file));
        let total_duration = 0;
        let total_tests = 0;
        let total_failures = 0;
        for (let group of groups) {
            total_duration += group.duration;
            total_failures += group.failed_tests;
            total_tests += group.test_count;
        }
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<testsuites tests="${total_tests}" failures="${total_failures}" time="${total_duration.toFixed(3)}">\n`;
        for (let group of groups) {
            xml += `  <testsuite id="${sanitizeArg(group.name)}" name="${sanitizeArg(group.formatted_name)}" tests="${group.test_count}" failures="${group.failed_tests}" time="${group.duration.toFixed(3)}">\n`;
            for (let test of group.test_cases.values()) {
                xml += `    <testcase id="${sanitizeArg(test.name)}" name="${sanitizeArg(test.formatted_name)}" time="${test.duration.toFixed(3)}">\n`;
                for (let result of test.results) {
                    if (result[0] == false) {
                        xml += `      <failure message="${sanitizeArg(result[2] instanceof Error ? (result[2].constructor.name + ": " + result[2].message) :
                            Datex.Runtime.valueToDatexString(result[2], false))}">\n`;
                        xml += result[2] instanceof Error ? result[2].stack : (Datex.Runtime.valueToDatexString(result[2]) + '\n');
                        xml += `      </failure>\n`;
                    }
                }
                xml += `    </testcase>\n`;
            }
            xml += `  </testsuite>\n`;
        }
        xml += `</testsuites>`;
        return xml;
    }
}