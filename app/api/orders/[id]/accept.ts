import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { kitchenId, driverId } = body;

    if (!kitchenId) {
      return Response.json(
        { success: false, error: 'Kitchen ID required' },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const orderId = url.pathname.split('/').filter(Boolean)[2];

    if (!orderId) {
      return Response.json(
        { success: false, error: 'Order ID required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.rpc('accept_order_and_assign_driver', {
      p_order_id: orderId,
      p_kitchen_id: kitchenId,
      p_driver_id: driverId || null,
    });

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      data,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
