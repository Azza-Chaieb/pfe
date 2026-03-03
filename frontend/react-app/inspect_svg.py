
import re

svg_path = r"c:\Users\DELL\sunspace\frontend\react-app\public\plan_v2.svg"

try:
    with open(svg_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # First, UNDO the previous wrong renamings - restore original bureau_ IDs that are now bureau_student_left_X
    # Previous renames: bureau_8 -> bureau_student_left_1, bureau_9 -> bureau_student_left_2,
    # bureau_706 -> bureau_student_left_3, bureau_709 -> bureau_student_left_4
    # bureau_712 -> bureau_student_left_5, bureau_715 -> bureau_student_left_6
    
    # Restore them back (we can find them by the path data that's unique to each)
    # bureau_student_left_1 is a path element (the round chair back)
    # bureau_student_left_3,4,5,6 are use elements with class "interactive-chair G H"
    
    # Let's just check what bureau_student_left_1 looks like now
    match = re.search(r'id="bureau_student_left_1"[^>]*>', content)
    if match:
        print("bureau_student_left_1:", match.group(0)[:200])
    
    match2 = re.search(r'id="bureau_student_left_3"[^>]*>', content)
    if match2:
        print("bureau_student_left_3:", match2.group(0)[:200])
    
    # Check what the chair SEATS look like (bureau_700, 701, ...)
    match3 = re.search(r'id="bureau_700"[^>]*>', content)
    if match3:
        print("bureau_700:", match3.group(0)[:200])
        
    match4 = re.search(r'id="bureau_702"[^>]*>', content)
    if match4:
        print("bureau_702:", match4.group(0)[:200])

except Exception as e:
    print(f"Error: {e}")
