import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, FileText } from 'lucide-react';

function ProgressTimeline({ updates }) {
  if (!updates || updates.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
        <p>No updates to display in timeline</p>
      </div>
    );
  }

  const getIconForType = (type) => {
    switch (type) {
      case 'Update':
        return <CheckCircle size={24} />;
      case 'Road block':
        return <AlertCircle size={24} />;
      case 'Threat':
        return <AlertTriangle size={24} />;
      case 'Requirement':
        return <FileText size={24} />;
      default:
        return <CheckCircle size={24} />;
    }
  };

  const getColorForType = (type) => {
    switch (type) {
      case 'Update':
        return '#10b981';
      case 'Road block':
        return '#f59e0b';
      case 'Threat':
        return '#ef4444';
      case 'Requirement':
        return '#3b82f6';
      default:
        return '#64748b';
    }
  };

  // Sort updates by date (oldest first for timeline)
  const sortedUpdates = [...updates].sort((a, b) =>
    new Date(a.created_at) - new Date(b.created_at)
  );

  return (
    <div style={{ padding: '20px 0' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: '#1f2937' }}>
        Initiative Evolution Timeline
      </h3>

      <div style={{ position: 'relative', paddingLeft: '40px' }}>
        {/* Timeline vertical line */}
        <div style={{
          position: 'absolute',
          left: '11px',
          top: '12px',
          bottom: '12px',
          width: '2px',
          backgroundColor: '#e5e7eb'
        }}></div>

        {sortedUpdates.map((update, index) => {
          const color = getColorForType(update.update_type);
          const isLast = index === sortedUpdates.length - 1;

          return (
            <div
              key={update.id}
              style={{
                position: 'relative',
                marginBottom: isLast ? '0' : '32px',
                paddingBottom: isLast ? '0' : '16px'
              }}
            >
              {/* Timeline node */}
              <div style={{
                position: 'absolute',
                left: '-40px',
                top: '0',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'white',
                border: `3px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color,
                zIndex: 2
              }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color }}></div>
              </div>

              {/* Content card */}
              <div style={{
                backgroundColor: '#f9fafb',
                borderLeft: `4px solid ${color}`,
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ color: color, flexShrink: 0, marginTop: '2px' }}>
                    {getIconForType(update.update_type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {update.update_title}
                      </h4>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: color,
                        backgroundColor: `${color}20`,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        marginLeft: '12px'
                      }}>
                        {update.update_type}
                      </span>
                    </div>

                    {update.update_details && (
                      <p style={{
                        fontSize: '14px',
                        color: '#64748b',
                        marginTop: '8px',
                        marginBottom: '8px',
                        lineHeight: '1.5'
                      }}>
                        {update.update_details}
                      </p>
                    )}

                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      fontSize: '12px',
                      color: '#94a3b8',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <div>
                        <span style={{ fontWeight: '600' }}>Created:</span> {new Date(update.created_at).toLocaleDateString()} at {new Date(update.created_at).toLocaleTimeString()}
                      </div>
                      <div>
                        <span style={{ fontWeight: '600' }}>By:</span> {update.created_by_name}
                      </div>
                      {update.modified_at !== update.created_at && (
                        <div>
                          <span style={{ fontWeight: '600' }}>Modified:</span> {new Date(update.modified_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#f1f5f9',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: getColorForType('Update') }}></div>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Update</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: getColorForType('Road block') }}></div>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Road block</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: getColorForType('Threat') }}></div>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Threat</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: getColorForType('Requirement') }}></div>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Requirement</span>
        </div>
      </div>
    </div>
  );
}

export default ProgressTimeline;
