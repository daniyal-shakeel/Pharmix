import type {
  Medicine,
  Order,
  Shipment,
  Manufacturer,
  Pharmacy,
  DeliveryPartner,
  Supply,
} from "@/types";

export const CATEGORIES = [
  "Category 1",
  "Category 2",
  "Category 3",
  "Category 4",
  "Category 5",
  "Category 6",
  "Category 7",
  "Category 8",
];

export const MANUFACTURERS: Manufacturer[] = [];

const MFR_NAMES: string[] = [];
const MFR_IDS: string[] = [];

export const PHARMACIES: Pharmacy[] = [];

const PHR_NAMES: string[] = [];
const PHR_IDS: string[] = [];

export const DELIVERY_PARTNERS: DeliveryPartner[] = [];

const DLV_NAMES: string[] = [];
const DLV_IDS: string[] = [];

export const SUPPLIES: Supply[] = [
  {
    id: "SUP-001",
    manufacturerId: "MFR-001",
    pharmacyId: "PHR-001",
    since: "2024-02-20",
    medicineIds: ["MED-1000", "MED-1005", "MED-1010"],
  },
  {
    id: "SUP-002",
    manufacturerId: "MFR-001",
    pharmacyId: "PHR-003",
    since: "2024-03-01",
    medicineIds: ["MED-1000", "MED-1010"],
  },
  {
    id: "SUP-003",
    manufacturerId: "MFR-002",
    pharmacyId: "PHR-001",
    since: "2024-02-25",
    medicineIds: ["MED-1001", "MED-1006", "MED-1011"],
  },
  {
    id: "SUP-004",
    manufacturerId: "MFR-002",
    pharmacyId: "PHR-002",
    since: "2024-03-20",
    medicineIds: ["MED-1001", "MED-1006"],
  },
  {
    id: "SUP-005",
    manufacturerId: "MFR-003",
    pharmacyId: "PHR-002",
    since: "2024-03-15",
    medicineIds: ["MED-1002", "MED-1007", "MED-1012"],
  },
  {
    id: "SUP-006",
    manufacturerId: "MFR-003",
    pharmacyId: "PHR-004",
    since: "2024-04-05",
    medicineIds: ["MED-1002", "MED-1007"],
  },
  {
    id: "SUP-007",
    manufacturerId: "MFR-004",
    pharmacyId: "PHR-004",
    since: "2024-04-10",
    medicineIds: ["MED-1003", "MED-1008", "MED-1013"],
  },
  {
    id: "SUP-008",
    manufacturerId: "MFR-004",
    pharmacyId: "PHR-005",
    since: "2024-03-01",
    medicineIds: ["MED-1003", "MED-1008"],
  },
  {
    id: "SUP-009",
    manufacturerId: "MFR-005",
    pharmacyId: "PHR-005",
    since: "2024-04-15",
    medicineIds: ["MED-1004", "MED-1009", "MED-1014"],
  },
  {
    id: "SUP-010",
    manufacturerId: "MFR-005",
    pharmacyId: "PHR-006",
    since: "2024-05-10",
    medicineIds: ["MED-1004", "MED-1009"],
  },
  {
    id: "SUP-011",
    manufacturerId: "MFR-001",
    pharmacyId: "PHR-005",
    since: "2024-03-10",
    medicineIds: ["MED-1000", "MED-1015"],
  },
  {
    id: "SUP-012",
    manufacturerId: "MFR-002",
    pharmacyId: "PHR-006",
    since: "2024-05-15",
    medicineIds: ["MED-1001", "MED-1011"],
  },
];

const NAMES = [
  "Medi 1",
  "Medi 2",
  "Medi 3",
  "Medi 4",
  "Medi 5",
  "Medi 6",
  "Medi 7",
  "Medi 8",
  "Medi 9",
  "Medi 10",
  "Medi 11",
  "Medi 12",
  "Medi 13",
  "Medi 14",
  "Medi 15",
  "Medi 16",
];

export const MEDICINES: Medicine[] = NAMES.map((n, i) => ({
  id: `MED-${1000 + i}`,
  name: n,
  category: CATEGORIES[i % CATEGORIES.length],
  manufacturer: MFR_NAMES[i % 5],
  manufacturerId: MFR_IDS[i % 5],
  batch: `B${2024}${(i + 10).toString().padStart(3, "0")}`,
  price: Math.round((5 + i * 3.7) * 278 * 100) / 100,
  stock: Math.max(0, 240 - i * 13),
  expiry: `2026-${((i % 12) + 1).toString().padStart(2, "0")}-15`,
  rx: i % 3 === 0,
  description:
    "Pharmaceutical-grade medication manufactured under WHO-GMP certified facilities with full batch traceability.",
}));

export const ORDERS: Order[] = Array.from({ length: 24 }).map((_, i) => ({
  id: `ORD-${5200 + i}`,
  customer: PHR_NAMES[i % 6],
  pharmacyId: PHR_IDS[i % 6],
  items: 1 + (i % 8),
  total: Math.round((120 + i * 47.3) * 278 * 100) / 100,
  status: (["pending", "processing", "shipped", "delivered", "cancelled"] as const)[i % 5],
  date: new Date(Date.now() - i * 86400000).toISOString(),
  payment: (["paid", "pending", "failed"] as const)[i % 3],
}));

export const SHIPMENTS: Shipment[] = [];

export const REVENUE_SERIES = Array.from({ length: 12 }).map((_, i) => ({
  month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
  revenue: 11120000 + Math.round(Math.sin(i / 1.5) * 3336000 + i * 889600),
  orders: 220 + Math.round(Math.cos(i / 2) * 60 + i * 12),
}));

export const CATEGORY_DEMAND = CATEGORIES.slice(0, 6).map((c, i) => ({
  category: c,
  demand: 320 - i * 38 + (i % 2) * 24,
}));

export const DELIVERY_PERF = Array.from({ length: 7 }).map((_, i) => ({
  day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
  onTime: 70 + ((i * 7) % 20),
  delayed: 8 + (i % 4),
}));
