import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get active deliveries (assigned, picked_up, in_transit)
    const { data, error } = await supabase
      .from('deliveries')
      .select(
        `
        *,
        orders:order_id (id, user_name, user_phone, address, serving_size, status),
        drivers:driver_id (id, name, phone, is_available)
      `
      )
      .in('status', ['assigned', 'picked_up', 'in_transit'])
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      data,
      count: data?.length || 0,
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
