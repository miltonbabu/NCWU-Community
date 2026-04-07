import json
import os
import sys
import io
import urllib.request
import urllib.parse
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def translate_word(word):
    try:
        encoded = urllib.parse.quote(word)
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q={encoded}"
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        with urllib.request.urlopen(req, timeout=15) as response:
            data = response.read().decode('utf-8')
            import re
            match = re.search(r'\[\["([^"]+)"', data)
            if match:
                return match.group(1)
        return None
    except:
        return None

def main():
    base_dir = r"e:\PYTHON PROJECT UNI\Ncwu Int. Community\Kimi_Agent_Build+Class+Schedule+Site\server\data\hsk"
    file_path = os.path.join(base_dir, 'hsk4_vocabulary.json')
    
    print(f"Processing: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        vocabulary = json.load(f)
    
    translated = 0
    count = 0
    
    for i, word in enumerate(vocabulary):
        if count >= 100:
            break
            
        if not word.get('english') or word['english'] == '':
            translation = translate_word(word['word'])
            
            if translation:
                word['english'] = translation
                translated += 1
                print(f"{word['word']} -> {translation}")
                sys.stdout.flush()
            
            count += 1
            time.sleep(0.5)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(vocabulary, f, ensure_ascii=False, indent=2)
    
    print(f"\nTranslated: {translated} words")

if __name__ == '__main__':
    main()
