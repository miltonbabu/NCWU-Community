import { Router, Request, Response } from 'express';
import {
  getGrammarByLevel,
  searchGrammar,
  getTopicsByLevel,
  getGrammarByTopic,
  getAudioPath,
  preloadAllGrammarData,
} from '../utils/hskGrammarParser';

const router = Router();

preloadAllGrammarData();

router.get('/grammar/:level', async (req: Request, res: Response) => {
  try {
    const level = parseInt(req.params.level);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const topic = req.query.topic as string;
    
    if (level < 1 || level > 6) {
      return res.status(400).json({
        success: false,
        error: 'Invalid HSK level. Must be 1-6.'
      });
    }
    
    let result;
    if (topic) {
      result = getGrammarByTopic(level, topic, page, limit);
    } else {
      result = getGrammarByLevel(level, page, limit);
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching grammar:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch grammar data'
    });
  }
});

router.get('/grammar/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const level = req.query.level ? parseInt(req.query.level as string) : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const result = searchGrammar(query.trim(), level, page, limit);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error searching grammar:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search grammar'
    });
  }
});

router.get('/grammar/topics/:level', async (req: Request, res: Response) => {
  try {
    const level = parseInt(req.params.level);
    
    if (level < 1 || level > 6) {
      return res.status(400).json({
        success: false,
        error: 'Invalid HSK level. Must be 1-6.'
      });
    }
    
    const topics = getTopicsByLevel(level);
    
    res.json({
      success: true,
      data: topics
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch topics'
    });
  }
});

router.get('/audio/:level/:filename', async (req: Request, res: Response) => {
  try {
    const level = parseInt(req.params.level);
    const filename = req.params.filename;
    
    if (level < 1 || level > 6) {
      return res.status(400).json({
        success: false,
        error: 'Invalid HSK level. Must be 1-6.'
      });
    }
    
    const audioPath = getAudioPath(level, filename);
    
    if (!audioPath) {
      return res.status(404).json({
        success: false,
        error: 'Audio file not found'
      });
    }
    
    res.sendFile(audioPath);
  } catch (error) {
    console.error('Error serving audio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to serve audio file'
    });
  }
});

router.get('/grammar/stats', async (req: Request, res: Response) => {
  try {
    const stats: { level: number; totalSentences: number; topics: number }[] = [];
    
    for (let level = 1; level <= 6; level++) {
      const grammarData = getGrammarByLevel(level, 1, 1);
      const topics = getTopicsByLevel(level);
      stats.push({
        level,
        totalSentences: grammarData.total,
        topics: topics.length
      });
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch grammar statistics'
    });
  }
});

export default router;
