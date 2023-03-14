import { Test, Assert } from "unyt_tests";

@Test class JSTestGroup1 {
	
	@Test(
		[1,2], 
		[2,4], 
		[3,7]
	) 
	firstTest(a:number, b:number) {
		Assert.equals(a*2, b)
	}

	@Test secondTest() {
		Assert.equals(1,1)
	}
}