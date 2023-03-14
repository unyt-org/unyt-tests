import { Datex, f } from "unyt_core/datex.ts";
import { init } from "./test.ts";

// @ts-ignore worker context
self.onmessage = (e) => {
	init({
		endpoint: f(e.data.endpoint),
		test_manager: f(e.data.test_manager??Datex.LOCAL_ENDPOINT),
		context: new URL(e.data.context),
		supranet_connect: e.data.supranet_connect == "true"
	});
}
// @ts-ignore worker context
self.postMessage("loaded"); // inform parent that this worker is loaded and can receive messages