import { Test, Assert } from "../testing/test.ts";

@Test({
	runConditions: {
		runtime: ['browser']
	},
	flags: ['worker']
}) export class JSTestGroup1 {
	
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


@Test export class JSTestGroup2 {
	
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

	@Test secondTest3() {
		Assert.equals(1,1)
	}
}

@Test("a test group cool") export class JSTestGroup3 {}
@Test("a test group cool yei") export class JSTestGroup4 {}