import { Test, Assert } from "unyt_tests/testing/test.ts";
import { testLogger } from "unyt_tests/core/logger.ts";

@Test export class OtherTest {
	
	
	@Test firstTest() {
		testLogger.log("hello");
		Assert.equals(4,5)
	}

	@Test secondTest() {
		Assert.equals(1,1)
	}
}