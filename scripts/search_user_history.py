import json

transcript_path = r"C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf\.system_generated\logs\transcript.jsonl"
with open(transcript_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        try:
            obj = json.loads(line)
            if obj.get('source') == 'USER_EXPLICIT' or obj.get('type') == 'USER_INPUT':
                content = str(obj.get('content', ''))
                if any(w in content.lower() for w in ['salvar', 'baixar', 'acumulado', 'card', 'imagem']):
                    print("--- USER REQUEST ---")
                    print(content[:300])
        except Exception:
            pass
