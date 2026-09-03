import os
import random
from datetime import date, timedelta
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Dynamically locate the .env file in the project root
current_script_path = Path(__file__).resolve()
project_root = current_script_path.parent.parent.parent
env_path = project_root / '.env'
load_dotenv(dotenv_path=env_path)

# 2. Configure Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 3. Mock Historical Training Data 
departments = ["DEP-CARDIO", "DEP-NEURO", "DEP-ORTHO", "DEP-ONCO", "DEP-EMERG"]
X_train = np.random.rand(1000, 3) * 100 
y_vol = X_train[:, 0] * 1.2 + np.random.normal(0, 5, 1000) 
y_cost = y_vol * 800 + np.random.normal(0, 1000, 1000)     

# 4. Train Random Forest Regression Models
vol_model = RandomForestRegressor(n_estimators=50, random_state=42)
cost_model = RandomForestRegressor(n_estimators=50, random_state=42)
vol_model.fit(X_train, y_vol)
cost_model.fit(X_train, y_cost)

# 5. Generate Forecasts for the Next 30 Days
start_forecast = date.today()
forecast_metrics = []
efficiency_warnings = []

for i in range(30):
    current_date = start_forecast + timedelta(days=i)
    
    for dept in departments:
        current_features = np.array([[random.uniform(20, 100), random.uniform(0.5, 1.0), random.uniform(2, 10)]])
        
        pred_vol = max(int(vol_model.predict(current_features)[0]), 1)
        pred_cost = round(cost_model.predict(current_features)[0], 2)
        resource_demand = pred_vol * 12 
        
        forecast_metrics.append({
            "forecast_id": f"FCST-{current_date.strftime('%Y%m%d')}-{dept}",
            "dept_id": dept,
            "forecast_date": current_date.isoformat(),
            "predicted_patient_volume": pred_vol,
            "predicted_operational_cost": pred_cost,
            "predicted_resource_demand": resource_demand
        })
        
        warning_score = round(random.uniform(10, 95), 2)
        is_underperforming = 1 if warning_score > 75 else 0
        driver = random.choice(["High ALOS", "Low Bed Turnover", "Staff Shortage"]) if is_underperforming else None
        
        if is_underperforming:
            efficiency_warnings.append({
                "warning_id": f"WARN-{current_date.strftime('%Y%m%d')}-{dept}",
                "dept_id": dept,
                "evaluation_date": current_date.isoformat(),
                "underperforming_flag": is_underperforming,
                "early_warning_score": warning_score,
                "inefficiency_driver": driver
            })

# 6. Push to Supabase via Batch Insert
def batch_insert(table_name: str, records: list, chunk_size: int = 500):
    for i in range(0, len(records), chunk_size):
        try:
            supabase.table(table_name).insert(records[i:i + chunk_size]).execute()
        except Exception as e:
            print(f"Error inserting into {table_name}: {e}")

print("Uploading predictive forecasts...")
batch_insert("fact_forecast_metrics", forecast_metrics)
batch_insert("fact_efficiency_warnings", efficiency_warnings)
print("Predictive data successfully uploaded!")