
CREATE TABLE estimation_requests (
    id SERIAL PRIMARY KEY,
    request_date DATE,
    desired_estimation_date DATE,
    project_name VARCHAR(255),
    zac_project_number VARCHAR(100),
    sales_person VARCHAR(100),
    estimation_person VARCHAR(100),
    status VARCHAR(50),
    estimation TEXT,
    completion_date DATE,
    remarks TEXT,
    estimation_materials TEXT,
    box_url VARCHAR(500),
    others TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE estimation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on estimation_requests" ON estimation_requests
FOR ALL USING (true);
