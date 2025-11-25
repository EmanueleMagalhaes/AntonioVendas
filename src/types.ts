import { Timestamp, FieldValue } from "firebase/firestore"; 

export interface Client {
  id: string;
  companyName: string; // Empresa
  name: string;        // Nome Responsável
  phone: string;       // Telefone 1 (Obrigatório)
  phone2?: string;     // Telefone 2 (Opcional)
  email: string;
  
  // Address Fields
  zipCode?: string;     // CEP
  address: string;      // Logradouro
  number?: string;      // Número
  neighborhood?: string; // Bairro
  city: string;
  state?: string;       // UF
  
  cpfCnpj: string;
  stateRegistration?: string; // Inscrição Estadual
  createdAt?: Timestamp | FieldValue;
}
export type ClientCreate = Omit<Client, "id" | "createdAt">;

export interface Product {
  id: string;
  reference: string;
  description: string;
  price: number;
  category: string;
  grid: string; // e.g., "33-46"
  color: string;
  sole: string;      // New: Solado
  material: string;  // New: Couro/Material
  imageUrl?: string; 
}

export interface OrderItem {
  productId: string;
  reference: string;
  description: string;
  quantity: number; // Total items sum
  unitPrice: number;
  total: number;
  // Breakdown of sizes e.g. { "39": 2, "40": 1 }
  sizes: Record<string, number>; 
  // Snapshot of product details at time of order
  color: string;
  sole: string;
  material: string;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string; // Stores company name usually
  items: OrderItem[];
  totalValue: number;
  date?: Timestamp | FieldValue; // Timestamp
  status: string;
  
  
  // New fields
  freight: string;       // 'CIF' | 'FOB'
  paymentTerms: string;  // e.g. "30/60/90"
  paymentMethod: string; // e.g. "Boleto"
}

export const normalizeDate = (date: any): number => {
  if (!date) return 0;
  // Se já for número (timestamp salvo como number)
  if (typeof date === 'number') return date;
  // Se for Timestamp do Firebase (tem o método toDate)
  if (typeof date.toDate === 'function') return date.toDate().getTime();
  // Se for objeto serializado do Firebase { seconds: ..., nanoseconds: ... }
  if (date.seconds) return date.seconds * 1000;
  // Tenta converter string ou objeto Date padrão
  return new Date(date).getTime();
};

export type TimeFilter = '7' | '15' | '30' | 'all';