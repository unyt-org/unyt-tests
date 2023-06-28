import { Test, Assert } from "unyt_tests/testing/test.ts";

@Test({
	runConditions: {
		runtime: ['browser']
	},
	flags: ['wosrker']
}) export class JSTestGroup1A {
	
	throwing() {
		throw new Error("2")

	}

	@Test([
		[1,2]
	]) 
	async firstTest(a:number, b:number) {
		// await new Promise(resolve=>setTimeout(resolve,3000))
		Assert.equals(a*2, b)
	}

	@Test secondTest() {
		Assert.equals(1,1)
	}
}


@Test export class JSTestGroup2A {
	
	@Test([
		[()=>{throw 'x'}], 
		[()=>{throw 'x'}], 
	]) 
	firstTest(f:Function) {
		Assert.throws(f)
	}

	@Test secondTest() {
		Assert.equals(1,1)
	}

	@Test secondTest_() {
		Assert.equals(1,1)
	}
}

@Test("a test group cool") export class JSTestGroup3 {}
@Test("a test group cool yei") export class JSTestGroup4 {}