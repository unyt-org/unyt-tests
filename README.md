# Unyt Test library

This test library supports `.ts`, `.js` and `.dx` test files.

## Write Tests for TS/JS




## Run tests in the command line

Test directory
```bash
./run path_to_tests_directory
./run --path path_to_tests_directory
```

Multiple Test files
```bash
./run testA.ts testB.js testC.js testD.dx
```

### Options
 * `--color` or `-c`: Set the color mode of the output ("rgb", "simple", or "none2)
 * `--reporttype`: Set the type for the report file generation, currently supported types: "junit"
 * `--reportfile`: Set the path for the report output. When this option is set, a report is generated after all tests are finished.
 * `--watch` or `-w`: TODO
 * `--verbose` or `-v`: verbose output for debugging purposes