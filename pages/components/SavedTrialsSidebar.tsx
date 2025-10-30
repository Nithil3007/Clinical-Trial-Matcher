import React, { useState, useEffect } from 'react';
import { TrialDetails, getSavedTrials } from '../lib/api-service';

interface SavedTrialsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  refreshTrigger: number;
}

export default function SavedTrialsSidebar({ isOpen, onClose, refreshTrigger }: SavedTrialsSidebarProps) {
  const [savedTrials, setSavedTrials] = useState<TrialDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState<TrialDetails | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSavedTrials();
    }
  }, [isOpen, refreshTrigger]);

  const loadSavedTrials = async () => {
    setLoading(true);
    try {
      const response = await getSavedTrials();
      setSavedTrials(response.trials);
    } catch (error) {
      console.error('Error loading saved trials:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
        }}
      />
      
      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: selectedTrial ? '600px' : '400px',
          backgroundColor: 'white',
          boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s ease',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
            {selectedTrial ? 'Trial Details' : `Saved Trials (${savedTrials.length})`}
          </h2>
          <button
            onClick={() => {
              if (selectedTrial) {
                setSelectedTrial(null);
              } else {
                onClose();
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {selectedTrial ? '← Back' : '✕ Close'}
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {loading ? (
            <p>Loading saved trials...</p>
          ) : selectedTrial ? (
            /* Trial Details View */
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>NCT ID</td>
                    <td style={{ padding: '8px' }}>{selectedTrial.nct_id}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>Title</td>
                    <td style={{ padding: '8px' }}>{selectedTrial.title}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>Acronym</td>
                    <td style={{ padding: '8px' }}>{selectedTrial.acronym}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>Status</td>
                    <td style={{ padding: '8px' }}>{selectedTrial.status}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>Conditions</td>
                    <td style={{ padding: '8px' }}>{selectedTrial.conditions}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>Interventions</td>
                    <td style={{ padding: '8px' }}>{selectedTrial.interventions}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>Sponsor</td>
                    <td style={{ padding: '8px' }}>{selectedTrial.sponsor}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>Study Type</td>
                    <td style={{ padding: '8px' }}>{selectedTrial.study_type}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>Phases</td>
                    <td style={{ padding: '8px' }}>{selectedTrial.phases}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>Age</td>
                    <td style={{ padding: '8px' }}>{selectedTrial.age}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>Sex</td>
                    <td style={{ padding: '8px' }}>{selectedTrial.sex}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>Locations</td>
                    <td style={{ padding: '8px' }}>{selectedTrial.locations}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>Primary Completion Date</td>
                    <td style={{ padding: '8px' }}>{selectedTrial.primary_completion_date}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>Study First Post Date</td>
                    <td style={{ padding: '8px' }}>{selectedTrial.study_first_post_date}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>Last Update Post Date</td>
                    <td style={{ padding: '8px' }}>{selectedTrial.last_update_post_date}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>Eligibility Criteria</td>
                    <td style={{ padding: '8px', whiteSpace: 'pre-wrap' }}>{selectedTrial.eligibility_criteria}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : savedTrials.length === 0 ? (
            /* Empty State */
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>📋</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>No saved trials yet</p>
              <p style={{ fontSize: '14px' }}>Click the 💾 Save button on any trial to save it here</p>
            </div>
          ) : (
            /* Trials List */
            <div style={{ display: 'grid', gap: '12px' }}>
              {savedTrials.map((trial) => (
                <div
                  key={trial.nct_id}
                  onClick={() => setSelectedTrial(trial)}
                  style={{
                    padding: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: '#f9f9f9',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e3f2fd';
                    e.currentTarget.style.borderColor = '#2196F3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9f9f9';
                    e.currentTarget.style.borderColor = '#ddd';
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#2196F3', marginBottom: '8px' }}>
                    {trial.nct_id}
                  </div>
                  <div style={{ fontSize: '14px', color: '#333', marginBottom: '8px', fontWeight: '500' }}>
                    {trial.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    <strong>Conditions:</strong> {trial.conditions}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    <strong>Status:</strong> {trial.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
