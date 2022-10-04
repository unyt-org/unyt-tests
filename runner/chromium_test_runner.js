import { TestRunner } from "./test_runner.js";
import { Datex } from "../../unyt_core/datex.js";
import puppeteer from "puppeteer";
import express from "express";
console.log(puppeteer);
export class ChromiumTestRunner extends TestRunner {
    async handleLoad(path, endpoint) {
        await this.startServer(path);
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await page.goto("http://localhost:5200");
        const unyt_test_config = {
            test_manager: Datex.Runtime.endpoint.toString(),
            endpoint: endpoint.toString(),
            context: path.toString()
        };
        await page.evaluate((unyt_test_config) => {
            globalThis.unyt_test = unyt_test_config;
        }, unyt_test_config);
        await page.addScriptTag({ url: 'http://localhost:5200/test/test/base/accounts.test.js', type: 'module' });
    }
    startServer(path) {
        const main_dir = new URL("chromium_index", import.meta.url).toString().replace("file://", "");
        const test_dir = new URL("../../", path).toString().replace("file://", "");
        const app = express();
        app.use("/", express.static(main_dir));
        app.use("/test", express.static(test_dir));
        return new Promise(resolve => {
            app.listen(5200, () => {
                console.log('server is listening on port 5200....', main_dir, test_dir);
                resolve();
            });
        });
    }
}
