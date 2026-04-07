import { useState } from 'react';
import { FileText, FileSpreadsheet, CreditCard, Printer } from 'lucide-react';
import type { HSKLevel, HSKGrammarSentence } from '@/types/hsk';
import { hskGrammarApi } from '@/lib/api';
import { toast } from 'sonner';

interface GrammarDownloadsProps {
  isDark: boolean;
  level: HSKLevel;
}

export default function GrammarDownloads({ isDark, level }: GrammarDownloadsProps) {
  const [loading, setLoading] = useState(false);

  const loadSentences = async (): Promise<HSKGrammarSentence[]> => {
    if (!level || level < 1 || level > 6) {
      throw new Error('Invalid level');
    }
    const response = await hskGrammarApi.getGrammarByLevel(level, 1, 1000);
    if (!response.success || !response.data) {
      throw new Error('Failed to load grammar sentences');
    }
    return response.data.sentences;
  };

  const exportToCSV = async () => {
    try {
      setLoading(true);
      const sentences = await loadSentences();
      
      const headers = ['ID', 'Sentence', 'Pinyin', 'English', 'Grammar Pattern', 'Tags', 'Topic', 'Source URL'];
      const rows = sentences.map(s => [
        s.id,
        `"${s.sentenceClean}"`,
        `"${s.pinyin}"`,
        `"${s.english}"`,
        `"${s.grammarPattern}"`,
        `"${s.tags.join(', ')}"`,
        `"${s.topic}"`,
        `"${s.sourceUrl}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `hsk${level}-grammar.csv`;
      link.click();
      
      toast.success('CSV exported successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    } finally {
      setLoading(false);
    }
  };

  const exportToAnki = async () => {
    try {
      setLoading(true);
      const sentences = await loadSentences();
      
      const ankiContent = sentences.map(s => {
        const html = `
<div style="font-family: 'Noto Sans SC', sans-serif;">
  <h2 style="font-size: 24px; color: #333;">${s.sentenceClean}</h2>
  <p style="font-size: 18px; color: #666;">${s.pinyin}</p>
  <p style="font-size: 16px; color: #999;">${s.english}</p>
  <hr style="border: 1px solid #eee; margin: 10px 0;">
  <p style="font-size: 14px; color: #333;"><strong>Pattern:</strong> ${s.grammarPattern}</p>
  <p style="font-size: 14px; color: #666;"><strong>Tags:</strong> ${s.tags.join(', ')}</p>
  <p style="font-size: 14px; color: #666;"><strong>Topic:</strong> ${s.topic}</p>
</div>`.replace(/\n/g, '');
        
        return `${s.sentenceClean}\t${html}\t${s.tags.join(', ')}`;
      }).join('\n');

      const blob = new Blob([ankiContent], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `hsk${level}-grammar-anki.txt`;
      link.click();
      
      toast.success('Anki deck exported! Import this file into Anki.');
    } catch (error) {
      console.error('Error exporting Anki:', error);
      toast.error('Failed to export Anki deck');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    toast.info('PDF Export: Use your browser\'s print function (Ctrl+P) to save as PDF');
    window.print();
  };

  const exportWorksheet = async () => {
    try {
      setLoading(true);
      const sentences = await loadSentences();
      
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>HSK ${level} Grammar Worksheet</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { text-align: center; color: #333; }
    .sentence { 
      border: 1px solid #ddd; 
      padding: 15px; 
      margin: 10px 0; 
      border-radius: 8px;
      page-break-inside: avoid;
    }
    .chinese { font-size: 24px; font-weight: bold; color: #333; }
    .pinyin { font-size: 18px; color: #666; margin: 5px 0; }
    .english { font-size: 16px; color: #999; }
    .pattern { 
      background: #f0f0f0; 
      padding: 8px; 
      margin-top: 10px; 
      border-radius: 4px;
      font-size: 14px;
    }
    .exercise { 
      margin-top: 15px; 
      padding-top: 10px; 
      border-top: 1px dashed #ccc;
    }
  </style>
</head>
<body>
  <h1>HSK ${level} Grammar Practice Worksheet</h1>
  <p style="text-align: center; color: #666;">${sentences.length} Grammar Sentences</p>
  
  ${sentences.slice(0, 20).map((s, i) => `
    <div class="sentence">
      <div class="chinese">${i + 1}. ${s.sentenceClean.replace(/([^\s])/g, '$1_')}</div>
      <div class="pinyin">${s.pinyin}</div>
      <div class="english">${s.english}</div>
      <div class="pattern"><strong>Pattern:</strong> ${s.grammarPattern}</div>
      <div class="exercise">
        <strong>Practice:</strong> Write your own sentence using this pattern:<br><br>
        _________________________________________________________________<br><br>
        _________________________________________________________________
      </div>
    </div>
  `).join('')}
</body>
</html>`;

      const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `hsk${level}-grammar-worksheet.html`;
      link.click();
      
      toast.success('Worksheet exported! Open the HTML file in your browser.');
    } catch (error) {
      console.error('Error exporting worksheet:', error);
      toast.error('Failed to export worksheet');
    } finally {
      setLoading(false);
    }
  };

  // Guard against invalid level
  if (!level || level < 1 || level > 6) {
    return (
      <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-white/5 text-white' : 'bg-white text-slate-900'}`}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
        Export Grammar Data
      </h3>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={exportToCSV}
          disabled={loading}
          className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
            isDark
              ? 'bg-slate-800/60 border-slate-700 hover:border-indigo-500'
              : 'bg-white border-slate-200 hover:border-indigo-500'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FileSpreadsheet className="w-8 h-8 text-green-500" />
          <div className="text-left">
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Export as CSV
            </p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Spreadsheet format
            </p>
          </div>
        </button>

        <button
          onClick={exportToAnki}
          disabled={loading}
          className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
            isDark
              ? 'bg-slate-800/60 border-slate-700 hover:border-indigo-500'
              : 'bg-white border-slate-200 hover:border-indigo-500'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <CreditCard className="w-8 h-8 text-blue-500" />
          <div className="text-left">
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Export for Anki
            </p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Flashcard deck format
            </p>
          </div>
        </button>

        <button
          onClick={exportWorksheet}
          disabled={loading}
          className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
            isDark
              ? 'bg-slate-800/60 border-slate-700 hover:border-indigo-500'
              : 'bg-white border-slate-200 hover:border-indigo-500'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FileText className="w-8 h-8 text-purple-500" />
          <div className="text-left">
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Practice Worksheet
            </p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Fill-in-the-blank exercises
            </p>
          </div>
        </button>

        <button
          onClick={exportToPDF}
          disabled={loading}
          className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
            isDark
              ? 'bg-slate-800/60 border-slate-700 hover:border-indigo-500'
              : 'bg-white border-slate-200 hover:border-indigo-500'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Printer className="w-8 h-8 text-orange-500" />
          <div className="text-left">
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Print / Save as PDF
            </p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Browser print dialog
            </p>
          </div>
        </button>
      </div>

      <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-blue-50 border-blue-200'}`}>
        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-blue-800'}`}>
          <strong>Tip:</strong> All exports include grammar sentences with Chinese characters, Pinyin, English translations, grammar patterns, and tags.
        </p>
      </div>
    </div>
  );
}
