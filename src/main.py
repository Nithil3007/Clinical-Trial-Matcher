#imports
import os
import json
import logging
import uuid
import uvicorn
import re
from datetime import datetime
from openai import OpenAI
from utils import read_text_file
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from llm_service import extract_patient_data, rank_trials, ask_ai
from trial_service import get_params, relevant_trials, trials_long
from storage import save_data, load_data, delete_data, list_keys, get_storage_info

# Configure logging (container-friendly - no file logging)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

#loading environment variables
load_dotenv()

#initialize fastapi app
app = FastAPI(title = "Clinical Notes and Trials", version = "1.0.0")
logger.info("FastAPI app initialized")

#CORS configuration
cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:8007').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
logger.info(f"CORS middleware configured with origins: {cors_origins}")

#pydantic models for api responses
class PatientData(BaseModel):
    patient_name: str
    patient_dob: str
    patient_gender: str
    chief_complaint: str
    conditions: List[str]
    current_medications: List[str]
    allergies: List[str]
    past_medical_history: List[str]
    family_history: List[str]
    social_history: List[str]
    test_results: List[str]
    contradictions: List[str]
    proposed_plan: str
    interventions: List[str]
    concerns: str

class TrialData(BaseModel):
    nct_id: str
    conditions: str
    interventions: str

class TrialDataList(BaseModel):
    trials: List[TrialData]

class TrialDataLong(BaseModel):
    nct_id: str
    acronym: str
    title: str
    primary_completion_date: str
    study_first_post_date: str
    last_update_post_date: str
    study_type: str
    status: str
    sponsor: str
    conditions: str
    interventions: str
    locations: str
    age: str
    sex: str
    phases: str
    eligibility_criteria: str
    
class TranscriptUploadRequest(BaseModel):
    transcript: str

class ClinicalNotesResponse(BaseModel):
    clinical_notes_id: str
    patient_data: PatientData
    trials: List[Dict]
    created_at: str
    total_trials_found: int

class TrialRanking(BaseModel):
    nct_id: str
    explanation: str
    relevance_score: int

class TrialRankingList(BaseModel):
    trials: List[TrialRanking]


class AskAIRequest(BaseModel):
    clinical_notes_id: str
    nct_id: str
    query: str

#initialize llm and api clients
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
model = "gpt-4o"
clinical_notes_prompt = read_text_file("prompts/new_prompt.txt")
ranking_prompt = read_text_file("prompts/ranking_prompt.txt")
ask_ai_prompt = read_text_file("prompts/ask_ai_prompt.txt")

#transcript = input from user
temperature = 0.2
max_tokens = 10000
base_url = "https://clinicaltrials.gov/api/v2/studies"

#async api endpoints

# Healthcheck endpoint
@app.get("/")
async def healthcheck():
    return {"status": "ok"}

# POST endpoint to upload transcript and get clinical notes + trials
@app.post("/api/v1/transcripts", status_code=201)
async def upload_transcript(request: TranscriptUploadRequest) -> ClinicalNotesResponse:
    try:
        # Generate unique ID for this clinical note
        clinical_notes_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        logger.info(f"Processing transcript {clinical_notes_id}")
        
        # Step 1: Extract patient data from transcript using LLM
        llm_output = extract_patient_data(
            client, model, clinical_notes_prompt, request.transcript, temperature, max_tokens
        )
        logger.info(f"LLM extraction completed for {clinical_notes_id}")
        
        # Parse LLM output
        llm_output = re.sub(r'^```json|```$', '', llm_output)
        patient_data_dict = json.loads(llm_output)
        logger.info(f"Parsed LLM output for {clinical_notes_id}")
        
        patient_data = PatientData(**patient_data_dict)
        
        # Step 2: Get relevant trials based on extracted patient data
        params = get_params(llm_output)
        trials_list = relevant_trials(base_url, params)
        logger.info(f"Found {len(trials_list)} trials for {clinical_notes_id}")
        
        # Step 3: Store results for later retrieval
        save_data(f'notes/{clinical_notes_id}.json', {
            "patient_data": patient_data.dict(),
            "trials": trials_list,
            "created_at": timestamp,
            "llm_output": llm_output
        })
        
        logger.info(f"Clinical notes {clinical_notes_id} stored successfully")
        
        return ClinicalNotesResponse(
            clinical_notes_id=clinical_notes_id,
            patient_data=patient_data,
            trials=trials_list,
            created_at=timestamp,
            total_trials_found=len(trials_list)
        )
    
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid LLM response format")
    except Exception as e:
        logger.error(f"Error processing transcript: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing transcript: {str(e)}")

# GET endpoint to retrieve stored clinical notes
@app.get("/api/v1/transcripts/{clinical_notes_id}")
async def get_clinical_notes(clinical_notes_id: str) -> ClinicalNotesResponse:
    note = load_data(f'notes/{clinical_notes_id}.json')
    if not note:
        logger.warning(f"Clinical notes {clinical_notes_id} not found")
        raise HTTPException(status_code=404, detail="Clinical notes not found")
    
    return ClinicalNotesResponse(
        clinical_notes_id=clinical_notes_id,
        patient_data=PatientData(**note["patient_data"]),
        trials=note["trials"],
        created_at=note["created_at"],
        total_trials_found=len(note["trials"])
    )

# GET endpoint to retrieve trials for a specific clinical note
@app.get("/api/v1/transcripts/{clinical_notes_id}/trials")
async def get_trials_for_notes(clinical_notes_id: str) -> TrialDataList:
    note = load_data(f'notes/{clinical_notes_id}.json')
    if not note:
        logger.warning(f"Trials for clinical notes {clinical_notes_id} not found")
        raise HTTPException(status_code=404, detail="Trials not found for this clinical note")
    
    trials = note["trials"]
    logger.info(f"Trials: {trials}")
    return TrialDataList(trials=trials)

# GET endpoint to retrieve trial ranking for a specific clinical note
@app.get("/api/v1/transcripts/{clinical_notes_id}/trials/ranking")
async def get_trial_ranking(clinical_notes_id: str) -> TrialRankingList:
    note = load_data(f'notes/{clinical_notes_id}.json')
    if not note:
        logger.warning(f"Clinical notes {clinical_notes_id} not found")
        raise HTTPException(status_code=404, detail="Clinical notes not found")
    
    try:
        # Get trials and LLM output
        trials_list = note["trials"]
        llm_output = note["llm_output"]
        
        logger.info(f"Ranking {len(trials_list)} trials for {clinical_notes_id}")
        
        # Call AI ranking function
        ranking_json = rank_trials(
            client, model, ranking_prompt, trials_list, llm_output, temperature, max_tokens
        )
        
        logger.info(f"AI ranking response: {ranking_json}")
        
        # Parse JSON response - clean markdown code blocks if present
        cleaned_json = ranking_json.strip()
        if cleaned_json.startswith('```'):
            # Remove markdown code blocks
            cleaned_json = re.sub(r'^```(?:json)?\s*\n?', '', cleaned_json)
            cleaned_json = re.sub(r'\n?```\s*$', '', cleaned_json)
        
        logger.info(f"Cleaned JSON: {cleaned_json}")
        ranking_data = json.loads(cleaned_json)
        
        # Convert to list of TrialRanking objects
        ranked_trials = []
        for nct_id, data in ranking_data.items():
            ranked_trials.append({
                "nct_id": nct_id,
                "explanation": data[0] if isinstance(data, list) and len(data) > 0 else "No explanation",
                "relevance_score": int(data[1]) if isinstance(data, list) and len(data) > 1 else 0
            })
        
        logger.info(f"Ranked {len(ranked_trials)} trials")
        return TrialRankingList(trials=ranked_trials)
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI ranking response: {e}")
        logger.error(f"Raw response was: {ranking_json[:500]}")
        raise HTTPException(status_code=500, detail=f"Failed to parse AI ranking response: {str(e)}")
    except KeyError as e:
        logger.error(f"Missing key in ranking data: {e}")
        raise HTTPException(status_code=500, detail=f"Missing key in ranking data: {str(e)}")
    except Exception as e:
        logger.error(f"Error ranking trials: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=f"Error ranking trials: {str(e)}")

# GET endpoint to retrieve all saved trials (MUST be before {nct_id} route)
@app.get("/api/v1/trials/saved")
async def get_saved_trials() -> Dict[str, List[Dict]]:
    trial_keys = list_keys('saved-trials/')
    trials_list = []
    for key in trial_keys:
        trial_data = load_data(key)
        if trial_data:
            trials_list.append(trial_data)
    
    logger.info(f"Returning {len(trials_list)} saved trials")
    return {
        "trials": trials_list
    }

# POST endpoint to save a trial
@app.post("/api/v1/trials/{nct_id}/save")
async def save_trial(nct_id: str) -> Dict[str, str]:
    try:
        # Get trial details
        trial = trials_long(base_url, nct_id)
        
        # Save to storage
        save_data(f'saved-trials/{nct_id}.json', trial)
        
        logger.info(f"Saved trial {nct_id}")
        
        return {
            "message": "Trial saved successfully",
            "nct_id": nct_id
        }
    except Exception as e:
        logger.error(f"Error saving trial {nct_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving trial: {str(e)}")

# DELETE endpoint to remove a saved trial
@app.delete("/api/v1/trials/{nct_id}/save")
async def remove_saved_trial(nct_id: str) -> Dict[str, str]:
    trial_data = load_data(f'saved-trials/{nct_id}.json')
    if not trial_data:
        logger.warning(f"Trial {nct_id} not found in saved trials")
        raise HTTPException(status_code=404, detail="Trial not found in saved trials")
    
    delete_data(f'saved-trials/{nct_id}.json')
    logger.info(f"Removed trial {nct_id} from saved trials")
    
    return {
        "message": "Trial removed successfully",
        "nct_id": nct_id
    }

# GET endpoint to retrieve trial details by NCT ID (MUST be after /saved route)
@app.get("/api/v1/trials/{nct_id}")
async def get_trial_details(nct_id: str) -> TrialDataLong:
    try:
        trial = trials_long(base_url, nct_id)
        logger.info(f"url for {nct_id} = {base_url}/{nct_id}")
        logger.info(f"Retrieved trial details for {nct_id}")
        logger.info(f"Trial details: {trial}")
        return trial
    except Exception as e:
        logger.error(f"Error retrieving trial {nct_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving trial details: {str(e)}")

# POST endpoint to ask AI about a specific trial
@app.post("/api/v1/trials/ask_ai")
async def ask_ai_about_trial(request: AskAIRequest) -> Dict[str, str]:
    try:
        # Validate that clinical notes exist
        note = load_data(f'notes/{request.clinical_notes_id}.json')
        if not note:
            raise HTTPException(status_code=404, detail="Clinical notes not found")
        
        # Get trial details
        trial_details = trials_long(base_url, request.nct_id)
        
        # Get patient summary
        llm_output = note["llm_output"]
        
        # Convert trial details to JSON string for context
        trial_input = json.dumps(trial_details, indent=2)
        
        logger.info(f"Asking AI about trial {request.nct_id}: {request.query}")
        
        # Call AI to answer the question
        answer = ask_ai(
            client, model, ask_ai_prompt, request.query, 
            llm_output, trial_input, temperature, max_tokens
        )
        
        logger.info(f"AI response: {answer}")
        
        return {
            "nct_id": request.nct_id,
            "query": request.query,
            "answer": answer
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in ask_ai: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")

#main function to run app
if __name__ == "__main__":
    logger.info("Starting ElevenLabs API Server on host=0.0.0.0, port=8007")
    uvicorn.run(app, host="0.0.0.0", port=8007)

