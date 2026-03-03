
import re

svg_path = r"c:\Users\DELL\sunspace\frontend\react-app\public\plan_v2.svg"
try:
    with open(svg_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Bounding Box for Bottom: x=[2030, 2760], y=[1440, 1940]
    
    # Let's find all tags starting with <path or <use that have a bureau_ ID
    # and try to extract their coordinates or their parent group transform.
    
    # Actually, let's just find ALL bureau_ ids that appear after bureau_student_bottom in the file
    # since SVG elements are often grouped.
    
    idx_start = content.find('id="bureau_student_bottom"')
    if idx_start == -1:
        print("Could not find bureau_student_bottom")
        exit()
        
    # Search in the next 100,000 characters (arbitrary large number)
    search_space = content[idx_start:]
    
    ids = re.findall(r'id="(bureau_\d+)"', search_space)
    
    # Deduplicate and keep order
    seen = set()
    ordered_ids = []
    for bid in ids:
        if bid not in seen:
            ordered_ids.append(bid)
            seen.add(bid)
            
    with open('bottom_chairs.txt', 'w') as f:
        for bid in ordered_ids:
            f.write(bid + '\n')
            
    print(f"Found {len(ordered_ids)} unique bureau_ IDs after bureau_student_bottom.")

except Exception as e:
    print(f"Error: {e}")
