# -*- coding: utf-8 -*-
with open("src/App.tsx", "r", encoding="utf-8") as f:
    text = f.read()

start_marker = '<div className="overflow-x-auto">\n                  {historyMode === \'mensal\' ?'
if start_marker not in text:
    # Try CRLF
    start_marker = '<div className="overflow-x-auto">\r\n                  {historyMode === \'mensal\' ?'

start_idx = text.find(start_marker)
print("start_idx:", start_idx)

end_marker = '</section>\n            )}'
if end_marker not in text:
    end_marker = '</section>\r\n            )}'
end_idx = text.find(end_marker, start_idx)
print("end_idx:", end_idx)

# Let's inspect snippet
print("Snippet before replacement:")
print(text[start_idx:start_idx+100])
print("Snippet before end:")
print(text[end_idx-100:end_idx])
