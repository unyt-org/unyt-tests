import fs from 'fs';
import { logger } from '../run.js';

export abstract class ReportGenerator {

	constructor(protected files:URL[]) {

	}

	generateReport(outputfile:URL) {
		const output = this.generateReportText();
		fs.writeFileSync(outputfile, output)
		logger.info("Test Report exported to " + outputfile.toString().replaceAll("file://",""))
	}

	abstract generateReportText():string
}