# Unyt Test library

This test library supports `.ts`, `.js` and `.dx` test files.

## Write Tests for TypeScript and JavaScript

Example
```typescript

import { Assert } from "unyt_tests/testing/assertions.ts";
import { Test, Timeout } from "unyt_tests/testing/test.ts"


@Test class DatexJSONObjects {

	@Test(
		[1, 2, 3],
		[4, 4, 8],
		[6, 2, 8]
	) 
	sumIsCorrect(a:number, b:number, sum:number){
		Assert.equalsStrict(a+b, sum)
	}

	@Test
	testWithOutParameters(){
		Assert.true(true)
	}

	@Test
	@Timeout(10*60) 
	longDurationTest(){
		// test can take up to 10 minutes (10*60s) to complete
	}
}
```


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
 * `--color` or `-c`: Set the color mode of the output ("rgb", "simple", or "none")
 * `--reporttype`: Set the type for the report file generation, currently supported types: "junit"
 * `--reportfile`: Set the path for the report output. When this option is set, a report is generated after all tests are finished.
 * `--watch` or `-w`: TODO
 * `--verbose` or `-v`: verbose output for debugging purposes

## Development
Development follows the flow of unyt_core and uix
