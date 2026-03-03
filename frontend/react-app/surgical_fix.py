
import os
import re

svg_path = r"c:\Users\DELL\sunspace\frontend\react-app\public\plan_v2.svg"
try:
    with open(svg_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove the Redundant Layer
    content = re.sub(r'<!-- TOP INTERACTIVE LAYER -->.*?/g>', '', content, flags=re.DOTALL)
    content = re.sub(r'<g id="interactive_chairs_layer">.*?/g>', '', content, flags=re.DOTALL)

    # 2. Define the Mappings
    left_ids = ["bureau_8", "bureau_9", "bureau_706", "bureau_709", "bureau_712", "bureau_715"]
    bottom_ids = [
        "bureau_1032", "bureau_1039", "bureau_1046", "bureau_1053",
        "bureau_1060", "bureau_1067", "bureau_1074", "bureau_1081",
        "bureau_1088", "bureau_1095", "bureau_1102", "bureau_1109",
        "bureau_1116", "bureau_1123", "bureau_1130", "bureau_1137"
    ]

    # Function to replace ID and add class
    def update_element(match, new_id):
        elem_text = match.group(0)
        # Add interactive-chair class if not present
        if 'class="' in elem_text:
            elem_text = elem_text.replace('class="', 'class="interactive-chair ')
        else:
            elem_text = elem_text.replace('>', ' class="interactive-chair">', 1)
        
        # Replace the ID
        elem_text = re.sub(r'id="bureau_\d+"', f'id="{new_id}"', elem_text)
        return elem_text

    # Apply Left Mappings
    for i, old_id in enumerate(left_ids):
        pattern = rf'<(path|use|rect|g|circle|ellipse)\s+id="{old_id}"[^>]*>'
        new_id = f"bureau_student_left_{i+1}"
        content = re.sub(pattern, lambda m: update_element(m, new_id), content)

    # Apply Bottom Mappings
    for i, old_id in enumerate(bottom_ids):
        pattern = rf'<(path|use|rect|g|circle|ellipse)\s+id="{old_id}"[^>]*>'
        new_id = f"bureau_student_bottom_{i+1}"
        content = re.sub(pattern, lambda m: update_element(m, new_id), content)

    # 3. Ensure Garden areas are non-clickable
    content = content.replace('id="bureau_student_left" d', 'id="bureau_student_left" pointer-events="none" d')
    content = content.replace('id="bureau_student_bottom" d', 'id="bureau_student_bottom" pointer-events="none" d')

    with open(svg_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Surgical fix applied successfully to all 22 chairs.")

except Exception as e:
    print(f"Error: {e}")
