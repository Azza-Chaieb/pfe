
import os
import re

svg_path = r"c:\Users\DELL\sunspace\frontend\react-app\public\plan_v2.svg"
try:
    with open(svg_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Define the new interactive layer with precise coordinates
    new_layer = """
    <!-- TOP INTERACTIVE LAYER -->
    <g id="interactive_chairs_layer">
        <!-- Student Area Left (6 chairs) -->
        <rect id="bureau_student_left_1" x="190" y="715" width="70" height="70" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_left_2" x="190" y="795" width="70" height="70" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_left_3" x="190" y="1000" width="70" height="70" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_left_4" x="190" y="1080" width="70" height="70" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_left_5" x="190" y="1290" width="70" height="70" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_left_6" x="190" y="1370" width="70" height="70" class="interactive-chair" fill="rgba(59,130,246,0)"/>

        <!-- Student Area Bottom (16 chairs) -->
        <rect id="bureau_student_bottom_1" x="2050" y="1450" width="80" height="100" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_bottom_2" x="2150" y="1450" width="80" height="100" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_bottom_3" x="2250" y="1450" width="80" height="100" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_bottom_4" x="2350" y="1450" width="80" height="100" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_bottom_5" x="2450" y="1450" width="80" height="100" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_bottom_6" x="2550" y="1450" width="80" height="100" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_bottom_7" x="2650" y="1450" width="80" height="100" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_bottom_8" x="2050" y="1650" width="80" height="100" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_bottom_9" x="2150" y="1650" width="80" height="100" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_bottom_10" x="2250" y="1650" width="80" height="100" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_bottom_11" x="2350" y="1650" width="80" height="100" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_bottom_12" x="2450" y="1650" width="80" height="100" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_bottom_13" x="2550" y="1650" width="80" height="100" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_bottom_14" x="2650" y="1650" width="80" height="100" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_bottom_15" x="2050" y="1800" width="80" height="100" class="interactive-chair" fill="rgba(59,130,246,0)"/>
        <rect id="bureau_student_bottom_16" x="2150" y="1800" width="80" height="100" class="interactive-chair" fill="rgba(59,130,246,0)"/>
    </g>
"""

    # First, remove ANY existing interactive_chairs_layer to avoid duplicates
    content = re.sub(r'<!-- TOP INTERACTIVE LAYER -->.*?<!-- Student Area Bottom.*?/g>', '', content, flags=re.DOTALL)
    content = re.sub(r'<g id="interactive_chairs_layer">.*?/g>', '', content, flags=re.DOTALL)

    # Insert before the last </svg>
    if "</svg>" in content:
        idx = content.rfind("</svg>")
        new_content = content[:idx].strip() + "\n" + new_layer + "</svg>"
        with open(svg_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully updated SVG with precise overlays.")
    else:
        print("Error: Could not find </svg> tag.")

except Exception as e:
    print(f"Error: {e}")
