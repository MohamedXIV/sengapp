import { describe, expect, it } from "vitest";
import {
  EXPERIENCE_COOKIE, classicDestination, cozyDestination,
  preferredExperience, validConversationId,
} from "@/lib/experience";

const conversation = "k17e6ac9r36sqx085qf7eg8zzh7cbaz9";

describe("per-device experience routing", () => {
  it("defaults to Cozy; only an exact classic preference changes the home", () => {
    expect(EXPERIENCE_COOKIE).toBe("sengapp-experience");
    expect(preferredExperience(undefined)).toBe("cozy");
    expect(preferredExperience("classic")).toBe("classic");
    expect(preferredExperience("CLASSIC")).toBe("cozy");
    expect(preferredExperience("ship")).toBe("cozy");
  });

  it("keeps shared-feature context when switching to Classic", () => {
    expect(classicDestination("chats", conversation)).toBe(`/chats/${conversation}`);
    expect(classicDestination("chats")).toBe("/chats");
    expect(classicDestination("connections")).toBe("/connections");
    expect(classicDestination("profile")).toBe("/settings/profile");
    expect(classicDestination("appearance")).toBe("/settings/appearance");
    expect(classicDestination("notes")).toBe("/classic");
  });

  it("keeps shared-feature context when switching to Cozy", () => {
    expect(cozyDestination(`/chats/${conversation}`))
      .toBe(`/?panel=chats&conversation=${conversation}`);
    expect(cozyDestination("/chats")).toBe("/?panel=chats");
    expect(cozyDestination("/connections")).toBe("/?panel=connections");
    expect(cozyDestination("/settings/profile")).toBe("/?panel=profile");
    expect(cozyDestination("/settings/appearance")).toBe("/?panel=appearance");
    expect(cozyDestination("/classic")).toBe("/");
  });

  it("rejects arbitrary strings as conversation deep links", () => {
    expect(validConversationId(conversation)).toBe(true);
    expect(validConversationId("/logout?x=1")).toBe(false);
    expect(classicDestination("chats", "../settings/profile")).toBe("/chats");
    expect(cozyDestination("/chats/../../login")).toBe("/");
  });
});
