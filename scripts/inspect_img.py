from PIL import Image

path = r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf\.user_uploaded\media_1792965584708_e75dbaab.png'
img = Image.open(path)
print("Size:", img.size)
print("Mode:", img.mode)
