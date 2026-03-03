
import re

svg_path = r"c:\Users\DELL\sunspace\frontend\react-app\public\plan_v2.svg"

try:
    with open(svg_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # STEP 1: Restore previously wrongly renamed elements back to neutral non-interactive names
    # These were renamed: bureau_8 -> bureau_student_left_1 (path)
    #                     bureau_9 -> bureau_student_left_2 (path) 
    #                     bureau_706 -> bureau_student_left_3 (use)
    #                     bureau_709 -> bureau_student_left_4 (use)
    #                     bureau_712 -> bureau_student_left_5 (use)
    #                     bureau_715 -> bureau_student_left_6 (use)
    # We need to rename them away from bureau_student_left_X names
    # by giving them non-matching names (add "_back" suffix)
    
    content = re.sub(r'id="bureau_student_left_1"', 'id="bureau_student_left_back_1"', content)
    content = re.sub(r'id="bureau_student_left_2"', 'id="bureau_student_left_back_2"', content)
    content = re.sub(r'id="bureau_student_left_3"', 'id="bureau_student_left_back_3"', content)
    content = re.sub(r'id="bureau_student_left_4"', 'id="bureau_student_left_back_4"', content)
    content = re.sub(r'id="bureau_student_left_5"', 'id="bureau_student_left_back_5"', content)
    content = re.sub(r'id="bureau_student_left_6"', 'id="bureau_student_left_back_6"', content)
    
    # Also remove interactive-chair class from these back elements
    content = content.replace('class="interactive-chair G H"', 'class="G H"')
    
    # STEP 2: Now rename the SEAT fill elements (bureau_700, 702, 704, 707, 710, 713) to bureau_student_left_X
    # These are the main seat body elements (the primary fill, not the overlay)
    # Pairs: (700,701), (702,703), (704,705), (707,708), (710,711), (713,714)
    # bureau_700 -> bureau_student_left_1
    # bureau_702 -> bureau_student_left_2
    # bureau_704 -> bureau_student_left_3
    # bureau_707 -> bureau_student_left_4
    # bureau_710 -> bureau_student_left_5
    # bureau_713 -> bureau_student_left_6
    
    seat_map = {
        "bureau_700": "bureau_student_left_1",
        "bureau_702": "bureau_student_left_2",
        "bureau_704": "bureau_student_left_3",
        "bureau_707": "bureau_student_left_4",
        "bureau_710": "bureau_student_left_5",
        "bureau_713": "bureau_student_left_6"
    }
    
    for old_id, new_id in seat_map.items():
        # Add interactive-chair class to the element AND rename its ID
        # Match: <use id="bureau_700" ... >
        pattern = rf'(<use\s+id="{old_id}"[^>]*?)(/>|>)'
        def replace_func(m, new_id=new_id):
            tag = m.group(1)
            end = m.group(2)
            # Replace ID
            tag = re.sub(rf'id="{re.escape(old_id)}"', f'id="{new_id}"', tag)
            # Add class if missing
            if 'class="' in tag:
                tag = tag.replace('class="', 'class="interactive-chair ')
            else:
                tag = tag + ' class="interactive-chair"'
            return tag + end
            
        content = re.sub(pattern, replace_func, content)
    
    with open(svg_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Successfully applied seat rename fix.")
    
    # Verify
    for new_id in seat_map.values():
        match = re.search(rf'id="{new_id}"[^>]*>', content)
        if match:
            print(f"  {new_id}: {match.group(0)[:150]}")

except Exception as e:
    print(f"Error: {e}")
