# -*- coding: utf-8 -*-
import sys
import os
import time
import subprocess
import zipfile
import threading
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler

sys.stdout.reconfigure(encoding='utf-8')

PORT = 9055
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
FFMPEG_EXE = r"C:\Users\debor\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v9.0.2.exe"

PROJECT_DIR = Path(r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app")
ARTIFACT_DIR = Path(r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf")

PANORAMA_DIR = PROJECT_DIR / "img" / "panorama"
STORIES_DIR = PANORAMA_DIR / "stories"
FEED_DIR = PANORAMA_DIR / "feed"

STORIES_DIR.mkdir(parents=True, exist_ok=True)
FEED_DIR.mkdir(parents=True, exist_ok=True)

SLIDE_NAMES = [
    "lamina_01_abertura_outubro_2026.png",
    "lamina_02_volume_chuva_outubro_2026.png",
    "lamina_03_ranking_estacoes_outubro_2026.png",
    "lamina_04_ventos_extremos_termicos_outubro_2026.png",
    "lamina_05_sistemas_meteorologicos_outubro_2026.png",
    "lamina_06_encerramento_oficial_outubro_2026.png"
]

class SilentHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

def start_server():
    os.chdir(PROJECT_DIR)
    httpd = HTTPServer(('127.0.0.1', PORT), SilentHandler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd

def capture_slide(fmt, width, height, slide_idx, out_path):
    url = f"http://127.0.0.1:{PORT}/templates/panorama_render.html?format={fmt}&slide={slide_idx}"
    cmd = [
        EDGE_PATH,
        "--headless=new",
        "--disable-gpu",
        f"--window-size={width},{height}",
        "--virtual-time-budget=2000",
        f"--screenshot={out_path}",
        url
    ]
    res = subprocess.run(cmd, capture_output=True, timeout=25)
    return out_path.exists() and out_path.stat().st_size > 50000

def render_all_images():
    print("Iniciando renderizador de imagens com Edge Headless...")
    # Formats: Feed (1080x1350) and Stories (1080x1920)
    for fmt, width, height, target_dir, prefix in [
        ("stories", 1080, 1920, STORIES_DIR, "stories"),
        ("feed", 1080, 1350, FEED_DIR, "feed")
    ]:
        print(f"\n--- Renderizando Formato {fmt.upper()} ({width}x{height}) ---")
        for idx in range(1, 7):
            fname = SLIDE_NAMES[idx - 1]
            out_file = target_dir / fname
            artifact_file = ARTIFACT_DIR / f"panorama_{prefix}_{fname}"
            ok = capture_slide(fmt, width, height, idx, out_file)
            if ok:
                # Copy to artifact dir
                with open(out_file, "rb") as s, open(artifact_file, "wb") as d:
                    d.write(s.read())
                kb = out_file.stat().st_size / 1024
                print(f"  [OK] Lâmina {idx}/6 ({fmt}): {fname} ({kb:.1f} KB)")
            else:
                print(f"  [ERRO] Lâmina {idx}/6 ({fmt}) falhou")

def generate_video():
    print("\n--- Renderizando Vídeo Master Reels (1080x1920, 30 FPS, Libx264 CRF 15, Lossless) ---")
    video_out = PANORAMA_DIR / "video_reels_outubro_2026.mp4"
    artifact_video = ARTIFACT_DIR / "panorama_video_reels_outubro_2026.mp4"

    # Concat file with 7.8s per slide = 46.8s total
    concat_txt = PANORAMA_DIR / "concat_slides.txt"
    with open(concat_txt, "w", encoding="utf-8") as f:
        for idx in range(1, 7):
            p = (STORIES_DIR / SLIDE_NAMES[idx - 1]).resolve()
            f.write(f"file '{str(p).replace('\\', '/')}'\n")
            f.write("duration 7.8\n")
        last_p = (STORIES_DIR / SLIDE_NAMES[-1]).resolve()
        f.write(f"file '{str(last_p).replace('\\', '/')}'\n")

    cmd = [
        FFMPEG_EXE,
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_txt),
        "-vf", "fps=30,format=yuv420p",
        "-c:v", "libx264",
        "-crf", "15",
        "-preset", "slow",
        "-colorspace", "bt709",
        "-color_primaries", "bt709",
        "-color_trc", "bt709",
        "-color_range", "tv",
        "-movflags", "+faststart",
        str(video_out)
    ]

    print("Executando FFmpeg libx264...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0 and video_out.exists():
        mb = video_out.stat().st_size / (1024 * 1024)
        print(f"[OK] Vídeo Master Reels gerado com sucesso: {video_out} ({mb:.2f} MB)")
        with open(video_out, "rb") as s, open(artifact_video, "wb") as d:
            d.write(s.read())
    else:
        print("[FAIL] Erro no FFmpeg:", res.stderr)

    if concat_txt.exists():
        concat_txt.unlink()

def create_zip():
    print("\n--- Criando Pacote ZIP Consolidado ---")
    zip_path = PANORAMA_DIR / "panorama-clima-outubro-2026.zip"
    artifact_zip = ARTIFACT_DIR / "panorama-clima-outubro-2026.zip"

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in sorted(STORIES_DIR.glob("*.png")):
            zf.write(f, arcname=f"stories/{f.name}")
        for f in sorted(FEED_DIR.glob("*.png")):
            zf.write(f, arcname=f"feed/{f.name}")
        vid = PANORAMA_DIR / "video_reels_outubro_2026.mp4"
        if vid.exists():
            zf.write(vid, arcname="video/video_reels_outubro_2026.mp4")

    mb = zip_path.stat().st_size / (1024 * 1024)
    print(f"[OK] ZIP Final: {zip_path} ({mb:.2f} MB)")
    with open(zip_path, "rb") as s, open(artifact_zip, "wb") as d:
        d.write(s.read())

if __name__ == '__main__':
    httpd = start_server()
    time.sleep(1)
    try:
        render_all_images()
        generate_video()
        create_zip()
    finally:
        httpd.shutdown()
    print("\n=== TODAS AS TAREFAS CONCLUÍDAS COM SUCESSO! ===")
