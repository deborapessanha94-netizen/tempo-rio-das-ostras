with open('js/weather-codes.js', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('getWeatherCondition')
if pos != -1:
    print(text[pos:pos+1500])
