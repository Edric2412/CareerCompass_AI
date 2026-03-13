import requests
from bs4 import BeautifulSoup

def get_job_count(keyword="software engineer"):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept-Language": "en-US,en;q=0.9"
        }
        url = f"https://www.linkedin.com/jobs/search/?keywords={keyword.replace(' ', '%20')}"
        resp = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Find the meta tag or specific class that holds the job count
        count_elem = soup.find('span', class_='results-context-header__job-count')
        if count_elem:
            count_str = count_elem.text.strip().replace('+', '').replace(',', '')
            return int(count_str)
        return "Count element not found"
    except Exception as e:
        return {"error": str(e)}

print("Software Engineer:", get_job_count("software engineer"))
print("Data Scientist:", get_job_count("data scientist"))
print("Marketing Manager:", get_job_count("marketing manager"))
