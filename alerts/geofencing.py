def is_point_in_polygon(latitude, longitude, polygon_coords):
    """
    Ray casting algorithm to check if point is inside polygon.

    Args:
        latitude: Student's latitude
        longitude: Student's longitude
        polygon_coords: List of (lat, lon) tuples defining polygon boundary

    Returns:
        True if point is inside polygon, False otherwise
    """
    if not polygon_coords or len(polygon_coords) < 3:
        return False

    x, y = longitude, latitude
    n = len(polygon_coords)
    inside = False

    p1_lat, p1_lon = polygon_coords[0]
    for i in range(1, n + 1):
        p2_lat, p2_lon = polygon_coords[i % n]

        # Check if point is on the edge (within small tolerance)
        if point_on_segment(y, x, p1_lat, p1_lon, p2_lat, p2_lon):
            return True

        # Ray casting: count crossings with horizontal ray from point
        if y > min(p1_lat, p2_lat):
            if y <= max(p1_lat, p2_lat):
                if x <= max(p1_lon, p2_lon):
                    if p1_lat != p2_lat:
                        x_intersect = (y - p1_lat) * (p2_lon - p1_lon) / (
                            p2_lat - p1_lat
                        ) + p1_lon
                    if p1_lon == p2_lon or x <= x_intersect:
                        inside = not inside

        p1_lat, p1_lon = p2_lat, p2_lon

    return inside


def point_on_segment(x, y, x1, y1, x2, y2, tolerance=1e-9):
    """
    Check if point (x, y) is on line segment from (x1, y1) to (x2, y2).
    Uses tolerance to handle floating-point precision.
    """
    # Cross product should be zero if point is on line
    cross = (y - y1) * (x2 - x1) - (x - x1) * (y2 - y1)
    if abs(cross) > tolerance:
        return False

    # Point should be between the two endpoints
    if x < min(x1, x2) - tolerance or x > max(x1, x2) + tolerance:
        return False
    if y < min(y1, y2) - tolerance or y > max(y1, y2) + tolerance:
        return False

    return True
