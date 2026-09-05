import { describe, expect, it, vi } from "vitest";
import { setCommandIcon } from "../src/actions/command-icon.js";

describe("command artwork update ordering", () => {
	it("does not restore an old on-image after the command changes", async () => {
		let release!: () => void;
		const setImage = vi.fn().mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve; })).mockResolvedValue(undefined);
		const action = { setImage } as never;
		const old = setCommandIcon(action, "mic");
		await setCommandIcon(action, "camera");
		release();
		await old;
		expect(setImage.mock.calls).toEqual([
			["imgs/command-mic-off.png", { state: 0 }],
			["imgs/command-camera-off.png", { state: 0 }],
			["imgs/command-camera-on.png", { state: 1 }]
		]);
	});

	it("keeps the new command cached when an older update fails", async () => {
		let fail!: (error: Error) => void;
		const setImage = vi.fn().mockImplementationOnce(() => new Promise<void>((resolve, reject) => { fail = reject; })).mockResolvedValue(undefined);
		const action = { setImage } as never;
		const old = setCommandIcon(action, "mic");
		const rejected = expect(old).rejects.toThrow("old image failed");
		await setCommandIcon(action, "camera");
		fail(new Error("old image failed"));
		await rejected;
		await setCommandIcon(action, "camera");
		expect(setImage).toHaveBeenCalledTimes(3);
	});
});
