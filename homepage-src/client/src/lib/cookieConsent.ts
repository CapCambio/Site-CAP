export const cookieConsentStorageKey = "cap-cookie-consent";
export const cookieConsentEventName = "cap-cookie-consent";
export type CookieConsentChoice = "accepted" | "declined";

type ConsentStorage = Pick<Storage, "getItem" | "setItem">;

export function getCookieConsentChoice(storage: Pick<Storage, "getItem">): CookieConsentChoice | null {
  const storedChoice = storage.getItem(cookieConsentStorageKey);
  return storedChoice === "accepted" || storedChoice === "declined" ? storedChoice : null;
}

export function hasCookieConsent(storage: Pick<Storage, "getItem">) {
  return getCookieConsentChoice(storage) === "accepted";
}

export function hasCookiePreference(storage: Pick<Storage, "getItem">) {
  return getCookieConsentChoice(storage) !== null;
}

export function rememberCookieConsent(storage: ConsentStorage, choice: CookieConsentChoice) {
  storage.setItem(cookieConsentStorageKey, choice);
}
