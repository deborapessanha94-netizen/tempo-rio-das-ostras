with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_marker = '// Modal 4: Meteogramas Oficiais (INMET & CPTEC/INPE)'
end_marker = '// Fechar no ESC'

start_pos = text.find(start_marker)
end_pos = text.find(end_marker, start_pos)

print("Found markers:", start_pos, end_pos)
print("Block to replace length:", end_pos - start_pos)
print("Starts with:", repr(text[start_pos:start_pos+100]))
print("Ends with:", repr(text[end_pos-100:end_pos]))
