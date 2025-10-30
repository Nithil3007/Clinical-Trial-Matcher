# imports
import requests
import json

# ClinicalTrials.gov API Service
# This module provides three functions to interact with the ClinicalTrials.gov API:
# 1. get_params() - Extract search parameters from LLM output
# 2. relevant_trials() - Fetch list of relevant trials (table view)
# 3. short_trials() - Fetch detailed trial information (cascade view)


def get_params(llm_output: str) -> dict:
    try:
        data = json.loads(llm_output)
        conditions = data.get('conditions', [])
        interventions = data.get('interventions', [])
        
        conditions_str = ' OR '.join(conditions) if conditions else ''
        interventions_str = ' OR '.join(interventions) if interventions else ''
        
        params = {
            "query.cond": conditions_str,
            "query.intr": interventions_str,
            "pageSize": 30,
        }
        
        return params
        
    except json.JSONDecodeError as e:
        print(f"Error parsing LLM output: {e}")
        
    except Exception as e:
        print(f"Unexpected error in get_params: {e}")


def relevant_trials(base_url: str, params: dict) -> list:
    i = 0
    data_list = []
    while i <= 30:
        i+=1
        response = requests.get(base_url, params=params)
        if response.status_code == 200:
            data = response.json()
            studies = data.get('studies', [])
            for study in studies:
                protocol = study.get('protocolSection', {})
                identification = protocol.get('identificationModule', {})

                nct_id = identification.get('nctId', 'Unknown')
                conditions_module = protocol.get('conditionsModule', {})
                conditions_list = conditions_module.get('conditions', ['No conditions listed'])
                conditions_list = conditions_list[:4]
                conditions = ', '.join(conditions_list) if isinstance(conditions_list, list) else str(conditions_list)
                interventions_module = protocol.get('armsInterventionsModule', {})
                interventions_raw = interventions_module.get('interventions', [])
                interventions_raw = interventions_raw[:4]
                interventions_list = [
                    inv.get('name', 'Unknown') if isinstance(inv, dict) else str(inv) 
                    for inv in interventions_raw
                ] if interventions_raw else ['No interventions listed']
                interventions = ', '.join(interventions_list)
                data_list.append({
                    "nct_id": nct_id,
                    "conditions": conditions,
                    "interventions": interventions
                })
            
            nextPageToken = data.get('nextPageToken')
            if nextPageToken:
                params['nextPageToken'] = nextPageToken
            else:
                break
    return data_list

def trials_long(base_url: str, nct_id: str) -> dict:
    try:
        query_url = f"{base_url}/{nct_id}"
        
        response = requests.get(query_url, timeout=10)
        response.raise_for_status()
        
        json_data = response.json()
        
        if "protocolSection" in json_data:
            protocol = json_data.get("protocolSection", {})
        elif "studies" in json_data and json_data["studies"]:
            study = json_data["studies"][0]
            protocol = study.get("protocolSection", {})
        else:
            return {
                "nct_id": nct_id,
                "acronym": "Not Found",
                "title": "Not Found",
                "primary_completion_date": "Unknown",
                "study_first_post_date": "Unknown",
                "last_update_post_date": "Unknown",
                "study_type": "Unknown",
                "status": "Unknown",
                "sponsor": "Unknown",
                "conditions": "Unknown",
                "interventions": "Unknown",
                "locations": "Unknown",
                "age": "Unknown",
                "sex": "Unknown",
                "phases": "Unknown",
                "eligibility_criteria": "Not available"
            }
        
        id_module = protocol.get("identificationModule", {})
        nct_id_result = id_module.get("nctId", nct_id)
        acronym = id_module.get("acronym", "Unknown")
        title = id_module.get("briefTitle", "Unknown")
        
        status_module = protocol.get("statusModule", {})
        status = status_module.get("overallStatus", "Unknown")
        primary_completion_date = status_module.get("primaryCompletionDateStruct", {}).get("date", "Unknown")
        study_first_post_date = status_module.get("studyFirstPostDateStruct", {}).get("date", "Unknown")
        last_update_post_date = status_module.get("lastUpdatePostDateStruct", {}).get("date", "Unknown")
        
        design_module = protocol.get("designModule", {})
        study_type = design_module.get("studyType", "Unknown")
        phases_list = design_module.get("phases", [])
        phases = ', '.join(phases_list) if phases_list else "Not Available"
        
        sponsor_module = protocol.get("sponsorCollaboratorsModule", {})
        sponsor = sponsor_module.get("leadSponsor", {}).get("name", "Unknown")
        
        conditions_module = protocol.get("conditionsModule", {})
        conditions_list = conditions_module.get("conditions", [])
        conditions = ', '.join(conditions_list) if conditions_list else "No conditions listed"
        
        interventions_module = protocol.get("armsInterventionsModule", {})
        interventions_raw = interventions_module.get("interventions", [])
        interventions_list = [
            inter.get("name", "Unknown") if isinstance(inter, dict) else str(inter)
            for inter in interventions_raw
        ]
        interventions = ', '.join(interventions_list) if interventions_list else "No interventions listed"
        
        eligibility_module = protocol.get("eligibilityModule", {})
        min_age = eligibility_module.get("minimumAge", "Unknown")
        max_age = eligibility_module.get("maximumAge", "Unknown")
        age = f"{min_age} to {max_age}" if min_age != "Unknown" or max_age != "Unknown" else "Unknown"
        sex = eligibility_module.get("sex", "All")
        eligibility_criteria = eligibility_module.get("eligibilityCriteria", "")
        
        contacts_locations_module = protocol.get("contactsLocationsModule", {})
        locations_raw = contacts_locations_module.get("locations", [])
        locations_list = [
            f"{loc.get('city', 'Unknown')}, {loc.get('country', 'Unknown')}"
            for loc in locations_raw[:10] if isinstance(loc, dict)
        ]
        locations = ', '.join(locations_list) if locations_list else "No locations listed"
        
        return {
            "nct_id": nct_id_result,
            "acronym": acronym,
            "title": title,
            "primary_completion_date": primary_completion_date,
            "study_first_post_date": study_first_post_date,
            "last_update_post_date": last_update_post_date,
            "study_type": study_type,
            "status": status,
            "sponsor": sponsor,
            "conditions": conditions,
            "interventions": interventions,
            "locations": locations,
            "age": age,
            "sex": sex,
            "phases": phases,
            "eligibility_criteria": eligibility_criteria
        }
        
    except requests.exceptions.RequestException as e:
        print(f"API request error for NCT ID {nct_id}: {e}")
        return {
            "nct_id": nct_id,
            "acronym": "Error",
            "title": "Error fetching data",
            "primary_completion_date": "Unknown",
            "study_first_post_date": "Unknown",
            "last_update_post_date": "Unknown",
            "study_type": "Unknown",
            "status": "Error",
            "sponsor": "Error",
            "conditions": "Error fetching data",
            "interventions": "Error fetching data",
            "locations": "Error fetching data",
            "age": "Unknown",
            "sex": "Unknown",
            "phases": "Unknown",
            "eligibility_criteria": "Error fetching data"
        }
    except (KeyError, IndexError, TypeError) as e:
        print(f"Error parsing trial data for NCT ID {nct_id}: {e}")
        return {
            "nct_id": nct_id,
            "acronym": "Parse Error",
            "title": "Error parsing data",
            "primary_completion_date": "Unknown",
            "study_first_post_date": "Unknown",
            "last_update_post_date": "Unknown",
            "study_type": "Unknown",
            "status": "Error",
            "sponsor": "Error",
            "conditions": "Error parsing data",
            "interventions": "Error parsing data",
            "locations": "Error parsing data",
            "age": "Unknown",
            "sex": "Unknown",
            "phases": "Unknown",
            "eligibility_criteria": "Error parsing data"
        }