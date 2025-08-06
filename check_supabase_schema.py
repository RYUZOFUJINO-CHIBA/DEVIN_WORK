#!/usr/bin/env python3
"""Script to check and create the Supabase database schema."""

import psycopg

def check_and_create_schema():
    conn_str = 'postgresql://postgres:Apt@05810881@db.ltkgmmbapafctihusddh.supabase.co:5432/postgres'
    
    try:
        with psycopg.connect(conn_str) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    ORDER BY table_name;
                """)
                tables = cur.fetchall()
                print('Existing tables in public schema:')
                for table in tables:
                    print(f'  - {table[0]}')
                
                cur.execute("""
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = 'estimation_requests' 
                    AND table_schema = 'public'
                    ORDER BY ordinal_position;
                """)
                columns = cur.fetchall()
                
                if columns:
                    print('\nestimation_requests table schema:')
                    for col in columns:
                        nullable = "NULL" if col[2] == "YES" else "NOT NULL"
                        default = f" DEFAULT {col[3]}" if col[3] else ""
                        print(f'  - {col[0]}: {col[1]} {nullable}{default}')
                else:
                    print('\nestimation_requests table does not exist, creating...')
                    
                    create_table_sql = """
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
                    """
                    
                    cur.execute(create_table_sql)
                    conn.commit()
                    print('✓ estimation_requests table created successfully!')
                
                cur.execute("SELECT COUNT(*) FROM estimation_requests;")
                count = cur.fetchone()[0]
                print(f'\nNumber of records in estimation_requests: {count}')
                
                if count > 0:
                    cur.execute("SELECT * FROM estimation_requests LIMIT 3;")
                    sample_data = cur.fetchall()
                    print('\nSample data (first 3 records):')
                    for row in sample_data:
                        print(f'  {row}')
                
    except Exception as e:
        print(f'Database connection error: {e}')
        return False
    
    return True

if __name__ == "__main__":
    success = check_and_create_schema()
    if not success:
        exit(1)
