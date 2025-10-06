-- AI Reporting Application - DROP ALL TABLES Script
-- This script drops all tables in the correct order to handle foreign key dependencies
-- Run this script before running sql_init_ai_reporting.sql to recreate the database from scratch

USE AIReporting;
GO

-- Drop tables in reverse order of dependencies
IF OBJECT_ID('dbo.risks', 'U') IS NOT NULL DROP TABLE dbo.risks;
IF OBJECT_ID('dbo.monthly_metrics', 'U') IS NOT NULL DROP TABLE dbo.monthly_metrics;
IF OBJECT_ID('dbo.initiative_departments', 'U') IS NOT NULL DROP TABLE dbo.initiative_departments;
IF OBJECT_ID('dbo.initiatives', 'U') IS NOT NULL DROP TABLE dbo.initiatives;
IF OBJECT_ID('dbo.custom_metrics', 'U') IS NOT NULL DROP TABLE dbo.custom_metrics;
IF OBJECT_ID('dbo.field_options', 'U') IS NOT NULL DROP TABLE dbo.field_options;
GO

PRINT 'All tables have been dropped successfully.';
PRINT 'You can now run sql_init_ai_reporting.sql to recreate the database schema.';
