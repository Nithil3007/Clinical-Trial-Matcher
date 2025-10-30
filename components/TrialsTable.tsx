import React, { useState, useEffect } from 'react';
import { TrialData, TrialDetails, TrialRanking, getTrialDetails, getTrialRanking, askAI, saveTrial, removeSavedTrial, getSavedTrials } from '../lib/api-service';

interface TrialsTableProps {
  trials: TrialData[];
  clinicalNotesId: string;
  onTrialSaved?: () => void;
}

export default function TrialsTable({ trials, clinicalNotesId, onTrialSaved }: TrialsTableProps) {
  const [expandedTrial, setExpandedTrial] = useState<string | null>(null);
  const [trialDetails, setTrialDetails] = useState<{ [key: string]: TrialDetails }>({});
  const [loadingDetails, setLoadingDetails] = useState<{ [key: string]: boolean }>({});
  const [rankedTrials, setRankedTrials] = useState<TrialRanking[] | null>(null);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [showRanked, setShowRanked] = useState(false);
  const [aiQuery, setAiQuery] = useState<{ [key: string]: string }>({});
  const [aiAnswer, setAiAnswer] = useState<{ [key: string]: string }>({});
  const [loadingAI, setLoadingAI] = useState<{ [key: string]: boolean }>({});
  const [savingTrial, setSavingTrial] = useState<{ [key: string]: boolean }>({});
  const [savedTrialIds, setSavedTrialIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load saved trial IDs on mount
    loadSavedTrialIds();
  }, []);

  // Filter trials based on search query
  const filteredTrials = trials.filter(trial => 
    trial.nct_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRankedTrials = rankedTrials?.filter(trial =>
    trial.nct_id.toLowerCase().includes(searchQuery.toLowerCase())
  ) || null;

  const loadSavedTrialIds = async () => {
    try {
      const response = await getSavedTrials();
      const ids = new Set(response.trials.map(trial => trial.nct_id));
      setSavedTrialIds(ids);
    } catch (error) {
      console.error('Error loading saved trial IDs:', error);
    }
  };

  const handleViewDetails = async (nctId: string) => {
    if (expandedTrial === nctId) {
      setExpandedTrial(null);
      return;
    }

    setExpandedTrial(nctId);

    if (!trialDetails[nctId]) {
      setLoadingDetails({ ...loadingDetails, [nctId]: true });
      try {
        const details = await getTrialDetails(nctId);
        setTrialDetails({ ...trialDetails, [nctId]: details });
      } catch (error) {
        console.error('Error fetching trial details:', error);
        alert('Failed to load trial details');
      } finally {
        setLoadingDetails({ ...loadingDetails, [nctId]: false });
      }
    }
  };

  const handleAIRanking = async () => {
    if (showRanked) {
      setShowRanked(false);
      return;
    }

    if (rankedTrials) {
      setShowRanked(true);
      return;
    }

    setLoadingRanking(true);
    try {
      const response = await getTrialRanking(clinicalNotesId);
      setRankedTrials(response.trials);
      setShowRanked(true);
    } catch (error) {
      console.error('Error fetching AI ranking:', error);
      alert('Failed to load AI ranking');
    } finally {
      setLoadingRanking(false);
    }
  };

  const handleAskAI = async (nctId: string) => {
    const query = aiQuery[nctId];
    if (!query || !query.trim()) {
      alert('Please enter a question');
      return;
    }

    setLoadingAI({ ...loadingAI, [nctId]: true });
    try {
      const response = await askAI(clinicalNotesId, nctId, query);
      setAiAnswer({ ...aiAnswer, [nctId]: response.answer });
    } catch (error) {
      console.error('Error asking AI:', error);
      alert('Failed to get AI response');
    } finally {
      setLoadingAI({ ...loadingAI, [nctId]: false });
    }
  };

  const handleSaveTrial = async (nctId: string) => {
    const isSaved = savedTrialIds.has(nctId);
    
    setSavingTrial(prev => ({ ...prev, [nctId]: true }));
    try {
      if (isSaved) {
        // Remove from saved
        await removeSavedTrial(nctId);
        setSavedTrialIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(nctId);
          return newSet;
        });
        alert(`Trial ${nctId} has been removed from saved trials!`);
      } else {
        // Save trial
        await saveTrial(nctId);
        setSavedTrialIds(prev => new Set(prev).add(nctId));
        alert(`Trial ${nctId} has been saved successfully!`);
      }
      
      if (onTrialSaved) {
        onTrialSaved();
      }
    } catch (error) {
      console.error('Error saving/removing trial:', error);
      alert(`Failed to ${isSaved ? 'remove' : 'save'} trial`);
    } finally {
      setSavingTrial(prev => ({ ...prev, [nctId]: false }));
    }
  };

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
          Relevant Clinical Trials ({showRanked ? (filteredRankedTrials?.length || 0) : filteredTrials.length})
        </h2>
        <button
          onClick={handleAIRanking}
          disabled={loadingRanking}
          style={{
            padding: '10px 20px',
            backgroundColor: showRanked ? '#FF9800' : '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loadingRanking ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {loadingRanking ? 'Loading...' : showRanked ? 'Show All Trials' : '🤖 AI Ranking'}
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="🔍 Search trials by NCT ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box',
          }}
        />
        {searchQuery && (
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
            Found {showRanked ? (filteredRankedTrials?.length || 0) : filteredTrials.length} trial(s)
            <button
              onClick={() => setSearchQuery('')}
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        {!showRanked ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
            <thead>
              <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>NCT ID</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Conditions</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Interventions</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrials.map((trial, index) => (
              <React.Fragment key={trial.nct_id}>
                <tr style={{ borderBottom: '1px solid #ddd', backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  <td style={{ padding: '12px' }}>{trial.nct_id}</td>
                  <td style={{ padding: '12px' }}>{trial.conditions}</td>
                  <td style={{ padding: '12px' }}>{trial.interventions}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleViewDetails(trial.nct_id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: expandedTrial === trial.nct_id ? '#f44336' : '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        {expandedTrial === trial.nct_id ? 'Hide Details' : 'View Details'}
                      </button>
                      <button
                        onClick={() => handleSaveTrial(trial.nct_id)}
                        disabled={savingTrial[trial.nct_id]}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: savedTrialIds.has(trial.nct_id) ? '#f44336' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: savingTrial[trial.nct_id] ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        {savingTrial[trial.nct_id] 
                          ? (savedTrialIds.has(trial.nct_id) ? 'Removing...' : 'Saving...') 
                          : (savedTrialIds.has(trial.nct_id) ? '🗑️ Remove' : '💾 Save')}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedTrial === trial.nct_id && (
                  <tr>
                    <td colSpan={4} style={{ padding: '16px', backgroundColor: '#f0f8ff' }}>
                      {loadingDetails[trial.nct_id] ? (
                        <p>Loading details...</p>
                      ) : trialDetails[trial.nct_id] ? (
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
                            Trial Details
                          </h3>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                              <tr style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold', width: '25%' }}>NCT ID</td>
                                <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].nct_id}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>Acronym</td>
                                <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].acronym}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>Title</td>
                                <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].title}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>Primary Completion Date</td>
                                <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].primary_completion_date}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>Study First Post Date</td>
                                <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].study_first_post_date}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>Last Update Post Date</td>
                                <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].last_update_post_date}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>Study Type</td>
                                <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].study_type}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>Status</td>
                                <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].status}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>Sponsor</td>
                                <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].sponsor}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>Conditions</td>
                                <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].conditions}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>Interventions</td>
                                <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].interventions}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>Locations</td>
                                <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].locations}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>Age</td>
                                <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].age}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>Sex</td>
                                <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].sex}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>Phases</td>
                                <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].phases}</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>
                                  Eligibility Criteria
                                </td>
                                <td style={{ padding: '8px', whiteSpace: 'pre-wrap' }}>
                                  {trialDetails[trial.nct_id].eligibility_criteria}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          
                          {/* Ask AI Section */}
                          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#9C27B0' }}>
                              🤖 Ask AI about this trial
                            </h4>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                              <input
                                type="text"
                                placeholder="Ask a question about this trial..."
                                value={aiQuery[trial.nct_id] || ''}
                                onChange={(e) => setAiQuery({ ...aiQuery, [trial.nct_id]: e.target.value })}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAskAI(trial.nct_id);
                                  }
                                }}
                                style={{
                                  flex: 1,
                                  padding: '10px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                }}
                              />
                              <button
                                onClick={() => handleAskAI(trial.nct_id)}
                                disabled={loadingAI[trial.nct_id]}
                                style={{
                                  padding: '10px 20px',
                                  backgroundColor: '#9C27B0',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: loadingAI[trial.nct_id] ? 'not-allowed' : 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                }}
                              >
                                {loadingAI[trial.nct_id] ? 'Asking...' : 'Ask'}
                              </button>
                            </div>
                            {aiAnswer[trial.nct_id] && (
                              <div style={{ 
                                padding: '12px', 
                                backgroundColor: 'white', 
                                borderRadius: '4px',
                                border: '1px solid #9C27B0',
                                marginTop: '8px'
                              }}>
                                <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#9C27B0' }}>AI Answer:</p>
                                <p style={{ margin: 0, lineHeight: '1.6' }}>{aiAnswer[trial.nct_id]}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p>Failed to load details</p>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
            <thead>
              <tr style={{ backgroundColor: '#9C27B0', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Rank</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>NCT ID</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Explanation</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Score</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRankedTrials && filteredRankedTrials.map((trial, index) => (
                <React.Fragment key={trial.nct_id}>
                  <tr style={{ borderBottom: '1px solid #ddd', backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>#{index + 1}</td>
                    <td style={{ padding: '12px' }}>{trial.nct_id}</td>
                    <td style={{ padding: '12px' }}>{trial.explanation}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: trial.relevance_score >= 8 ? '#4CAF50' : trial.relevance_score >= 7 ? '#FF9800' : '#FFC107',
                        color: 'white',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}>
                        {trial.relevance_score}/10
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleViewDetails(trial.nct_id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: expandedTrial === trial.nct_id ? '#f44336' : '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          {expandedTrial === trial.nct_id ? 'Hide Details' : 'View Details'}
                        </button>
                        <button
                          onClick={() => handleSaveTrial(trial.nct_id)}
                          disabled={savingTrial[trial.nct_id]}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: savedTrialIds.has(trial.nct_id) ? '#f44336' : '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: savingTrial[trial.nct_id] ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          {savingTrial[trial.nct_id] 
                            ? (savedTrialIds.has(trial.nct_id) ? 'Removing...' : 'Saving...') 
                            : (savedTrialIds.has(trial.nct_id) ? '🗑️ Remove' : '💾 Save')}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedTrial === trial.nct_id && (
                    <tr>
                      <td colSpan={5} style={{ padding: '16px', backgroundColor: '#f0f8ff' }}>
                        {loadingDetails[trial.nct_id] ? (
                          <p>Loading details...</p>
                        ) : trialDetails[trial.nct_id] ? (
                          <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
                              Trial Details
                            </h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <tbody>
                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                  <td style={{ padding: '8px', fontWeight: 'bold', width: '25%' }}>NCT ID</td>
                                  <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].nct_id}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Acronym</td>
                                  <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].acronym}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Title</td>
                                  <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].title}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Primary Completion Date</td>
                                  <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].primary_completion_date}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Study First Post Date</td>
                                  <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].study_first_post_date}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Last Update Post Date</td>
                                  <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].last_update_post_date}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Study Type</td>
                                  <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].study_type}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Status</td>
                                  <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].status}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Sponsor</td>
                                  <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].sponsor}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Conditions</td>
                                  <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].conditions}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Interventions</td>
                                  <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].interventions}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Locations</td>
                                  <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].locations}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Age</td>
                                  <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].age}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Sex</td>
                                  <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].sex}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Phases</td>
                                  <td style={{ padding: '8px' }}>{trialDetails[trial.nct_id].phases}</td>
                                </tr>
                                <tr>
                                  <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>
                                    Eligibility Criteria
                                  </td>
                                  <td style={{ padding: '8px', whiteSpace: 'pre-wrap' }}>
                                    {trialDetails[trial.nct_id].eligibility_criteria}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            
                            {/* Ask AI Section */}
                            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                              <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#9C27B0' }}>
                                🤖 Ask AI about this trial
                              </h4>
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <input
                                  type="text"
                                  placeholder="Ask a question about this trial..."
                                  value={aiQuery[trial.nct_id] || ''}
                                  onChange={(e) => setAiQuery({ ...aiQuery, [trial.nct_id]: e.target.value })}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAskAI(trial.nct_id);
                                    }
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                  }}
                                />
                                <button
                                  onClick={() => handleAskAI(trial.nct_id)}
                                  disabled={loadingAI[trial.nct_id]}
                                  style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#9C27B0',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: loadingAI[trial.nct_id] ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  {loadingAI[trial.nct_id] ? 'Asking...' : 'Ask'}
                                </button>
                              </div>
                              {aiAnswer[trial.nct_id] && (
                                <div style={{ 
                                  padding: '12px', 
                                  backgroundColor: 'white', 
                                  borderRadius: '4px',
                                  border: '1px solid #9C27B0',
                                  marginTop: '8px'
                                }}>
                                  <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#9C27B0' }}>AI Answer:</p>
                                  <p style={{ margin: 0, lineHeight: '1.6' }}>{aiAnswer[trial.nct_id]}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p>Failed to load details</p>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
