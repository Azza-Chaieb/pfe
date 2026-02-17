import os

path = r'c:\Users\Nwres\Documents\GitHub\pfe\frontend\react-app\public\plan_v2.svg'
target = 'id="bureau_602"'

with open(path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if target in line:
            print(f"Found {target} on line {i}")
            print(f"Content: {line.strip()}")
            break
    else:
        print(f"Target {target} not found.")
