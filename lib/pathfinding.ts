/**
 * Pathfinding service for generating optimized delivery routes
 * Uses Google Maps Directions API or fallback interpolation
 */

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RouteOptions {
  waypoints?: Coordinate[];
}

/**
 * Linear interpolation between two coordinates
 * Generates intermediate points for a smoother visual route
 */
function interpolateCoordinates(
  start: Coordinate,
  end: Coordinate,
  steps: number = 10
): Coordinate[] {
  const result: Coordinate[] = [start];

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    result.push({
      latitude: start.latitude + (end.latitude - start.latitude) * t,
      longitude: start.longitude + (end.longitude - start.longitude) * t,
    });
  }

  result.push(end);
  return result;
}

/**
 * Calculate approximate distance between two coordinates using Haversine formula
 */
export function calculateDistance(start: Coordinate, end: Coordinate): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((end.latitude - start.latitude) * Math.PI) / 180;
  const dLon = ((end.longitude - start.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((start.latitude * Math.PI) / 180) *
    Math.cos((end.latitude * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate a route with multiple waypoints
 * For now, uses interpolation. Can be extended to use Google Maps Directions API
 */
export async function generateRoute(
  start: Coordinate,
  end: Coordinate,
  options: RouteOptions = {}
): Promise<Coordinate[]> {
  try {
    // If using Google Maps API, implement here
    // For now, use local interpolation

    let allPoints: Coordinate[] = [start];

    // Add waypoints if provided
    if (options.waypoints && options.waypoints.length > 0) {
      for (const waypoint of options.waypoints) {
        const distance = calculateDistance(allPoints[allPoints.length - 1], waypoint);
        // More points for longer segments
        const steps = Math.ceil(distance * 15); // 15 interpolation points per km
        const segment = interpolateCoordinates(
          allPoints[allPoints.length - 1],
          waypoint,
          Math.max(5, steps)
        );
        allPoints.push(...segment.slice(1)); // Skip duplicate start point
      }
    }

    // Add final segment
    const distance = calculateDistance(allPoints[allPoints.length - 1], end);
    const steps = Math.ceil(distance * 15);
    const finalSegment = interpolateCoordinates(
      allPoints[allPoints.length - 1],
      end,
      Math.max(5, steps)
    );
    allPoints.push(...finalSegment.slice(1));

    return allPoints;
  } catch (error) {
    console.error('Error generating route:', error);
    // Fallback: return direct line
    return interpolateCoordinates(start, end, 20);
  }
}

/**
 * Calculate estimated delivery time based on distance
 * Assumes average speed of 30 km/h in urban areas
 */
export function calculateEstimatedTime(distance: number): number {
  const averageSpeed = 30; // km/h
  return Math.ceil((distance / averageSpeed) * 60); // Returns minutes
}

/**
 * Get optimized route with driver location if available
 */
export async function generateDeliveryRoute(
  pickupLocation: Coordinate,
  deliveryLocation: Coordinate,
  driverLocation?: Coordinate
): Promise<Coordinate[]> {
  const waypoints = driverLocation ? [driverLocation] : [];

  return generateRoute(pickupLocation, deliveryLocation, { waypoints });
}
