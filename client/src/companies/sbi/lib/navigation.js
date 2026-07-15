/**
 * SBI YONO — native screen routing for home loan concierge demo.
 */

/** @typedef {'credit_card_pin'} SbiOverlay */

/**
 * @param {string} destination
 * @returns {{ overlay: SbiOverlay } | { tab: 'loans' } | null}
 */
export function resolveSbiNativeDestination(destination) {
  switch (destination) {
    case 'credit_card':
      return { overlay: 'credit_card_pin' };
    case 'loans':
      return { tab: 'loans' };
    default:
      return null;
  }
}

/**
 * Apply a native SBI navigation target.
 * @param {{ overlay?: SbiOverlay, tab?: string } | null} target
 * @param {{ setOverlay: (v: string|null) => void, setBottomTab: (v: string) => void, closeAi?: () => void }} actions
 * @returns {boolean}
 */
export function applySbiNativeNavigation(target, actions) {
  if (!target) return false;
  actions.closeAi?.();
  if (target.overlay) {
    actions.setOverlay(target.overlay);
    actions.setBottomTab('home');
    return true;
  }
  if (target.tab) {
    actions.setBottomTab(target.tab);
    actions.setOverlay(null);
    return true;
  }
  return false;
}
