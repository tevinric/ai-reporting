-- Migration Script: Add Risk Mitigation, Controls, and Overall Risk fields
-- Run this script on existing databases to add the new risk management fields

-- Add new columns to risks table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = 'risks' AND COLUMN_NAME = 'risk_mitigation')
BEGIN
    ALTER TABLE dbo.risks ADD risk_mitigation NVARCHAR(MAX);
    PRINT 'Added risk_mitigation column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = 'risks' AND COLUMN_NAME = 'controls')
BEGIN
    ALTER TABLE dbo.risks ADD controls NVARCHAR(MAX);
    PRINT 'Added controls column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = 'risks' AND COLUMN_NAME = 'overall_risk')
BEGIN
    ALTER TABLE dbo.risks ADD overall_risk NVARCHAR(50);
    PRINT 'Added overall_risk column';
END

-- Update existing records to calculate overall_risk based on frequency and severity
-- Using the same risk matrix as in the backend
UPDATE dbo.risks
SET overall_risk = CASE
    -- Low Frequency
    WHEN frequency = 'Low' AND severity = 'Low' THEN 'Low'
    WHEN frequency = 'Low' AND severity = 'Medium' THEN 'Low'
    WHEN frequency = 'Low' AND severity = 'High' THEN 'Medium'
    -- Medium Frequency
    WHEN frequency = 'Medium' AND severity = 'Low' THEN 'Low'
    WHEN frequency = 'Medium' AND severity = 'Medium' THEN 'Medium'
    WHEN frequency = 'Medium' AND severity = 'High' THEN 'High'
    -- High Frequency
    WHEN frequency = 'High' AND severity = 'Low' THEN 'Medium'
    WHEN frequency = 'High' AND severity = 'Medium' THEN 'High'
    WHEN frequency = 'High' AND severity = 'High' THEN 'High'
    -- Default
    ELSE 'Low'
END
WHERE overall_risk IS NULL OR overall_risk = '';

PRINT 'Migration completed successfully';
PRINT 'Updated overall_risk for existing records';
