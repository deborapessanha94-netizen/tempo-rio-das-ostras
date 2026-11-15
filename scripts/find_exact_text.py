import json

with open('data/boletim_metadata.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

def search_dict(obj, path=''):
    if isinstance(obj, dict):
        for k, v in obj.items():
            search_dict(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            search_dict(v, f"{path}[{i}]")
    elif isinstance(obj, str):
        if "Neste s" in obj or "Neste d" in obj:
            print(f"Path: {path} ->\n{obj}\n")

search_dict(d)
