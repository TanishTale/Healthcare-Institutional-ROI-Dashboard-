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


-- ==========================================
-- PREDICTIVE ANALYTICS FACT TABLES
-- ==========================================

-- 1. Volume, Cost, and Resource Forecasting
CREATE TABLE fact_forecast_metrics (
    forecast_id VARCHAR(50) PRIMARY KEY,
    dept_id VARCHAR(50) REFERENCES dim_department(dept_id) ON DELETE CASCADE,
    forecast_date DATE REFERENCES dim_date(date),
    predicted_patient_volume INT NOT NULL,     -- For forecasting patient volume
    predicted_operational_cost NUMERIC(15, 2), -- For cost forecasting
    predicted_resource_demand INT,             -- Metric representing staff/equipment hours needed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Performance & Early Warning Indicators
CREATE TABLE fact_efficiency_warnings (
    warning_id VARCHAR(50) PRIMARY KEY,
    dept_id VARCHAR(50) REFERENCES dim_department(dept_id) ON DELETE CASCADE,
    evaluation_date DATE REFERENCES dim_date(date),
    underperforming_flag INT CHECK (underperforming_flag IN (0, 1)), -- Identification of underperforming departments[cite: 1]
    early_warning_score NUMERIC(5, 2),                               -- 1-100 scale for operational inefficiency[cite: 1]
    inefficiency_driver VARCHAR(100),                                -- e.g., "High ALOS", "Low Bed Turnover"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Create indexes to speed up Power BI DirectQuery load times
CREATE INDEX idx_forecast_dept ON fact_forecast_metrics(dept_id);
CREATE INDEX idx_warnings_dept ON fact_efficiency_warnings(dept_id);