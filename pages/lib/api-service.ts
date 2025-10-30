// api service for backend 
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8007';

export interface PatientData {
  patient_name: string;
  patient_dob: string;
  patient_gender: string;
  chief_complaint: string;
  conditions: string[];
  current_medications: string[];
  allergies: string[];
  past_medical_history: string[];
  family_history: string[];
  social_history: string[];
  test_results: string[];
  contradictions: string[];
  proposed_plan: string;
  interventions: string[];
  concerns: string;
}

export interface TrialData {
  nct_id: string;
  conditions: string;
  interventions: string;
}

export interface ClinicalNotesResponse {
  clinical_notes_id: string;
  patient_data: PatientData;
  trials: TrialData[];
  created_at: string;
  total_trials_found: number;
}

export interface TrialDetails {
  nct_id: string;
  acronym: string;
  title: string;
  primary_completion_date: string;
  study_first_post_date: string;
  last_update_post_date: string;
  study_type: string;
  status: string;
  sponsor: string;
  conditions: string;
  interventions: string;
  locations: string;
  age: string;
  sex: string;
  phases: string;
  eligibility_criteria: string;
}

export interface TrialRanking {
  nct_id: string;
  explanation: string;
  relevance_score: number;
}

export interface TrialRankingResponse {
  trials: TrialRanking[];
}

// Upload transcript and get clinical notes + trials
export async function uploadTranscript(transcript: string): Promise<ClinicalNotesResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/transcripts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transcript }),
  });

  if (!response.ok) {
    throw new Error(`Failed to upload transcript: ${response.statusText}`);
  }

  return response.json();
}

// Get trial details by NCT ID
export async function getTrialDetails(nctId: string): Promise<TrialDetails> {
  const response = await fetch(`${API_BASE_URL}/api/v1/trials/${nctId}`);

  if (!response.ok) {
    throw new Error(`Failed to get trial details: ${response.statusText}`);
  }

  return response.json();
}

// Get AI-ranked trials for a clinical note
export async function getTrialRanking(clinicalNotesId: string): Promise<TrialRankingResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/transcripts/${clinicalNotesId}/trials/ranking`);

  if (!response.ok) {
    throw new Error(`Failed to get trial ranking: ${response.statusText}`);
  }

  return response.json();
}

export interface AskAIResponse {
  nct_id: string;
  query: string;
  answer: string;
}

// Ask AI about a specific trial
export async function askAI(clinicalNotesId: string, nctId: string, query: string): Promise<AskAIResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/trials/ask_ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clinical_notes_id: clinicalNotesId,
      nct_id: nctId,
      query: query,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to ask AI: ${response.statusText}`);
  }

  return response.json();
}

export interface SaveTrialResponse {
  message: string;
  nct_id: string;
}

// Save a trial
export async function saveTrial(nctId: string): Promise<SaveTrialResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/trials/${nctId}/save`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to save trial: ${response.statusText}`);
  }

  return response.json();
}

export interface SavedTrialsResponse {
  trials: TrialDetails[];
}

// Get all saved trials
export async function getSavedTrials(): Promise<SavedTrialsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/trials/saved`);

  if (!response.ok) {
    throw new Error(`Failed to get saved trials: ${response.statusText}`);
  }

  return response.json();
}

// Remove a saved trial
export async function removeSavedTrial(nctId: string): Promise<SaveTrialResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/trials/${nctId}/save`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to remove saved trial: ${response.statusText}`);
  }

  return response.json();
}

// Check if a trial is saved
export async function isTrialSaved(nctId: string): Promise<boolean> {
  try {
    const response = await getSavedTrials();
    return response.trials.some(trial => trial.nct_id === nctId);
  } catch (error) {
    console.error('Error checking if trial is saved:', error);
    return false;
  }
}
