import { afterEach, describe, expect, it, vi } from "vitest";
import { GuestCommandAction } from "../src/actions/guest-command.js";
import { selectedTargetStore, sessionStore, vdoClient } from "../src/services.js";

describe("guest confirmation and selection", () => {
	afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); selectedTargetStore.clear(); });
	it.each([false, true])("requires confirmation for changed selection=%s", async changed => {
		vi.useFakeTimers();
		vi.spyOn(sessionStore, "getStreamChoices").mockReturnValue([
			{ streamID: "guest-a", UUID: "uuid-a", label: "A" },
			{ streamID: "guest-b", UUID: "uuid-b", label: "B" }
		]);
		const send = vi.spyOn(vdoClient, "sendCommand").mockResolvedValue({ result: true });
		selectedTargetStore.setSelectedStreamID("guest-a");
		const handler = new GuestCommandAction();
		const action = { id: "selection-confirmation", isKey: () => true, setImage: vi.fn(), setTitle: vi.fn(), setState: vi.fn(), showOk: vi.fn(), showAlert: vi.fn() };
		const event = { action, payload: { settings: { command: "hangup", targetMode: "selected" } } } as never;
		await handler.onKeyDown(event);
		expect(send).not.toHaveBeenCalled();
		if (changed) selectedTargetStore.setSelectedStreamID("guest-b");
		await handler.onKeyDown(event);
		if (changed) {
			expect(send).not.toHaveBeenCalled();
			expect(action.setTitle).toHaveBeenLastCalledWith("Press\nagain");
			await handler.onKeyDown(event);
		}
		expect(send).toHaveBeenCalledOnce();
		expect(send.mock.calls[0][0]).toEqual({ action: "hangup", target: changed ? "uuid-b" : "uuid-a" });
	});
});
