
import re

svg_path = r"c:\Users\DELL\sunspace\frontend\react-app\public\plan_v2.svg"
try:
    with open(svg_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all bureau_ID elements with their x,y context or parent group info
    # We are looking for things like <path id="bureau_8" ... or <use id="bureau_709" ...
    
    # Let's just find all IDs starting with bureau_
    ids = re.findall(r'id="(bureau_\d+)"', content)
    print(f"Total bureau_ IDs found: {len(ids)}")
    
    # We want to find those in the student areas.
    # Left area is around x=0-450, y=600-1460
    # Bottom area is around x=2000-2750, y=1440-1940
    
    # This might be hard to parse purely by regex if coords are far away.
    # Let's refine the search for specific blocks.
    
except Exception as e:
    print(f"Error: {e}")
