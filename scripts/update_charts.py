import os

path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\charts.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace getColors text colors
content = content.replace("text: '#1e293b'", "text: '#000000'")
content = content.replace("textMuted: '#64748b'", "textMuted: '#000000'")
content = content.replace("barBorder: '#3d4f61'", "barBorder: '#000000'")

# Replace tooltip styling
content = content.replace("backgroundColor: '#273441'", "backgroundColor: '#ffffff'")
content = content.replace("titleColor: '#ffffff'", "titleColor: '#000000'")
content = content.replace("bodyColor: '#f1f5f9'", "bodyColor: '#000000'")
content = content.replace("borderColor: '#3d4f61',\n        borderWidth: 1", "borderColor: '#000000',\n        borderWidth: 1.5")
content = content.replace("borderColor: '#3d4f61',\r\n        borderWidth: 1", "borderColor: '#000000',\r\n        borderWidth: 1.5")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated js/charts.js successfully")
