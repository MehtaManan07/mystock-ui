// API Configuration
// export const API_BASE_URL = "http://localhost:8000/api"
export const API_BASE_URL = "https://adminstock.duckdns.org/api"

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/users/login',
    REGISTER: '/users/register',
    ME: '/users/me',
  },
  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: number) => `/users/${id}`,
    BY_ROLE: '/users/role',
  },
  // Products
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id: number) => `/products/${id}`,
    BULK: '/products/bulk',
    LOOKUP_BY_SKUS: '/products/lookup-by-skus',
    IMAGES: (id: number) => `/products/${id}/images`,
    IMAGES_COPY_FROM: (id: number) => `/products/${id}/images/copy-from`,
    IMAGE_BY_ID: (productId: number, imageId: number) => `/products/${productId}/images/${imageId}`,
    IMAGES_REORDER: (id: number) => `/products/${id}/images/reorder`,
  },
  // Containers
  CONTAINERS: {
    BASE: '/containers',
    BY_ID: (id: number) => `/containers/${id}`,
    BULK: '/containers/bulk',
  },
  // Container Products (Inventory)
  CONTAINER_PRODUCTS: {
    SET_PRODUCTS: '/container-products/set-products',
    BY_CONTAINER: (id: number) => `/container-products/${id}/products`,
    BY_PRODUCT: (id: number) => `/container-products/product/${id}/containers`,
    TOTAL_QUANTITY: (id: number) => `/container-products/product/${id}/total-quantity`,
    SEARCH: '/container-products/search',
    ANALYTICS: '/container-products/analytics',
    MAP_PRODUCTS: '/container-products/map-products-to-ids',
    BY_PRODUCT_IDS: '/container-products/by-product-ids',
  },
  // Contacts
  CONTACTS: {
    BASE: '/contacts',
    BY_ID: (id: number) => `/contacts/${id}`,
  },
  // Transactions
  TRANSACTIONS: {
    BASE: '/transactions',
    SALES: '/transactions/sales',
    PURCHASES: '/transactions/purchases',
    BY_ID: (id: number) => `/transactions/${id}`,
    PAYMENTS: (id: number) => `/transactions/${id}/payments`,
    INVOICE_METADATA: (id: number) => `/transactions/${id}/invoice/metadata`,
    INVOICE_GENERATE: (id: number) => `/transactions/${id}/invoice/generate`,
    INVOICE_DOWNLOAD: (id: number) => `/transactions/${id}/invoice/download`,
  },
  // Payments
  PAYMENTS: {
    BASE: '/payments',
    BY_ID: (id: number) => `/payments/${id}`,
    SUMMARY: '/payments/summary',
    CATEGORIES: '/payments/suggested-categories',
  },
  // Inventory Logs
  INVENTORY_LOGS: {
    BASE: '/inventory-logs',
    BY_PRODUCT: (id: number) => `/inventory-logs/product/${id}`,
    BY_CONTAINER: (id: number) => `/inventory-logs/container/${id}`,
    BULK: '/inventory-logs/bulk',
  },
  // Dashboard
  DASHBOARD: {
    BASE: '/dashboard',
  },
  // Drafts
  DRAFTS: {
    BASE: '/drafts',
    BY_ID: (id: number) => `/drafts/${id}`,
    COMPLETE: (id: number) => `/drafts/${id}/complete`,
  },
} as const;

// React Query Base Keys — single source of truth for all string literals used in query keys
export const QUERY_KEY_BASE = {
  // Entity identifiers
  CURRENT_USER: 'currentUser',
  USERS: 'users',
  PRODUCTS: 'products',
  CONTAINERS: 'containers',
  CONTAINER_PRODUCTS: 'containerProducts',
  PRODUCT_CONTAINERS: 'productContainers',
  PRODUCT_TOTAL_QTY: 'productTotalQty',
  INVENTORY_ANALYTICS: 'inventoryAnalytics',
  CONTAINER_SEARCH: 'containerSearch',
  CONTACTS: 'contacts',
  TRANSACTIONS: 'transactions',
  TRANSACTION_PAYMENTS: 'transactionPayments',
  INVOICE_METADATA: 'invoiceMetadata',
  PAYMENTS: 'payments',
  PAYMENT_SUMMARY: 'paymentSummary',
  PAYMENT_CATEGORIES: 'paymentCategories',
  INVENTORY_LOGS: 'inventoryLogs',
  DASHBOARD: 'dashboard',
  DRAFTS: 'drafts',
  SETTINGS: 'settings',
  // Segment qualifiers (sub-keys within an entity's key hierarchy)
  INFINITE: 'infinite',
  BATCH: 'batch',
  COMPLETE: 'complete',
  PRODUCT: 'product',
  CONTAINER: 'container',
} as const;

// React Query Keys
export const QUERY_KEYS = {
  // Auth
  CURRENT_USER: [QUERY_KEY_BASE.CURRENT_USER] as const,

  // Users
  USERS: [QUERY_KEY_BASE.USERS] as const,
  USERS_LIST: (search?: string) =>
    search ? [QUERY_KEY_BASE.USERS, search] : [QUERY_KEY_BASE.USERS],
  USER: (id: number) => [QUERY_KEY_BASE.USERS, id] as const,

  // Products
  PRODUCTS: [QUERY_KEY_BASE.PRODUCTS] as const,
  PRODUCTS_LIST: (search?: string) =>
    search ? [QUERY_KEY_BASE.PRODUCTS, search] : [QUERY_KEY_BASE.PRODUCTS],
  PRODUCTS_INFINITE: (search?: string) =>
    search
      ? [QUERY_KEY_BASE.PRODUCTS, QUERY_KEY_BASE.INFINITE, search]
      : [QUERY_KEY_BASE.PRODUCTS, QUERY_KEY_BASE.INFINITE],
  PRODUCTS_BATCH: (skus: string[]) =>
    [QUERY_KEY_BASE.PRODUCTS, QUERY_KEY_BASE.BATCH, skus.slice().sort().join(',')],
  PRODUCT: (id: number) => [QUERY_KEY_BASE.PRODUCTS, id] as const,
  PRODUCT_BY_SKU: (sku: string) => [QUERY_KEY_BASE.PRODUCTS, sku],

  // Containers
  CONTAINERS: [QUERY_KEY_BASE.CONTAINERS] as const,
  CONTAINERS_LIST: (search?: string) =>
    search ? [QUERY_KEY_BASE.CONTAINERS, search] : [QUERY_KEY_BASE.CONTAINERS],
  CONTAINERS_INFINITE: (search?: string) =>
    search
      ? [QUERY_KEY_BASE.CONTAINERS, QUERY_KEY_BASE.INFINITE, search]
      : [QUERY_KEY_BASE.CONTAINERS, QUERY_KEY_BASE.INFINITE],
  CONTAINER: (id: number) => [QUERY_KEY_BASE.CONTAINERS, id] as const,

  // Container Products
  CONTAINER_PRODUCTS: (containerId: number) =>
    [QUERY_KEY_BASE.CONTAINER_PRODUCTS, containerId] as const,
  CONTAINER_SEARCH: (sku?: string) =>
    sku ? [QUERY_KEY_BASE.CONTAINER_SEARCH, sku] : [QUERY_KEY_BASE.CONTAINER_SEARCH],
  PRODUCT_CONTAINERS: (productId: number) =>
    [QUERY_KEY_BASE.PRODUCT_CONTAINERS, productId] as const,
  PRODUCT_TOTAL_QTY: (productId: number) =>
    [QUERY_KEY_BASE.PRODUCT_TOTAL_QTY, productId] as const,
  INVENTORY_ANALYTICS: [QUERY_KEY_BASE.INVENTORY_ANALYTICS] as const,

  // Contacts
  CONTACTS: [QUERY_KEY_BASE.CONTACTS] as const,
  CONTACTS_INFINITE: (filters?: object) =>
    filters
      ? [QUERY_KEY_BASE.CONTACTS, QUERY_KEY_BASE.INFINITE, filters]
      : [QUERY_KEY_BASE.CONTACTS, QUERY_KEY_BASE.INFINITE],
  CONTACT: (id: number) => [QUERY_KEY_BASE.CONTACTS, id] as const,

  // Transactions
  TRANSACTIONS: [QUERY_KEY_BASE.TRANSACTIONS] as const,
  TRANSACTIONS_LIST: (filters?: object) =>
    filters ? [QUERY_KEY_BASE.TRANSACTIONS, filters] : [QUERY_KEY_BASE.TRANSACTIONS],
  TRANSACTIONS_INFINITE: (filters?: object) =>
    filters
      ? [QUERY_KEY_BASE.TRANSACTIONS, QUERY_KEY_BASE.INFINITE, filters]
      : [QUERY_KEY_BASE.TRANSACTIONS, QUERY_KEY_BASE.INFINITE],
  TRANSACTION: (id: number) => [QUERY_KEY_BASE.TRANSACTIONS, id] as const,
  TRANSACTION_PAYMENTS: (id: number) =>
    [QUERY_KEY_BASE.TRANSACTION_PAYMENTS, id] as const,
  INVOICE_METADATA: (id: number) => [QUERY_KEY_BASE.INVOICE_METADATA, id] as const,

  // Payments
  PAYMENTS: [QUERY_KEY_BASE.PAYMENTS] as const,
  PAYMENTS_LIST: (filters?: object) =>
    filters ? [QUERY_KEY_BASE.PAYMENTS, filters] : [QUERY_KEY_BASE.PAYMENTS],
  PAYMENTS_INFINITE: (filters?: object) =>
    filters
      ? [QUERY_KEY_BASE.PAYMENTS, QUERY_KEY_BASE.INFINITE, filters]
      : [QUERY_KEY_BASE.PAYMENTS, QUERY_KEY_BASE.INFINITE],
  PAYMENT: (id: number) => [QUERY_KEY_BASE.PAYMENTS, id] as const,
  PAYMENT_SUMMARY: [QUERY_KEY_BASE.PAYMENT_SUMMARY] as const,
  PAYMENT_SUMMARY_RANGE: (fromDate?: string, toDate?: string) =>
    [QUERY_KEY_BASE.PAYMENT_SUMMARY, fromDate, toDate],
  PAYMENT_CATEGORIES: [QUERY_KEY_BASE.PAYMENT_CATEGORIES] as const,

  // Inventory Logs
  INVENTORY_LOGS: [QUERY_KEY_BASE.INVENTORY_LOGS] as const,
  PRODUCT_LOGS: (productId: number) =>
    [QUERY_KEY_BASE.INVENTORY_LOGS, QUERY_KEY_BASE.PRODUCT, productId] as const,
  CONTAINER_LOGS: (containerId: number) =>
    [QUERY_KEY_BASE.INVENTORY_LOGS, QUERY_KEY_BASE.CONTAINER, containerId] as const,

  // Dashboard
  DASHBOARD: [QUERY_KEY_BASE.DASHBOARD] as const,

  // Settings
  SETTINGS: [QUERY_KEY_BASE.SETTINGS] as const,

  // Drafts
  DRAFTS: [QUERY_KEY_BASE.DRAFTS] as const,
  DRAFTS_LIST: (type?: 'sale' | 'purchase') =>
    type ? [QUERY_KEY_BASE.DRAFTS, type] : [QUERY_KEY_BASE.DRAFTS],
  DRAFT: (id: number) => [QUERY_KEY_BASE.DRAFTS, id] as const,
  DRAFT_COMPLETE: (id: number) => [QUERY_KEY_BASE.DRAFTS, id, QUERY_KEY_BASE.COMPLETE],
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  JOBBER: 'JOBBER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Contact Types
export const CONTACT_TYPES = {
  CUSTOMER: 'customer',
  SUPPLIER: 'supplier',
  BOTH: 'both',
} as const;

export type ContactType = (typeof CONTACT_TYPES)[keyof typeof CONTACT_TYPES];

// Container Types
export const CONTAINER_TYPES = {
  SINGLE: 'single',
  MIXED: 'mixed',
} as const;

export type ContainerType = (typeof CONTAINER_TYPES)[keyof typeof CONTAINER_TYPES];

// Transaction Types
export const TRANSACTION_TYPES = {
  SALE: 'sale',
  PURCHASE: 'purchase',
} as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

// Payment Status
export const PAYMENT_STATUS = {
  PAID: 'paid',
  PARTIAL: 'partial',
  UNPAID: 'unpaid',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  UPI: 'upi',
  CHEQUE: 'cheque',
  CARD: 'card',
  OTHER: 'other',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

// Payment Types (Income/Expense)
export const PAYMENT_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const;

export type PaymentType = (typeof PAYMENT_TYPES)[keyof typeof PAYMENT_TYPES];

// Product Details Display Mode
export const PRODUCT_DETAILS_DISPLAY_MODE = {
  CUSTOMER_SKU: 'customer_sku',
  COMPANY_SKU: 'company_sku',
  PRODUCT_NAME: 'product_name',
} as const;

export type ProductDetailsDisplayMode = (typeof PRODUCT_DETAILS_DISPLAY_MODE)[keyof typeof PRODUCT_DETAILS_DISPLAY_MODE];

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'mystock_access_token',
  USER: 'mystock_user',
  THEME_MODE: 'mystock_theme_mode',
  TRANSACTION_DRAFTS: 'mystock_transaction_drafts',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;
