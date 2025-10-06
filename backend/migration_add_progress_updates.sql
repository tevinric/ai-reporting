-- Migration script to add progress_updates table
-- This table stores progress updates/comments for initiatives

-- Create progress_updates table
IF OBJECT_ID('dbo.progress_updates', 'U') IS NOT NULL DROP TABLE dbo.progress_updates;
GO

CREATE TABLE dbo.progress_updates (
    id INT IDENTITY(1,1) PRIMARY KEY,
    initiative_id INT NOT NULL,
    update_type NVARCHAR(50) NOT NULL, -- 'Update', 'Road block', 'Threat', 'Requirement'
    update_title NVARCHAR(500) NOT NULL,
    update_details NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    created_by_name NVARCHAR(255),
    created_by_email NVARCHAR(255),
    modified_at DATETIME DEFAULT GETDATE(),
    modified_by_name NVARCHAR(255),
    modified_by_email NVARCHAR(255),
    FOREIGN KEY (initiative_id) REFERENCES dbo.initiatives(id) ON DELETE CASCADE
);
GO

-- Create index for better performance
CREATE INDEX IX_progress_updates_initiative ON dbo.progress_updates(initiative_id, created_at DESC);
GO

-- Insert update type options into field_options
INSERT INTO dbo.field_options (field_name, option_value, display_order) VALUES
('update_type', 'Update', 1),
('update_type', 'Road block', 2),
('update_type', 'Threat', 3),
('update_type', 'Requirement', 4);
GO
