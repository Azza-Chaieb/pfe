
import re

svg_path = r"c:\Users\DELL\sunspace\frontend\react-app\public\plan_v2.svg"
try:
    with open(svg_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all bureau_ID elements with class="G H"
    matches = re.findall(r'id="(bureau_\d+)"[^>]*class="[^"]*G H[^"]*"', content)
    print(f"Total chairs with G H class: {len(matches)}")
    print(matches)

except Exception as e:
    print(f"Error: {e}")
