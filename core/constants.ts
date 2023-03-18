export const VERSION = '2.0-beta';

export const SUPPORTED_REPORT_TYPES = [
	'junit'
]

export const getBoxWidth = () => Math.min(Deno.consoleSize().columns, 140);