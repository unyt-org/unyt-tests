import { Datex, f } from "unyt_core/datex.ts";
import { endpoint_name } from "unyt_core/datex_all.ts";
import { init } from "./test.ts";

declare const process: any;

init({
	endpoint: f(<endpoint_name>process.env.endpoint),
	test_manager: f(<endpoint_name>(process.env.test_manager??Datex.LOCAL_ENDPOINT)),
	context: new URL(process.env.context),
	supranet_connect: process.env.supranet_connect == "true"
});