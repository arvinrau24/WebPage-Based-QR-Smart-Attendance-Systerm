import xml.etree.ElementTree as ET


def parse_kml_polygon(kml_file_path):
    """
    Parse KML file and extract polygon coordinates.
    Returns list of (latitude, longitude) tuples from the first polygon found.
    KML coordinates are in format: longitude,latitude,altitude
    """
    tree = ET.parse(kml_file_path)
    root = tree.getroot()

    # Define namespace
    ns = {"kml": "http://www.opengis.net/kml/2.2"}

    # Find all Polygon elements
    polygons = root.findall(".//kml:Polygon", ns)

    if not polygons:
        raise ValueError("No polygons found in KML file")

    # Get first polygon
    polygon = polygons[0]
    coordinates_elem = polygon.find(".//kml:outerBoundaryIs/kml:LinearRing/kml:coordinates", ns)

    if coordinates_elem is None or not coordinates_elem.text:
        raise ValueError("No coordinates found in polygon")

    # Parse coordinates string
    coords_text = coordinates_elem.text.strip()
    coords = []

    for coord in coords_text.split():
        parts = coord.split(",")
        if len(parts) >= 2:
            lon, lat = float(parts[0]), float(parts[1])
            coords.append((lat, lon))

    return coords
