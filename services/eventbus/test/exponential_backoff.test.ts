import { afterEach, describe, expect, it, vi } from "vitest";
import { ExponentialBackoff } from "../src";

describe("ExponentialBackoff", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("uses default values when inputs are zero or invalid", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const backoff = new ExponentialBackoff(0, 0, 0);

		expect(backoff.currentDelay).toBe(0);
		expect(backoff.nextDelay()).toBe(ExponentialBackoff.DEFAULT_MIN_DELAY);
		expect(backoff.nextDelay()).toBe(
			ExponentialBackoff.DEFAULT_MIN_DELAY *
				ExponentialBackoff.DEFAULT_MULTIPLIER,
		);
	});

	it("uses the default multiplier when the multiplier is below one", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const backoff = new ExponentialBackoff(50, 1000, 0.5);

		expect(backoff.nextDelay()).toBe(50);
		expect(backoff.nextDelay()).toBe(100);
	});

	it("ensures the maximum delay is not less than the minimum delay", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const backoff = new ExponentialBackoff(500, 200, 2);

		expect(backoff.nextDelay()).toBe(500);
		expect(backoff.nextDelay()).toBe(500);
	});

	it("starts at the minimum delay and adds jitter", () => {
		vi.spyOn(Math, "random").mockReturnValue(0.5);
		const backoff = new ExponentialBackoff(200, 2000, 2);

		const delay = backoff.nextDelay();

		expect(backoff.currentDelay).toBe(200);
		expect(delay).toBe(210);
		expect(backoff.retryCount).toBe(1);
	});

	it("doubles each retry until it reaches the maximum delay", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const backoff = new ExponentialBackoff(100, 250, 2);

		expect(backoff.nextDelay()).toBe(100);
		expect(backoff.currentDelay).toBe(100);

		expect(backoff.nextDelay()).toBe(200);
		expect(backoff.currentDelay).toBe(200);

		expect(backoff.nextDelay()).toBe(250);
		expect(backoff.currentDelay).toBe(250);
	});

	it("resets to zero and starts the sequence again", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const backoff = new ExponentialBackoff(150, 5000, 3);

		backoff.nextDelay();
		backoff.nextDelay();
		backoff.reset();

		expect(backoff.currentDelay).toBe(0);
		expect(backoff.retryCount).toBe(0);
		expect(backoff.nextDelay()).toBe(150);
		expect(backoff.currentDelay).toBe(150);
	});
});
