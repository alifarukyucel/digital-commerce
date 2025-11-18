// User types
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  username: string;
  displayName?: string;
}

// Product types
export interface Product {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string | null;
  priceCents: number;
  currency: string;
  coverImageUrl: string | null;
  productType: string;
  isPublished: boolean;
  salesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithFiles extends Product {
  files: ProductFile[];
}

export interface ProductFile {
  id: string;
  productId: string;
  fileName: string;
  fileSize: bigint | null;
  fileUrl: string;
  fileType: string | null;
  displayOrder: number;
  createdAt: string;
}

export interface CreateProductRequest {
  title: string;
  slug: string;
  description?: string;
  priceCents: number;
  currency?: string;
  productType: string;
  coverImageUrl?: string;
}

export interface UpdateProductRequest {
  title?: string;
  slug?: string;
  description?: string;
  priceCents?: number;
  coverImageUrl?: string;
}

// Order types
export interface Order {
  id: string;
  productId: string;
  userId: string;
  buyerEmail: string;
  buyerName: string | null;
  amountCents: number;
  currency: string;
  stripePaymentIntentId: string | null;
  status: string;
  downloadToken: string | null;
  downloadExpiresAt: string | null;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCheckoutRequest {
  productId: string;
  buyerEmail: string;
  buyerName?: string;
  discountCode?: string;
}

// Discount types
export interface DiscountCode {
  id: string;
  productId: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number | null;
  usesCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateDiscountRequest {
  productId: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses?: number;
  expiresAt?: string;
}

// Analytics types
export interface AnalyticsOverview {
  totalRevenueCents: number;
  totalSales: number;
  conversionRate: number;
  averageOrderValueCents: number;
}

export interface SalesDataPoint {
  date: string;
  salesCount: number;
  revenueCents: number;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  pagination?: Pagination;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Storefront types
export interface StorefrontData {
  user: {
    username: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
  };
  products: Product[];
}
