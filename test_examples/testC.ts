import { Test, Assert } from "../testing/test.ts";

@Test export class OtherTest {
	
	@Test firstTest() {
		Assert.equals(4,5)
	}

	@Test secondTest() {
		Assert.equals(1,1)
	}
}