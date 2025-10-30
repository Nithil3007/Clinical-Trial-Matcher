import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import PatientDataTable from './components/PatientDataTable';
import TrialsTable from './components/TrialsTable';
import SavedTrialsSidebar from './components/SavedTrialsSidebar';
import { uploadTranscript, ClinicalNotesResponse, getSavedTrials } from '../lib/api-service';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ClinicalNotesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [savedTrialsCount, setSavedTrialsCount] = useState(0);

  useEffect(() => {
    // Fetch saved trials count on mount and when refreshTrigger changes
    const fetchSavedTrialsCount = async () => {
      try {
        console.log('Fetching saved trials count, refreshTrigger:', refreshTrigger);
        const savedTrialsData = await getSavedTrials();
        console.log('Saved trials data:', savedTrialsData);
        console.log('Saved trials count:', savedTrialsData.trials.length);
        setSavedTrialsCount(savedTrialsData.trials.length);
      } catch (error) {
        console.error('Error fetching saved trials count:', error);
        setSavedTrialsCount(0);
      }
    };

    fetchSavedTrialsCount();
  }, [refreshTrigger]);

  useEffect(() => {
    console.log('savedTrialsCount updated to:', savedTrialsCount);
  }, [savedTrialsCount]);

  const handleFileUpload = async (content: string) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await uploadTranscript(content);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSidebar = () => {
    if (savedTrialsCount > 0) {
      setSidebarOpen(true);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '32px', position: 'relative' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
            Clinical Trial Matcher
          </h1>
          <p style={{ fontSize: '16px', color: '#666' }}>
            Upload a patient/clinician transcript to find relevant clinical trials
          </p>
          <button
            onClick={handleOpenSidebar}
            disabled={savedTrialsCount === 0}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              padding: '10px 20px',
              backgroundColor: savedTrialsCount === 0 ? '#cccccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: savedTrialsCount === 0 ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              opacity: savedTrialsCount === 0 ? 0.5 : 1,
            }}
          >
            📋 Saved Trials ({savedTrialsCount})
          </button>
        </header>

        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />

          {error && (
            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#ffebee', borderRadius: '4px', color: '#c62828' }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {response && (
            <div>
              <PatientDataTable data={response.patient_data} />
              <TrialsTable 
                trials={response.trials} 
                clinicalNotesId={response.clinical_notes_id}
                onTrialSaved={() => {
                  console.log('Trial saved callback triggered');
                  setRefreshTrigger(prev => {
                    console.log('Updating refreshTrigger from', prev, 'to', prev + 1);
                    return prev + 1;
                  });
                }}
              />
            </div>
          )}
        </div>
      </div>
      
      <SavedTrialsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
