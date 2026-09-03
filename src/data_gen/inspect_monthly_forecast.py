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
    
    # Group by month
    monthly = {}
    for row in data:
        fdate = row.get('forecast_date')
        if not fdate: continue
        month_key = fdate[:7] # YYYY-MM
        dept = row.get('dept_id')
        if month_key not in monthly:
            monthly[month_key] = {'vol': 0, 'cost': 0, 'by_dept': {}}
        monthly[month_key]['vol'] += row.get('predicted_patient_volume', 0)
        monthly[month_key]['cost'] += float(row.get('predicted_operational_cost', 0) or 0)
        
        if dept not in monthly[month_key]['by_dept']:
            monthly[month_key]['by_dept'][dept] = {'vol': 0, 'cost': 0}
        monthly[month_key]['by_dept'][dept]['vol'] += row.get('predicted_patient_volume', 0)
        monthly[month_key]['by_dept'][dept]['cost'] += float(row.get('predicted_operational_cost', 0) or 0)

    print("Monthly aggregated forecast metrics:")
    for mk, val in sorted(monthly.items()):
        print(f"Month {mk}: Total Volume = {val['vol']}, Total Cost = {val['cost']}")
        for d, dv in val['by_dept'].items():
            print(f"   Dept {d}: Vol = {dv['vol']}, Cost = {dv['cost']}")

except Exception as e:
    print("Error:", e)
