import { afterEach, expect, it, vi } from "vitest";

vi.mock("@elgato/streamdeck", () => ({ default: {
	settings: { getGlobalSettings: vi.fn(async () => ({ apiKey: "test-only" })), onDidReceiveGlobalSettings: vi.fn() },
	ui: { onSendToPlugin: vi.fn(), sendToPropertyInspector: vi.fn() }
} }));

afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); });

it("tests the page again instead of reporting a cached connected state", async () => {
	vi.useFakeTimers();
	const { default: sdk } = await import("@elgato/streamdeck");
	const { initializeServices, vdoClient } = await import("../src/services.js");
	vi.spyOn(vdoClient, "configure").mockImplementation(() => undefined);
	vi.spyOn(vdoClient, "sendCommand").mockResolvedValue({ result: true });
	await initializeServices();
	const client = vdoClient as unknown as { setState(state: string): void };
	client.setState("connected");
	const send = vi.mocked(vdoClient.sendCommand).mockImplementation(async () => {
		client.setState("no-page");
		throw new Error("No page");
	});
	send.mockClear();
	const listener = vi.mocked(sdk.ui.onSendToPlugin).mock.calls[0][0];
	await listener({ payload: { type: "testConnection" } } as never);
	const replies = vi.mocked(sdk.ui.sendToPropertyInspector).mock.calls.map(call => call[0]);
	expect(send).toHaveBeenCalledWith({ action: "getDetails" });
	expect(replies).toContainEqual(expect.objectContaining({ type: "connectionTestResult", ok: false, state: "no-page" }));
});

it.each([false, true])("WebSocket connection test requires a fresh reply: %s", async reply => {
	vi.useFakeTimers();
	const { default: sdk } = await import("@elgato/streamdeck");
	vi.mocked(sdk.settings.getGlobalSettings).mockResolvedValue({ apiKey: "test-only", httpFallback: false });
	const { initializeServices, vdoClient } = await import("../src/services.js");
	vi.spyOn(vdoClient, "configure").mockImplementation(() => undefined);
	vi.spyOn(vdoClient, "sendCommand").mockResolvedValue({});
	await initializeServices();
	const client = vdoClient as unknown as { setState(state: string): void; handleMessage(raw: string): void };
	client.setState("connected");
	const listener = vi.mocked(sdk.ui.onSendToPlugin).mock.calls.at(-1)![0];
	const result = listener({ payload: { type: "testConnection" } } as never);
	await vi.advanceTimersByTimeAsync(1);
	if (reply) client.handleMessage(JSON.stringify({ update: { action: "details" } }));
	await vi.advanceTimersByTimeAsync(6500);
	await result;
	expect(vi.mocked(sdk.ui.sendToPropertyInspector).mock.calls.at(-1)![0]).toMatchObject({ type: "connectionTestResult", ok: reply });
});
