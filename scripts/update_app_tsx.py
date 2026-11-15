import os

app_path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\src\App.tsx'

with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''  const { hourlyPoints, allHourlyPoints, chartDayOptions } = useMemo(() => {
    if (!openMeteo?.hourly) {
      return { hourlyPoints: [] as HourlyPoint[], allHourlyPoints: [] as HourlyPoint[], chartDayOptions: [] as string[] };
    }
    const allPts: HourlyPoint[] = openMeteo.hourly.time.map((t, i) => {
      const [datePart, hourPart] = t.split('T');
      return {
        hour: hourPart || t,
        dayLabel: formatDateBr(datePart),
        temp: openMeteo.hourly.temperature_2m[i] ?? 0,
        rainMm: openMeteo.hourly.precipitation[i] ?? 0,
        rainProb: openMeteo.hourly.precipitation_probability[i] ?? 0,
        windKmh: openMeteo.hourly.wind_speed_10m[i] ?? 0,
        windDir: degToCompass(openMeteo.hourly.wind_direction_10m[i] ?? 0),
        pressureHpa: openMeteo.hourly.surface_pressure[i] ?? 1015,
        humidity: openMeteo.hourly.relative_humidity_2m[i] ?? 75,
      };
    });

    // Current local hour in America/Sao_Paulo (YYYY-MM-DDTHH)
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const getP = (type: string) => parts.find((p) => p.type === type)?.value || '00';
    const nowBrtHour = `${getP('year')}-${getP('month')}-${getP('day')}T${getP('hour')}`;
    const startIdx = Math.max(0, openMeteo.hourly.time.findIndex((t) => t >= nowBrtHour));
    const forwardPts = allPts.slice(startIdx, startIdx + 192);
    const days = Array.from(new Set(allPts.map((p) => p.dayLabel)));

    return { hourlyPoints: forwardPts, allHourlyPoints: allPts, chartDayOptions: days };
  }, [openMeteo]);'''

replacement = '''  const SHIFT_HOURLY_WEIGHTS: Record<string, number[]> = useMemo(() => ({
    Madrugada: [0.10, 0.15, 0.25, 0.25, 0.15, 0.10], // 00h - 05h
    Manhã:     [0.10, 0.10, 0.15, 0.20, 0.25, 0.20], // 06h - 11h
    Tarde:     [0.08, 0.12, 0.25, 0.30, 0.15, 0.10], // 12h - 17h (pico convectivo 14h-16h)
    Noite:     [0.25, 0.30, 0.20, 0.15, 0.07, 0.03], // 18h - 23h
  }), []);

  const { hourlyPoints, allHourlyPoints, chartDayOptions } = useMemo(() => {
    if (!openMeteo?.hourly) {
      return { hourlyPoints: [] as HourlyPoint[], allHourlyPoints: [] as HourlyPoint[], chartDayOptions: [] as string[] };
    }
    const allPts: HourlyPoint[] = openMeteo.hourly.time.map((t, i) => {
      const [datePart, hourPart] = t.split('T');
      const hourNum = parseInt(hourPart?.slice(0, 2) || '0', 10);

      let shiftName = 'Madrugada';
      let hourIdxInShift = hourNum;
      if (hourNum >= 18) {
        shiftName = 'Noite';
        hourIdxInShift = hourNum - 18;
      } else if (hourNum >= 12) {
        shiftName = 'Tarde';
        hourIdxInShift = hourNum - 12;
      } else if (hourNum >= 6) {
        shiftName = 'Manhã';
        hourIdxInShift = hourNum - 6;
      }

      const shiftRow = boletimOficial?.find(
        (b) => b.data_iso === datePart && (b.turno === shiftName || b.turno_label === shiftName)
      );

      let rainVal = openMeteo.hourly.precipitation[i] ?? 0;
      let rainProbVal = openMeteo.hourly.precipitation_probability[i] ?? 0;

      // Harmonização precisa com o Boletim Oficial Municipal e Alertas INMET
      if (shiftRow) {
        if (typeof shiftRow.chuva_media === 'number') {
          const w = SHIFT_HOURLY_WEIGHTS[shiftName]?.[hourIdxInShift] ?? (1 / 6);
          rainVal = Math.round(shiftRow.chuva_media * w * 10) / 10;
        }
        if (typeof shiftRow.chuva_prob === 'number') {
          rainProbVal = Math.max(rainProbVal, shiftRow.chuva_prob);
        }
      }

      return {
        hour: hourPart || t,
        dayLabel: formatDateBr(datePart),
        temp: openMeteo.hourly.temperature_2m[i] ?? 0,
        rainMm: rainVal,
        rainProb: rainProbVal,
        windKmh: openMeteo.hourly.wind_speed_10m[i] ?? 0,
        windDir: degToCompass(openMeteo.hourly.wind_direction_10m[i] ?? 0),
        pressureHpa: openMeteo.hourly.surface_pressure[i] ?? 1015,
        humidity: openMeteo.hourly.relative_humidity_2m[i] ?? 75,
      };
    });

    // Current local hour in America/Sao_Paulo (YYYY-MM-DDTHH)
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const getP = (type: string) => parts.find((p) => p.type === type)?.value || '00';
    const nowBrtHour = `${getP('year')}-${getP('month')}-${getP('day')}T${getP('hour')}`;
    const startIdx = Math.max(0, openMeteo.hourly.time.findIndex((t) => t >= nowBrtHour));
    const forwardPts = allPts.slice(startIdx, startIdx + 192);
    const days = Array.from(new Set(allPts.map((p) => p.dayLabel)));

    return { hourlyPoints: forwardPts, allHourlyPoints: allPts, chartDayOptions: days };
  }, [openMeteo, boletimOficial, SHIFT_HOURLY_WEIGHTS]);'''

target_crlf = target.replace('\n', '\r\n')
replacement_crlf = replacement.replace('\n', '\r\n')

if target in content:
    content = content.replace(target, replacement)
    with open(app_path, 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(content)
    print('App.tsx updated (LF match)!')
elif target_crlf in content:
    content = content.replace(target_crlf, replacement_crlf)
    with open(app_path, 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(content)
    print('App.tsx updated (CRLF match)!')
else:
    print('Target not found in App.tsx!')
