import { Test, Assert } from "unyt_tests";

@Test export class OtherTest {
	
	@Test firstTest() {
		Assert.equals(4,4)
	}

	@Test secondTest() {
		Assert.equals(1,1)
	}
}