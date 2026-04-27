import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return Response.json(
        { success: false, error: 'Status required' },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const deliveryId = url.pathname.split('/').filter(Boolean)[2];

    if (!deliveryId) {
      return Response.json(
        { success: false, error: 'Delivery ID required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.rpc('update_delivery_status', {
      p_delivery_id: deliveryId,
      p_new_status: status,
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
