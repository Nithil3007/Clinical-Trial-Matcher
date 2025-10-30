def extract_patient_data(client, model, prompt,transcript,temperature,max_tokens):
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": transcript}
        ],
        temperature=temperature,
        max_tokens=max_tokens
    )
    return response.choices[0].message.content

def rank_trials(client, model, prompt, trials_list, llm_output, temperature,max_tokens):
    user_content = f'Trial list - {trials_list}\nSummary - {llm_output}'
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": user_content}
        ],
        temperature=temperature,
        max_tokens=max_tokens
    )
    return response.choices[0].message.content

def ask_ai(client, model, prompt, query, llm_output, trial_input, temperature, max_tokens):
    user_content = f'Patient Summary:\n{llm_output}\n\nTrial Details:\n{trial_input}\n\nUser Question: {query}'
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": user_content}
        ],
        temperature=temperature,
        max_tokens=max_tokens
    )
    return response.choices[0].message.content
