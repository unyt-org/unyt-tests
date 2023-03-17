import { Test, Assert } from "unyt_tests";

@Test class JSTestGroup1 {
	
	@Test(
		[1,2], 
		[2,5], 
		[3,7]
	) 
	firstTest(a:number, b:number) {
		Assert.equals(a*2, b)
	}

	@Test secondTest() {
		Assert.equals(1,1)
	}
}

@Test export class JSTestGroup2 {
	
	@Test(
		[()=>{throw 'x'}], 
		[()=>{throw 'x'}], 
		[()=>{throw 'x'}], 
		[()=>{throw 'x'}], 
		[()=>{return 'x'}], 
	) 
	firstTest(f:Function) {
		Assert.throws(f)
	}

	@Test secondTest() {
		Assert.equals(1,1)
	}

	@Test secondTest3 = () => {
		Assert.equals(1,1)
	}
}