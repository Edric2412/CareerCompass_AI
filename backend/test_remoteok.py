import requests

def get_job_counts(keyword="software engineer"):
    try:
        # Base jobs (about 1000 returned)
        base_resp = requests.get("https://remoteok.com/api", headers={'User-Agent': 'Mozilla/5.0'})
        base_jobs = base_resp.json()
        total_jobs = max(1, len(base_jobs) - 1)  # -1 for the legal notice item

        # Keyword jobs
        kw_resp = requests.get(f"https://remoteok.com/api?tag={keyword}", headers={'User-Agent': 'Mozilla/5.0'})
        kw_jobs = kw_resp.json()
        role_jobs = max(0, len(kw_jobs) - 1)
        
        return {"total": total_jobs, "role": role_jobs}
    except Exception as e:
        return {"error": str(e)}

print(get_job_counts())
