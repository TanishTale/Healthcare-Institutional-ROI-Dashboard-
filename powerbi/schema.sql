-- ==========================================
-- DIMENSION TABLES (Lookup Tables)
-- ==========================================

CREATE TABLE dim_date (
    date DATE PRIMARY KEY,
    month VARCHAR(20) NOT NULL,
    year INT NOT NULL
);

CREATE TABLE dim_department (
    dept_id VARCHAR(50) PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    allocated_budget NUMERIC(15, 2) DEFAULT 0.00,
    infrastructure_value NUMERIC(15, 2) DEFAULT 0.00
);

CREATE TABLE dim_patient (
    patient_id VARCHAR(50) PRIMARY KEY,
    age_group VARCHAR(20),
    risk_category VARCHAR(20) CHECK (risk_category IN ('Low', 'Medium', 'High'))
);

-- ==========================================
-- FACT TABLES (Data Tables)
-- ==========================================

CREATE TABLE fact_operational_clinical (
    encounter_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES dim_patient(patient_id) ON DELETE CASCADE,
    dept_id VARCHAR(50) REFERENCES dim_department(dept_id) ON DELETE CASCADE,
    admission_date DATE REFERENCES dim_date(date),
    discharge_date DATE,
    bed_occupied INT CHECK (bed_occupied IN (0, 1)),
    satisfaction_score INT CHECK (satisfaction_score >= 1 AND satisfaction_score <= 10),
    readmitted_30d INT CHECK (readmitted_30d IN (0, 1))
);

CREATE TABLE fact_financials (
    transaction_id VARCHAR(50) PRIMARY KEY,
    dept_id VARCHAR(50) REFERENCES dim_department(dept_id) ON DELETE CASCADE,
    transaction_date DATE REFERENCES dim_date(date),
    service_cost NUMERIC(12, 2) NOT NULL,
    billed_revenue NUMERIC(12, 2) NOT NULL
);

CREATE TABLE fact_predictions (
    prediction_id VARCHAR(50) PRIMARY KEY,
    dept_id VARCHAR(50) REFERENCES dim_department(dept_id) ON DELETE CASCADE,
    forecast_date DATE REFERENCES dim_date(date),
    predicted_volume INT NOT NULL,
    predicted_cost NUMERIC(15, 2) NOT NULL
);

-- Optional: Create indexes on Foreign Keys to speed up Power BI DirectQuery performance
CREATE INDEX idx_fact_op_dept ON fact_operational_clinical(dept_id);
CREATE INDEX idx_fact_op_patient ON fact_operational_clinical(patient_id);
CREATE INDEX idx_fact_fin_dept ON fact_financials(dept_id);
CREATE INDEX idx_fact_pred_dept ON fact_predictions(dept_id);