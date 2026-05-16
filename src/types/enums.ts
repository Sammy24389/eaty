export const Activity = { ENABLE: 5, DISABLE: 10 } as const;
export const AddressType = { HOME: 5, WORK: 10, OTHER: 15 } as const;
export const AnalyticSection = { HEAD: 5, BODY: 10, FOOTER: 15 } as const;
export const Ask = { YES: 5, NO: 10 } as const;
export const CurrencyPosition = { LEFT: 5, RIGHT: 10 } as const;
export const DiscountType = { FIXED: 5, PERCENTAGE: 10 } as const;
export const DisplayMode = { LTR: 5, RTL: 10 } as const;
export const GatewayMode = { SANDBOX: 5, LIVE: 10 } as const;
export const InputType = { TEXT: 5, SELECT: 10 } as const;
export const IsAdvance = { YES: 5, NO: 10 } as const;
export const ItemType = { VEG: 5, NON_VEG: 10 } as const;
export const MenuType = { BACKEND: 1, FRONTEND: 2 } as const;
export const NotificationType = { SINGLE: 5, ALL: 10 } as const;
export const OrderStatus = {
  PENDING: 1,
  ACCEPT: 4,
  PREPARING: 7,
  PREPARED: 8,
  OUT_FOR_DELIVERY: 10,
  DELIVERED: 13,
  CANCELED: 16,
  REJECTED: 19,
  RETURNED: 22,
} as const;
export const OrderType = { DELIVERY: 5, TAKEAWAY: 10, POS: 15 } as const;
export const PaymentGateway = {
  CASH_ON_DELIVERY: 1,
  E_WALLET: 2,
  PAYPAL: 3,
  STRIPE: 4,
  PAYSTACK: 5,
  FLUTTERWAVE: 6,
} as const;
export const PaymentStatus = { PAID: 5, UNPAID: 10 } as const;
export const PosPaymentMethod = {
  CASH: 1,
  CARD: 2,
  MOBILE_BANKING: 3,
  OTHER: 4,
} as const;
export const UserRole = {
  ADMIN: 1,
  CUSTOMER: 2,
  DELIVERY_BOY: 3,
  WAITER: 4,
  CHEF: 5,
  BRANCH_MANAGER: 6,
  POS_OPERATOR: 7,
  STUFF: 8,
} as const;
export const Source = { WEB: 5, APP: 10, POS: 15 } as const;
export const Status = { ACTIVE: 5, INACTIVE: 10 } as const;
export const SwitchBox = { ON: 5, OFF: 10 } as const;
export const TaxType = { FIXED: 5, PERCENTAGE: 10 } as const;
