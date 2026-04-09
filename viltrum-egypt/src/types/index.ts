export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  sizes: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product_id: string;
  title: string;
  price: number;
  size: string;
  quantity: number;
  image_url: string | null;
}

export interface OrderItem {
  product_id: string;
  title: string;
  size: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  payment_method: "vodafone_cash" | "instapay";
  payment_screenshot_url: string | null;
  items: OrderItem[];
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered";
  created_at: string;
  updated_at: string;
}
