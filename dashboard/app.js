const { createClient } = window.supabase || {};

const config = window.DASHBOARD_CONFIG || {};
const GOOGLE_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0b0b0b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#000000' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#171717' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#222222' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#202020' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#101010' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#040404' }] },
];
const state = {
  supabase: null,
  kitchens: [],
  drivers: [],
  pendingOrders: [],
  activeDeliveries: [],
  selectedOrderId: null,
  selectedDeliveryId: null,
  selectedKitchenId: null,
  selectedDriverId: null,
  targetPoint: null,
  livePoint: null,
  googleMapsPromise: null,
  googleMap: null,
  liveMarker: null,
  targetMarker: null,
  routeLine: null,
  refreshTimer: null,
  refreshHandle: null,
};

const els = {
  connectionPill: document.getElementById('connectionPill'),
  refreshButton: document.getElementById('refreshButton'),
  refreshControlButton: document.getElementById('refreshControlButton'),
  pendingCount: document.getElementById('pendingCount'),
  activeCount: document.getElementById('activeCount'),
  selectedLabel: document.getElementById('selectedLabel'),
  realtimeLabel: document.getElementById('realtimeLabel'),
  kitchenSelect: document.getElementById('kitchenSelect'),
  driverSelect: document.getElementById('driverSelect'),
  pendingList: document.getElementById('pendingList'),
  deliveryList: document.getElementById('deliveryList'),
  map: document.getElementById('map'),
  liveLat: document.getElementById('liveLat'),
  liveLng: document.getElementById('liveLng'),
  pushLocationButton: document.getElementById('pushLocationButton'),
  activityLog: document.getElementById('activityLog'),
  locationSummary: document.getElementById('locationSummary'),
};

function log(message) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
  els.activityLog.prepend(entry);
}

function setConnectionState(text, live = false) {
  els.connectionPill.textContent = text;
  els.connectionPill.classList.toggle('is-live', live);
}

function setRealtimeLabel(text) {
  els.realtimeLabel.textContent = text;
}

function getLabel(row, fallback = 'Untitled') {
  return row?.name || row?.title || row?.label || row?.description || fallback;
}

function getOrderPoint(order) {
  const latitude = Number(order.delivery_latitude ?? order.latitude ?? order.lat);
  const longitude = Number(order.delivery_longitude ?? order.longitude ?? order.lng);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { lat: latitude, lng: longitude };
  }
  return null;
}

function getDeliveryPoint(order) {
  if (!order) return null;
  return getOrderPoint(order);
}

function getMapCenter() {
  return {
    lat: Number(config.defaultCenter?.lat ?? 43.7315),
    lng: Number(config.defaultCenter?.lng ?? -79.7624),
  };
}

function formatPoint(point) {
  return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
}

function loadGoogleMapsApi() {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (state.googleMapsPromise) {
    return state.googleMapsPromise;
  }

  if (!config.googleMapsApiKey || config.googleMapsApiKey.includes('YOUR_GOOGLE_MAPS_API_KEY')) {
    return Promise.reject(new Error('Set dashboard/config.js with a Google Maps API key.'));
  }

  state.googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(config.googleMapsApiKey)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error('Google Maps failed to load.'));
    document.head.appendChild(script);
  });

  return state.googleMapsPromise;
}

function createGoogleMap() {
  const center = getMapCenter();
  els.map.textContent = '';
  state.googleMap = new window.google.maps.Map(els.map, {
    center,
    zoom: Number(config.defaultZoom ?? 13),
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    gestureHandling: 'greedy',
    disableDefaultUI: true,
    backgroundColor: '#050505',
    styles: GOOGLE_MAP_STYLES,
  });

  state.googleMap.addListener('click', (event) => {
    if (!event.latLng) return;
    const point = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    updateMapFocus(point, 'Live location updated');
  });

  window.google.maps.event.addListenerOnce(state.googleMap, 'idle', () => {
    state.googleMap.setCenter(center);
  });

  state.liveMarker = new window.google.maps.Marker({
    map: state.googleMap,
    position: center,
    draggable: true,
    title: 'Live location',
    icon: {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 9,
      fillColor: '#ffffff',
      fillOpacity: 1,
      strokeColor: '#000000',
      strokeWeight: 2,
    },
  });

  state.targetMarker = new window.google.maps.Marker({
    map: state.googleMap,
    position: center,
    draggable: false,
    title: 'Target location',
    icon: {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 9,
      fillColor: '#000000',
      fillOpacity: 0,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    },
  });

  state.routeLine = new window.google.maps.Polyline({
    map: state.googleMap,
    path: [center, center],
    strokeColor: '#ffffff',
    strokeOpacity: 0.9,
    strokeWeight: 2,
    icons: [
      {
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity: 1,
          scale: 3,
        },
        offset: '0',
        repeat: '14px',
      },
    ],
  });

  state.liveMarker.addListener('dragend', () => {
    const position = state.liveMarker.getPosition();
    if (!position) return;
    updateMapFocus(
      { lat: position.lat(), lng: position.lng() },
      'Live location updated'
    );
  });

  renderMap();
}

function renderMap() {
  if (!state.googleMap) return;

  if (state.livePoint && state.liveMarker) {
    state.liveMarker.setPosition(state.livePoint);
    els.liveLat.value = state.livePoint.lat.toFixed(6);
    els.liveLng.value = state.livePoint.lng.toFixed(6);
  }

  if (state.targetPoint && state.targetMarker) {
    state.targetMarker.setPosition(state.targetPoint);
  }

  if (state.livePoint && state.targetPoint && state.routeLine) {
    state.routeLine.setPath([state.livePoint, state.targetPoint]);
  }

  if (state.livePoint) {
    els.locationSummary.textContent = formatPoint(state.livePoint);
  }
}

function applyMapPoint(point, label) {
  state.livePoint = point;
  if (state.googleMap) {
    state.googleMap.setCenter(point);
  }
  els.liveLat.value = point.lat.toFixed(6);
  els.liveLng.value = point.lng.toFixed(6);
  els.locationSummary.textContent = label || formatPoint(point);
  renderMap();
}

function setTargetPoint(point, label) {
  state.targetPoint = point;
  if (label) {
    els.locationSummary.textContent = label;
  }
  if (state.googleMap) {
    const bounds = new window.google.maps.LatLngBounds();
    if (state.livePoint) bounds.extend(state.livePoint);
    bounds.extend(point);
    if (!bounds.isEmpty()) {
      state.googleMap.fitBounds(bounds, 64);
    }
  }
  renderMap();
}

function ensureSupabase() {
  if (state.supabase) return state.supabase;
  if (typeof createClient !== 'function') {
    setConnectionState('Supabase script missing');
    log('Load the Supabase browser script before app.js.');
    return null;
  }
  if (!config.supabaseUrl || !config.supabaseAnonKey || config.supabaseUrl.includes('YOUR_PROJECT')) {
    setConnectionState('Configure Supabase keys');
    log('Set dashboard/config.js with your Supabase URL and anon key.');
    return null;
  }
  state.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
  setConnectionState('Supabase connected', true);
  return state.supabase;
}

function updateMapFocus(point, label) {
  if (!state.googleMap || !point) return;
  applyMapPoint(point, label || formatPoint(point));
}

function updateTarget(point, label) {
  if (!state.googleMap || !point) {
    return;
  }

  setTargetPoint(point, label || 'Selected destination');
}

async function initMap() {
  els.map.innerHTML = '<div class="map-loading">Loading map...</div>';

  try {
    await loadGoogleMapsApi();
    createGoogleMap();
    const center = getMapCenter();
    updateMapFocus(center, 'Default live location');
  } catch (error) {
    els.map.innerHTML = '<div class="map-loading error">Set a Google Maps API key in dashboard/config.js.</div>';
    setConnectionState('Map unavailable');
    log(error.message || 'Map failed to load');
    throw error;
  }
}

async function loadReferenceData() {
  const supabase = ensureSupabase();
  if (!supabase) return;

  const [{ data: kitchens }, { data: drivers }] = await Promise.all([
    supabase.from('kitchens').select('*').limit(50),
    supabase.from('drivers').select('*').limit(50),
  ]);

  state.kitchens = kitchens || [];
  state.drivers = drivers || [];

  els.kitchenSelect.innerHTML = '';
  state.kitchens.forEach((kitchen, index) => {
    const option = document.createElement('option');
    option.value = kitchen.id;
    option.textContent = getLabel(kitchen, `Kitchen ${index + 1}`);
    els.kitchenSelect.appendChild(option);
  });

  els.driverSelect.innerHTML = '';
  const blankOption = document.createElement('option');
  blankOption.value = '';
  blankOption.textContent = 'Auto-assign a driver';
  els.driverSelect.appendChild(blankOption);

  state.drivers.forEach((driver, index) => {
    const option = document.createElement('option');
    option.value = driver.id;
    option.textContent = getLabel(driver, `Driver ${index + 1}`);
    els.driverSelect.appendChild(option);
  });

  state.selectedKitchenId = state.kitchens[0]?.id || null;
  if (state.selectedKitchenId) {
    els.kitchenSelect.value = state.selectedKitchenId;
  }

  log(`Loaded ${state.kitchens.length} kitchens and ${state.drivers.length} drivers.`);
}

async function loadPendingOrders() {
  const supabase = ensureSupabase();
  if (!supabase) return;

  const { data, error } = await supabase.rpc('get_pending_orders');
  if (error) throw error;

  state.pendingOrders = Array.isArray(data) ? data : [];
  renderPendingOrders();
  updateCounters();
}

async function loadActiveDeliveries() {
  const supabase = ensureSupabase();
  if (!supabase) return;

  const { data, error } = await supabase
    .from('deliveries')
    .select('id, order_id, driver_id, status, created_at, updated_at')
    .in('status', ['assigned', 'picked_up', 'in_transit'])
    .order('created_at', { ascending: false });

  if (error) throw error;

  const deliveries = data || [];
  const orderIds = deliveries.map((delivery) => delivery.order_id).filter(Boolean);
  let ordersById = {};

  if (orderIds.length > 0) {
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('id, user_name, user_phone, address, serving_size, status, delivery_latitude, delivery_longitude')
      .in('id', orderIds);

    if (orderError) throw orderError;
    ordersById = Object.fromEntries((orders || []).map((order) => [order.id, order]));
  }

  state.activeDeliveries = deliveries.map((delivery) => ({
    ...delivery,
    order: ordersById[delivery.order_id] || null,
  }));

  renderActiveDeliveries();
  updateCounters();
}

function updateCounters() {
  els.pendingCount.textContent = String(state.pendingOrders.length);
  els.activeCount.textContent = String(state.activeDeliveries.length);
}

function renderPendingOrders() {
  els.pendingList.innerHTML = '';

  if (state.pendingOrders.length === 0) {
    els.pendingList.innerHTML = '<div class="item-card"><div class="item-title">No pending orders right now</div><div class="item-subtitle">Orders will appear here in realtime as they are created.</div></div>';
    return;
  }

  state.pendingOrders.forEach((order) => {
    const point = getOrderPoint(order);
    const card = document.createElement('article');
    card.className = `item-card${state.selectedOrderId === order.id ? ' active' : ''}`;
    card.innerHTML = `
      <div class="item-top">
        <div>
          <div class="item-title">${order.user_name || 'Anonymous user'}</div>
          <div class="item-subtitle">${order.address || 'No address recorded'}</div>
        </div>
        <span class="tag warn">Pending</span>
      </div>
      <div class="item-meta">${order.user_phone || 'No phone'} · Serving size ${order.serving_size ?? 'n/a'}</div>
      <div class="tag-row">
        <span class="tag">${order.status || 'pending'}</span>
        ${point ? `<span class="tag soft">${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}</span>` : '<span class="tag">No coordinates</span>'}
      </div>
      <div class="button-row">
        <button class="item-button primary" data-action="focus-order">Focus map</button>
        <button class="item-button positive" data-action="accept-order">Accept</button>
      </div>
    `;

    card.querySelector('[data-action="focus-order"]').addEventListener('click', () => {
      state.selectedOrderId = order.id;
      els.selectedLabel.textContent = order.user_name || order.id;
      if (point) {
        updateTarget(point, order.address || 'Pending order');
        if (!state.liveMarker) {
          updateMapFocus(point, 'Focused on order location');
        }
      }
      renderPendingOrders();
    });

    card.querySelector('[data-action="accept-order"]').addEventListener('click', () => {
      acceptOrder(order.id);
    });

    card.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('button')) return;
      state.selectedOrderId = order.id;
      els.selectedLabel.textContent = order.user_name || order.id;
      if (point) {
        updateTarget(point, order.address || 'Pending order');
      }
      renderPendingOrders();
    });

    els.pendingList.appendChild(card);
  });
}

function renderActiveDeliveries() {
  els.deliveryList.innerHTML = '';

  if (state.activeDeliveries.length === 0) {
    els.deliveryList.innerHTML = '<div class="item-card"><div class="item-title">No active deliveries</div><div class="item-subtitle">Accepted orders will show here for live status and location updates.</div></div>';
    return;
  }

  state.activeDeliveries.forEach((delivery) => {
    const order = delivery.order || {};
    const point = getDeliveryPoint(order);
    const card = document.createElement('article');
    card.className = `item-card${state.selectedDeliveryId === delivery.id ? ' active' : ''}`;
    card.innerHTML = `
      <div class="item-top">
        <div>
          <div class="item-title">${order.user_name || 'Order ' + delivery.order_id.slice(0, 8)}</div>
          <div class="item-subtitle">${order.address || 'No address linked'}</div>
        </div>
        <span class="tag soft">${delivery.status}</span>
      </div>
      <div class="item-meta">Driver: ${delivery.driver_id || 'Unassigned'}</div>
      <div class="tag-row">
        <span class="tag">${order.serving_size ?? 'n/a'} servings</span>
        ${point ? `<span class="tag soft">${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}</span>` : '<span class="tag">No coordinates</span>'}
      </div>
      <div class="button-row">
        <button class="item-button primary" data-action="focus-delivery">Focus map</button>
        <button class="item-button" data-action="picked-up">Picked up</button>
        <button class="item-button positive" data-action="in-transit">En route</button>
        <button class="item-button danger" data-action="delivered">Delivered</button>
      </div>
    `;

    card.querySelector('[data-action="focus-delivery"]').addEventListener('click', () => {
      state.selectedDeliveryId = delivery.id;
      els.selectedLabel.textContent = order.user_name || delivery.id;
      if (point) {
        updateTarget(point, order.address || 'Active delivery');
        if (!state.liveMarker) {
          updateMapFocus(point, 'Focused on delivery destination');
        }
      }
      renderActiveDeliveries();
    });

    card.querySelector('[data-action="picked-up"]').addEventListener('click', () => updateDeliveryStatus(delivery.id, 'picked_up'));
    card.querySelector('[data-action="in-transit"]').addEventListener('click', () => updateDeliveryStatus(delivery.id, 'in_transit'));
    card.querySelector('[data-action="delivered"]').addEventListener('click', () => updateDeliveryStatus(delivery.id, 'delivered'));

    card.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('button')) return;
      state.selectedDeliveryId = delivery.id;
      els.selectedLabel.textContent = order.user_name || delivery.id;
      if (point) {
        updateTarget(point, order.address || 'Active delivery');
      }
      renderActiveDeliveries();
    });

    els.deliveryList.appendChild(card);
  });
}

async function acceptOrder(orderId) {
  const supabase = ensureSupabase();
  if (!supabase) return;

  const kitchenId = els.kitchenSelect.value || state.selectedKitchenId;
  const driverId = els.driverSelect.value || null;

  if (!kitchenId) {
    log('Pick a kitchen before accepting an order.');
    return;
  }

  setRealtimeLabel('Accepting order...');
  const { data, error } = await supabase.rpc('accept_order_and_assign_driver', {
    p_order_id: orderId,
    p_kitchen_id: kitchenId,
    p_driver_id: driverId,
  });

  if (error) {
    log(`Accept failed: ${error.message}`);
    setRealtimeLabel('Idle');
    return;
  }

  log(`Order accepted: ${data?.message || orderId}`);
  state.selectedOrderId = orderId;
  await refreshAll();
  setRealtimeLabel('Idle');
}

async function updateDeliveryStatus(deliveryId, status) {
  const supabase = ensureSupabase();
  if (!supabase) return;

  setRealtimeLabel(`Updating ${status}...`);
  const { error } = await supabase.rpc('update_delivery_status', {
    p_delivery_id: deliveryId,
    p_new_status: status,
  });

  if (error) {
    log(`Status update failed: ${error.message}`);
    setRealtimeLabel('Idle');
    return;
  }

  log(`Delivery ${deliveryId.slice(0, 8)} moved to ${status}.`);
  await refreshAll();
  setRealtimeLabel('Idle');
}

async function pushLiveLocation() {
  const supabase = ensureSupabase();
  if (!supabase) return;
  const deliveryId = state.selectedDeliveryId;

  if (!deliveryId) {
    log('Select an active delivery before pushing a live location.');
    return;
  }

  const latitude = Number(els.liveLat.value);
  const longitude = Number(els.liveLng.value);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    log('Enter a valid latitude and longitude first.');
    return;
  }

  setRealtimeLabel('Sending live location...');
  const { error } = await supabase.rpc('simulate_driver_location_update', {
    p_delivery_id: deliveryId,
    p_latitude: latitude,
    p_longitude: longitude,
  });

  if (error) {
    log(`Location push failed: ${error.message}`);
    setRealtimeLabel('Idle');
    return;
  }

  updateMapFocus({ lat: latitude, lng: longitude }, 'Live location pushed');
  log(`Live location pushed for delivery ${deliveryId.slice(0, 8)}.`);
  setRealtimeLabel('Idle');
}

function scheduleRefresh() {
  clearTimeout(state.refreshHandle);
  state.refreshHandle = setTimeout(() => {
    refreshAll().catch((error) => {
      log(error.message || 'Refresh failed');
    });
  }, 250);
}

async function refreshAll() {
  const supabase = ensureSupabase();
  if (!supabase) return;

  await Promise.all([loadPendingOrders(), loadActiveDeliveries()]);

  if (state.selectedDeliveryId) {
    const selected = state.activeDeliveries.find((delivery) => delivery.id === state.selectedDeliveryId);
    if (selected?.order) {
      const point = getDeliveryPoint(selected.order);
      if (point) {
        updateTarget(point, selected.order.address || 'Selected delivery');
      }
    }
  }
}

function subscribeRealtime() {
  const supabase = ensureSupabase();
  if (!supabase) return;

  const channels = [
    supabase
      .channel('dashboard-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        setRealtimeLabel('Orders updated');
        scheduleRefresh();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') log('Subscribed to order changes.');
      }),
    supabase
      .channel('dashboard-deliveries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => {
        setRealtimeLabel('Deliveries updated');
        scheduleRefresh();
      })
      .subscribe(),
    supabase
      .channel('dashboard-location-pings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'driver_location_pings' }, (payload) => {
        const row = payload.new || {};
        if (row.delivery_id === state.selectedDeliveryId) {
          const latitude = Number(row.latitude ?? row.lat);
          const longitude = Number(row.longitude ?? row.lng);
          if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
            updateMapFocus({ lat: latitude, lng: longitude }, 'Realtime location ping');
          }
        }
        scheduleRefresh();
      })
      .subscribe(),
  ];

  state.subscriptions = channels;
}

function wireEvents() {
  els.refreshButton.addEventListener('click', () => refreshAll().catch((error) => log(error.message || 'Refresh failed')));
  els.refreshControlButton.addEventListener('click', () => refreshAll().catch((error) => log(error.message || 'Refresh failed')));
  els.kitchenSelect.addEventListener('change', () => {
    state.selectedKitchenId = els.kitchenSelect.value || null;
  });
  els.driverSelect.addEventListener('change', () => {
    state.selectedDriverId = els.driverSelect.value || null;
  });
  els.pushLocationButton.addEventListener('click', () => pushLiveLocation());
}

async function boot() {
  await initMap();
  wireEvents();
  ensureSupabase();
  await loadReferenceData();
  await refreshAll();
  subscribeRealtime();

  if (config.refreshMs && Number.isFinite(config.refreshMs)) {
    state.refreshTimer = setInterval(() => {
      refreshAll().catch((error) => log(error.message || 'Refresh failed'));
    }, config.refreshMs);
  }
}

boot().catch((error) => {
  setConnectionState('Dashboard failed to boot');
  log(error.message || 'Unexpected startup error');
});
