import urllib.request
import json

with open('.env.local') as f:
    lines = f.readlines()

key = ""
for line in lines:
    if 'NEXT_PUBLIC_SUPABASE_ANON_KEY' in line:
        key = line.split('=')[1].strip().strip('"')

url = "https://bpvezpzdteyjjwmieuyr.supabase.co/rest/v1/fact_forecast_metrics?select=*"
req = urllib.request.Request(url, headers={'apikey': key, 'Authorization': f'Bearer {key}'})

try:
    res = urllib.request.urlopen(req)
    data = json.loads(res.read())
    print("fact_forecast_metrics count:", len(data))
    if data:
        print("Sample row:", json.dumps(data[0], indent=2))
        dates = sorted(list(set(d['forecast_date'] for d in data if d.get('forecast_date'))))
        print("Forecast dates:", dates)
        depts = sorted(list(set(d['dept_id'] for d in data if d.get('dept_id'))))
        print("Departments:", depts)
except Exception as e:
    print("Error:", e)
