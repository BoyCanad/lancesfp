import os
from PIL import Image

path = r"d:\App\Website\stream\public\images\storyboards\el-bimbo-sprite.png"
with Image.open(path) as img:
    print(f"{img.width}x{img.height}")
