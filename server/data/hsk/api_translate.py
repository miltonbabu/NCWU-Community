import json
import os
import sys
import io
import urllib.request
import urllib.parse
import time
import random

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
    except Exception as e:
        return None

def process_file(file_path, max_words=500):
    print(f"\nProcessing: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        vocabulary = json.load(f)
    
    translated = 0
    errors = 0
    total = len(vocabulary)
    
    for i, word in enumerate(vocabulary):
        if translated >= max_words:
            break
            
        if not word.get('english') or word['english'] == '':
            translation = translate_word(word['word'])
            
            if translation and len(translation) > 0:
                word['english'] = translation
                translated += 1
                if translated % 20 == 0:
                    print(f"[{i+1}/{total}] {word['word']} -> {translation}")
                    sys.stdout.flush()
            else:
                word['english'] = ''
                errors += 1
            
            time.sleep(random.uniform(0.3, 0.8))
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(vocabulary, f, ensure_ascii=False, indent=2)
    
    print(f"Translated: {translated}, Errors: {errors}")
    return translated

def main():
    base_dir = r"e:\PYTHON PROJECT UNI\Ncwu Int. Community\Kimi_Agent_Build+Class+Schedule+Site\server\data\hsk"
    
    files = [
        ('hsk4_vocabulary.json', 300),
        ('hsk5_vocabulary.json', 400),
        ('hsk6_vocabulary.json', 400),
        ('hsk7-9_vocabulary.json', 500),
    ]
    
    total = 0
    for filename, max_words in files:
        file_path = os.path.join(base_dir, filename)
        if os.path.exists(file_path):
            total += process_file(file_path, max_words)
    
    print(f"\n{'='*50}")
    print(f"TOTAL TRANSLATED: {total} words")

if __name__ == '__main__':
    main()
