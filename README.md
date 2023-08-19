# Unyt Test library

This test library supports `.ts`, `.js` and `.dx` test files.

## Write Tests for TypeScript and JavaScript

Example
```typescript

import { Assert } from "unyt_tests/testing/assertions.ts";
import { Test, Timeout } from "unyt_tests/testing/test.ts"

@Test export class DatexJSONObjects {

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
	async longDurationTest(){
		// test can take up to 10 minutes (10*60s) to complete
	}
}
```


## Run tests in the command line

Test directory
```bash
deno run -Aq --import-map [IMPORT_MAP] https://dev.cdn.unyt.org/unyt_tests/run.ts [TEST_DIRECTORY]
```
As a default IMPORT_MAP path, `https://dev.cdn.unyt.org/unyt_tests/importmap.dev.json` can be used.

Multiple Test files
```bash
deno run -Aq --import-map [IMPORT_MAP] https://dev.cdn.unyt.org/unyt_tests/run.ts testA.ts testB.js testC.js testD.dx
```

### Options
See <RUN.md> or run 
```bash
deno run -Aq --import-map [IMPORT_MAP] https://dev.cdn.unyt.org/unyt_tests/run.ts -h
```

## Development

To test the test library locally, run
```bash
deno run -Aq --import-map ./importmap.local.json ./run.ts test_examples/
```