// Shared subscriber data & types used across multiple pages
// Extracted from customers/page.tsx to avoid Next.js "not a valid Page export" error

export interface CustomerItem {
  id: string;
  name: string;
  cnic: string;
  phone: string;
  whatsapp?: string | null;
  address: string;
  area: string;
  packageName: string;
  monthlyFee: number;
  status: "ACTIVE" | "SUSPENDED" | "PENDING" | "CLOSED";
  pppoeUsername?: string | null;
  onuMac?: string | null;
  previousBalance: number;
}

export interface CoverageArea {
  id: string;
  name: string;
  city: string;
  nodeName: string;
  status: "ACTIVE" | "MAINTENANCE";
}

export const DEFAULT_SUBSCRIBERS: CustomerItem[] = [
  {
    id: "cust-1",
    name: "Ali Raza Khan",
    cnic: "35202-1234567-1",
    phone: "03004445566",
    whatsapp: "03004445566",
    address: "House 12, Block B, Johar Town",
    area: "Johar Town",
    packageName: "Home Standard 20Mbps",
    monthlyFee: 2500,
    status: "ACTIVE",
    pppoeUsername: "ali_raza",
    previousBalance: 2900,
  },
  {
    id: "cust-2",
    name: "Muhammad Usman",
    cnic: "35201-9876543-3",
    phone: "03218889900",
    whatsapp: "03218889900",
    address: "Street 4, Sector C, Johar Town",
    area: "Johar Town",
    packageName: "Home Basic 10Mbps",
    monthlyFee: 1500,
    status: "ACTIVE",
    pppoeUsername: "usman_johar",
    previousBalance: 1740,
  },
  {
    id: "cust-3",
    name: "Fatima Ahmed",
    cnic: "35202-5554433-2",
    phone: "03337776655",
    whatsapp: "03337776655",
    address: "Plaza 8, Main Boulevard, Gulberg",
    area: "Gulberg",
    packageName: "Ultra Speed 50Mbps",
    monthlyFee: 4500,
    status: "ACTIVE",
    pppoeUsername: "fatima_gulberg",
    previousBalance: 5220,
  },
  {
    id: "cust-4",
    name: "Tariq Mehmood",
    cnic: "35201-1122334-5",
    phone: "03051112233",
    whatsapp: "03051112233",
    address: "House 99, Phase 5, DHA",
    area: "DHA Phase 5",
    packageName: "Home Standard 20Mbps",
    monthlyFee: 2500,
    status: "ACTIVE",
    pppoeUsername: "tariq_dha",
    previousBalance: 5600,
  },
];

export const INITIAL_AREAS: CoverageArea[] = [
  { id: "area-1", name: "Johar Town", city: "Lahore", nodeName: "POP-JT-01", status: "ACTIVE" },
  { id: "area-2", name: "Gulberg", city: "Lahore", nodeName: "POP-GB-02", status: "ACTIVE" },
  { id: "area-3", name: "DHA Phase 5", city: "Lahore", nodeName: "POP-DHA-05", status: "ACTIVE" },
  { id: "area-4", name: "Model Town", city: "Lahore", nodeName: "POP-MT-03", status: "ACTIVE" },
  { id: "area-5", name: "Faisal Town", city: "Lahore", nodeName: "POP-FT-04", status: "ACTIVE" },
];
