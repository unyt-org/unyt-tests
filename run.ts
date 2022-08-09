import { UnytTests } from "./tests.js";

declare let process:any;

// load test script
const file_path = (process.argv[2]?.startsWith("/")?"":"../") + process.argv[2];
await import(file_path);

// run tests
await UnytTests.local();
await UnytTests.runAllTests();