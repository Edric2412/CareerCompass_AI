import requests
import base64
import re
from typing import List, Dict, Optional, Any
# from .gemini_service import check_quota_and_generate # Circular dependency removed
# For simplicity, we'll implement a standalone function that might use a helper.

def parse_github_input(input_str: str) -> List[Dict[str, str]]:
    raw_links = re.split(r'[\s,]+', input_str)
    repos = []
    
    for link in raw_links:
        clean = link.strip().rstrip('/')
        if not clean:
            continue
            
        match = re.search(r'(?:github\.com\/|^)([a-zA-Z0-9-]{1,39})\/([a-zA-Z0-9-_\.]+)', clean)
        if match:
            repos.append({
                "owner": match.group(1),
                "repo": match.group(2),
                "url": f"https://github.com/{match.group(1)}/{match.group(2)}"
            })
            
    # Deduplicate
    unique = {}
    for r in repos:
        unique[r['url']] = r
    return list(unique.values())

def fetch_github_file_content(owner: str, repo: str, path: str) -> Optional[str]:
    try:
        url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
        # Ideally, we should use a GITHUB_TOKEN if available to avoid rate limits
        headers = {} 
        # headers['Authorization'] = f"token {os.getenv('GITHUB_TOKEN')}"
        
        res = requests.get(url, headers=headers)
        if res.status_code != 200:
            return None
            
        data = res.json()
        if data.get('content') and data.get('encoding') == 'base64':
            return base64.b64decode(data['content']).decode('utf-8', errors='ignore')
        return None
    except Exception as e:
        print(f"Error fetching file {path} from {owner}/{repo}: {e}")
        return None

def fetch_github_repo_data(owner: str, repo: str) -> Optional[Dict[str, Any]]:
    try:
        headers = {}
        
        # Meta
        meta_res = requests.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers)
        if meta_res.status_code != 200:
            return None
        meta = meta_res.json()
        
        # Languages
        lang_res = requests.get(f"https://api.github.com/repos/{owner}/{repo}/languages", headers=headers)
        lang_summary = ""
        if lang_res.status_code == 200:
            langs = lang_res.json()
            total = sum(langs.values())
            if total > 0:
                top_langs = sorted(langs.items(), key=lambda x: x[1], reverse=True)[:5]
                lang_strings = [f"{l} {round(b/total*100)}%" for l, b in top_langs]
                lang_summary = ", ".join(lang_strings)
        
        # Files
        contents_res = requests.get(f"https://api.github.com/repos/{owner}/{repo}/contents", headers=headers)
        files_bundle = ""
        
        if contents_res.status_code == 200:
            contents = contents_res.json()
            if isinstance(contents, list):
                interesting_files = [
                    'README.md', 'package.json', 'requirements.txt', 'pyproject.toml', 
                    'main.py', 'app.py', 'server.js', 'index.js', 'App.tsx', 'index.html', 'go.mod', 'Cargo.toml'
                ]
                
                found_files = [item for item in contents if item['type'] == 'file' and item['name'] in interesting_files]
                
                # Sort logic similar to frontend
                def sort_key(item):
                    name = item['name']
                    if name.startswith('README'): return 0
                    if 'json' in name or 'txt' in name: return 1
                    return 2
                
                found_files.sort(key=sort_key)
                
                target_files = found_files[:4]
                
                for file_node in target_files:
                    content = fetch_github_file_content(owner, repo, file_node['path'])
                    if content:
                        truncated = content[:8000] + "\n...(truncated)..." if len(content) > 8000 else content
                        files_bundle += f"FILE: {file_node['path']}\n{truncated}\n\n"
        
        return {
            "repo_name": meta.get('name'),
            "repo_url": meta.get('html_url'),
            "language_summary": lang_summary,
            "files_bundle": files_bundle
        }
        
    except Exception as e:
        print(f"Failed to fetch data for {owner}/{repo}: {e}")
        return None
