import { afterEach, describe, expect, it, vi } from "vitest";
import { VdoClient } from "../src/api/vdo-client.js";

describe("connection lifecycle", () => {
	afterEach(() => vi.unstubAllGlobals());

	it.each(["true", "failed", "timeout"])("ignores an old HTTP %s response after removing the key", async body => {
		const client = new VdoClient();
		vi.spyOn(client, "connect").mockImplementation(() => undefined);
		client.configure({ apiKey: "test-only" });
		let respond!: (response: Response) => void;
		vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(resolve => { respond = resolve; })));
		const callback = vi.fn();
		client.onCallback(callback);
		const request = client.sendCommand({ action: "getDetails" });
		client.configure({ apiKey: "" });
		respond(new Response(body));
		await expect(request).rejects.toThrow();
		expect(callback).not.toHaveBeenCalled();
		expect(client.connectionState).toBe("missing-key");
	});

	it("ignores old network errors after disconnect", async () => {
		const client = new VdoClient();
		vi.spyOn(client, "connect").mockImplementation(() => undefined);
		client.configure({ apiKey: "test-only" });
		let reject!: (error: Error) => void;
		vi.stubGlobal("fetch", vi.fn(() => new Promise((_resolve, fail) => { reject = fail; })));
		const request = client.sendCommand({ action: "getDetails" });
		client.disconnect();
		reject(new Error("Old request failed"));
		await expect(request).rejects.toThrow();
		expect(client.connectionState).toBe("disconnected");
	});

	it("ignores invalid relay envelopes without crashing or claiming a page answered", () => {
		const client = new VdoClient();
		const receive = (client as unknown as { handleMessage(raw: string): void }).handleMessage.bind(client);
		for (const message of [null, [], 3, "hello", { callback: [] }, { update: "bad" }, { msg: [] }]) {
			expect(() => receive(JSON.stringify(message))).not.toThrow();
		}
		expect(client.connectionState).toBe("missing-key");
	});
});
