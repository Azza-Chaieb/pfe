
import re

svg_path = r"c:\Users\DELL\sunspace\frontend\react-app\public\plan_v2.svg"
try:
    with open(svg_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Search for filters HE, HF, HG
    for fid in ["HE", "HF", "HG"]:
        match = re.search(f'<filter id="{fid}".*?x="([-0-9.]+)".*?y="([-0-9.]+)"', content, re.DOTALL)
        if match:
            print(f"Filter {fid}: x={match.group(1)}, y={match.group(2)}")
        else:
            print(f"Filter {fid} not found.")

except Exception as e:
    print(f"Error: {e}")
