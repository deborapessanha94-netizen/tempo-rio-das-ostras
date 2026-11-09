import urllib.request
import json

url = "https://api.github.com/repos/deborapessanha94-netizen/tempo-rio-das-ostras/actions/runs"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
data = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
r = data['workflow_runs'][0]
print(f"Run {r['id']} ({r['head_commit']['id'][:7]}): status={r['status']}, conclusion={r['conclusion']}")
