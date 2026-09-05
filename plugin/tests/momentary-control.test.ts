import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalControlAction } from "../src/actions/local-control.js";
import { vdoClient } from "../src/services.js";

function key() {
	return { id: "momentary-test", isKey: () => true, setImage: vi.fn(), setTitle: vi.fn(), setState: vi.fn(), showAlert: vi.fn() };
}

describe("momentary microphone lifecycle", () => {
	afterEach(() => vi.restoreAllMocks());
	it("orders release after an outstanding press request", async () => {
		let finish!: () => void;
		const send = vi.spyOn(vdoClient, "sendCommand")
			.mockImplementationOnce(() => new Promise(resolve => { finish = () => resolve({ result: true }); }))
			.mockResolvedValue({ result: true });
		const handler = new LocalControlAction();
		const action = key();
		const event = { action, payload: { settings: { command: "mic", behavior: "pushToTalk" } } } as never;
		const down = handler.onKeyDown(event);
		await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
		const up = handler.onKeyUp(event);
		await Promise.resolve();
		expect(send).toHaveBeenCalledTimes(1);
		finish();
		await Promise.all([down, up]);
		expect(send.mock.calls.map(call => call[0].value)).toEqual([true, false]);
	});

	it("releases the original mic behavior when settings change while held", async () => {
		const send = vi.spyOn(vdoClient, "sendCommand").mockResolvedValue({ result: true });
		const handler = new LocalControlAction();
		const action = key();
		await handler.onKeyDown({ action, payload: { settings: { command: "mic", behavior: "pushToTalk" } } } as never);
		await handler.onDidReceiveSettings({ action, payload: { settings: { command: "camera", behavior: "toggle" } } } as never);
		expect(send.mock.calls.map(call => call[0])).toEqual([{ action: "mic", value: true }, { action: "mic", value: false }]);
	});

	it.each(["pushToTalk", "pushToMute"])("releases %s when the key disappears", async behavior => {
		const send = vi.spyOn(vdoClient, "sendCommand").mockResolvedValue({ result: true });
		const handler = new LocalControlAction();
		const action = key();
		await handler.onKeyDown({ action, payload: { settings: { command: "mic", behavior } } } as never);
		await handler.onWillDisappear({ action: { id: action.id } } as never);
		expect(send.mock.calls.map(call => call[0].value)).toEqual(behavior === "pushToTalk" ? [true, false] : [false, true]);
	});
});
