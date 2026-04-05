export type OrderStatus = "Baru" | "Diproses" | "Siap Kirim" | "Selesai";

export type Order = {
  id: string;
  customerName: string;
  vehicle: string;
  total: number;
  itemCount: number;
  status: OrderStatus;
  createdAt: string;
};
