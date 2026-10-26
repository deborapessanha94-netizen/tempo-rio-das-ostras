import json

with open(r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        obj = json.loads(line)
        if obj.get('source') == 'USER_EXPLICIT' or obj.get('type') == 'USER_INPUT':
            content = obj.get('content', '')
            if 'inmet' in content.lower() or 'http' in content.lower() or 'meteograma' in content.lower():
                print(f"Step {obj.get('step_index')}: {content}")
