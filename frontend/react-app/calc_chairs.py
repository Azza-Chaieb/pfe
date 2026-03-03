
import re

svg_path = r"c:\Users\DELL\sunspace\frontend\react-app\public\plan_v2.svg"
try:
    with open(svg_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Left Student Area: Filters HE, HF, HG
    # Each filter has 2 chairs (one use element, one with y=-77)
    left_coords = []
    for fid in ["HF", "HG", "HE"]: # Order from top to bottom roughly
        match = re.search(f'<filter id="{fid}".*?x="([-0-9.]+)".*?y="([-0-9.]+)"', content, re.DOTALL)
        if match:
            fx, fy = float(match.group(1)), float(match.group(2))
            # The use element inside the filter group usually has some offset or class
            # But from screenshot, bureau_709 is the chair.
            # Let's just use the filter x, y as the base for the 2 chairs in each group.
            left_coords.append((fx + 20, fy + 20)) # Chair 1
            left_coords.append((fx + 20, fy - 57)) # Chair 2 (y-77)
    
    print("--- Left Area Suggestion (6 chairs) ---")
    for i, (x, y) in enumerate(left_coords):
        print(f"rect id=\"bureau_student_left_{i+1}\" x=\"{x}\" y=\"{y}\" width=\"40\" height=\"40\"")

    # 2. Bottom Student Area: bureau_350 area
    # Looking for bureau_350, 354, 358, 362, 398, etc. in the bottom right 
    bottom_ids = ["bureau_350", "bureau_354", "bureau_358", "bureau_362", "bureau_398", "bureau_408"]
    print("\n--- Bottom Area Base Coords (Sample) ---")
    for bid in bottom_ids:
        # Match rect or use with this ID
        match = re.search(f'id="{bid}".*?x="([-0-9.]+)".*?y="([-0-9.]+)"', content, re.DOTALL)
        if match:
             print(f"{bid}: x={match.group(1)}, y={match.group(2)}")

except Exception as e:
    print(f"Error: {e}")
