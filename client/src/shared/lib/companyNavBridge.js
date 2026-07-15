/**
 * Lets company HomeScreens intercept shared CompanyDemoApp navigation
 * for native UI routes.
 */

/** @type {{ openCreditCardPin?: () => void } | null} */
let sbiHandler = null;

export function registerSbiNavHandler(handler) {
  sbiHandler = handler;
}

export function unregisterSbiNavHandler() {
  sbiHandler = null;
}

/** @returns {boolean} true if handled by SBI HomeScreen */
export function tryOpenSbiCreditCardPin() {
  if (!sbiHandler?.openCreditCardPin) return false;
  sbiHandler.openCreditCardPin();
  return true;
}
