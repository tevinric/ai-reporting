from flask import Flask, request, jsonify
from flask_cors import CORS
import pyodbc
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging
from dotenv import load_dotenv
from openai import AzureOpenAI

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    'server': os.environ.get('DB_SERVER', 'localhost'),
    'database': os.environ.get('DB_DATABASE', 'AIReporting'),
    'username': os.environ.get('DB_USERNAME', ''),
    'password': os.environ.get('DB_PASSWORD', ''),
    'driver': os.environ.get('DB_DRIVER', '{ODBC Driver 17 for SQL Server}')
}

# Default user for testing
DEFAULT_USER = {
    'name': 'Tester',
    'email': 'test@tester.com'
}

# Azure OpenAI client configuration
openai_api_key = os.environ.get('OPENAI_API_KEY')
openai_endpoint = os.environ.get('OPENAI_ENDPOINT')
openai_api_version = os.environ.get('OPENAI_API_VERSION', '2024-02-15-preview')

openai_client = AzureOpenAI(
    api_key=openai_api_key,
    azure_endpoint=openai_endpoint,
    api_version=openai_api_version
)

def get_db_connection():
    """Create and return a database connection"""
    try:
        if DB_CONFIG['username']:
            conn_string = f"DRIVER={DB_CONFIG['driver']};SERVER={DB_CONFIG['server']};DATABASE={DB_CONFIG['database']};UID={DB_CONFIG['username']};PWD={DB_CONFIG['password']}"
        else:
            # Use Windows Authentication
            conn_string = f"DRIVER={DB_CONFIG['driver']};SERVER={DB_CONFIG['server']};DATABASE={DB_CONFIG['database']};Trusted_Connection=yes"

        conn = pyodbc.connect(conn_string)
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        raise

def dict_from_row(cursor, row):
    """Convert database row to dictionary"""
    columns = [column[0] for column in cursor.description]
    return dict(zip(columns, row))

# ==================== Health Check ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        conn = get_db_connection()
        conn.close()
        return jsonify({'status': 'healthy', 'database': 'connected'})
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

# ==================== Dashboard Statistics ====================

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get overall statistics
        cursor.execute("""
            SELECT
                COUNT(*) as total_initiatives,
                COUNT(CASE WHEN status = 'Ideation' THEN 1 END) as ideation_count,
                COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_count,
                COUNT(CASE WHEN status = 'Live (Complete)' THEN 1 END) as completed_count,
                AVG(percentage_complete) as avg_completion,
                COUNT(CASE WHEN MONTH(created_at) = MONTH(GETDATE()) AND YEAR(created_at) = YEAR(GETDATE()) THEN 1 END) as new_initiatives_count
            FROM initiatives
        """)
        row = cursor.fetchone()
        stats = dict_from_row(cursor, row)

        # Get in-progress initiatives
        cursor.execute("""
            SELECT TOP 10
                i.id,
                i.use_case_name,
                i.percentage_complete,
                i.health_status,
                i.status,
                STRING_AGG(id_dept.department, ', ') as departments
            FROM initiatives i
            LEFT JOIN initiative_departments id_dept ON i.id = id_dept.initiative_id
            WHERE i.status = 'In Progress'
            GROUP BY i.id, i.use_case_name, i.percentage_complete, i.health_status, i.status, i.modified_at
            ORDER BY i.modified_at DESC
        """)
        in_progress = [dict_from_row(cursor, row) for row in cursor.fetchall()]
        stats['in_progress_initiatives'] = in_progress

        # Get initiatives by department
        cursor.execute("""
            SELECT department, COUNT(*) as count
            FROM initiative_departments id
            JOIN initiatives i ON id.initiative_id = i.id
            GROUP BY department
            ORDER BY count DESC
        """)
        departments = [dict_from_row(cursor, row) for row in cursor.fetchall()]
        stats['by_department'] = departments

        # Get initiatives by benefit
        cursor.execute("""
            SELECT benefit, COUNT(*) as count
            FROM initiatives
            WHERE benefit IS NOT NULL
            GROUP BY benefit
            ORDER BY count DESC
        """)
        benefits = [dict_from_row(cursor, row) for row in cursor.fetchall()]
        stats['by_benefit'] = benefits

        # Get initiatives by business unit
        cursor.execute("""
            SELECT business_unit, COUNT(*) as count
            FROM initiatives
            WHERE business_unit IS NOT NULL
            GROUP BY business_unit
            ORDER BY count DESC
        """)
        business_units = [dict_from_row(cursor, row) for row in cursor.fetchall()]
        stats['by_business_unit'] = business_units

        # Get pinned initiatives
        cursor.execute("""
            SELECT
                i.id,
                i.use_case_name,
                i.description,
                i.percentage_complete,
                i.health_status,
                i.status,
                i.initiative_type,
                i.pinned_at,
                STRING_AGG(id_dept.department, ', ') as departments
            FROM initiatives i
            LEFT JOIN initiative_departments id_dept ON i.id = id_dept.initiative_id
            WHERE i.is_pinned = 1
            GROUP BY i.id, i.use_case_name, i.description, i.percentage_complete, i.health_status, i.status, i.initiative_type, i.pinned_at
            ORDER BY i.pinned_at DESC
        """)
        pinned = [dict_from_row(cursor, row) for row in cursor.fetchall()]
        stats['pinned_initiatives'] = pinned

        conn.close()
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/monthly-trends', methods=['GET'])
def get_monthly_trends():
    """Get monthly trends aggregating all metrics across all initiatives with optional filters"""
    try:
        import json
        from flask import request
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get filter parameters
        initiative_ids = request.args.get('initiative_ids')  # Comma-separated IDs
        initiative_type = request.args.get('initiative_type')  # Single type filter

        # Build WHERE clause based on filters
        where_clauses = []
        params = []

        if initiative_ids:
            id_list = [int(id.strip()) for id in initiative_ids.split(',') if id.strip()]
            if id_list:
                placeholders = ','.join(['?' for _ in id_list])
                where_clauses.append(f"mm.initiative_id IN ({placeholders})")
                params.extend(id_list)

        if initiative_type:
            where_clauses.append("i.initiative_type = ?")
            params.append(initiative_type)

        where_sql = ""
        if where_clauses:
            where_sql = "WHERE " + " AND ".join(where_clauses)

        # Get all monthly metrics with additional_metrics JSON
        query = f"""
            SELECT
                mm.metric_period,
                mm.initiative_id,
                mm.additional_metrics
            FROM monthly_metrics mm
            JOIN initiatives i ON mm.initiative_id = i.id
            {where_sql}
            ORDER BY mm.metric_period
        """

        cursor.execute(query, params)
        rows = cursor.fetchall()

        # Aggregate metrics by period
        period_aggregates = {}

        for row in rows:
            period = row[0]
            initiative_id = row[1]
            additional_metrics_json = row[2]

            if period not in period_aggregates:
                period_aggregates[period] = {
                    'metric_period': period,
                    'active_initiatives': set(),
                    'metrics': {}
                }

            period_aggregates[period]['active_initiatives'].add(initiative_id)

            # Parse and aggregate additional_metrics
            if additional_metrics_json:
                try:
                    metrics = json.loads(additional_metrics_json)
                    for metric_name, metric_data in metrics.items():
                        if metric_name not in period_aggregates[period]['metrics']:
                            period_aggregates[period]['metrics'][metric_name] = {
                                'values': [],
                                'total': 0,
                                'count': 0,
                                'avg': 0
                            }

                        try:
                            value = float(metric_data.get('value', 0))
                            period_aggregates[period]['metrics'][metric_name]['values'].append(value)
                            period_aggregates[period]['metrics'][metric_name]['total'] += value
                            period_aggregates[period]['metrics'][metric_name]['count'] += 1
                        except (ValueError, TypeError):
                            pass
                except:
                    pass

        # Calculate averages and format output
        trends = []
        for period, data in sorted(period_aggregates.items()):
            trend_point = {
                'metric_period': period,
                'active_initiatives': len(data['active_initiatives'])
            }

            # Add aggregated metrics
            for metric_name, metric_data in data['metrics'].items():
                if metric_data['count'] > 0:
                    metric_data['avg'] = metric_data['total'] / metric_data['count']
                    trend_point[f'{metric_name}_total'] = round(metric_data['total'], 2)
                    trend_point[f'{metric_name}_avg'] = round(metric_data['avg'], 2)
                    trend_point[f'{metric_name}_count'] = metric_data['count']

            trends.append(trend_point)

        conn.close()
        return jsonify(trends)
    except Exception as e:
        logger.error(f"Error fetching monthly trends: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/period/<period>', methods=['GET'])
def get_period_drilldown(period):
    """Get all initiatives with metrics for a specific period"""
    try:
        import json
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                i.id,
                i.use_case_name,
                i.status,
                i.health_status,
                i.percentage_complete,
                mm.additional_metrics,
                STRING_AGG(id_dept.department, ', ') as departments
            FROM initiatives i
            INNER JOIN monthly_metrics mm ON i.id = mm.initiative_id
            LEFT JOIN initiative_departments id_dept ON i.id = id_dept.initiative_id
            WHERE mm.metric_period = ?
            GROUP BY i.id, i.use_case_name, i.status, i.health_status, i.percentage_complete, mm.additional_metrics
            ORDER BY i.use_case_name
        """, period)

        initiatives = []
        for row in cursor.fetchall():
            initiative = {
                'id': row[0],
                'use_case_name': row[1],
                'status': row[2],
                'health_status': row[3],
                'percentage_complete': row[4],
                'departments': row[6],
                'metrics': {}
            }

            # Parse additional_metrics
            if row[5]:
                try:
                    initiative['metrics'] = json.loads(row[5])
                except:
                    initiative['metrics'] = {}

            initiatives.append(initiative)

        conn.close()
        return jsonify({'period': period, 'initiatives': initiatives})
    except Exception as e:
        logger.error(f"Error fetching period drilldown: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/metric/<metric_name>', methods=['GET'])
def get_metric_drilldown(metric_name):
    """Get all initiatives tracking a specific metric across all periods"""
    try:
        import json
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                i.id,
                i.use_case_name,
                mm.metric_period,
                mm.additional_metrics,
                STRING_AGG(id_dept.department, ', ') as departments
            FROM initiatives i
            INNER JOIN monthly_metrics mm ON i.id = mm.initiative_id
            LEFT JOIN initiative_departments id_dept ON i.id = id_dept.initiative_id
            WHERE mm.additional_metrics IS NOT NULL
            GROUP BY i.id, i.use_case_name, mm.metric_period, mm.additional_metrics
            ORDER BY mm.metric_period, i.use_case_name
        """)

        initiatives_by_period = {}
        for row in cursor.fetchall():
            initiative_id = row[0]
            use_case_name = row[1]
            period = row[2]
            additional_metrics_json = row[3]
            departments = row[4]

            # Parse and check if this initiative has the metric
            if additional_metrics_json:
                try:
                    metrics = json.loads(additional_metrics_json)
                    if metric_name in metrics:
                        if period not in initiatives_by_period:
                            initiatives_by_period[period] = []

                        initiatives_by_period[period].append({
                            'id': initiative_id,
                            'use_case_name': use_case_name,
                            'departments': departments,
                            'value': metrics[metric_name].get('value'),
                            'comments': metrics[metric_name].get('comments')
                        })
                except:
                    pass

        conn.close()
        return jsonify({'metric_name': metric_name, 'by_period': initiatives_by_period})
    except Exception as e:
        logger.error(f"Error fetching metric drilldown: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ==================== Initiatives CRUD ====================

@app.route('/api/initiatives', methods=['GET'])
def get_initiatives():
    """Get all initiatives with optional filtering"""
    try:
        status = request.args.get('status')
        department = request.args.get('department')

        conn = get_db_connection()
        cursor = conn.cursor()

        query = "SELECT * FROM initiatives WHERE 1=1"
        params = []

        if status:
            query += " AND status = ?"
            params.append(status)

        if department:
            query += " AND id IN (SELECT initiative_id FROM initiative_departments WHERE department = ?)"
            params.append(department)

        query += " ORDER BY modified_at DESC"

        cursor.execute(query, params)
        initiatives = [dict_from_row(cursor, row) for row in cursor.fetchall()]

        # Get departments for each initiative and trim string fields
        string_fields = ['use_case_name', 'description', 'benefit', 'strategic_objective', 'status',
                        'process_owner', 'business_owner', 'priority', 'risk_level', 'technology_stack',
                        'health_status', 'initiative_type', 'business_unit']
        for initiative in initiatives:
            # Trim string fields
            for field in string_fields:
                if initiative.get(field) and isinstance(initiative[field], str):
                    initiative[field] = initiative[field].strip()

            # Get departments
            cursor.execute("""
                SELECT department FROM initiative_departments
                WHERE initiative_id = ?
            """, initiative['id'])
            initiative['departments'] = [row[0] for row in cursor.fetchall()]

        conn.close()
        return jsonify(initiatives)
    except Exception as e:
        logger.error(f"Error fetching initiatives: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/initiatives/<int:initiative_id>', methods=['GET'])
def get_initiative(initiative_id):
    """Get a specific initiative by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM initiatives WHERE id = ?", initiative_id)
        row = cursor.fetchone()

        if not row:
            conn.close()
            return jsonify({'error': 'Initiative not found'}), 404

        initiative = dict_from_row(cursor, row)

        # Trim string fields to remove any whitespace
        string_fields = ['use_case_name', 'description', 'benefit', 'strategic_objective', 'status',
                        'process_owner', 'business_owner', 'priority', 'risk_level', 'technology_stack',
                        'health_status', 'initiative_type', 'business_unit']
        for field in string_fields:
            if initiative.get(field) and isinstance(initiative[field], str):
                initiative[field] = initiative[field].strip()

        # Convert date fields to ISO format strings if they exist
        import datetime
        date_fields = ['start_date', 'expected_completion_date', 'actual_completion_date', 'featured_month',
                      'created_at', 'modified_at', 'pinned_at']
        for field in date_fields:
            if initiative.get(field) and isinstance(initiative[field], (datetime.date, datetime.datetime)):
                initiative[field] = initiative[field].isoformat()

        logger.info(f"Fetching initiative {initiative_id} - returning date values: start_date={initiative.get('start_date')}, expected_completion_date={initiative.get('expected_completion_date')}")

        # Get departments
        cursor.execute("""
            SELECT department FROM initiative_departments
            WHERE initiative_id = ?
        """, initiative_id)
        initiative['departments'] = [row[0] for row in cursor.fetchall()]

        conn.close()
        return jsonify(initiative)
    except Exception as e:
        logger.error(f"Error fetching initiative: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/initiatives', methods=['POST'])
def create_initiative():
    """Create a new initiative"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert initiative
        cursor.execute("""
            INSERT INTO initiatives (
                use_case_name, description, benefit, strategic_objective, status,
                percentage_complete, process_owner, business_owner, start_date,
                expected_completion_date, priority, risk_level, technology_stack,
                team_size, budget_allocated, health_status, initiative_type, business_unit, created_by_name, created_by_email,
                modified_by_name, modified_by_email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get('use_case_name'),
            data.get('description'),
            data.get('benefit'),
            data.get('strategic_objective'),
            data.get('status', 'Ideation'),
            data.get('percentage_complete', 0),
            data.get('process_owner'),
            data.get('business_owner'),
            convert_to_date(data.get('start_date')),
            convert_to_date(data.get('expected_completion_date')),
            data.get('priority'),
            data.get('risk_level'),
            data.get('technology_stack'),
            data.get('team_size'),
            data.get('budget_allocated'),
            data.get('health_status', 'Green'),
            data.get('initiative_type', 'Internal AI'),
            data.get('business_unit'),
            DEFAULT_USER['name'],
            DEFAULT_USER['email'],
            DEFAULT_USER['name'],
            DEFAULT_USER['email']
        ))

        # Get the inserted ID
        cursor.execute("SELECT @@IDENTITY")
        initiative_id = cursor.fetchone()[0]

        # Insert departments
        departments = data.get('departments', [])
        for dept in departments:
            cursor.execute("""
                INSERT INTO initiative_departments (initiative_id, department)
                VALUES (?, ?)
            """, (initiative_id, dept))

        conn.commit()
        conn.close()

        return jsonify({'id': initiative_id, 'message': 'Initiative created successfully'}), 201
    except Exception as e:
        logger.error(f"Error creating initiative: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/initiatives/<int:initiative_id>', methods=['PUT'])
def update_initiative(initiative_id):
    """Update an existing initiative"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()

        # Helper function to process string fields - only strip if not empty
        def process_string(value):
            if value is None or value == '':
                return None
            return value.strip() if isinstance(value, str) else value

        # Log incoming date values for debugging
        logger.info(f"Updating initiative {initiative_id} - received date values: start_date={data.get('start_date')}, expected_completion_date={data.get('expected_completion_date')}, actual_completion_date={data.get('actual_completion_date')}")

        # Process date values
        start_date_value = convert_to_date(data.get('start_date'))
        expected_date_value = convert_to_date(data.get('expected_completion_date'))
        actual_date_value = convert_to_date(data.get('actual_completion_date'))
        featured_month_value = convert_to_date(data.get('featured_month'))

        logger.info(f"Processed date values: start_date={start_date_value}, expected_completion_date={expected_date_value}, actual_completion_date={actual_date_value}")

        # Update initiative - use the provided values or None if empty
        cursor.execute("""
            UPDATE initiatives SET
                use_case_name = ?,
                description = ?,
                benefit = ?,
                strategic_objective = ?,
                status = ?,
                percentage_complete = ?,
                process_owner = ?,
                business_owner = ?,
                start_date = ?,
                expected_completion_date = ?,
                actual_completion_date = ?,
                priority = ?,
                risk_level = ?,
                technology_stack = ?,
                team_size = ?,
                budget_allocated = ?,
                budget_spent = ?,
                health_status = ?,
                initiative_type = ?,
                business_unit = ?,
                is_featured = ?,
                featured_month = ?,
                modified_at = GETDATE(),
                modified_by_name = ?,
                modified_by_email = ?
            WHERE id = ?
        """, (
            process_string(data.get('use_case_name')),
            process_string(data.get('description')),
            process_string(data.get('benefit')),
            process_string(data.get('strategic_objective')),
            process_string(data.get('status')),
            data.get('percentage_complete'),
            process_string(data.get('process_owner')),
            process_string(data.get('business_owner')),
            start_date_value,
            expected_date_value,
            actual_date_value,
            process_string(data.get('priority')),
            process_string(data.get('risk_level')),
            process_string(data.get('technology_stack')),
            data.get('team_size') if data.get('team_size') not in [None, ''] else None,
            data.get('budget_allocated') if data.get('budget_allocated') not in [None, ''] else None,
            data.get('budget_spent') if data.get('budget_spent') not in [None, ''] else None,
            process_string(data.get('health_status')),
            process_string(data.get('initiative_type')),
            process_string(data.get('business_unit')),
            1 if data.get('is_featured') else 0,
            featured_month_value,
            DEFAULT_USER['name'],
            DEFAULT_USER['email'],
            initiative_id
        ))

        # Update departments
        cursor.execute("DELETE FROM initiative_departments WHERE initiative_id = ?", initiative_id)
        departments = data.get('departments', [])
        for dept in departments:
            if dept:  # Only insert non-empty departments
                cursor.execute("""
                    INSERT INTO initiative_departments (initiative_id, department)
                    VALUES (?, ?)
                """, (initiative_id, dept))

        conn.commit()
        conn.close()

        logger.info(f"Successfully updated initiative {initiative_id}")
        return jsonify({'message': 'Initiative updated successfully'})
    except Exception as e:
        logger.error(f"Error updating initiative: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/initiatives/<int:initiative_id>', methods=['DELETE'])
def delete_initiative(initiative_id):
    """Delete an initiative"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM initiatives WHERE id = ?", initiative_id)

        conn.commit()
        conn.close()

        return jsonify({'message': 'Initiative deleted successfully'})
    except Exception as e:
        logger.error(f"Error deleting initiative: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/initiatives/<int:initiative_id>/pin', methods=['POST'])
def pin_initiative(initiative_id):
    """Pin an initiative to the dashboard"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE initiatives
            SET is_pinned = 1, pinned_at = GETDATE()
            WHERE id = ?
        """, initiative_id)

        conn.commit()
        conn.close()

        return jsonify({'message': 'Initiative pinned successfully'})
    except Exception as e:
        logger.error(f"Error pinning initiative: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/initiatives/<int:initiative_id>/unpin', methods=['POST'])
def unpin_initiative(initiative_id):
    """Unpin an initiative from the dashboard"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE initiatives
            SET is_pinned = 0, pinned_at = NULL
            WHERE id = ?
        """, initiative_id)

        conn.commit()
        conn.close()

        return jsonify({'message': 'Initiative unpinned successfully'})
    except Exception as e:
        logger.error(f"Error unpinning initiative: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ==================== Monthly Metrics ====================

@app.route('/api/initiatives/<int:initiative_id>/metrics', methods=['GET'])
def get_initiative_metrics(initiative_id):
    """Get all monthly metrics for an initiative"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM monthly_metrics
            WHERE initiative_id = ?
            ORDER BY metric_period DESC
        """, initiative_id)

        metrics = []
        for row in cursor.fetchall():
            metric = dict_from_row(cursor, row)
            # Parse additional_metrics JSON if present
            if metric.get('additional_metrics'):
                try:
                    import json
                    metric['additional_metrics'] = json.loads(metric['additional_metrics'])
                except:
                    metric['additional_metrics'] = {}
            else:
                metric['additional_metrics'] = {}
            metrics.append(metric)

        conn.close()
        return jsonify(metrics)
    except Exception as e:
        logger.error(f"Error fetching metrics: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/initiatives/<int:initiative_id>/metrics/<period>', methods=['GET'])
def get_initiative_metric_for_period(initiative_id, period):
    """Get metrics for a specific period"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM monthly_metrics
            WHERE initiative_id = ? AND metric_period = ?
        """, (initiative_id, period))

        row = cursor.fetchone()
        if not row:
            conn.close()
            return jsonify({'error': 'Metrics not found for this period'}), 404

        metric = dict_from_row(cursor, row)

        # Parse additional_metrics JSON if present
        if metric.get('additional_metrics'):
            try:
                import json
                metric['additional_metrics'] = json.loads(metric['additional_metrics'])
            except:
                metric['additional_metrics'] = {}
        else:
            metric['additional_metrics'] = {}

        conn.close()
        return jsonify(metric)
    except Exception as e:
        logger.error(f"Error fetching metric: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/initiatives/<int:initiative_id>/metrics/<period>/metric/<metric_name>', methods=['PUT'])
def update_individual_metric(initiative_id, period, metric_name):
    """Update a specific metric within a period"""
    try:
        import json
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get existing metrics
        cursor.execute("""
            SELECT id, additional_metrics FROM monthly_metrics
            WHERE initiative_id = ? AND metric_period = ?
        """, (initiative_id, period))

        row = cursor.fetchone()
        if not row:
            conn.close()
            return jsonify({'error': 'Metrics not found for this period'}), 404

        # Parse existing metrics
        existing_metrics = {}
        if row[1]:
            try:
                existing_metrics = json.loads(row[1])
            except:
                existing_metrics = {}

        # Update the specific metric
        existing_metrics[metric_name] = {
            'value': data.get('value'),
            'comments': data.get('comments', '')
        }

        # Save back to database
        cursor.execute("""
            UPDATE monthly_metrics
            SET additional_metrics = ?,
                modified_at = GETDATE(),
                modified_by_name = ?,
                modified_by_email = ?
            WHERE id = ?
        """, (
            json.dumps(existing_metrics),
            DEFAULT_USER['name'],
            DEFAULT_USER['email'],
            row[0]
        ))

        conn.commit()
        conn.close()

        return jsonify({'message': 'Metric updated successfully'})
    except Exception as e:
        logger.error(f"Error updating individual metric: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/initiatives/<int:initiative_id>/metrics/<period>/metric/<metric_name>', methods=['DELETE'])
def delete_individual_metric(initiative_id, period, metric_name):
    """Delete a specific metric from a period"""
    try:
        import json
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get existing metrics
        cursor.execute("""
            SELECT id, additional_metrics FROM monthly_metrics
            WHERE initiative_id = ? AND metric_period = ?
        """, (initiative_id, period))

        row = cursor.fetchone()
        if not row:
            conn.close()
            return jsonify({'error': 'Metrics not found for this period'}), 404

        # Parse existing metrics
        existing_metrics = {}
        if row[1]:
            try:
                existing_metrics = json.loads(row[1])
            except:
                existing_metrics = {}

        # Remove the specific metric
        if metric_name in existing_metrics:
            del existing_metrics[metric_name]

        # Save back to database
        cursor.execute("""
            UPDATE monthly_metrics
            SET additional_metrics = ?,
                modified_at = GETDATE(),
                modified_by_name = ?,
                modified_by_email = ?
            WHERE id = ?
        """, (
            json.dumps(existing_metrics) if existing_metrics else None,
            DEFAULT_USER['name'],
            DEFAULT_USER['email'],
            row[0]
        ))

        conn.commit()
        conn.close()

        return jsonify({'message': 'Metric deleted successfully'})
    except Exception as e:
        logger.error(f"Error deleting individual metric: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/initiatives/<int:initiative_id>/metrics/<period>', methods=['DELETE'])
def delete_period_metrics(initiative_id, period):
    """Delete all metrics for a specific period"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM monthly_metrics
            WHERE initiative_id = ? AND metric_period = ?
        """, (initiative_id, period))

        conn.commit()
        conn.close()

        return jsonify({'message': 'Period metrics deleted successfully'})
    except Exception as e:
        logger.error(f"Error deleting period metrics: {str(e)}")
        return jsonify({'error': str(e)}), 500

def convert_to_numeric(value):
    """Convert value to numeric, return None if empty or invalid"""
    if value is None or value == '' or value == 'null':
        return None
    try:
        return float(value) if '.' in str(value) else int(value)
    except (ValueError, TypeError):
        return None

def convert_to_date(value):
    """Convert value to date, return None if empty or invalid"""
    if value is None or value == '' or value == 'null' or value == 'undefined':
        return None
    return value

@app.route('/api/initiatives/<int:initiative_id>/metrics', methods=['POST'])
def create_initiative_metric(initiative_id):
    """Create or update monthly metrics for an initiative"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()

        metric_period = data.get('metric_period')

        # Convert numeric fields properly
        customer_experience_score = convert_to_numeric(data.get('customer_experience_score'))
        time_saved_hours = convert_to_numeric(data.get('time_saved_hours'))
        cost_saved_rands = convert_to_numeric(data.get('cost_saved_rands'))
        revenue_increase_rands = convert_to_numeric(data.get('revenue_increase_rands'))
        processed_units = convert_to_numeric(data.get('processed_units'))
        model_accuracy = convert_to_numeric(data.get('model_accuracy'))
        user_adoption_rate = convert_to_numeric(data.get('user_adoption_rate'))
        error_rate = convert_to_numeric(data.get('error_rate'))
        response_time_ms = convert_to_numeric(data.get('response_time_ms'))
        data_quality_score = convert_to_numeric(data.get('data_quality_score'))
        user_satisfaction_score = convert_to_numeric(data.get('user_satisfaction_score'))
        business_impact_score = convert_to_numeric(data.get('business_impact_score'))
        innovation_score = convert_to_numeric(data.get('innovation_score'))

        # Handle additional dynamic metrics
        import json
        new_additional_metrics = data.get('additional_metrics', {})

        # Check if metric already exists
        cursor.execute("""
            SELECT id, additional_metrics FROM monthly_metrics
            WHERE initiative_id = ? AND metric_period = ?
        """, (initiative_id, metric_period))

        existing = cursor.fetchone()

        if existing:
            # Merge new metrics with existing metrics (don't overwrite)
            existing_metrics = {}
            if existing[1]:  # existing[1] is the additional_metrics column
                try:
                    existing_metrics = json.loads(existing[1])
                except:
                    existing_metrics = {}

            # Merge: new metrics are added, existing metrics are preserved
            merged_metrics = {**existing_metrics, **new_additional_metrics}
            additional_metrics_json = json.dumps(merged_metrics) if merged_metrics else None

            # Update existing metric
            cursor.execute("""
                UPDATE monthly_metrics SET
                    customer_experience_score = ?,
                    customer_experience_comments = ?,
                    time_saved_hours = ?,
                    time_saved_comments = ?,
                    cost_saved_rands = ?,
                    cost_saved_comments = ?,
                    revenue_increase_rands = ?,
                    revenue_increase_comments = ?,
                    processed_units = ?,
                    processed_units_comments = ?,
                    model_accuracy = ?,
                    model_accuracy_comments = ?,
                    user_adoption_rate = ?,
                    user_adoption_comments = ?,
                    error_rate = ?,
                    error_rate_comments = ?,
                    response_time_ms = ?,
                    response_time_comments = ?,
                    data_quality_score = ?,
                    data_quality_comments = ?,
                    user_satisfaction_score = ?,
                    user_satisfaction_comments = ?,
                    business_impact_score = ?,
                    business_impact_comments = ?,
                    innovation_score = ?,
                    innovation_comments = ?,
                    additional_metrics = ?,
                    modified_at = GETDATE(),
                    modified_by_name = ?,
                    modified_by_email = ?
                WHERE id = ?
            """, (
                customer_experience_score,
                data.get('customer_experience_comments'),
                time_saved_hours,
                data.get('time_saved_comments'),
                cost_saved_rands,
                data.get('cost_saved_comments'),
                revenue_increase_rands,
                data.get('revenue_increase_comments'),
                processed_units,
                data.get('processed_units_comments'),
                model_accuracy,
                data.get('model_accuracy_comments'),
                user_adoption_rate,
                data.get('user_adoption_comments'),
                error_rate,
                data.get('error_rate_comments'),
                response_time_ms,
                data.get('response_time_comments'),
                data_quality_score,
                data.get('data_quality_comments'),
                user_satisfaction_score,
                data.get('user_satisfaction_comments'),
                business_impact_score,
                data.get('business_impact_comments'),
                innovation_score,
                data.get('innovation_comments'),
                additional_metrics_json,
                DEFAULT_USER['name'],
                DEFAULT_USER['email'],
                existing[0]
            ))
        else:
            # Insert new metric (first time for this period)
            additional_metrics_json = json.dumps(new_additional_metrics) if new_additional_metrics else None

            cursor.execute("""
                INSERT INTO monthly_metrics (
                    initiative_id, metric_period,
                    customer_experience_score, customer_experience_comments,
                    time_saved_hours, time_saved_comments,
                    cost_saved_rands, cost_saved_comments,
                    revenue_increase_rands, revenue_increase_comments,
                    processed_units, processed_units_comments,
                    model_accuracy, model_accuracy_comments,
                    user_adoption_rate, user_adoption_comments,
                    error_rate, error_rate_comments,
                    response_time_ms, response_time_comments,
                    data_quality_score, data_quality_comments,
                    user_satisfaction_score, user_satisfaction_comments,
                    business_impact_score, business_impact_comments,
                    innovation_score, innovation_comments,
                    additional_metrics,
                    created_by_name, created_by_email,
                    modified_by_name, modified_by_email
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                initiative_id, metric_period,
                customer_experience_score,
                data.get('customer_experience_comments'),
                time_saved_hours,
                data.get('time_saved_comments'),
                cost_saved_rands,
                data.get('cost_saved_comments'),
                revenue_increase_rands,
                data.get('revenue_increase_comments'),
                processed_units,
                data.get('processed_units_comments'),
                model_accuracy,
                data.get('model_accuracy_comments'),
                user_adoption_rate,
                data.get('user_adoption_comments'),
                error_rate,
                data.get('error_rate_comments'),
                response_time_ms,
                data.get('response_time_comments'),
                data_quality_score,
                data.get('data_quality_comments'),
                user_satisfaction_score,
                data.get('user_satisfaction_comments'),
                business_impact_score,
                data.get('business_impact_comments'),
                innovation_score,
                data.get('innovation_comments'),
                additional_metrics_json,
                DEFAULT_USER['name'],
                DEFAULT_USER['email'],
                DEFAULT_USER['name'],
                DEFAULT_USER['email']
            ))

        conn.commit()
        conn.close()

        return jsonify({'message': 'Metrics saved successfully'}), 201
    except Exception as e:
        logger.error(f"Error saving metrics: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ==================== Field Options (Management View) ====================

@app.route('/api/field-options', methods=['GET'])
def get_field_options():
    """Get all field options grouped by field name"""
    try:
        field_name = request.args.get('field_name')

        conn = get_db_connection()
        cursor = conn.cursor()

        if field_name:
            cursor.execute("""
                SELECT * FROM field_options
                WHERE field_name = ? AND is_active = 1
                ORDER BY display_order, option_value
            """, field_name)
        else:
            cursor.execute("""
                SELECT * FROM field_options
                WHERE is_active = 1
                ORDER BY field_name, display_order, option_value
            """)

        options = [dict_from_row(cursor, row) for row in cursor.fetchall()]

        conn.close()
        return jsonify(options)
    except Exception as e:
        logger.error(f"Error fetching field options: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/field-options', methods=['POST'])
def create_field_option():
    """Create a new field option"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO field_options (
                field_name, option_value, display_order,
                created_by, modified_by
            ) VALUES (?, ?, ?, ?, ?)
        """, (
            data.get('field_name'),
            data.get('option_value'),
            data.get('display_order', 0),
            DEFAULT_USER['email'],
            DEFAULT_USER['email']
        ))

        cursor.execute("SELECT @@IDENTITY")
        option_id = cursor.fetchone()[0]

        conn.commit()
        conn.close()

        return jsonify({'id': option_id, 'message': 'Field option created successfully'}), 201
    except Exception as e:
        logger.error(f"Error creating field option: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ===============================================================================
# Custom Metrics Endpoints
# ===============================================================================

@app.route('/api/custom-metrics', methods=['GET'])
def get_custom_metrics():
    """Get all active custom metrics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM custom_metrics
            WHERE is_active = 1
            ORDER BY metric_name
        """)

        metrics = [dict_from_row(cursor, row) for row in cursor.fetchall()]

        conn.close()
        return jsonify(metrics)
    except Exception as e:
        logger.error(f"Error fetching custom metrics: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/custom-metrics', methods=['POST'])
def create_custom_metric():
    """Create a new custom metric"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO custom_metrics (
                metric_name, metric_description, metric_type, unit_of_measure,
                created_by, modified_by
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data.get('metric_name'),
            data.get('metric_description'),
            data.get('metric_type'),
            data.get('unit_of_measure'),
            DEFAULT_USER['email'],
            DEFAULT_USER['email']
        ))

        cursor.execute("SELECT @@IDENTITY")
        metric_id = cursor.fetchone()[0]

        conn.commit()
        conn.close()

        return jsonify({'id': metric_id, 'message': 'Custom metric created successfully'}), 201
    except Exception as e:
        logger.error(f"Error creating custom metric: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/field-options/<int:option_id>', methods=['PUT'])
def update_field_option(option_id):
    """Update a field option"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()

        old_value = data.get('old_value')
        new_value = data.get('option_value')
        field_name = data.get('field_name')

        # Update the field option
        cursor.execute("""
            UPDATE field_options SET
                option_value = ?,
                display_order = ?,
                modified_at = GETDATE(),
                modified_by = ?
            WHERE id = ?
        """, (
            new_value,
            data.get('display_order', 0),
            DEFAULT_USER['email'],
            option_id
        ))

        # Update all initiatives using this option
        if old_value and new_value and old_value != new_value:
            if field_name == 'benefit':
                cursor.execute("UPDATE initiatives SET benefit = ? WHERE benefit = ?", (new_value, old_value))
            elif field_name == 'strategic_objective':
                cursor.execute("UPDATE initiatives SET strategic_objective = ? WHERE strategic_objective = ?", (new_value, old_value))
            elif field_name == 'status':
                cursor.execute("UPDATE initiatives SET status = ? WHERE status = ?", (new_value, old_value))
            elif field_name == 'priority':
                cursor.execute("UPDATE initiatives SET priority = ? WHERE priority = ?", (new_value, old_value))
            elif field_name == 'risk_level':
                cursor.execute("UPDATE initiatives SET risk_level = ? WHERE risk_level = ?", (new_value, old_value))
            elif field_name == 'department':
                cursor.execute("UPDATE initiative_departments SET department = ? WHERE department = ?", (new_value, old_value))

        conn.commit()
        conn.close()

        return jsonify({'message': 'Field option updated successfully'})
    except Exception as e:
        logger.error(f"Error updating field option: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/field-options/<int:option_id>', methods=['DELETE'])
def delete_field_option(option_id):
    """Soft delete a field option"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Soft delete - just mark as inactive
        cursor.execute("""
            UPDATE field_options SET
                is_active = 0,
                modified_at = GETDATE(),
                modified_by = ?
            WHERE id = ?
        """, (DEFAULT_USER['email'], option_id))

        conn.commit()
        conn.close()

        return jsonify({'message': 'Field option deleted successfully'})
    except Exception as e:
        logger.error(f"Error deleting field option: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ==================== Featured Solutions ====================

@app.route('/api/featured-solutions', methods=['GET'])
def get_featured_solutions():
    """Get featured solutions for a specific month"""
    try:
        month = request.args.get('month')  # Format: YYYY-MM

        conn = get_db_connection()
        cursor = conn.cursor()

        if month:
            cursor.execute("""
                SELECT * FROM initiatives
                WHERE is_featured = 1 AND featured_month = ?
                ORDER BY modified_at DESC
            """, month)
        else:
            cursor.execute("""
                SELECT * FROM initiatives
                WHERE is_featured = 1
                ORDER BY featured_month DESC, modified_at DESC
            """)

        solutions = [dict_from_row(cursor, row) for row in cursor.fetchall()]

        # Get departments for each solution
        for solution in solutions:
            cursor.execute("""
                SELECT department FROM initiative_departments
                WHERE initiative_id = ?
            """, solution['id'])
            solution['departments'] = [row[0] for row in cursor.fetchall()]

        conn.close()
        return jsonify(solutions)
    except Exception as e:
        logger.error(f"Error fetching featured solutions: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ==================== Autocomplete / Suggestions ====================

@app.route('/api/suggestions/process-owners', methods=['GET'])
def get_process_owner_suggestions():
    """Get unique process owners for autocomplete"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT DISTINCT process_owner
            FROM initiatives
            WHERE process_owner IS NOT NULL
            ORDER BY process_owner
        """)

        owners = [row[0] for row in cursor.fetchall()]

        conn.close()
        return jsonify(owners)
    except Exception as e:
        logger.error(f"Error fetching process owners: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/suggestions/business-owners', methods=['GET'])
def get_business_owner_suggestions():
    """Get unique business owners for autocomplete"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT DISTINCT business_owner
            FROM initiatives
            WHERE business_owner IS NOT NULL
            ORDER BY business_owner
        """)

        owners = [row[0] for row in cursor.fetchall()]

        conn.close()
        return jsonify(owners)
    except Exception as e:
        logger.error(f"Error fetching business owners: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ==================== Risks Management ====================

def calculate_overall_risk(frequency, severity):
    """
    Calculate overall risk based on frequency and severity using a risk matrix.

    Risk Matrix:
                 Severity
               Low      Medium    High
    Freq Low    Low      Low      Medium
         Med    Low      Medium   High
         High   Medium   High     High

    Args:
        frequency: Risk frequency (Low, Medium, High)
        severity: Risk severity (Low, Medium, High)

    Returns:
        Overall risk level (Low, Medium, High)
    """
    if not frequency or not severity:
        return 'Low'  # Default if values not provided

    freq = frequency.strip()
    sev = severity.strip()

    # Risk matrix mapping
    risk_matrix = {
        ('Low', 'Low'): 'Low',
        ('Low', 'Medium'): 'Low',
        ('Low', 'High'): 'Medium',
        ('Medium', 'Low'): 'Low',
        ('Medium', 'Medium'): 'Medium',
        ('Medium', 'High'): 'High',
        ('High', 'Low'): 'Medium',
        ('High', 'Medium'): 'High',
        ('High', 'High'): 'High'
    }

    return risk_matrix.get((freq, sev), 'Low')

@app.route('/api/initiatives/<int:initiative_id>/risks', methods=['GET'])
def get_initiative_risks(initiative_id):
    """Get all risks for an initiative"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM risks
            WHERE initiative_id = ?
            ORDER BY created_at DESC
        """, initiative_id)

        risks = [dict_from_row(cursor, row) for row in cursor.fetchall()]

        conn.close()
        return jsonify(risks)
    except Exception as e:
        logger.error(f"Error fetching risks: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/initiatives/<int:initiative_id>/risks', methods=['POST'])
def create_risk(initiative_id):
    """Create a new risk for an initiative"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()

        # Calculate overall risk based on frequency and severity
        frequency = data.get('frequency', '')
        severity = data.get('severity', '')
        overall_risk = calculate_overall_risk(frequency, severity)

        cursor.execute("""
            INSERT INTO risks (
                initiative_id, risk_title, risk_detail, frequency, severity,
                risk_mitigation, controls, overall_risk,
                created_by_name, created_by_email, modified_by_name, modified_by_email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            initiative_id,
            data.get('risk_title'),
            data.get('risk_detail'),
            frequency,
            severity,
            data.get('risk_mitigation', ''),
            data.get('controls', ''),
            overall_risk,
            DEFAULT_USER['name'],
            DEFAULT_USER['email'],
            DEFAULT_USER['name'],
            DEFAULT_USER['email']
        ))

        cursor.execute("SELECT @@IDENTITY")
        risk_id = cursor.fetchone()[0]

        conn.commit()
        conn.close()

        return jsonify({'id': risk_id, 'message': 'Risk created successfully'}), 201
    except Exception as e:
        logger.error(f"Error creating risk: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/risks/<int:risk_id>', methods=['PUT'])
def update_risk(risk_id):
    """Update a risk"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()

        # Calculate overall risk based on frequency and severity
        frequency = data.get('frequency', '')
        severity = data.get('severity', '')
        overall_risk = calculate_overall_risk(frequency, severity)

        cursor.execute("""
            UPDATE risks SET
                risk_title = ?,
                risk_detail = ?,
                frequency = ?,
                severity = ?,
                risk_mitigation = ?,
                controls = ?,
                overall_risk = ?,
                modified_at = GETDATE(),
                modified_by_name = ?,
                modified_by_email = ?
            WHERE id = ?
        """, (
            data.get('risk_title'),
            data.get('risk_detail'),
            frequency,
            severity,
            data.get('risk_mitigation', ''),
            data.get('controls', ''),
            overall_risk,
            DEFAULT_USER['name'],
            DEFAULT_USER['email'],
            risk_id
        ))

        conn.commit()
        conn.close()

        return jsonify({'message': 'Risk updated successfully'})
    except Exception as e:
        logger.error(f"Error updating risk: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/risks/<int:risk_id>', methods=['DELETE'])
def delete_risk(risk_id):
    """Delete a risk"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM risks WHERE id = ?", risk_id)

        conn.commit()
        conn.close()

        return jsonify({'message': 'Risk deleted successfully'})
    except Exception as e:
        logger.error(f"Error deleting risk: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ==================== Progress Updates ====================

@app.route('/api/initiatives/<int:initiative_id>/progress-updates', methods=['GET'])
def get_progress_updates(initiative_id):
    """Get all progress updates for an initiative with pagination"""
    try:
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 10))
        offset = (page - 1) * page_size

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get total count
        cursor.execute("""
            SELECT COUNT(*) FROM progress_updates
            WHERE initiative_id = ?
        """, initiative_id)
        total_count = cursor.fetchone()[0]

        # Get paginated updates
        cursor.execute("""
            SELECT * FROM progress_updates
            WHERE initiative_id = ?
            ORDER BY created_at DESC
            OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
        """, (initiative_id, offset, page_size))

        updates = [dict_from_row(cursor, row) for row in cursor.fetchall()]

        conn.close()
        return jsonify({
            'updates': updates,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size
        })
    except Exception as e:
        logger.error(f"Error fetching progress updates: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/initiatives/<int:initiative_id>/progress-updates', methods=['POST'])
def create_progress_update(initiative_id):
    """Create a new progress update for an initiative"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO progress_updates (
                initiative_id, update_type, update_title, update_details,
                created_by_name, created_by_email, modified_by_name, modified_by_email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            initiative_id,
            data.get('update_type'),
            data.get('update_title'),
            data.get('update_details'),
            DEFAULT_USER['name'],
            DEFAULT_USER['email'],
            DEFAULT_USER['name'],
            DEFAULT_USER['email']
        ))

        cursor.execute("SELECT @@IDENTITY")
        update_id = cursor.fetchone()[0]

        conn.commit()
        conn.close()

        return jsonify({'id': update_id, 'message': 'Progress update created successfully'}), 201
    except Exception as e:
        logger.error(f"Error creating progress update: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/progress-updates/<int:update_id>', methods=['GET'])
def get_progress_update(update_id):
    """Get a specific progress update by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM progress_updates WHERE id = ?", update_id)
        row = cursor.fetchone()

        if not row:
            conn.close()
            return jsonify({'error': 'Progress update not found'}), 404

        update = dict_from_row(cursor, row)

        conn.close()
        return jsonify(update)
    except Exception as e:
        logger.error(f"Error fetching progress update: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/progress-updates/<int:update_id>', methods=['PUT'])
def update_progress_update(update_id):
    """Update a progress update"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE progress_updates SET
                update_type = ?,
                update_title = ?,
                update_details = ?,
                modified_at = GETDATE(),
                modified_by_name = ?,
                modified_by_email = ?
            WHERE id = ?
        """, (
            data.get('update_type'),
            data.get('update_title'),
            data.get('update_details'),
            DEFAULT_USER['name'],
            DEFAULT_USER['email'],
            update_id
        ))

        conn.commit()
        conn.close()

        return jsonify({'message': 'Progress update updated successfully'})
    except Exception as e:
        logger.error(f"Error updating progress update: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/progress-updates/<int:update_id>', methods=['DELETE'])
def delete_progress_update(update_id):
    """Delete a progress update"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM progress_updates WHERE id = ?", update_id)

        conn.commit()
        conn.close()

        return jsonify({'message': 'Progress update deleted successfully'})
    except Exception as e:
        logger.error(f"Error deleting progress update: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ==================== ROI Assistant ====================

@app.route('/api/roi-assistant', methods=['POST'])
def roi_assistant():
    """Get ROI recommendations from OpenAI based on user responses"""
    try:
        data = request.json

        # Build the prompt from user responses
        prompt = f"""You are an ROI measurement expert for TIH AI and RPA initiatives.
A user is planning to implement an initiative and needs guidance on which ROI metrics to use and how to measure them.

Here is the information provided about the initiative:

Initiative Type: {data.get('initiative_type', 'Not specified')}
Primary Value Type: {data.get('value_type', 'Not specified')}
Implementation Scale: {data.get('scale', 'Not specified')}
Units Processed Per Month: {data.get('units_processed', 'Not specified')}
Current Process Status: {data.get('current_process', 'Not specified')}
Success Measurement Approach: {data.get('success_metrics', 'Not specified')}
Expected ROI Timeline: {data.get('timeline', 'Not specified')}
Industry Challenges Addressed: {data.get('industry_specifics', 'Not specified')}

Based on this information, please provide:

1. RECOMMENDED ROI METRICS
   - List the specific quantitative and/or qualitative metrics that would be most appropriate for this initiative
   - Explain why each metric is relevant given the context provided

2. DATA COMPILATION GUIDANCE
   - Provide clear, step-by-step guidance on how to collect and compile data for each recommended metric
   - Include specific examples relevant to the South African insurance market
   - Assume the user has no technical knowledge - use simple, easy-to-understand language

3. MEASUREMENT FRAMEWORK
   - Suggest how frequently to measure each metric
   - Provide baseline establishment recommendations
   - Include any formulas or calculations needed (explained in simple terms)

4. ADDITIONAL RECOMMENDATIONS
   - Highlight any considerations specific to the South African insurance industry
   - Suggest any complementary metrics that could add value
   - Provide tips for ensuring accurate and meaningful ROI measurement

IMPORTANT GUIDELINES:
- Write in a professional tone without using any emojis or emoticons
- Focus on practical, actionable guidance
- Use clear, non-technical language that anyone can understand
- Consider the South African insurance market context in your recommendations
- Be specific and provide concrete examples where possible
- Format your response clearly with headers and bullet points for readability
- Your response must get to the point. Respond with guidance and dont start with terms such as 'Certainly' or 'Sure I can help with that...'"""

        # Call OpenAI API
        response = openai_client.chat.completions.create(
            model="gpt-4.1",  # Using gpt-4.1 deployment
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert ROI consultant for TIH that operates in South Africa. You provide clear, professional, actionable guidance on how users can measure return on investment for AI and RPA initiatives. You never use emojis and always write in a professional manner suitable for executive reporting.
                                  Your reponse must provide ROI metrics that the user must consider to for their initiative. Provide clear guidelines for the user to follow with appropiate calculation guides."""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=2000
        )

        recommendation = response.choices[0].message.content

        # Save conversation to database for tracking
        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            import json
            cursor.execute("""
                INSERT INTO roi_conversations (
                    user_responses, llm_recommendation,
                    created_by_name, created_by_email
                ) VALUES (?, ?, ?, ?)
            """, (
                json.dumps(data),
                recommendation,
                DEFAULT_USER['name'],
                DEFAULT_USER['email']
            ))

            conn.commit()
            conn.close()
        except Exception as db_error:
            logger.warning(f"Failed to save ROI conversation to database: {str(db_error)}")
            # Don't fail the request if database save fails

        return jsonify({
            'recommendation': recommendation,
            'status': 'success'
        })

    except Exception as e:
        logger.error(f"Error in ROI assistant: {str(e)}")
        return jsonify({'error': 'Failed to generate ROI recommendations. Please try again.'}), 500

# ==================== Complexity Analyzer ====================

@app.route('/api/complexity-analyzer', methods=['POST'])
def complexity_analyzer():
    """Analyze initiative complexity based on user responses"""
    try:
        data = request.json

        # Calculate complexity score based on user responses
        complexity_score = calculate_complexity_score(data)
        value_score = calculate_value_score(data)
        quadrant = determine_quadrant(complexity_score, value_score)

        # Build the prompt from user responses
        prompt = f"""You are an AI initiative complexity expert for TIH operating in South Africa.
A user has provided information about an AI initiative they want to implement. Based on their responses, analyze the complexity and provide actionable recommendations.

Initiative Name: {data.get('initiative_name', 'Not specified')}

READINESS ASSESSMENT:
Data Availability: {data.get('data_availability', 'Not specified')}
Data Quality: {data.get('data_quality', 'Not specified')}
Infrastructure Readiness: {data.get('infrastructure_readiness', 'Not specified')}
Team Skills: {data.get('team_skills', 'Not specified')}
Stakeholder Buy-in: {data.get('stakeholder_buyin', 'Not specified')}
Budget Availability: {data.get('budget_availability', 'Not specified')}
Regulatory Compliance: {data.get('regulatory_compliance', 'Not specified')}
Integration Complexity: {data.get('integration_complexity', 'Not specified')}
Technology Maturity: {data.get('technology_maturity', 'Not specified')}
Expected Timeline: {data.get('expected_timeline', 'Not specified')}

CALCULATED METRICS:
Complexity Score: {complexity_score}/100 (Higher = More Complex)
Value Score: {value_score}/100 (Higher = More Valuable)
Classification: {quadrant}

Based on this assessment, please provide:

1. COMPLEXITY ANALYSIS
   - Summarize the key complexity drivers
   - Highlight the most challenging aspects
   - Identify quick wins vs long-term challenges

2. GAPS TO ADDRESS
   - List specific gaps that need to be closed
   - Prioritize gaps by impact and urgency
   - Provide specific action items for each gap

3. RECOMMENDED NEXT STEPS
   - Provide a clear roadmap with phases
   - Suggest specific actions for the next 30/60/90 days
   - Include any pilot or proof-of-concept recommendations

4. RESOURCE REQUIREMENTS
   - Estimate team composition needed
   - Identify critical skills or tools required
   - Suggest training or hiring needs

5. RISK MITIGATION
   - Highlight key risks based on the complexity
   - Provide mitigation strategies
   - Suggest monitoring and checkpoints

IMPORTANT GUIDELINES:
- Write in a professional tone without using any emojis or emoticons
- Focus on practical, actionable guidance specific to the South African insurance market
- Be honest about challenges but provide constructive solutions
- Consider TIH's context in your recommendations
- Format your response clearly with headers and bullet points for readability"""

        # Call OpenAI API
        response = openai_client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert AI implementation consultant specializing in insurance companies in South Africa. You provide clear, professional, actionable guidance on implementing AI initiatives. You analyze complexity, identify gaps, and provide practical roadmaps. You never use emojis and always write in a professional manner."""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=2500
        )

        recommendation = response.choices[0].message.content

        # Save conversation to database
        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            import json
            cursor.execute("""
                INSERT INTO complexity_conversations (
                    initiative_name, user_responses, complexity_score, value_score,
                    quadrant, llm_recommendation, created_by_name, created_by_email
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data.get('initiative_name'),
                json.dumps(data),
                complexity_score,
                value_score,
                quadrant,
                recommendation,
                DEFAULT_USER['name'],
                DEFAULT_USER['email']
            ))

            # Get the inserted ID
            cursor.execute("SELECT @@IDENTITY")
            conversation_id = cursor.fetchone()[0]

            conn.commit()
            conn.close()
        except Exception as db_error:
            logger.warning(f"Failed to save complexity conversation to database: {str(db_error)}")
            conversation_id = None

        return jsonify({
            'recommendation': recommendation,
            'complexity_score': complexity_score,
            'value_score': value_score,
            'quadrant': quadrant,
            'conversation_id': conversation_id,
            'status': 'success'
        })

    except Exception as e:
        logger.error(f"Error in complexity analyzer: {str(e)}")
        return jsonify({'error': 'Failed to analyze complexity. Please try again.'}), 500

def calculate_complexity_score(data):
    """Calculate complexity score based on user responses (0-100, higher = more complex)"""
    score = 0
    total_questions = 13  # Updated to match new question count

    # Define scoring for each question (higher score = more complex)

    # Business case clarity (inverse - less clear = more complex)
    business_case_scores = {
        'Very clear with quantified benefits': 0,
        'Moderately clear': 25,
        'Somewhat unclear': 50,
        'Needs significant work': 75
    }
    score += business_case_scores.get(data.get('business_case_clarity', ''), 50)

    # Data availability (inverse - less available = more complex)
    data_avail_scores = {
        'Readily available and accessible': 0,
        'Available but needs gathering': 25,
        'Partially available': 60,
        'Not available yet': 90
    }
    score += data_avail_scores.get(data.get('data_availability', ''), 50)

    # Data quality (inverse - lower quality = more complex)
    data_quality_scores = {
        'High quality and clean': 0,
        'Moderate quality': 30,
        'Poor quality, needs cleaning': 70,
        'Unknown or unassessed': 60
    }
    score += data_quality_scores.get(data.get('data_quality', ''), 50)

    # Infrastructure readiness (inverse - less ready = more complex)
    infra_scores = {
        'Fully ready': 0,
        'Mostly ready, minor gaps': 20,
        'Significant gaps exist': 60,
        'Not ready, needs build-out': 85
    }
    score += infra_scores.get(data.get('infrastructure_readiness', ''), 50)

    # Stakeholder buy-in (inverse - less support = more complex)
    stakeholder_scores = {
        'Strong support from all levels': 0,
        'Moderate support': 30,
        'Limited support': 65,
        'No support secured yet': 90
    }
    score += stakeholder_scores.get(data.get('stakeholder_buyin', ''), 50)

    # Budget availability (inverse - less budget = more complex)
    budget_scores = {
        'Approved and allocated': 0,
        'Budget requested pending approval': 30,
        'Budget uncertain': 70,
        'No budget identified': 95
    }
    score += budget_scores.get(data.get('budget_availability', ''), 50)

    # Regulatory compliance (higher risk = more complex)
    compliance_scores = {
        'Low risk, compliant': 0,
        'Moderate risk, manageable': 35,
        'High risk, needs review': 75,
        'Very high risk or unknown': 95
    }
    score += compliance_scores.get(data.get('regulatory_compliance', ''), 50)

    # Integration complexity (direct - more complex integration = higher score)
    integration_scores = {
        'Simple, minimal integration': 0,
        'Moderate complexity': 35,
        'Complex, multiple systems': 70,
        'Very complex, enterprise-wide': 95
    }
    score += integration_scores.get(data.get('integration_complexity', ''), 50)

    # Technology maturity (inverse - less mature = more complex)
    tech_scores = {
        'Proven and widely adopted': 0,
        'Established but evolving': 25,
        'Emerging technology': 60,
        'Experimental or cutting-edge': 85
    }
    score += tech_scores.get(data.get('technology_maturity', ''), 50)

    # Change management (inverse - less prepared = more complex)
    change_scores = {
        'Highly prepared with change plan': 0,
        'Moderately prepared': 30,
        'Limited preparation': 65,
        'Not prepared': 90
    }
    score += change_scores.get(data.get('change_management', ''), 50)

    # Data governance (inverse - weaker governance = more complex)
    governance_scores = {
        'Strong governance in place': 0,
        'Adequate governance': 30,
        'Weak governance': 70,
        'No governance established': 90
    }
    score += governance_scores.get(data.get('data_governance', ''), 50)

    # Expected timeline (longer timeline = more complex)
    timeline_scores = {
        'Under 3 months': 10,
        '3-6 months': 35,
        '6-12 months': 65,
        'Over 12 months': 90
    }
    score += timeline_scores.get(data.get('expected_timeline', ''), 50)

    # Team availability (inverse - less available = more complex)
    team_scores = {
        'Team fully allocated': 0,
        'Team mostly available': 25,
        'Limited availability': 65,
        'Team not identified': 90
    }
    score += team_scores.get(data.get('team_availability', ''), 50)

    return round(score / total_questions, 2)

def calculate_value_score(data):
    """Calculate value score based on expected benefits and impact (0-100)"""
    score = 0

    # Business case clarity (higher clarity = higher value confidence)
    business_case_scores = {
        'Very clear with quantified benefits': 25,
        'Moderately clear': 18,
        'Somewhat unclear': 10,
        'Needs significant work': 5
    }
    score += business_case_scores.get(data.get('business_case_clarity', ''), 12)

    # Data availability (more available = higher value potential)
    data_avail_scores = {
        'Readily available and accessible': 15,
        'Available but needs gathering': 12,
        'Partially available': 7,
        'Not available yet': 3
    }
    score += data_avail_scores.get(data.get('data_availability', ''), 8)

    # Data quality (higher quality = higher value potential)
    data_quality_scores = {
        'High quality and clean': 15,
        'Moderate quality': 11,
        'Poor quality, needs cleaning': 5,
        'Unknown or unassessed': 7
    }
    score += data_quality_scores.get(data.get('data_quality', ''), 8)

    # Stakeholder buy-in (more support = higher value realization)
    stakeholder_scores = {
        'Strong support from all levels': 20,
        'Moderate support': 14,
        'Limited support': 7,
        'No support secured yet': 2
    }
    score += stakeholder_scores.get(data.get('stakeholder_buyin', ''), 10)

    # Budget availability (approved budget = higher value feasibility)
    budget_scores = {
        'Approved and allocated': 15,
        'Budget requested pending approval': 10,
        'Budget uncertain': 5,
        'No budget identified': 1
    }
    score += budget_scores.get(data.get('budget_availability', ''), 7)

    # Timeline (faster delivery = higher value)
    timeline_scores = {
        'Under 3 months': 10,
        '3-6 months': 8,
        '6-12 months': 5,
        'Over 12 months': 2
    }
    score += timeline_scores.get(data.get('expected_timeline', ''), 5)

    return min(score, 100)

def determine_quadrant(complexity_score, value_score):
    """Determine which quadrant the initiative falls into"""
    # Complexity thresholds
    low_complexity = complexity_score < 33
    medium_complexity = 33 <= complexity_score < 66
    high_complexity = complexity_score >= 66

    # Value thresholds
    low_value = value_score < 40
    medium_value = 40 <= value_score < 70
    high_value = value_score >= 70

    # Determine quadrant
    if high_value and low_complexity:
        return "Low Hanging Fruit (High Value, Low Complexity)"
    elif high_value and medium_complexity:
        return "Needs Planning (High Value, Medium Complexity)"
    elif high_value and high_complexity:
        return "Needs AI COE Planning (High Value, High Complexity)"
    elif medium_value and low_complexity:
        return "Quick Wins (Medium Value, Low Complexity)"
    elif medium_value and medium_complexity:
        return "Moderate Effort (Medium Value, Medium Complexity)"
    elif medium_value and high_complexity:
        return "High Risk (Medium Value, High Complexity)"
    elif low_value and low_complexity:
        return "Low Priority (Low Value, Low Complexity)"
    elif low_value and medium_complexity:
        return "Questionable (Low Value, Medium Complexity)"
    else:  # low_value and high_complexity
        return "Avoid (Low Value, High Complexity)"

@app.route('/api/complexity-conversations', methods=['GET'])
def get_complexity_conversations():
    """Get all complexity conversations for the current user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, initiative_name, complexity_score, value_score, quadrant, created_at
            FROM complexity_conversations
            WHERE created_by_email = ?
            ORDER BY created_at DESC
        """, DEFAULT_USER['email'])

        conversations = [dict_from_row(cursor, row) for row in cursor.fetchall()]

        conn.close()
        return jsonify(conversations)
    except Exception as e:
        logger.error(f"Error fetching complexity conversations: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/complexity-conversations/<int:conversation_id>', methods=['GET'])
def get_complexity_conversation(conversation_id):
    """Get a specific complexity conversation by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM complexity_conversations
            WHERE id = ?
        """, conversation_id)

        row = cursor.fetchone()
        if not row:
            conn.close()
            return jsonify({'error': 'Conversation not found'}), 404

        conversation = dict_from_row(cursor, row)

        conn.close()
        return jsonify(conversation)
    except Exception as e:
        logger.error(f"Error fetching complexity conversation: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/complexity-matrix-data', methods=['GET'])
def get_complexity_matrix_data():
    """Get all conversations for plotting on the complexity matrix"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, initiative_name, complexity_score, value_score, quadrant, created_at
            FROM complexity_conversations
            ORDER BY created_at DESC
        """)

        conversations = [dict_from_row(cursor, row) for row in cursor.fetchall()]

        conn.close()
        return jsonify(conversations)
    except Exception as e:
        logger.error(f"Error fetching complexity matrix data: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
