import os
from PIL import Image

image_dir = r"d:\App\Website\stream\public\images"
images = ["el-bimbo-detail.png", "el-bimbo-detail-mobile.png", "minsan-banner.png", "minsan-mobile-carousel.png"]

for img_name in images:
    try:
        path = os.path.join(image_dir, img_name)
        with Image.open(path) as img:
            print(f"{img_name}: {img.width}x{img.height}")
    except Exception as e:
        print(f"{img_name}: Error - {e}")
