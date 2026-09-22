from typing import List, Tuple, Dict, Any, Optional
import math
from shapely.geometry import shape, mapping, Point, LineString, Polygon
from shapely.ops import transform
import json


def meters_to_degrees_approx(meters: float, lat: float = 13.0) -> float:
    """Approximate conversion from meters to degrees at a given latitude."""
    lat_rad = math.radians(lat)
    deg_per_meter_lat = 1.0 / 111320.0
    deg_per_meter_lon = 1.0 / (111320.0 * max(0.1, math.cos(lat_rad)))
    return meters * math.sqrt((deg_per_meter_lat ** 2 + deg_per_meter_lon ** 2) / 2.0)


def create_route_corridor_polygon(route_path: List[List[float]], corridor_width_meters: float = 40.0) -> Polygon:
    """Creates a buffered polygon corridor around a route LineString path."""
    if len(route_path) < 2:
        return Polygon()
    
    # route_path: [[lon, lat], [lon, lat], ...]
    line = LineString(route_path)
    avg_lat = sum(p[1] for p in route_path) / len(route_path) if route_path else 13.0
    buffer_deg = meters_to_degrees_approx(corridor_width_meters / 2.0, lat=avg_lat)
    corridor = line.buffer(buffer_deg, cap_style="round", join_style="round")
    return corridor


def check_route_parcel_spatial_intersection(
    route_path: List[List[float]],
    parcel_coords: List[float],
    parcel_polygon: Optional[List[List[float]]] = None,
    corridor_width_meters: float = 40.0,
) -> Tuple[bool, str, float]:
    """
    Performs true geometric spatial intersection between a route corridor and a parcel.
    Returns:
      (is_affected: bool, impact_level: str, distance_or_overlap: float)
    """
    if not route_path or len(route_path) < 2:
        return False, "unaffected", 999.0

    avg_lat = route_path[0][1] if route_path else 13.0
    line = LineString(route_path)
    buffer_deg = meters_to_degrees_approx(corridor_width_meters / 2.0, lat=avg_lat)
    corridor = line.buffer(buffer_deg, cap_style="round", join_style="round")

    # If polygon geometry is available
    if parcel_polygon and len(parcel_polygon) >= 3:
        try:
            poly = Polygon(parcel_polygon)
            if not poly.is_valid:
                poly = poly.buffer(0)
            
            if corridor.intersects(poly):
                # Check overlap degree
                overlap_geom = corridor.intersection(poly)
                overlap_area = overlap_geom.area
                poly_area = poly.area if poly.area > 0 else 1.0
                ratio = overlap_area / poly_area
                
                if ratio > 0.4:
                    return True, "high", 0.0
                else:
                    return True, "affected", 0.0
            
            # Check proximity for potential impact
            extended_corridor = line.buffer(buffer_deg * 2.0)
            if extended_corridor.intersects(poly):
                return True, "potential", 15.0
                
        except Exception:
            pass

    # Fallback to centroid point
    if parcel_coords and len(parcel_coords) >= 2:
        pt = Point(parcel_coords[0], parcel_coords[1])
        if corridor.intersects(pt) or corridor.contains(pt):
            return True, "high", 0.0
        
        # Check distance to centerline
        dist_deg = line.distance(pt)
        dist_meters = dist_deg * 111320.0
        if dist_meters <= (corridor_width_meters / 2.0):
            return True, "high", dist_meters
        elif dist_meters <= (corridor_width_meters * 1.2):
            return True, "affected", dist_meters
        elif dist_meters <= (corridor_width_meters * 2.5):
            return True, "potential", dist_meters

    return False, "unaffected", 999.0


def compute_affected_parcels_for_route(route: Any, parcels: List[Any]) -> List[Dict[str, Any]]:
    """
    Spatially filters parcels that intersect with the route corridor.
    Returns the affected parcels with geometry, area, impact, risk, and stakeholder ID.
    """
    route_path = route.path if isinstance(route.path, list) else []
    corridor_width = getattr(route, "corridor_width_meters", 32.0) or 32.0

    affected = []
    for p in parcels:
        coords = p.coords if isinstance(p.coords, list) else []
        poly_coords = p.polygon_coords if isinstance(p.polygon_coords, list) else None

        is_aff, impact, dist = check_route_parcel_spatial_intersection(
            route_path=route_path,
            parcel_coords=coords,
            parcel_polygon=poly_coords,
            corridor_width_meters=corridor_width,
        )

        # Also consider if route_ids contains the route id or if affected
        is_in_route_ids = (p.route_ids and route.id in p.route_ids) if hasattr(p, "route_ids") else False
        is_in_affected_list = (route.affected_parcel_ids and p.id in route.affected_parcel_ids) if hasattr(route, "affected_parcel_ids") else False

        if is_aff or is_in_route_ids or is_in_affected_list:
            final_impact = impact if is_aff else (p.impact or "affected")
            affected.append({
                "id": p.id,
                "parcelId": p.id,
                "projectId": p.project_id,
                "geometry": {
                    "type": "Polygon" if poly_coords else "Point",
                    "coordinates": poly_coords if poly_coords else coords,
                },
                "coords": coords,
                "polygonCoords": poly_coords,
                "area": p.area_sq_ft,
                "areaSqFt": p.area_sq_ft,
                "impact": final_impact,
                "risk": p.risk_contribution or "medium",
                "riskContribution": p.risk_contribution or "medium",
                "stakeholderId": p.owner_ref,
                "ownerRef": p.owner_ref,
                "landType": p.land_type,
                "verification": p.verification,
                "acquisitionStatus": p.acquisition_status,
                "disputed": p.disputed,
                "structuresPresent": p.structures_present,
            })

    return affected
