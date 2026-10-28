import { afterEach, describe, expect, it } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { AccountLocaleProvider } from "@/components/i18n/account-locale-provider";
import { useDirection } from "@/components/ui/direction";

function Probe() {
  const t = useTranslations("Navigation");
  const direction = useDirection();
  return <p data-testid="locale-probe">{t("connections")} / {direction}</p>;
}

afterEach(() => cleanup());

describe("account-scoped localization", () => {
  it("renders Arabic UI, sets document direction and restores it after sign-out", () => {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
    const { unmount } = render(<AccountLocaleProvider locale="ar"><Probe /></AccountLocaleProvider>);
    expect(screen.getByTestId("locale-probe")).toHaveTextContent("جهات الاتصال / rtl");
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
    unmount();
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
  });
});
