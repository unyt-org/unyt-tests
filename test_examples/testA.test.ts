import { Test, Assert } from "../testing/test.ts";

@Test({
	runConditions: {
		runtime: ['node']
	},
	flags: ['wo rker']
}) export class JSTestGroup1 {
	
	@Test([
		[1,2], 
		[2,4], 
		[3,6]
	]) 
	firstTest(a:number, b:number) {
		Assert.equals(a*2, b)
	}

	@Test secondTest() {
		Assert.equals(1,1)
	}
}

@Test({
	flags: ['wor ker', 'x']
}) export class JSTestGroup2 {
	
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