import os
import random
from datetime import date, timedelta
from pathlib import Path
import numpy as np
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

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Ensure .env is in the root directory and contains SUPABASE_URL and SUPABASE_KEY.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 3. Generate Dimension: Dates (2025 to 2026)
start_date = date(2025, 1, 1)
date_list = [start_date + timedelta(days=i) for i in range(730)]
dim_dates = [
    {
        "date": d.isoformat(),
        "month": d.strftime("%B"),
        "year": d.year
    }
    for d in date_list
]

# 4. Generate Dimension: Departments
departments = [
    {"dept_id": "DEP-CARDIO", "department_name": "Cardiology", "allocated_budget": 1200000.00, "infrastructure_value": 3500000.00},
    {"dept_id": "DEP-NEURO", "department_name": "Neurology", "allocated_budget": 1500000.00, "infrastructure_value": 4200000.00},
    {"dept_id": "DEP-ORTHO", "department_name": "Orthopedics", "allocated_budget": 950000.00, "infrastructure_value": 2100000.00},
    {"dept_id": "DEP-ONCO", "department_name": "Oncology", "allocated_budget": 1800000.00, "infrastructure_value": 5000000.00},
    {"dept_id": "DEP-EMERG", "department_name": "Emergency", "allocated_budget": 2200000.00, "infrastructure_value": 2800000.00}
]

# 5. Generate Dimension: Patients (1,500 unique profiles)
patients = []
for i in range(1, 1501):
    patients.append({
        "patient_id": f"PAT-{i:05d}",
        "age_group": random.choice(["18-35", "36-50", "51-65", "65+"]),
        "risk_category": random.choices(["Low", "Medium", "High"], weights=[0.5, 0.35, 0.15])[0]
    })

# 6. Generate Fact Tables (5,000 Encounters, Financials, & Outcomes)
op_clinical = []
financials = []

for i in range(1, 5001):
    enc_id = f"ENC-{i:06d}"
    dept = random.choice(departments)["dept_id"]
    pat = random.choice(patients)["patient_id"]
    
    adm_date = random.choice(date_list[:-15])
    los = max(1, int(np.random.exponential(scale=4)))
    disch_date = adm_date + timedelta(days=los)
    
    op_clinical.append({
        "encounter_id": enc_id,
        "patient_id": pat,
        "dept_id": dept,
        "admission_date": adm_date.isoformat(),
        "discharge_date": disch_date.isoformat(),
        "bed_occupied": 1 if los > 1 else 0,
        "satisfaction_score": int(np.clip(np.random.normal(7.5, 1.5), 1, 10)),
        "readmitted_30d": 1 if random.random() < 0.12 else 0
    })
    
    cost = round(random.uniform(500, 3500) + (los * 400), 2)
    revenue = round(cost * random.uniform(1.15, 1.45), 2)
    
    financials.append({
        "transaction_id": f"TXN-{i:06d}",
        "dept_id": dept,
        "transaction_date": adm_date.isoformat(),
        "service_cost": cost,
        "billed_revenue": revenue
    })

# 7. Batch upload helper to prevent Supabase payload timeout
def batch_insert(table_name: str, records: list, chunk_size: int = 500):
    for i in range(0, len(records), chunk_size):
        chunk = records[i:i + chunk_size]
        try:
            supabase.table(table_name).insert(chunk).execute()
        except Exception as e:
            print(f"Error inserting into {table_name}: {e}")

# 8. Execute uploads in dependency order
print("Uploading Dimension Tables...")
batch_insert("dim_date", dim_dates)
batch_insert("dim_department", departments)
batch_insert("dim_patient", patients)

print("Uploading Fact Tables...")
batch_insert("fact_operational_clinical", op_clinical)
batch_insert("fact_financials", financials)

print("Data generation and upload complete!")