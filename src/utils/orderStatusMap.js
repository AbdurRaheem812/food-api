export const STATUS_TRANSITIONS = {
  ACCEPTED:         { allowedRoles: ['OWNER'], from: ['PENDING'] },
  REJECTED:         { allowedRoles: ['OWNER'], from: ['PENDING'], requiresReason: true },
  PREPARING:        { allowedRoles: ['OWNER'], from: ['ACCEPTED'] },
  OUT_FOR_DELIVERY: { allowedRoles: ['OWNER'], from: ['PREPARING'] },
  DELIVERED:        { allowedRoles: ['OWNER'], from: ['OUT_FOR_DELIVERY'] },
  CANCELLED:        { allowedRoles: ['CUSTOMER'], from: ['PENDING'] },
};

export const isValidTransition = (currentStatus, newStatus) => {
  const rule = STATUS_TRANSITIONS[newStatus];
  if (!rule) return false;
  return rule.from.includes(currentStatus);
};

export const getTransitionRule = (newStatus) => STATUS_TRANSITIONS[newStatus];