export type ProductColor = {
  name: string;
  hex: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  sortOrder: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  imageUrl: string;
  images: string[];
  stock: number;
  sizes: string[];
  colors: ProductColor[];
  details: string;
  isNew: boolean;
  isActive: boolean;
  createdAt: string;
};

export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string;
  size: string;
  color: string;
  colorHex: string;
  quantity: number;
};

export type StoreSettings = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  deliveryFee: number;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
};

export type OrderItem = {
  id: string;
  productId: string | null;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  selectedSize: string;
  selectedColor: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  createdAt: string;
};

export type Payment = {
  id: string;
  amount: number;
  status: string;
  receiptName: string | null;
  receiptMime: string | null;
  hasReceipt: boolean;
  submittedAt: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  items: OrderItem[];
  payment: Payment | null;
};
