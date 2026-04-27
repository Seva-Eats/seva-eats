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

/**
 * Simple meal request submission for frontend app
 */
export interface SimpleMealRequestInput {
  address: string;
  latitude: number;
  longitude: number;
  servingSize: number;
}

export async function submitSimpleMealRequest(input: SimpleMealRequestInput) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  try {
    // Get current user from auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        address: input.address,
        delivery_latitude: input.latitude,
        delivery_longitude: input.longitude,
        requested_servings: input.servingSize,
        status: 'pending',
      })
      .select('id, status, created_at')
      .single();

    if (orderError) {
      throw orderError;
    }

    return {
      id: order.id,
      status: order.status,
      createdAt: order.created_at,
      message: 'Order submitted! Waiting for admin approval...',
    };
  } catch (error) {
    console.error('Error submitting meal request:', error);
    throw error;
  }
}

/**
 * Get order details
 */
export async function getOrderDetails(orderId: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        address,
        delivery_latitude,
        delivery_longitude,
        requested_servings,
        status,
        created_at,
        updated_at
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

/**
 * Subscribe to order status updates in real-time
 */
export function subscribeToOrderUpdates(
  orderId: string,
  callback: (order: any) => void
) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const subscription = supabase
    .from(`orders:id=eq.${orderId}`)
    .on('*', (payload) => {
      callback(payload.new);
    })
    .subscribe();

  return subscription;
}

/**
 * Subscribe to driver location updates for a delivery
 */
export function subscribeToDriverLocation(
  orderId: string,
  callback: (location: { latitude: number; longitude: number; speed_mps?: number; heading?: number }) => void
) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const subscription = supabase
    .from(`driver_location_pings:order_id=eq.${orderId}`)
    .on('INSERT', (payload) => {
      const ping = payload.new;
      callback({
        latitude: ping.latitude,
        longitude: ping.longitude,
        speed_mps: ping.speed_mps,
        heading: ping.heading,
      });
    })
    .subscribe();

  return subscription;
}
