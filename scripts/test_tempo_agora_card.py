import os
import sys
import time
import json
import base64
import tempfile
import threading
import subprocess
from http.server import SimpleHTTPRequestHandler, HTTPServer
import urllib.request
import websocket

PORT = 8777
PROJECT_DIR = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
ARTIFACT_DIR = r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf"
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PROJECT_DIR, **kwargs)
    def log_message(self, format, *args):
        pass

def start_server():
    httpd = HTTPServer(('127.0.0.1', PORT), QuietHandler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    return httpd

class CDPClient:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url, timeout=15)
        self.msg_id = 0

    def send(self, method, params=None):
        self.msg_id += 1
        payload = {"id": self.msg_id, "method": method}
        if params:
            payload["params"] = params
        self.ws.send(json.dumps(payload))
        while True:
            res = json.loads(self.ws.recv())
            if res.get("id") == self.msg_id:
                return res

    def evaluate(self, expression):
        res = self.send("Runtime.evaluate", {
            "expression": expression,
            "returnByValue": True,
            "awaitPromise": True
        })
        if "error" in res:
            raise RuntimeError(f"Eval error: {res['error']}")
        result = res.get("result", {}).get("result", {})
        return result.get("value")

    def close(self):
        try:
            self.ws.close()
        except Exception:
            pass

def main():
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    httpd = start_server()
    temp_user_data = tempfile.mkdtemp()
    edge_cmd = [
        EDGE_PATH,
        "--headless=new",
        "--remote-debugging-port=9226",
        f"--user-data-dir={temp_user_data}",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--window-size=1400,950",
        "about:blank"
    ]
    edge_proc = subprocess.Popen(edge_cmd)

    ws_url = None
    for _ in range(20):
        time.sleep(0.5)
        try:
            with urllib.request.urlopen("http://127.0.0.1:9226/json", timeout=2) as resp:
                targets = json.loads(resp.read().decode())
                for t in targets:
                    if t.get("type") == "page" and "webSocketDebuggerUrl" in t:
                        ws_url = t["webSocketDebuggerUrl"]
                        break
            if ws_url:
                break
        except Exception:
            pass

    if not ws_url:
        print("[ERROR] Could not connect to Edge CDP")
        edge_proc.terminate()
        return

    cdp = CDPClient(ws_url)

    try:
        cdp.send("Page.enable")
        cdp.send("Runtime.enable")

        url = f"http://127.0.0.1:{PORT}/index.html?v=193"
        cdp.send("Page.navigate", {"url": url})
        time.sleep(3)

        # Refined Tempo Agora Canvas Renderer
        refined_script = """(() => {
            window.renderTempoAgoraRefined = function(format, theme) {
                const isStory = format === 'story';
                const isDark = theme === 'dark';
                const width = 1080;
                const height = isStory ? 1920 : 1350;

                let canvas = document.getElementById('test-tempo-canvas-refined');
                if (!canvas) {
                    canvas = document.createElement('canvas');
                    canvas.id = 'test-tempo-canvas-refined';
                    document.body.appendChild(canvas);
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // 1. Fundo Geral
                if (isDark) {
                    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
                    bgGrad.addColorStop(0, '#020b18');
                    bgGrad.addColorStop(0.5, '#041226');
                    bgGrad.addColorStop(1, '#06172e');
                    ctx.fillStyle = bgGrad;
                } else {
                    ctx.fillStyle = '#f4f1ea';
                }
                ctx.fillRect(0, 0, width, height);

                // Dados extraídos do DOM
                const getTxt = (id, fallback = '') => {
                    const el = document.getElementById(id);
                    return el ? el.textContent.trim().replace(/\\s+/g, ' ') : fallback;
                };

                const data = {
                    title: 'Rio das Ostras, RJ – Tempo agora',
                    estacaoAno: getTxt('hero-estacao-txt', 'Estação: Primavera'),
                    subtitle: 'Região dos Lagos • Costa do Sol • Estação Telemétrica Sede',
                    alertPill: getTxt('hero-alert-pill', 'Alerta Oficial Vigente Hoje'),
                    temp: getTxt('sidebar-temp', '20°'),
                    sensacao: getTxt('hero-sensacao', 'Sensação em Tempo Real: 20°C'),
                    skyCond: getTxt('hero-sky-condition', 'Céu no Momento'),
                    condTitle: getTxt('hero-condition', 'Muitas nuvens com pancadas de chuva'),
                    condSub: getTxt('hero-subcondition', 'Chuva prevista: 15.9 mm • Rajadas 50 km/h na orla marítima'),
                    date: getTxt('hero-date', 'Segunda-feira, 09 de Novembro de 2026'),
                    syncLabel: getTxt('hero-sync-label', 'Atualização a cada 5 min (Tempo Real)'),
                    chips: [
                        { label: 'CHUVA PREVISTA', val: getTxt('hero-chip-chuva-val', '15.9 mm (Até 50 mm)'), sub: getTxt('hero-chip-chuva-sub', 'Pico: 20 a 30 mm/h (Alerta)'), icon: '🌧️', isCoral: true },
                        { label: 'VENTO / RAJADAS', val: getTxt('sidebar-wind', '50 km/h'), sub: getTxt('hero-chip-vento-sub', 'Rajadas na orla marítima'), icon: '💨', isCoral: false },
                        { label: 'UMIDADE DO AR', val: getTxt('sidebar-hum', '60% a 90%'), sub: getTxt('hero-chip-umid-sub', 'Ar Muito Úmido'), icon: '💧', isCoral: true },
                        { label: 'MAR NA ORLA', val: getTxt('sidebar-sea', '1.0 a 1.0 m'), sub: getTxt('hero-chip-mar-sub', 'Atenção • Moderado'), icon: '🌊', isCoral: false },
                        { label: 'PRESSÃO ATM.', val: getTxt('hero-chip-press-val', '1018 hPa'), sub: getTxt('hero-chip-press-sub', 'Estável'), icon: '⏲️', isCoral: false },
                        { label: 'ÍNDICE UV', val: getTxt('hero-chip-uv-val', '8 - Muito Alto'), sub: getTxt('hero-chip-uv-sub', 'Evite sol • FPS 50+'), icon: '☀️', isCoral: true },
                        { label: 'NASCER & PÔR DO SOL', val: getTxt('hero-chip-sol-val', '🌅 04:57 • 🌇 18:06'), sub: getTxt('hero-chip-sol-sub', '13h 08m de Sol'), icon: '🌄', isCoral: true },
                        { label: 'FASE DA LUA', val: getTxt('hero-chip-lua-val', '🌑 Lua Nova'), sub: getTxt('hero-chip-lua-sub', 'Ilum. 0% • Noite'), icon: '🌙', isCoral: false }
                    ]
                };

                // Margens e Geometria do Hero Card Central
                const margin = 55;
                const cardX = margin;
                const cardY = isStory ? 80 : 45;
                const cardW = width - margin * 2; // 970px
                const cardH = isStory ? 1700 : 1220;

                // Cartão Principal
                ctx.fillStyle = isDark ? 'rgba(10, 20, 38, 0.96)' : '#ffffff';
                ctx.beginPath();
                ctx.roundRect(cardX, cardY, cardW, cardH, 24);
                ctx.fill();

                ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.35)' : '#cbd5e1';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                // Barra superior de destaque (Orange pill accent)
                ctx.fillStyle = '#ea580c';
                ctx.beginPath();
                ctx.roundRect(cardX + 28, cardY, cardW - 56, 5, 2.5);
                ctx.fill();

                // 2. TOPO DO CARD: Ícone Pin + Título + Estação + Alerta + 24H
                const headerY = cardY + (isStory ? 45 : 36);

                // Pin Medallion
                ctx.fillStyle = '#ea580c';
                ctx.beginPath();
                ctx.roundRect(cardX + 28, headerY, 44, 44, 12);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = '22px sans-serif';
                ctx.fillText('📍', cardX + 38, headerY + 31);

                // Título Principal
                const titleX = cardX + 84;
                ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
                ctx.font = isStory ? 'bold 28px sans-serif' : 'bold 24px sans-serif';
                ctx.fillText(data.title, titleX, headerY + 24);

                // Linha 2 do Cabeçalho: Subtítulo + Badge Estação
                ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
                ctx.font = '500 14px sans-serif';
                const subTxt = data.subtitle;
                ctx.fillText(subTxt, titleX, headerY + 48);

                const subTxtWidth = ctx.measureText(subTxt).width;
                const estacaoX = titleX + subTxtWidth + 14;
                ctx.font = 'bold 12px sans-serif';
                const estacaoWidth = ctx.measureText(data.estacaoAno).width + 18;

                ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7';
                ctx.beginPath();
                ctx.roundRect(estacaoX, headerY + 34, estacaoWidth, 20, 10);
                ctx.fill();
                ctx.strokeStyle = isDark ? '#10b981' : '#86efac';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = isDark ? '#34d399' : '#15803d';
                ctx.fillText(data.estacaoAno, estacaoX + 9, headerY + 48);

                // Lado Direito do Topo: Alerta Oficial + 24H
                const rightX = cardX + cardW - 28;
                ctx.textAlign = 'right';

                // Badge 24H
                ctx.font = 'bold 12px sans-serif';
                const badge24Width = 44;
                ctx.fillStyle = isDark ? '#1e293b' : '#f1f5f9';
                ctx.beginPath();
                ctx.roundRect(rightX - badge24Width, headerY + 8, badge24Width, 28, 8);
                ctx.fill();
                ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = isDark ? '#e2e8f0' : '#0f172a';
                ctx.fillText('24H', rightX - 12, headerY + 27);

                // Badge Alerta Oficial Vigente
                const alertText = data.alertPill.toUpperCase();
                ctx.font = '900 12px sans-serif';
                const alertWidth = ctx.measureText(alertText).width + 24;
                const alertX = rightX - badge24Width - 10 - alertWidth;

                ctx.fillStyle = '#ea580c';
                ctx.beginPath();
                ctx.roundRect(alertX, headerY + 8, alertWidth, 28, 14);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.fillText(alertText, rightX - badge24Width - 22, headerY + 27);
                ctx.textAlign = 'left';

                // Linha divisória horizontal
                const div1Y = headerY + 68;
                ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(203, 213, 225, 0.8)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(cardX + 28, div1Y);
                ctx.lineTo(cardX + cardW - 28, div1Y);
                ctx.stroke();

                // 3. CENTRO DO CARD: Temperatura + Sensação + Céu no Momento + Mapa & Ícone
                const centerTopY = div1Y + (isStory ? 32 : 24);

                // Temperatura Gigante
                ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
                ctx.font = isStory ? '900 84px sans-serif' : '900 70px sans-serif';
                ctx.fillText(data.temp, cardX + 28, centerTopY + (isStory ? 72 : 62));

                const tempWidth = ctx.measureText(data.temp).width;
                ctx.font = 'bold 30px sans-serif';
                ctx.fillText('C', cardX + 32 + tempWidth, centerTopY + (isStory ? 42 : 34));

                // Sensação em Tempo Real (Pill)
                const sensX = cardX + 64 + tempWidth;
                ctx.font = 'bold 14px sans-serif';
                const sensText = `🔥 ${data.sensacao}`;
                const sensWidth = ctx.measureText(sensText).width + 24;
                ctx.fillStyle = '#ea580c';
                ctx.beginPath();
                ctx.roundRect(sensX, centerTopY + (isStory ? 20 : 14), sensWidth, 30, 15);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.fillText(sensText, sensX + 12, centerTopY + (isStory ? 41 : 34));

                // Pill "CÉU NO MOMENTO"
                const skyY = centerTopY + (isStory ? 116 : 98);
                ctx.font = 'bold 11px sans-serif';
                ctx.fillStyle = isDark ? 'rgba(234, 88, 12, 0.2)' : '#ffedd5';
                ctx.beginPath();
                ctx.roundRect(cardX + 28, skyY - 14, 128, 22, 6);
                ctx.fill();
                ctx.strokeStyle = isDark ? '#ea580c' : '#fdba74';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = isDark ? '#ea580c' : '#c2410c';
                ctx.fillText('👁️ CÉU NO MOMENTO', cardX + 34, skyY + 2);

                // Subtítulo do Céu
                ctx.fillStyle = isDark ? '#94a3b8' : '#334155';
                ctx.font = '600 16px sans-serif';
                ctx.fillText(data.skyCond, cardX + 166, skyY + 2);

                // Título da Condição (Grande e Destacado)
                const condY = skyY + (isStory ? 42 : 32);
                ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
                ctx.font = isStory ? 'bold 30px sans-serif' : 'bold 23px sans-serif';
                ctx.fillText(data.condTitle, cardX + 28, condY);

                // Subcondição (Chuva prevista e rajadas na orla)
                const subcondY = condY + (isStory ? 32 : 26);
                ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
                ctx.font = '500 16px sans-serif';
                ctx.fillText(data.condSub, cardX + 28, subcondY);

                // LADO DIREITO DO CENTRO: Mini-Mapa do RJ
                const visualRightX = cardX + cardW - 28;
                const mapW = isStory ? 220 : 185;
                const mapH = isStory ? 154 : 130;
                const mapX = visualRightX - mapW;
                const mapY = centerTopY + 2;

                // Box do Mapa
                ctx.fillStyle = isDark ? '#0b1322' : '#f8fafc';
                ctx.beginPath();
                ctx.roundRect(mapX, mapY, mapW, mapH, 14);
                ctx.fill();
                ctx.strokeStyle = isDark ? '#1e293b' : '#cbd5e1';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Imagem real do Mapa do RJ
                const mapImg = document.querySelector(isDark ? 'img[src*="mapa_rj_dark"]' : 'img[src*="mapa_rj_light"]') ||
                               document.querySelector('img[src*="mapa_rj"]');
                if (mapImg && mapImg.complete && mapImg.naturalWidth > 0) {
                    ctx.drawImage(mapImg, mapX + 6, mapY + 6, mapW - 12, mapH - 12);
                }

                // Ponto de Rio das Ostras no Mapa
                const pinX = mapX + mapW * 0.788;
                const pinY = mapY + mapH * 0.60;
                ctx.fillStyle = '#ea580c';
                ctx.beginPath();
                ctx.arc(pinX, pinY, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Tag "Rio das Ostras" sobre o mapa
                ctx.fillStyle = '#ea580c';
                ctx.beginPath();
                ctx.roundRect(mapX + mapW - 88, mapY + mapH - 24, 82, 19, 4);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 9.5px sans-serif';
                ctx.fillText('📍 Rio das Ostras', mapX + mapW - 84, mapY + mapH - 10);

                // Linha divisória horizontal antes da grade de métricas
                const div2Y = Math.max(subcondY + (isStory ? 30 : 20), mapY + mapH + (isStory ? 24 : 16));
                ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(203, 213, 225, 0.8)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(cardX + 28, div2Y);
                ctx.lineTo(cardX + cardW - 28, div2Y);
                ctx.stroke();

                // 4. GRADE DE 8 MÉTRICAS ESSENCIAIS (2 Colunas x 4 Linhas)
                const gridStartY = div2Y + (isStory ? 28 : 18);
                const colGap = 18;
                const colW = (cardW - 56 - colGap) / 2; // ~448px cada
                const rowGap = isStory ? 20 : 10;
                const metricH = isStory ? 130 : 84;

                data.chips.forEach((chip, i) => {
                    const col = i % 2;
                    const row = Math.floor(i / 2);
                    const chipX = cardX + 28 + col * (colW + colGap);
                    const chipY = gridStartY + row * (metricH + rowGap);

                    // Fundo da Célula de Métrica
                    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : '#ffffff';
                    ctx.beginPath();
                    ctx.roundRect(chipX, chipY, colW, metricH, 14);
                    ctx.fill();

                    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.25)' : '#cbd5e1';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    // Medalhão Circular do Ícone
                    const iconSize = isStory ? 52 : 42;
                    const iconX = chipX + 14;
                    const iconY = chipY + (metricH - iconSize) / 2;

                    ctx.fillStyle = chip.isCoral 
                        ? (isDark ? 'rgba(234, 88, 12, 0.2)' : '#ffedd5')
                        : (isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe');
                    ctx.beginPath();
                    ctx.arc(iconX + iconSize/2, iconY + iconSize/2, iconSize/2, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = chip.isCoral ? '#ea580c' : (isDark ? '#38bdf8' : '#0284c7');
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.font = isStory ? '24px sans-serif' : '19px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(chip.icon, iconX + iconSize/2, iconY + iconSize/2 + (isStory ? 8 : 6));
                    ctx.textAlign = 'left';

                    // Textos da Métrica
                    const textX = iconX + iconSize + 14;
                    const topTextY = chipY + (isStory ? 32 : 22);

                    // Rótulo
                    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
                    ctx.font = 'bold 11px sans-serif';
                    ctx.fillText(chip.label, textX, topTextY);

                    // Valor com escala dinâmica de fonte para evitar qualquer estouro
                    ctx.fillStyle = isDark ? (chip.isCoral ? '#38bdf8' : '#ffffff') : '#0f172a';
                    const valLen = chip.val.length;
                    const valFontSize = isStory 
                        ? (valLen > 24 ? 17 : (valLen > 18 ? 19 : 22)) 
                        : (valLen > 24 ? 14 : (valLen > 18 ? 15 : 17));
                    ctx.font = `900 ${valFontSize}px sans-serif`;
                    ctx.fillText(chip.val, textX, topTextY + (isStory ? 32 : 23));

                    // Subtexto
                    ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
                    ctx.font = isStory ? '500 13px sans-serif' : '500 12px sans-serif';
                    ctx.fillText(chip.sub, textX, topTextY + (isStory ? 58 : 42));
                });

                // 5. RODAPÉ DO HERO CARD: Data Oficial + Frequência de Atualização
                const heroFooterY = cardY + cardH - (isStory ? 40 : 28);
                ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(203, 213, 225, 0.8)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(cardX + 28, heroFooterY - 18);
                ctx.lineTo(cardX + cardW - 28, heroFooterY - 18);
                ctx.stroke();

                ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
                ctx.font = isStory ? 'bold 16px sans-serif' : 'bold 14px sans-serif';
                ctx.fillText(data.date, cardX + 28, heroFooterY + 4);

                // Badge de Sincronização em Tempo Real
                ctx.textAlign = 'right';
                ctx.fillStyle = isDark ? '#38bdf8' : '#059669';
                ctx.font = isStory ? 'bold 14px sans-serif' : 'bold 12px sans-serif';
                ctx.fillText(`🟢 ${data.syncLabel}`, cardX + cardW - 28, heroFooterY + 4);
                ctx.textAlign = 'left';

                // 6. RODAPÉ EXTERNO DO POST: Marca Oficial @tempoemriodasostras
                const extFooterY = height - (isStory ? 50 : 30);
                ctx.fillStyle = isDark ? '#38bdf8' : '#ea580c';
                ctx.beginPath();
                ctx.roundRect(margin, extFooterY - 26, width - margin * 2, 2.5, 1.25);
                ctx.fill();

                ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
                ctx.font = isStory ? 'bold 24px sans-serif' : 'bold 20px sans-serif';
                ctx.fillText('@tempoemriodasostras', margin, extFooterY);

                ctx.textAlign = 'right';
                ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
                ctx.font = isStory ? '500 16px sans-serif' : '500 14px sans-serif';
                ctx.fillText('Canal Oficial • Telemetria Oficial dos Bairros • Rio das Ostras - RJ', width - margin, extFooterY);
                ctx.textAlign = 'left';

                return canvas.toDataURL('image/png');
            };
        })()"""

        cdp.evaluate(refined_script)

        # Generate refined images
        print("Rendering Refined Post Dark...")
        url_post_dark = cdp.evaluate("window.renderTempoAgoraRefined('post', 'dark')")
        bytes_post_dark = base64.b64decode(url_post_dark.split(",")[1])
        path_post_dark = os.path.join(ARTIFACT_DIR, "v194_tempo_agora_post_dark.png")
        with open(path_post_dark, "wb") as f:
            f.write(bytes_post_dark)

        print("Rendering Refined Post Clara...")
        url_post_clara = cdp.evaluate("window.renderTempoAgoraRefined('post', 'nordic')")
        bytes_post_clara = base64.b64decode(url_post_clara.split(",")[1])
        path_post_clara = os.path.join(ARTIFACT_DIR, "v194_tempo_agora_post_clara.png")
        with open(path_post_clara, "wb") as f:
            f.write(bytes_post_clara)

        print("Rendering Refined Story Dark...")
        url_story_dark = cdp.evaluate("window.renderTempoAgoraRefined('story', 'dark')")
        bytes_story_dark = base64.b64decode(url_story_dark.split(",")[1])
        path_story_dark = os.path.join(ARTIFACT_DIR, "v194_tempo_agora_story_dark.png")
        with open(path_story_dark, "wb") as f:
            f.write(bytes_story_dark)

        print("Rendering Refined Story Clara...")
        url_story_clara = cdp.evaluate("window.renderTempoAgoraRefined('story', 'nordic')")
        bytes_story_clara = base64.b64decode(url_story_clara.split(",")[1])
        path_story_clara = os.path.join(ARTIFACT_DIR, "v194_tempo_agora_story_clara.png")
        with open(path_story_clara, "wb") as f:
            f.write(bytes_story_clara)

        print("ALL REFINED TESTS GENERATED SUCCESSFULLY!")

    finally:
        cdp.close()
        edge_proc.terminate()
        try:
            edge_proc.wait(timeout=3)
        except Exception:
            edge_proc.kill()

if __name__ == "__main__":
    main()
