import { supabase } from '@/lib/supabase';

export type RequestedOrderItem = {
  menuItemId: string;
  quantity: number;
};

export type RequestMealOrderInput = {
  menuId: string;
  kitchenId: string;
  items: RequestedOrderItem[];
  deliveryAddressLine1: string;
  deliveryCity: string;
  deliveryProvince: string;
  deliveryPostalCode: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  servingSize?: number;
  specialInstructions?: string;
  deliveryWindowStart?: string;
  deliveryWindowEnd?: string;
};

export async function requestMealOrder(input: RequestMealOrderInput) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const payloadItems = input.items.map((item) => ({
    menu_item_id: item.menuItemId,
    quantity: item.quantity,
  }));

  const { data, error } = await supabase.rpc('request_meal_order', {
    p_menu_id: input.menuId,
    p_kitchen_id: input.kitchenId,
    p_items: payloadItems,
    p_delivery_address_line1: input.deliveryAddressLine1,
    p_delivery_city: input.deliveryCity,
    p_delivery_province: input.deliveryProvince,
    p_delivery_postal_code: input.deliveryPostalCode,
    p_delivery_latitude: input.deliveryLatitude,
    p_delivery_longitude: input.deliveryLongitude,
    p_serving_size: input.servingSize ?? 2,
    p_special_instructions: input.specialInstructions ?? null,
    p_delivery_window_start: input.deliveryWindowStart ?? null,
    p_delivery_window_end: input.deliveryWindowEnd ?? null,
  });

  if (error) {
    throw error;
  }

  return data as string;
}

export async function fetchOrderLifecycle(orderId: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase
    .from('order_lifecycle_overview')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchSystemLoad() {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase
    .from('system_load_dashboard')
    .select('*')
    .order('kitchen_name', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}
