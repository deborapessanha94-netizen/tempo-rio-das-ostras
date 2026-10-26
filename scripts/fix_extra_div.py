with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''              </div>
            </div>
          </div>
</div>



        </div>'''

replacement = '''              </div>
            </div>
          </div>



        </div>'''

if target in text:
    text = text.replace(target, replacement, 1)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed extra div!")
else:
    print("Target not found!")
