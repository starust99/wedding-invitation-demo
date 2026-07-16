import os
from PIL import Image

src_path = "/Users/augustinonathan/Downloads/Thiết kế chưa có tên (50).png"
out_dir = "/Users/augustinonathan/Documents/TerraCotta/wedding-invitation-demo/public/assets/wedding/timeline"
os.makedirs(out_dir, exist_ok=True)

img = Image.open(src_path).convert("RGBA")
width, height = img.size

# Precise safe boxes based on vertical projection analysis:
# - Row 0 Y range: 100 to 700 (captures entire arch Y=202-665, star Y=243-609; text starts at 748)
# - Row 1 Y range: 900 to 1400 (captures rings Y=1020-1344, champagne Y=969-1361; text starts at 1442)
# - Row 2 Y range: 1650 to 2120 (captures music Y=1689-2064, photos Y=1689-2077; text starts at 2191)
safe_boxes = [
    # 17:30 (Row 0, Col 0)
    {"name": "icon-1730.png", "box": (50, 100, 830, 700)},
    # 19:00 (Row 0, Col 1)
    {"name": "icon-1900.png", "box": (930, 100, 1710, 700)},
    # 19:10 (Row 1, Col 0)
    {"name": "icon-1910.png", "box": (50, 900, 830, 1400)},
    # 19:20 (Row 1, Col 1)
    {"name": "icon-1920.png", "box": (930, 900, 1710, 1400)},
    # 20:00 (Row 2, Col 0)
    {"name": "icon-2000.png", "box": (50, 1650, 830, 2120)},
    # 20:50 (Row 2, Col 1)
    {"name": "icon-2050.png", "box": (930, 1650, 1710, 2120)}
]

TARGET_CANVAS_SIZE = 512
ICON_MAX_SIZE = 380

for item in safe_boxes:
    name = item["name"]
    box = item["box"]
    
    cropped_safe = img.crop(box)
    
    alpha = cropped_safe.split()[3]
    bbox = alpha.getbbox()
    
    if bbox:
        tight_icon = cropped_safe.crop(bbox)
    else:
        tight_icon = cropped_safe
        
    w, h = tight_icon.size
    aspect_ratio = w / h
    if w > h:
        new_w = ICON_MAX_SIZE
        new_h = int(ICON_MAX_SIZE / aspect_ratio)
    else:
        new_h = ICON_MAX_SIZE
        new_w = int(ICON_MAX_SIZE * aspect_ratio)
        
    resized_icon = tight_icon.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    canvas = Image.new("RGBA", (TARGET_CANVAS_SIZE, TARGET_CANVAS_SIZE), (0, 0, 0, 0))
    paste_x = (TARGET_CANVAS_SIZE - new_w) // 2
    paste_y = (TARGET_CANVAS_SIZE - new_h) // 2
    canvas.paste(resized_icon, (paste_x, paste_y), resized_icon)
    
    out_path = os.path.join(out_dir, name)
    canvas.save(out_path, "PNG")
    print(f"Saved: {out_path} (original tight size: {tight_icon.size} -> resized: {resized_icon.size})")

print("All icons successfully cropped, scaled to uniform sizes, and centered!")
