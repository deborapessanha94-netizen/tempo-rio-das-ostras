import urllib.request
import json
import time

url = "https://api.github.com/repos/deborapessanha94-netizen/tempo-rio-das-ostras/actions/runs"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})

for attempt in range(12):
    try:
        data = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        r = data['workflow_runs'][0]
        cid = r['head_commit']['id'][:7]
        st = r['status']
        conc = r['conclusion']
        print(f"[{attempt+1}] Run {r['id']} ({cid}): status={st}, conclusion={conc}")
        if st == "completed":
            print(f"Deploy finished with conclusion: {conc}")
            break
    except Exception as e:
        print(f"Error checking runs: {e}")
    time.sleep(6)
