import * as fs from 'fs';
import * as path from 'path';

export interface HSKGrammarSentence {
  id: number;
  level: number;
  sentenceWithSpaces: string;
  sentenceClean: string;
  pinyin: string;
  english: string;
  audioFile: string;
  grammarPattern: string;
  tags: string[];
  topic: string;
  sourceUrl: string;
}

export interface GrammarTopic {
  name: string;
  count: number;
}

const DATA_BASE_PATH = path.join(__dirname, '../../data/hsk-resources/Chinese-Grammar-master/Chinese-Grammar-master');
const CSV_FOLDER = path.join(DATA_BASE_PATH, 'CSV Files HSK1 - HSK6');

let grammarCache: Map<number, HSKGrammarSentence[]> = new Map();
let topicsCache: Map<number, GrammarTopic[]> = new Map();

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

function extractAudioFilename(audioRef: string): string {
  const match = audioRef.match(/\[sound:([^\]]+)\]/);
  return match ? match[1] : '';
}

function parseTags(tagsStr: string): string[] {
  if (!tagsStr) return [];
  return tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
}

function cleanGrammarPattern(pattern: string): string {
  return pattern.replace(/::/g, '').trim();
}

export function loadGrammarData(level: number): HSKGrammarSentence[] {
  if (grammarCache.has(level)) {
    return grammarCache.get(level)!;
  }
  
  const csvPath = path.join(CSV_FOLDER, `hsk${level}.csv`);
  
  try {
    if (!fs.existsSync(csvPath)) {
      console.warn(`CSV file not found for HSK ${level}: ${csvPath}`);
      return [];
    }
    
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    const sentences: HSKGrammarSentence[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const columns = parseCSVRow(line);
      
      if (columns.length >= 9) {
        const sentence: HSKGrammarSentence = {
          id: i + 1,
          level: level,
          sentenceWithSpaces: columns[0] || '',
          sentenceClean: columns[1] || '',
          pinyin: columns[2] || '',
          english: columns[3] || '',
          audioFile: extractAudioFilename(columns[4] || ''),
          grammarPattern: cleanGrammarPattern(columns[5] || ''),
          tags: parseTags(columns[6] || ''),
          topic: columns[7] || '',
          sourceUrl: columns[8] || ''
        };
        
        sentences.push(sentence);
      }
    }
    
    grammarCache.set(level, sentences);
    return sentences;
  } catch (error) {
    console.error(`Error loading grammar data for HSK ${level}:`, error);
    return [];
  }
}

export function getGrammarByLevel(level: number, page: number = 1, limit: number = 50): {
  sentences: HSKGrammarSentence[];
  total: number;
  page: number;
  totalPages: number;
} {
  const allSentences = loadGrammarData(level);
  const total = allSentences.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    sentences: allSentences.slice(startIndex, endIndex),
    total,
    page,
    totalPages
  };
}

export function searchGrammar(query: string, level?: number, page: number = 1, limit: number = 50): {
  sentences: HSKGrammarSentence[];
  total: number;
  page: number;
  totalPages: number;
} {
  const levelsToSearch = level ? [level] : [1, 2, 3, 4, 5, 6];
  const queryLower = query.toLowerCase();
  
  let allResults: HSKGrammarSentence[] = [];
  
  for (const lvl of levelsToSearch) {
    const sentences = loadGrammarData(lvl);
    const filtered = sentences.filter(s => 
      s.sentenceClean.toLowerCase().includes(queryLower) ||
      s.sentenceWithSpaces.toLowerCase().includes(queryLower) ||
      s.pinyin.toLowerCase().includes(queryLower) ||
      s.english.toLowerCase().includes(queryLower) ||
      s.grammarPattern.toLowerCase().includes(queryLower) ||
      s.topic.toLowerCase().includes(queryLower)
    );
    allResults = allResults.concat(filtered);
  }
  
  const total = allResults.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    sentences: allResults.slice(startIndex, endIndex),
    total,
    page,
    totalPages
  };
}

export function getTopicsByLevel(level: number): GrammarTopic[] {
  if (topicsCache.has(level)) {
    return topicsCache.get(level)!;
  }
  
  const sentences = loadGrammarData(level);
  const topicCounts = new Map<string, number>();
  
  for (const sentence of sentences) {
    if (sentence.topic) {
      const count = topicCounts.get(sentence.topic) || 0;
      topicCounts.set(sentence.topic, count + 1);
    }
  }
  
  const topics: GrammarTopic[] = Array.from(topicCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  topicsCache.set(level, topics);
  return topics;
}

export function getGrammarByTopic(level: number, topic: string, page: number = 1, limit: number = 50): {
  sentences: HSKGrammarSentence[];
  total: number;
  page: number;
  totalPages: number;
} {
  const allSentences = loadGrammarData(level);
  const filtered = allSentences.filter(s => s.topic === topic);
  
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    sentences: filtered.slice(startIndex, endIndex),
    total,
    page,
    totalPages
  };
}

export function getAudioPath(level: number, filename: string): string | null {
  const audioPath = path.join(DATA_BASE_PATH, `HSK${level}`, 'audio', filename);
  
  if (fs.existsSync(audioPath)) {
    return audioPath;
  }
  
  return null;
}

export function preloadAllGrammarData(): void {
  console.log('Preloading HSK grammar data...');
  for (let level = 1; level <= 6; level++) {
    const count = loadGrammarData(level).length;
    console.log(`HSK ${level}: ${count} grammar sentences loaded`);
  }
  console.log('Grammar data preloading complete!');
}
