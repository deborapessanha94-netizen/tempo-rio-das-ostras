import os
import json

with open(r'C:\Users\debor\.gemini\antigravity\brain\ec824ae4-216a-462f-9550-50517e326bdf\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        obj = json.loads(line)
        step = obj.get('step_index', 0)
        if step > 16000 and (obj.get('source') == 'USER_EXPLICIT' or obj.get('type') == 'USER_INPUT'):
            content = obj.get('content', '')
            media = obj.get('media', [])
            print(f"Step {step}:")
            print(f"   Content: {content}")
            if media:
                print(f"   Media: {media}")
