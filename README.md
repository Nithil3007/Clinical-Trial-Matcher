# Clinical Trial Matcher
Use patient-clinician transcriptions to get relevant clinical trials

## Project structure
- **src (backend)**
  - llm_service.py (helper functions for llm clients)
  - trial_service.py (helper functions for clinical trial api requests)
  - storage.py (persistent object storage for cloud deployment. Not needed to run locally)
  - main.py (main backend file. Used Pydantic models and FastAPI endpoints)
- **pages (frontend)**
  - components (required UI components)
    - FileUpload.tsx 
    - PatientDataTable.tsx
    - SavedTrialsSidebar.tsx
    - TrialsTable.tsx
  - lib (api service)
    - api-service.ts (api service for backend)
  - app.tsx 
  - index.tsx (landing page)
- **prompts (prompts for LLM clients)**
  - ask_ai_prompt.txt
  - clinical_notes_prompt.txt
  - ranking_prompt.txt 
- **requirements.txt (required backend modules)**
- **packages.json (required frontend modules)**

## Approach
- Wrote the backend and then the frontend. Kept reviewing the **project and bonus requirements** along the way. Kept working side by side with the frontend and backend after a certain point. Revised the API design and the UI design mid-project to make sure the all the project requirements were met.
- Kept coming across errors. Logging them in the terminal eased debugging.
### Stack
- Backend: Python, FastAPI, OpenAI, Pydantic
- Frontend: React, TypeScript, TailwindCSS
### Backend
- Started with implementing the **text extraction** function and the **clinical notes** prompt.
- Extracted the conditions and treatment parameters from the transcript. The clinical trial API uses a semantic search method to retrieve the relevant trials. I had to figure out a way to extract the trials with the most relevance. Used AND and OR operators with **condition** and **intervention** queries to get the required URLs for the API. Completed the **get_params()** function. Spent more time coming up with the logic than writing the functions in the trial_service.py script. AI was helpful in extracting values from the trial json data.
- Used the **relevant_trials()** function to get the relevant trials, **trials_long()** function to get the detailed trial information. 
- Began working on the **main.py** backend code at this point. Wrote API endpoints for **patient data extraction**, getting **trials related** to patient data and getting **trial details** given the NCT ID as a starting point.
- Proceeded with the **BONUS** requirements. Wrote API endpoints to **save_selected_trails()**, **delete_saved_trails()**, **list_saved_trails()**.
- Moved on to the AI features. Wrote a **ai_rank()** function to enable AI rank, explain relevance and sort the trials based on the patient data. Then wrote the **ask_ai()** function - a chat interface that takes the trial details and patient data as context to respond. 
### Frontend
- Used AI to write most of the frontend code. Clearly specified the requirements to make sure the UI met the requirements I had in mind.
- Started with the **file upload** component. The basic functionality. Enables users to upload a transcript and get the clinical notes and trials.
- The **PatientDataTable** component. Simple viewing of patient data. Display all the extracted patient data.
- Then created the main component **TrialsTable** to display a concise view of the trials (nct_id, conditions, interventions)   
- Added the save and remove buttons to the **TrialsTable** component. Included the **SavedTrialsSidebar** component to display the saved trials. 
- Finally moved on to the AI features. Added the **ai rank()** function to the **PatientDataTable** component. Also added the **ask_ai()** function to let the user query the AI about their selected trial 

## Running the project locally

#### Setting up environment variables

Create a .env file in the root directory of the project and add the following variables:

OPENAI_API_KEY=your_openai_api_key

#### Backend: 
```bash
python3 -m venv venv # create virtual environment
source venv/bin/activate # activate virtual environment
pip install -r requirements.txt # install dependencies
python -m src.main # run the backend api
```
- http://localhost:8007 - Backend API
- http://localhost:8007/docs - Backend API Documentation

#### Frontend: 
```bash
npm install # install dependencies
npm run dev # run the frontend app
```
- http://localhost:3000 - Frontend

## Assumptions
- Thought I had to go with a RAG to extract details from the transcript. But it was not required as the transcipts were not too long and using RAGs would be an overkill (would increase the number of steps dramatically).
- Assumed interventions wouldn't be needed to filter the trials. But adding it as a query gave better results.
- Assumed the trials API would only return trials if there was a strong match. But it returned the specified number of trials for most cases.
- Assumed the LLM model would be expensive. But it cheaper than expected (used gpt-4o).

  
