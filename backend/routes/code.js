const express = require('express');
const router = express.Router();
const axios = require('axios');

// Execute code using Piston API (Free, no API key required)
// Piston API: https://emkc.org/api/v2/piston/execute
// Documentation: https://github.com/engineer-man/piston
router.post('/execute', async (req, res) => {
  try {
    const { code, language, stdin = '' } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    // Language mapping for Piston API
    // Piston supports: python, javascript, java, c, cpp, go, rust, php, ruby, swift, kotlin, and more
    const languageMap = {
      'c': 'c',
      'cpp': 'cpp',
      'c++': 'cpp',
      'python': 'python',
      'python3': 'python',
      'java': 'java',
      'javascript': 'javascript',
      'js': 'javascript',
      'nodejs': 'javascript',
      'php': 'php',
      'ruby': 'ruby',
      'go': 'go',
      'rust': 'rust',
      'swift': 'swift',
      'kotlin': 'kotlin',
      'typescript': 'typescript',
      'ts': 'typescript',
      'csharp': 'csharp',
      'cs': 'csharp',
      'dart': 'dart',
      'lua': 'lua',
      'perl': 'perl',
      'r': 'r',
      'scala': 'scala'
    };

    const pistonLanguage = languageMap[language.toLowerCase()];

    if (!pistonLanguage) {
      return res.status(400).json({ 
        error: 'Unsupported language',
        supported: Object.keys(languageMap).join(', '),
        message: 'Piston API supports many languages. Check https://github.com/engineer-man/piston for full list.'
      });
    }

    // PRIMARY: Use Piston API (Free, no API key required!)
    // Public instance: https://emkc.org/api/v2/piston/execute
    try {
      const pistonResponse = await axios.post(
        'https://emkc.org/api/v2/piston/execute',
        {
          language: pistonLanguage,
          version: '*', // Use latest version
          files: [{
            content: code
          }],
          stdin: stdin || '',
          args: []
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 20000 // 20 seconds timeout
        }
      );

      if (pistonResponse.data && pistonResponse.data.run) {
        // Check for compilation errors
        if (pistonResponse.data.compile && pistonResponse.data.compile.stderr) {
          return res.json({ error: `Compilation Error: ${pistonResponse.data.compile.stderr}` });
        }
        
        // Check for runtime errors
        if (pistonResponse.data.run.stderr && !pistonResponse.data.run.stdout) {
          return res.json({ error: pistonResponse.data.run.stderr });
        }
        
        // Return output
        const output = pistonResponse.data.run.stdout || pistonResponse.data.run.stderr;
        return res.json({ 
          output: output || 'Code executed successfully (no output)',
          source: 'piston'
        });
      }
    } catch (pistonError) {
      console.log('Piston API failed, trying CodeX API:', pistonError.message);
      
      // Fallback: Try CodeX API (Free, no key required)
      try {
        const codexLanguage = pistonLanguage === 'python' ? 'python3' : 
                              pistonLanguage === 'javascript' ? 'nodejs' : 
                              pistonLanguage;
        
        const codexResponse = await axios.post(
          'https://api.codex.jaagrav.in',
          {
            code: code,
            language: codexLanguage,
            input: stdin || ''
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );

        if (codexResponse.data && codexResponse.data.output !== undefined) {
          if (codexResponse.data.error) {
            return res.json({ error: codexResponse.data.error });
          }
          return res.json({ 
            output: codexResponse.data.output || 'Code executed successfully (no output)',
            source: 'codex'
          });
        }
      } catch (codexError) {
        console.log('CodeX API also failed:', codexError.message);
      }
    }

    // Final fallback: Try RapidAPI Judge0 if key is configured
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    if (RAPIDAPI_KEY && RAPIDAPI_KEY !== 'your-rapidapi-key-here') {
      try {
        const languageIds = {
          'c': 50,
          'cpp': 54,
          'python': 71,
          'python3': 71,
          'javascript': 63,
          'nodejs': 63,
          'java': 62
        };

        const languageId = languageIds[pistonLanguage] || languageIds[language.toLowerCase()];
        
        if (languageId) {
          const judge0Response = await axios.post(
            'https://judge0-ce.p.rapidapi.com/submissions',
            {
              source_code: code,
              language_id: languageId,
              stdin: '',
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
              },
              params: {
                base64_encoded: 'false',
                wait: 'true',
                fields: 'stdout,stderr,compile_output,status'
              },
              timeout: 15000
            }
          );

          if (judge0Response.data.stdout) {
            return res.json({ output: judge0Response.data.stdout });
          } else if (judge0Response.data.stderr) {
            return res.json({ error: judge0Response.data.stderr });
          } else if (judge0Response.data.compile_output) {
            return res.json({ error: `Compilation Error: ${judge0Response.data.compile_output}` });
          }
        }
      } catch (judge0Error) {
        console.log('Judge0 API failed:', judge0Error.message);
      }
    }

    // If all APIs fail
    return res.status(503).json({ 
      error: 'All code execution services are currently unavailable',
      message: 'Please try again later or check your internet connection.'
    });

  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({ 
      error: 'Code execution failed',
      message: error.message 
    });
  }
});

module.exports = router;

