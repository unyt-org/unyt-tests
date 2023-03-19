export const VERSION = '2.0-beta';

export const SUPPORTED_REPORT_TYPES = [
	'junit'
]

const DEFAULT_BOX_WIDTH = 140;

export const getBoxWidth = () => {
	try {
		return Math.min(Deno.consoleSize().columns, DEFAULT_BOX_WIDTH);
	} 
	catch {
		return DEFAULT_BOX_WIDTH
	}
}