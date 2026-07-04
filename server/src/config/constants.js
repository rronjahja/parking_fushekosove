// Konstantet e sistemit - nje burim i vetem i te vertetes per role dhe statuse.

export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  AGENT: 'AGENT',
  ADMIN: 'ADMIN',
  SUPERADMIN: 'SUPERADMIN',
};
export const STAFF_ROLES = [ROLES.AGENT, ROLES.ADMIN, ROLES.SUPERADMIN];
export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPERADMIN];

export const SPOT_STATUS = {
  FREE: 'free',
  RESERVED: 'reserved',
  OCCUPIED: 'occupied',
};

export const SPOT_TYPE = {
  STANDARD: 'standard',
  ACCESSIBLE: 'accessible', // vend per persona me aftesi te kufizuara
};

export const RESERVATION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  PENDING: 'pending',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const PAYMENT_METHOD = {
  SMS: 'sms',
  TERMINAL: 'terminal', // aparati / pika fizike e pageses
  CREDITS: 'credits',
};

export const CHAT_STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  CLOSED: 'closed',
};
