import urllib.request
import json
import time

for i in range(15):
    time.sleep(4)
    req = urllib.request.Request('https://api.github.com/repos/deborapessanha94-netizen/tempo-rio-das-ostras/actions/runs')
    req.add_header('User-Agent', 'Mozilla/5.0')
    try:
        data = json.loads(urllib.request.urlopen(req, timeout=5).read().decode())
        runs = data.get('workflow_runs', [])
        if runs:
            r = runs[0]
            sha = r.get('head_commit', {}).get('id', '')[:7]
            status = r.get('status', '')
            conclusion = r.get('conclusion', '')
            print(f"[{i+1}] Commit {sha} -> Status: {status}, Conclusion: {conclusion}")
            if sha.startswith('14e039f') and status == 'completed':
                print("Deploy completed successfully!")
                break
    except Exception as e:
        print(f"Error checking: {e}")
