
import re

svg_path = r"c:\Users\DELL\sunspace\frontend\react-app\public\plan_v2.svg"
try:
    with open(svg_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # LEFT AREA: 6 CHAIRS
    # Based on HF (top), HG (middle), HE (bottom)
    # Filter HF: x=189.171, y=792.511
    # Filter HG: x=189.171, y=1080.09
    # Filter HE: x=189.171, y=1157.09
    
    # We'll use more descriptive IDs that ExplorationScene can easily map to "bureau_student_left"
    left_chairs = [
        # Filter HF (792)
        (209, 792, "bureau_student_left_1"),
        (209, 715, "bureau_student_left_2"),
        # Filter HG (1080)
        (209, 1080, "bureau_student_left_3"),
        (209, 1003, "bureau_student_left_4"),
        # Filter HE (1157)
        (209, 1157, "bureau_student_left_5"),
        (209, 1080, "bureau_student_left_6"), # Wait, HG and HE might overlap or I need 709 etc.
    ]

    # Let's get REALLY precise coordinates for bureau_709 from its USE element
    match_709 = re.search(r'id="bureau_709".*?href="#Ux"', content)
    # bureau_709 is inside filter HE? No, it's just in a G with filter HE.
    
    # I'll just manually pick 22 points that look correct on the map screenshot
    # Left: 6 chairs in a column
    left_pts = [
        (215, 740), (215, 820),
        (215, 1025), (215, 1105),
        (215, 1315), (215, 1395)
    ]
    
    # Bottom: 16 chairs? User said 16.
    # Bottom area is around 2033, 1442 to 2754, 1937
    # Let's place a grid of sorts or follow visual clues if possible.
    # bureau_350: x=1967.34, y=1303.98 (wait, this is outside?)
    # Bureau_student_bottom: M2033 1442h721v495
    # Let's just use the current ones which were "roughly" correct but move them "on top"
    
    print("--- NEW CHAIR LAYER ---")
    print('<g id="interactive_chairs_layer">')
    for i, (x, y) in enumerate(left_pts):
        print(f'    <rect id="bureau_student_left_{i+1}" x="{x-25}" y="{y-25}" width="70" height="70" class="interactive-chair" fill="rgba(59,130,246,0)"/>')
    
    # Let's assume the previous bottom coordinates were "okay" but just needed z-index and garden fix.
    # x=2050 to 2650, y=1450 to 1800
    bottom_x = [2050, 2150, 2250, 2350, 2450, 2550, 2650]
    bottom_y = [1450, 1650, 1800]
    
    count = 1
    for y in bottom_y:
        for x in bottom_x:
            if count > 16: break
            print(f'    <rect id="bureau_student_bottom_{count}" x="{x}" y="{y}" width="80" height="100" class="interactive-chair" fill="rgba(59,130,246,0)"/>')
            count += 1
    print('</g>')

except Exception as e:
    print(f"Error: {e}")
