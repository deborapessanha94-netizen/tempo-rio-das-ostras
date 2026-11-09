import urllib.request
import json

url = 'https://api.open-meteo.com/v1/forecast?latitude=-22.5269&longitude=-41.9453&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&forecast_days=7&timezone=America%2FSao_Paulo'
data = json.loads(urllib.request.urlopen(url).read().decode('utf-8'))
daily = data['daily']
for i in range(len(daily['time'])):
    t = daily['time'][i]
    r = daily['precipitation_sum'][i]
    rp = daily['precipitation_probability_max'][i]
    w = daily['wind_speed_10m_max'][i]
    g = daily['wind_gusts_10m_max'][i]
    d = daily['wind_direction_10m_dominant'][i]
    tmin = daily['temperature_2m_min'][i]
    tmax = daily['temperature_2m_max'][i]
    code = daily['weather_code'][i]
    print(f"{t}: Rain {r}mm (Prob {rp}%), Wind {w} km/h, Gusts {g} km/h, Dir {d}°, Temp {tmin}°C to {tmax}°C, WMO {code}")
