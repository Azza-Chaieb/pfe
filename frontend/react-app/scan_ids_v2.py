
import re

svg_path = r"c:\Users\DELL\sunspace\frontend\react-app\public\plan_v2.svg"
try:
    with open(svg_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Bounding boxes
    # Left: x=[10, 460], y=[600, 1460]
    # Bottom: x=[2030, 2760], y=[1440, 1940]
    
    left_chairs = []
    bottom_chairs = []
    
    # 1. Look for <use> elements
    # <use id="bureau_709" href="#Ux" class="G H"/>  - no x,y means it's 0,0 or defined in filter
    # But some have x,y or y offsets.
    # This is complex because of filters.
    
    # Let's just find ALL bureau_XXX IDs and see their context.
    # From previous runs, we know the left ones: 8, 9, 706, 709, 712, 715.
    
    # Let's search for "bureau_" and capture the element type and some context.
    matches = re.finditer(r'<(path|use|rect|g|circle|ellipse)\s+id="(bureau_\d+)"', content)
    
    results = []
    for m in matches:
        tag = m.group(1)
        bid = m.group(2)
        # Get surrounding 100 chars
        ctx = content[max(0, m.start()-50) : min(len(content), m.end()+150)]
        results.append((bid, tag, ctx))

    print(f"Total bureau_ IDs: {len(results)}")
    
    # 2. Heuristic for bottom chairs:
    # Look for "bureau_" followed by coords in the 2000s and 1400-1900s.
    for bid, tag, ctx in results:
        # Simple coordinate extraction from context
        coords = re.findall(r'[xy]="([-0-9.]+)"', ctx)
        if coords:
            # Check if any coordinate falls in the bottom area range
            is_bottom = False
            for c in coords:
                val = float(c)
                if (2000 <= val <= 2800) or (1440 <= val <= 1940):
                    # This is likely a bottom chair
                    bottom_chairs.append(bid)
                    break

    # Deduplicate and sort
    bottom_chairs = sorted(list(set(bottom_chairs)))
    print(f"Potential Bottom Chairs ({len(bottom_chairs)}): {bottom_chairs}")

except Exception as e:
    print(f"Error: {e}")
