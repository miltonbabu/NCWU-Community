import json
import re
import os

# Read extracted data
with open('Kimi_Agent_Build+Class+Schedule+Site/server/data/hsk/raw_extract.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Parse vocabulary by level
vocabulary = {1: [], 2: [], 3: [], 4: [], 5: [], 6: [], '7-9': []}

# Pattern to match vocabulary lines: number level word pinyin part_of_speech
# Example: 1 1 爱 ài 动
pattern = r'^(\d+)\s+(\d|7-9)\s+(\S+)\s+(\S+)\s*(.*)?$'

for page_data in data:
    text = page_data['text']
    lines = text.split('\n')
    
    for line in lines:
        match = re.match(pattern, line.strip())
        if match:
            seq = int(match.group(1))
            level_str = match.group(2)
            if level_str.isdigit():
                level = int(level_str)
            else:
                level = '7-9'
            word = match.group(3)
            pinyin = match.group(4)
            pos = match.group(5) or ''
            
            if level in vocabulary:
                vocabulary[level].append({
                    'id': seq,
                    'word': word,
                    'pinyin': pinyin,
                    'pos': pos.strip()
                })

# Save parsed vocabulary
for level, words in vocabulary.items():
    if words:
        filename = f'Kimi_Agent_Build+Class+Schedule+Site/server/data/hsk/hsk{level}_vocabulary.json'
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(words, f, ensure_ascii=False, indent=2)
        print(f'HSK {level}: {len(words)} words saved')
