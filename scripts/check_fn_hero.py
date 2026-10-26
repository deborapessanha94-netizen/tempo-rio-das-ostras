with open('js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

pos = 28865
# find beginning of the function
fn_start = text.rfind('function', 0, pos)
if fn_start == -1:
    fn_start = text.rfind('const ', 0, pos)

print("Function starts around:", fn_start)
print(text[fn_start:pos+1200])
