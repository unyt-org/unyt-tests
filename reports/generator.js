import fs from 'fs';
import { logger } from '../runner/utils.js';
export class ReportGenerator {
    files;
    constructor(files) {
        this.files = files;
    }
    generateReport(outputfile) {
        const output = this.generateReportText();
        fs.writeFileSync(outputfile, output);
        logger.info("Test Report exported to " + outputfile.toString().replaceAll("file://", ""));
    }
}
