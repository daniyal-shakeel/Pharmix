export type Role = "admin" | "manufacturer" | "pharmacy" | "customer" | "delivery";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  entityId?: string;
  isSuperAdmin?: boolean;
}

export interface Manufacturer {
  id: string;
  name: string;
  region: string;
  email: string;
  phone: string;
  address: string;
  status: "active" | "pending" | "inactive";
  joinedDate: string;
  totalSkus: number;
  description: string;
  linkedDeliveryPartners: string[];
  shippingFee: number;
  deliveryConfig?: {
    smallOrderTime: number;
    mediumOrderTime: number;
    largeOrderTime: number;
    smallThreshold: number;
    mediumThreshold: number;
  };
}

export interface Pharmacy {
  id: string;
  name: string;
  region: string;
  email: string;
  phone: string;
  address: string;
  status: "active" | "pending" | "inactive";
  joinedDate: string;
  totalSkus: number;
  description: string;
  linkedManufacturers: string[];
}

export interface DeliveryPartner {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  zone: string;
  status: "active" | "inactive";
  joinedDate: string;
  rating: number;
  totalDeliveries: number;
  linkedManufacturers: string[];
}

export interface Supply {
  id: string;
  manufacturerId: string;
  pharmacyId: string;
  since: string;
  medicineIds: string[];
}

export interface Medicine {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  manufacturerId: string;
  batch: string;
  price: number;
  stock: number;
  expiry: string;
  image?: string;
  rx?: boolean;
  description?: string;
}

export interface Order {
  id: string;
  pharmacyId: string;
  manufacturerId: string;
  items: any[];
  subtotal: number;
  shippingFee: number;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "paid" | "pending" | "failed";
  date: string;
  expectedDeliveryDate?: string;
  deliveredAt?: string;
  deliveryStatus?: "on-time" | "late" | "pending";
}

export interface Shipment {
  id: string;
  orderId: string;
  manufacturerId: string;
  pharmacyId: string;
  riderId: string;
  origin: string;
  destination: string;
  status: "pickup" | "in_transit" | "delivered";
  riderName?: string;
  manufacturerName?: string;
  pharmacyName?: string;
  riderLocation?: {
    lat: number;
    lng: number;
    updatedAt: string;
  };
  createdAt: string;
}

export interface Payment {
  id: string;
  stripePaymentIntentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  manufacturerId: string;
  pharmacyId: string;
  paymentMethod: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}
