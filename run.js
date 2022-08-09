import { UnytTests } from "./tests.js";
const file_path = (process.argv[2]?.startsWith("/") ? "" : "../") + process.argv[2];
await import(file_path);
await UnytTests.local();
await UnytTests.runAllTests();
