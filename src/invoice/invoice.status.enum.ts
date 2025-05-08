export enum InvoiceStatus {
  PENDING = 'pending', // Invoice generated, awaiting payment
  PAID = 'paid', // Invoice paid successfully
  FAILED = 'failed', // Payment attempt failed
  CANCELLED = 'cancelled', // Invoice cancelled (e.g., subscription cancelled before payment)
  REFUNDED = 'refunded', // Invoice amount refunded
}
