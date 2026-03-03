
import re
import xml.etree.ElementTree as ET

svg_path = r"c:\Users\DELL\sunspace\frontend\react-app\public\plan_v2.svg"
try:
    # Register namespaces to handle xmlns
    ET.register_namespace('', "http://www.w3.org/2000/svg")
    tree = ET.parse(svg_path)
    root = tree.getroot()
    ns = {'svg': 'http://www.w3.org/2000/svg'}

    def get_transform_offset(transform_str):
        if not transform_str: return 0, 0
        m = re.search(r'translate\(([-0-9.]+)[, ]+([-0-9.]+)\)', transform_str)
        if m: return float(m.group(1)), float(m.group(2))
        return 0, 0

    results = []
    
    def walk(elem, ox, oy):
        # Handle transform (very basic translate only for now)
        transform = elem.get('transform', '')
        tx, ty = get_transform_offset(transform)
        curr_x, curr_y = ox + tx, oy + ty
        
        # If it has an ID starting with bureau_
        eid = elem.get('id', '')
        if eid.startswith('bureau_'):
            # Try to get its local x,y
            lx = float(elem.get('x', 0))
            ly = float(elem.get('y', 0))
            results.append((eid, curr_x + lx, curr_y + ly, elem.tag))
            
        for child in elem:
            walk(child, curr_x, curr_y)

    walk(root, 0, 0)
    
    with open('all_bureau_coords.txt', 'w') as f:
        for rid, rx, ry, rtag in results:
            f.write(f"{rid} | {rx} | {ry} | {rtag}\n")
            
    print(f"Stats: Found {len(results)} bureau_ elements.")

except Exception as e:
    print(f"Error: {e}")
