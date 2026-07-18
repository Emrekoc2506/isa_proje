export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  roles: string[];
  isActive: boolean;
}

export interface AddressDto {
  id: string;
  title: string;
  fullName: string;
  phoneNumber: string;
  city: string;
  district: string;
  neighborhood: string;
  addressLine: string;
  zipCode?: string;
  isCorporate: boolean;
  companyName?: string;
  taxOffice?: string;
  taxNumber?: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export interface ProductListResponse {
  id: string;
  name: string;
  price: number;
  oldPrice?: number | null;
  imageUrl?: string | null;
  stockQuantity: number;
  isNew: boolean;
  isSale: boolean;
  isFeatured: boolean;
  isActive: boolean;
  slug: string;
}

export interface ProductVariantResponse {
  id: string;
  name: string;
  sku: string;
  additionalPrice: number;
  stockQuantity: number;
}

export interface ProductDetailResponse {
  id: string;
  name: string;
  price: number;
  oldPrice?: number | null;
  imageUrl?: string | null;
  stockQuantity: number;
  isNew: boolean;
  isSale: boolean;
  isFeatured: boolean;
  isActive: boolean;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  unit: string;
  discount?: string | null;
  variants: ProductVariantResponse[];
}

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children: CategoryResponse[];
}

export interface BannerResponse {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  image: string;
  imageMobile?: string | null;
  cta?: string | null;
  href?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface CouponResponse {
  id: string;
  code: string;
  discountAmount: number;
  discountPercentage: number;
  isPercentage: boolean;
  expiryDate?: string | null;
  maxUses?: number | null;
  isActive: boolean;
}

export interface OrderItemResponse {
  productId: string;
  productName: string;
  productVariantId?: string | null;
  productVariantName?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  totalAmount: number;
  currency: string;
  status: number;
  statusText: string;
  paymentStatus: string;
  shippingAddress: AddressDto;
  billingAddress: AddressDto;
  items: OrderItemResponse[];
  createdAt: string;
}

export interface LowStockProductResponse {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
}

export interface MessageAttachmentResponse {
  id: string;
  url: string;
  fileName: string;
  contentType: string;
  size: number;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId?: string | null;
  senderName: string;
  content: string;
  sentAt: string;
  isRead: boolean;
  attachments: MessageAttachmentResponse[];
  senderType: string;
  isMine: boolean;
}

export interface ConversationResponse {
  id: string;
  subject: string;
  customerName: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  isClosed: boolean;
  unreadCount: number;
}

export interface NotificationResponse {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}
