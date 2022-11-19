import { logger } from '../runner/utils.ts';

export abstract class ReportGenerator {

	constructor(protected files:URL[]) {

	}

	generateReport(outputfile:URL) {
		const output = this.generateReportText();
		Deno.writeTextFileSync(outputfile, output)
		logger.info("Test Report exported to " + outputfile.toString().replaceAll("file://",""))
	}

	abstract generateReportText():string
}