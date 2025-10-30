# Clinical Trial Matcher
Use patient-clinician transcriptions to get relevant clinical trials

## Project Structure
- **src (backend)**
  - llm_service.py (helper functions for llm clients)
  - trial_service.py (helper functions for clinical trial api requests)
  - storage.py (persistent object storage for cloud deployment. In-memory for local development or when AWS credentials are not configured)
  - main.py (main backend file. Used Pydantic models and FastAPI endpoints)
- **pages (frontend)**
  - index.tsx (landing page)
  - app.tsx 
- **lib (api service)**
  - api-service.ts (api service for backend)
- **components (required UI components)**
  - FileUpload.tsx 
  - PatientDataTable.tsx
  - SavedTrialsSidebar.tsx
  - TrialsTable.tsx
- **prompts (prompts for LLM clients)**
  - ask_ai_prompt.txt
  - clinical_notes_prompt.txt
  - ranking_prompt.txt 
- **requirements.txt (required backend modules)**
- **packages.json (required frontend modules)**
- **Dockerfile (cloud deployment)**
- **README.md (project description and setup instructions)**

## Key Features
- Transcript processing and summarisation
- Fetch trials relevant to the patient's details
- AI-powered trial ranking
- AI chat interface that uses patient data and clinical trials to answer queries.
- Trial bookmarking 

## Approach
- Wrote the backend and then the frontend. Kept reviewing the **project and bonus requirements** along the way. After a certain point, I kept working side by side with the frontend and backend. Revised the API design mid-project to make sure all the project requirements were met.
- Kept coming across errors; logging them in the terminal eased debugging.
### Stack
- Backend: Python, FastAPI, OpenAI, Pydantic
- Frontend: React, TypeScript, TailwindCSS
### Backend
- Started with implementing the **text extraction** function.
- Extracted the conditions and treatment parameters from the transcript. The clinical trial API uses a semantic search method to retrieve the relevant trials. I had to figure out a way to extract the trials with the most relevance. Used AND and OR operators with **condition** and **intervention** queries to get the required URLs for the API. Completed the **get_params()** function. Spent more time coming up with the logic than writing the functions in the trial_service.py script. AI was helpful in extracting values from the trial json data.
- Used the **relevant_trials()** function to get the relevant trials, **trials_long()** function to get detailed trial information. 
- Began working on the **main.py** backend code at this point. Wrote API endpoints to extract **patient data**, get **trials related** to the patient and get **trial details** given the NCT ID as a starting point.
- Proceeded with the **BONUS** requirements. Wrote API endpoints to **save selected trails**, **delete saved trails**, **list saved trails**. 
- Moved on to the AI features. Wrote a **ai_rank()** function to enable AI rank, explain relevance and sort the trials based on the patient data. Then wrote the **ask_ai()** function - a chat interface that takes the trial details and patient data as context to respond. 
### Frontend
- Used AI to write most of the frontend code. Made the web app UI simple and easy to navigate. Crafted the prompts to get deterministic responses from the AI and responsive code.
- Started with the **file upload** component; the basic functionality. Enables users to upload a transcript and get the clinical notes and trials.
- The **PatientDataTable** component; simple viewing of patient data. Display all the extracted patient data.
- Then created the main component **TrialsTable**, to display a concise view of the trials (nct_id, conditions, interventions)   
- Added the save and remove buttons to the **TrialsTable** component. Included the **SavedTrialsSidebar** component to display the saved trials. 
- Finally moved on to the AI features. Added the **ai rank()** function to the **PatientDataTable** component. Also added the **ask_ai()** function to let the user query the AI about their selected trial 

## Deployment 

- Project link - **https://main.d3e5zy64vh32y7.amplifyapp.com/**
- Demo (contains video and the transcript used) - **https://drive.google.com/drive/folders/1Q_9fjp6nO9ixj0nV8EU0Akkh3ULRshJp?usp=drive_link**
- AWS App Runner to deploy the backend API
- AWS S3 to store the patient data
- AWS Amplify for the frontend
- Docker for containerization

## Running the project locally

#### Setting up environment variables

Create a .env file in the root directory of the project and add the following variables:

OPENAI_API_KEY=your_openai_api_key

#### Backend: 
```bash
\\ create virtual environment
python -m venv venv 

\\ activate virtual environment
source venv/bin/activate 

\\ install dependencies
pip install -r requirements.txt 

\\ run the backend api
python -m src.main 
```
- http://localhost:8007 - Backend API
- http://localhost:8007/docs - Backend API Documentation

#### Frontend: (in another terminal)
```bash
\\ install dependencies
npm install 

\\ run the frontend app
npm run dev 
```
- http://localhost:3000 - Frontend

- Upload the transcript text file in the file upload component. The app processes the file and returns the clinical notes and relevant trials along with many other details.

## Assumptions
- Thought I had to go with a RAG to extract details from the transcript. But it was not required, as the transcripts were not too long, and using RAGs would be excessive (it would increase the number of steps dramatically).
- I assumed the 'interventions' parameter wouldn't be needed to filter the trials. But using it gave better results.
- Since it's my first time using the trials API, I assumed it would only return trials if there was a strong match. But that was not the case.
- An object storage service (AWS S3) was easier to implement and cheaper. Even though a database would have been much better in terms of performance and security.
- I had trouble coming up with the right project structure (especially for the frontend). Turns out not using subfolders was the right option. 

  
