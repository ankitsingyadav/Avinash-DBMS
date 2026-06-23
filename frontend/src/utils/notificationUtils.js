// ── Shared notification utilities (used by Notificationspage + NotificationBell)

// ── localStorage helpers — cross-tab, per-session key: "orgId:interactionIndex"
const LS_KEY = "np_cancelled_interactions";

export const loadCancelledKeys = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(LS_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

const saveCancelledKeys = (set) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...set]));
  } catch {}
};

export const makeCancelKey = (orgId, interactionIndex) =>
  `${String(orgId)}:${interactionIndex}`;

export const addCancelledKey = (orgId, interactionIndex) => {
  const current = loadCancelledKeys();
  current.add(makeCancelKey(orgId, interactionIndex));
  saveCancelledKeys(current);
  return current;
};

export const isCancelled = (item, cancelledKeys) =>
  cancelledKeys.has(makeCancelKey(item._id, item.interactionIndex));

// ── Pick the SOONEST upcoming interaction per organisation ────────────────────
// API may return multiple interactions for the same org if several have
// nextInteractionDate within the 48h window. We show the most urgent one.
export const getSoonestPerOrg = (list) => {
  if (!list || list.length === 0) return [];

  const orgMap = {};

  list.forEach((item) => {
    const orgId = String(item._id);
    if (!orgMap[orgId]) {
      orgMap[orgId] = item;
      return;
    }
    const existingTime = new Date(orgMap[orgId].nextInteractionDate).getTime();
    const itemTime     = new Date(item.nextInteractionDate).getTime();
    if (itemTime < existingTime) {
      orgMap[orgId] = item;
    }
  });

  return Object.values(orgMap);
};
