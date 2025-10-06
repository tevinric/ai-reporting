-- AI Reporting Application Database Schema
-- This script creates all necessary tables for the AI reporting application

-- Drop tables if they exist (in reverse order of dependencies)
IF OBJECT_ID('dbo.risks', 'U') IS NOT NULL DROP TABLE dbo.risks;
IF OBJECT_ID('dbo.monthly_metrics', 'U') IS NOT NULL DROP TABLE dbo.monthly_metrics;
IF OBJECT_ID('dbo.initiative_departments', 'U') IS NOT NULL DROP TABLE dbo.initiative_departments;
IF OBJECT_ID('dbo.initiatives', 'U') IS NOT NULL DROP TABLE dbo.initiatives;
IF OBJECT_ID('dbo.custom_metrics', 'U') IS NOT NULL DROP TABLE dbo.custom_metrics;
IF OBJECT_ID('dbo.field_options', 'U') IS NOT NULL DROP TABLE dbo.field_options;
GO

-- Table: field_options
-- Stores configurable dropdown options for various fields
CREATE TABLE dbo.field_options (
    id INT IDENTITY(1,1) PRIMARY KEY,
    field_name NVARCHAR(100) NOT NULL,
    option_value NVARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    created_by NVARCHAR(255),
    modified_at DATETIME DEFAULT GETDATE(),
    modified_by NVARCHAR(255)
);

-- Table: custom_metrics
-- Stores user-defined custom metrics that can be tracked
CREATE TABLE dbo.custom_metrics (
    id INT IDENTITY(1,1) PRIMARY KEY,
    metric_name NVARCHAR(255) NOT NULL,
    metric_description NVARCHAR(MAX),
    metric_type NVARCHAR(50) NOT NULL, -- 'quantitative' or 'qualitative'
    unit_of_measure NVARCHAR(100), -- e.g., 'hours', 'rands', 'percentage', 'count'
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    created_by NVARCHAR(255),
    modified_at DATETIME DEFAULT GETDATE(),
    modified_by NVARCHAR(255)
);

-- Table: initiatives
-- Main table storing AI initiative details
CREATE TABLE dbo.initiatives (
    id INT IDENTITY(1,1) PRIMARY KEY,
    use_case_name NVARCHAR(500) NOT NULL,
    description NVARCHAR(MAX),
    benefit NVARCHAR(255),
    strategic_objective NVARCHAR(255),
    status NVARCHAR(100),
    percentage_complete DECIMAL(5,2) DEFAULT 0,
    process_owner NVARCHAR(255),
    business_owner NVARCHAR(255),

    -- Additional tracking fields
    start_date DATE,
    expected_completion_date DATE,
    actual_completion_date DATE,
    priority NVARCHAR(50), -- High, Medium, Low
    risk_level NVARCHAR(50), -- High, Medium, Low
    technology_stack NVARCHAR(MAX), -- Technologies used
    team_size INT,
    budget_allocated DECIMAL(18,2),
    budget_spent DECIMAL(18,2),
    health_status NVARCHAR(50) DEFAULT 'Green', -- Green, Amber, Red
    initiative_type NVARCHAR(50) DEFAULT 'Internal AI', -- Internal AI, RPA, External AI
    is_pinned BIT DEFAULT 0, -- Pinned to dashboard
    pinned_at DATETIME, -- When it was pinned

    -- Audit fields
    created_at DATETIME DEFAULT GETDATE(),
    created_by_name NVARCHAR(255),
    created_by_email NVARCHAR(255),
    modified_at DATETIME DEFAULT GETDATE(),
    modified_by_name NVARCHAR(255),
    modified_by_email NVARCHAR(255),
    is_featured BIT DEFAULT 0, -- For featured solutions page
    featured_month NVARCHAR(7) -- Format: YYYY-MM
);

-- Table: initiative_departments
-- Many-to-many relationship between initiatives and departments
CREATE TABLE dbo.initiative_departments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    initiative_id INT NOT NULL,
    department NVARCHAR(255) NOT NULL,
    FOREIGN KEY (initiative_id) REFERENCES dbo.initiatives(id) ON DELETE CASCADE
);

-- Table: risks
-- Stores risk assessments for each initiative
CREATE TABLE dbo.risks (
    id INT IDENTITY(1,1) PRIMARY KEY,
    initiative_id INT NOT NULL,
    risk_title NVARCHAR(255) NOT NULL,
    risk_detail NVARCHAR(MAX),
    frequency NVARCHAR(50), -- High, Medium, Low
    severity NVARCHAR(50), -- High, Medium, Low
    created_at DATETIME DEFAULT GETDATE(),
    created_by_name NVARCHAR(255),
    created_by_email NVARCHAR(255),
    modified_at DATETIME DEFAULT GETDATE(),
    modified_by_name NVARCHAR(255),
    modified_by_email NVARCHAR(255),
    FOREIGN KEY (initiative_id) REFERENCES dbo.initiatives(id) ON DELETE CASCADE
);

-- Table: monthly_metrics
-- Stores monthly metric values for each initiative
CREATE TABLE dbo.monthly_metrics (
    id INT IDENTITY(1,1) PRIMARY KEY,
    initiative_id INT NOT NULL,
    metric_period NVARCHAR(7) NOT NULL, -- Format: YYYY-MM

    -- Standard ROI metrics
    customer_experience_score DECIMAL(5,2), -- Scale 1-10
    customer_experience_comments NVARCHAR(MAX),
    time_saved_hours DECIMAL(10,2), -- Normalized to hours per month
    time_saved_comments NVARCHAR(MAX),
    cost_saved_rands DECIMAL(18,2), -- Rands per month
    cost_saved_comments NVARCHAR(MAX),
    revenue_increase_rands DECIMAL(18,2), -- Rands per month
    revenue_increase_comments NVARCHAR(MAX),
    processed_units INT,
    processed_units_comments NVARCHAR(MAX),

    -- Additional AI-specific metrics
    model_accuracy DECIMAL(5,2), -- Percentage
    model_accuracy_comments NVARCHAR(MAX),
    user_adoption_rate DECIMAL(5,2), -- Percentage
    user_adoption_comments NVARCHAR(MAX),
    error_rate DECIMAL(5,2), -- Percentage
    error_rate_comments NVARCHAR(MAX),
    response_time_ms DECIMAL(10,2), -- Average response time in milliseconds
    response_time_comments NVARCHAR(MAX),
    data_quality_score DECIMAL(5,2), -- Scale 1-10
    data_quality_comments NVARCHAR(MAX),

    -- Qualitative metrics
    user_satisfaction_score DECIMAL(5,2), -- Scale 1-10
    user_satisfaction_comments NVARCHAR(MAX),
    business_impact_score DECIMAL(5,2), -- Scale 1-10
    business_impact_comments NVARCHAR(MAX),
    innovation_score DECIMAL(5,2), -- Scale 1-10
    innovation_comments NVARCHAR(MAX),

    -- Dynamic metrics (stored as JSON for flexibility)
    additional_metrics NVARCHAR(MAX), -- JSON object for custom metrics

    -- Audit fields
    created_at DATETIME DEFAULT GETDATE(),
    created_by_name NVARCHAR(255),
    created_by_email NVARCHAR(255),
    modified_at DATETIME DEFAULT GETDATE(),
    modified_by_name NVARCHAR(255),
    modified_by_email NVARCHAR(255),

    FOREIGN KEY (initiative_id) REFERENCES dbo.initiatives(id) ON DELETE CASCADE,
    UNIQUE (initiative_id, metric_period)
);

-- Insert default field options
INSERT INTO dbo.field_options (field_name, option_value, display_order) VALUES
-- Benefits
('benefit', 'Customer experience', 1),
('benefit', 'Productivity', 2),
('benefit', 'Customer Enablement', 3),

-- Strategic Objectives
('strategic_objective', 'Customer Experience', 1),
('strategic_objective', 'Efficiency', 2),
('strategic_objective', 'Enablement', 3),

-- Status
('status', 'Ideation', 1),
('status', 'In Progress', 2),
('status', 'Live (Complete)', 3),

-- Departments
('department', 'Sales', 1),
('department', 'Collections', 2),
('department', 'Claims', 3),
('department', 'Customer', 4),
('department', 'GIT', 5),
('department', 'Data Science', 6),

-- Priority
('priority', 'High', 1),
('priority', 'Medium', 2),
('priority', 'Low', 3),

-- Risk Level
('risk_level', 'High', 1),
('risk_level', 'Medium', 2),
('risk_level', 'Low', 3),

-- Health Status
('health_status', 'Green', 1),
('health_status', 'Amber', 2),
('health_status', 'Red', 3),

-- Risk Frequency
('frequency', 'High', 1),
('frequency', 'Medium', 2),
('frequency', 'Low', 3),

-- Risk Severity
('severity', 'High', 1),
('severity', 'Medium', 2),
('severity', 'Low', 3),

-- Initiative Type
('initiative_type', 'Internal AI', 1),
('initiative_type', 'RPA', 2),
('initiative_type', 'External AI', 3);

-- Insert default custom metrics
INSERT INTO dbo.custom_metrics (metric_name, metric_description, metric_type, unit_of_measure) VALUES
('Customer Experience Improvement', 'Measures the improvement in customer experience on a scale of 1-10', 'quantitative', 'score'),
('Time Saved', 'Total time saved through automation and efficiency improvements', 'quantitative', 'hours'),
('Cost Saved', 'Cost savings realized from the initiative', 'quantitative', 'rands'),
('Revenue Increase', 'Additional revenue generated from the initiative', 'quantitative', 'rands'),
('Processed Units', 'Number of units/transactions processed by the AI system', 'quantitative', 'count'),
('Model Accuracy', 'Accuracy of the AI model predictions', 'quantitative', 'percentage'),
('User Adoption Rate', 'Percentage of intended users actively using the solution', 'quantitative', 'percentage'),
('Error Rate', 'Percentage of errors or failed transactions', 'quantitative', 'percentage'),
('Response Time', 'Average response time of the AI system', 'quantitative', 'milliseconds'),
('Data Quality Score', 'Quality of data used by the AI system', 'quantitative', 'score'),
('User Satisfaction', 'User satisfaction rating based on surveys', 'qualitative', 'score'),
('Business Impact', 'Overall business impact assessment', 'qualitative', 'score'),
('Innovation Score', 'Level of innovation and novelty of the solution', 'qualitative', 'score');

GO

-- Create indexes for better performance
CREATE INDEX IX_initiatives_status ON dbo.initiatives(status);
CREATE INDEX IX_initiatives_featured ON dbo.initiatives(is_featured, featured_month);
CREATE INDEX IX_initiatives_health_status ON dbo.initiatives(health_status);
CREATE INDEX IX_monthly_metrics_period ON dbo.monthly_metrics(metric_period);
CREATE INDEX IX_field_options_field_name ON dbo.field_options(field_name, is_active);
CREATE INDEX IX_risks_initiative ON dbo.risks(initiative_id);

GO
