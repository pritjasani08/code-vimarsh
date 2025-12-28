const express = require('express');
const router = express.Router();
const axios = require('axios');

// Fetch aptitude questions from multiple sources with API keys
router.get('/questions', async (req, res) => {
  try {
    const { category = 'all', difficulty = 'medium', amount = 10 } = req.query;
    const requestedAmount = parseInt(amount) || 10;

    let questions = [];

    // Priority 1: QuizAPI.io (Requires API key - Best quality)
    const QUIZAPI_KEY = process.env.QUIZAPI_KEY;
    if (QUIZAPI_KEY && QUIZAPI_KEY !== 'your-quizapi-key-here' && QUIZAPI_KEY.trim() !== '') {
      try {
        const quizApiResponse = await axios.get('https://quizapi.io/api/v1/questions', {
          params: {
            limit: requestedAmount,
            category: category === 'code' ? 'code' : category === 'linux' ? 'linux' : 'code',
            difficulty: difficulty === 'easy' ? 'Easy' : difficulty === 'hard' ? 'Hard' : 'Medium'
          },
            timeout: 8000,
          headers: {
            'X-Api-Key': QUIZAPI_KEY
          }
        });

        if (quizApiResponse.data && Array.isArray(quizApiResponse.data) && quizApiResponse.data.length > 0) {
          questions = quizApiResponse.data.map((q, index) => {
            const correctAnswer = q.correct_answer;
            const allAnswers = [];
            
            // Collect all answers
            if (q.answers && typeof q.answers === 'object') {
              Object.values(q.answers).forEach(answer => {
                if (answer) allAnswers.push(answer);
              });
            }
            
            // Shuffle answers
            const shuffled = [...allAnswers].sort(() => Math.random() - 0.5);
            const correctIndex = shuffled.findIndex(a => a === correctAnswer);

            return {
              id: q.id || Date.now() + index,
              title: q.question || `Question ${index + 1}`,
              question: q.question || 'Aptitude question',
              options: shuffled.length > 0 ? shuffled : ['Option A', 'Option B', 'Option C', 'Option D'],
              correctAnswer: correctIndex >= 0 ? correctIndex : 0,
              explanation: q.explanation || `The correct answer is: ${correctAnswer}`,
              category: q.category || 'Quantitative Aptitude',
              tags: q.tags || []
            };
          });

          if (questions.length > 0) {
            return res.json({ questions, source: 'quizapi' });
          }
        }
      } catch (quizApiError) {
        // Check for rate limit or quota exceeded errors
        const errorStatus = quizApiError.response?.status;
        const errorData = quizApiError.response?.data;
        
        if (errorStatus === 429 || errorStatus === 403 || 
            (errorData && (errorData.message?.toLowerCase().includes('limit') || 
                          errorData.message?.toLowerCase().includes('quota') ||
                          errorData.message?.toLowerCase().includes('too many')))) {
          console.log('QuizAPI rate limit/quota exceeded - using fallback');
        } else {
          console.log('QuizAPI failed:', errorData || quizApiError.message);
        }
        // Continue to next API - don't throw error
      }
    }

    // Priority 2: Aptitude API (Free, no key required)
    try {
      const aptitudeResponse = await axios.get('https://aptitude-api.vercel.app/', {
        timeout: 8000,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (aptitudeResponse.data) {
        let apiQuestions = [];
        
        // Handle different response formats
        if (Array.isArray(aptitudeResponse.data)) {
          apiQuestions = aptitudeResponse.data;
        } else if (aptitudeResponse.data.questions && Array.isArray(aptitudeResponse.data.questions)) {
          apiQuestions = aptitudeResponse.data.questions;
        } else if (aptitudeResponse.data.data && Array.isArray(aptitudeResponse.data.data)) {
          apiQuestions = aptitudeResponse.data.data;
        }

        if (apiQuestions.length > 0) {
          questions = apiQuestions.slice(0, requestedAmount).map((q, index) => {
            // Handle different question formats
            const questionText = q.question || q.problem || q.statement || 'Aptitude question';
            let options = [];
            
            if (q.options && Array.isArray(q.options)) {
              options = q.options;
            } else if (q.options && typeof q.options === 'object') {
              options = Object.values(q.options).filter(Boolean);
            } else {
              options = [
                q.option1 || q.optionA || 'Option A',
                q.option2 || q.optionB || 'Option B',
                q.option3 || q.optionC || 'Option C',
                q.option4 || q.optionD || 'Option D'
              ].filter(opt => opt && opt !== 'Option A' && opt !== 'Option B' && opt !== 'Option C' && opt !== 'Option D');
            }

            // Ensure we have at least 4 options
            while (options.length < 4) {
              options.push(`Option ${String.fromCharCode(65 + options.length)}`);
            }

            const correctAnswer = q.correctAnswer !== undefined ? q.correctAnswer : 
                                 q.correct_answer !== undefined ? q.correct_answer :
                                 q.answer !== undefined ? q.answer : 0;

            return {
              id: q.id || Date.now() + index,
              title: q.topic || q.title || q.category || `Question ${index + 1}`,
              question: questionText,
              options: options.slice(0, 4),
              correctAnswer: typeof correctAnswer === 'number' ? correctAnswer : 
                           options.indexOf(correctAnswer) >= 0 ? options.indexOf(correctAnswer) : 0,
              explanation: q.explanation || q.solution || `The correct answer is option ${String.fromCharCode(65 + (typeof correctAnswer === 'number' ? correctAnswer : 0))}.`,
              category: q.category || q.topic || 'Quantitative Aptitude'
            };
          });

          if (questions.length > 0) {
            return res.json({ questions, source: 'aptitude-api' });
          }
        }
      }
    } catch (aptitudeError) {
      console.log('Aptitude API failed:', aptitudeError.message);
    }

    // Priority 3: Open Trivia Database (Free, no key required - More reliable)
    try {
      const triviaResponse = await axios.get('https://opentdb.com/api.php', {
        params: {
          amount: requestedAmount,
          category: category === 'quantitative' ? 19 : category === 'logical' ? 9 : undefined,
          difficulty: difficulty,
          type: 'multiple'
        },
        timeout: 6000
      });

      if (triviaResponse.data.results && triviaResponse.data.results.length > 0) {
        questions = triviaResponse.data.results.map((q, index) => {
          const allAnswers = [...q.incorrect_answers, q.correct_answer].map(a => 
            a.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&')
          );
          const shuffled = [...allAnswers].sort(() => Math.random() - 0.5);
          const correctIndex = shuffled.indexOf(q.correct_answer.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&'));

          return {
            id: Date.now() + index,
            title: `Question ${index + 1}`,
            question: q.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&'),
            options: shuffled,
            correctAnswer: correctIndex,
            explanation: `The correct answer is: ${q.correct_answer.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&')}`,
            category: category === 'quantitative' ? 'Quantitative Aptitude' : category === 'logical' ? 'Logical Reasoning' : 'General Knowledge'
          };
        });

        if (questions.length > 0) {
          return res.json({ questions, source: 'opentdb' });
        }
      }
    } catch (triviaError) {
      console.log('Open Trivia API failed:', triviaError.message);
    }

    // Fallback: Generate questions (ALWAYS WORKS - Never fails)
    const generatedQuestions = generateAptitudeQuestions(requestedAmount);
    return res.status(200).json({ questions: generatedQuestions, source: 'generated' });

  } catch (error) {
    console.error('Error fetching questions:', error);
    // Always return generated questions as final fallback - NEVER FAIL
    const generatedQuestions = generateAptitudeQuestions(parseInt(req.query.amount) || 10);
    return res.status(200).json({ questions: generatedQuestions, source: 'generated-fallback' });
  }
});

// Enhanced question generation with more variety
function generateAptitudeQuestions(amount) {
  const questionTemplates = [
    {
      title: 'Time and Work',
      generate: (id) => {
        const a = Math.floor(Math.random() * 10) + 5;
        const b = Math.floor(Math.random() * 10) + 5;
        const together = Math.round((a * b) / (a + b) * 10) / 10;
        const options = [
          `${together} days`,
          `${together + 1} days`,
          `${together - 1} days`,
          `${together + 2} days`
        ].sort(() => Math.random() - 0.5);
        return {
          id: id,
          title: 'Time and Work',
          question: `A can do a piece of work in ${a} days and B can do it in ${b} days. In how many days will they complete the work if they work together?`,
          options: options,
          correctAnswer: options.indexOf(`${together} days`),
          explanation: `A's 1 day work = 1/${a}, B's 1 day work = 1/${b}. Together: 1/${a} + 1/${b} = ${a + b}/${a * b} = 1/${together}. So they will complete in ${together} days.`,
          category: 'Quantitative Aptitude'
        };
      }
    },
    {
      title: 'Percentage',
      generate: (id) => {
        const percent = Math.floor(Math.random() * 20) + 10;
        const netChange = Math.round((percent * percent / 100) * 100) / 100;
        const options = [
          'No change',
          `${netChange}% increase`,
          `${netChange}% decrease`,
          `${netChange * 2}% decrease`
        ].sort(() => Math.random() - 0.5);
        return {
          id: id,
          title: 'Percentage',
          question: `If the price of a product is increased by ${percent}% and then decreased by ${percent}%, what is the net change in price?`,
          options: options,
          correctAnswer: options.indexOf(`${netChange}% decrease`),
          explanation: `Let original price = 100. After ${percent}% increase: ${100 + percent}. After ${percent}% decrease: ${100 + percent} - (${percent}% of ${100 + percent}) = ${100 - netChange}. Net change = ${netChange}% decrease.`,
          category: 'Quantitative Aptitude'
        };
      }
    },
    {
      title: 'Ratio and Proportion',
      generate: (id) => {
        const ratio1 = Math.floor(Math.random() * 3) + 2;
        const ratio2 = ratio1 + 1;
        const years = Math.floor(Math.random() * 5) + 3;
        const age = Math.floor(Math.random() * 10) + 10;
        const options = [
          `${age} years`,
          `${age + 5} years`,
          `${age - 5} years`,
          `${age + 10} years`
        ].sort(() => Math.random() - 0.5);
        return {
          id: id,
          title: 'Ratio and Proportion',
          question: `The ratio of the ages of A and B is ${ratio1}:${ratio2}. After ${years} years, the ratio becomes ${ratio1 + 1}:${ratio2 + 1}. What is the present age of A?`,
          options: options,
          correctAnswer: options.indexOf(`${age} years`),
          explanation: `Let A's age = ${ratio1}x, B's age = ${ratio2}x. After ${years} years: (${ratio1}x+${years})/(${ratio2}x+${years}) = ${ratio1 + 1}/${ratio2 + 1}. Solving gives x = ${Math.floor(age / ratio1)}. A's age = ${ratio1}×${Math.floor(age / ratio1)} = ${age} years.`,
          category: 'Quantitative Aptitude'
        };
      }
    },
    {
      title: 'Number Series',
      generate: (id) => {
        const start = Math.floor(Math.random() * 5) + 1;
        const next = (start + 4) * (start + 5);
        const options = [
          `${next}`,
          `${next + 2}`,
          `${next - 2}`,
          `${next + 4}`
        ].sort(() => Math.random() - 0.5);
        return {
          id: id,
          title: 'Number Series',
          question: `Find the next number in the series: ${start * (start + 1)}, ${(start + 1) * (start + 2)}, ${(start + 2) * (start + 3)}, ${(start + 3) * (start + 4)}, ?`,
          options: options,
          correctAnswer: options.indexOf(`${next}`),
          explanation: `The pattern is: n×(n+1). So next is ${start + 4}×${start + 5} = ${next}.`,
          category: 'Logical Reasoning'
        };
      }
    },
    {
      title: 'Profit and Loss',
      generate: (id) => {
        const cp = Math.floor(Math.random() * 50) + 50;
        const profit = Math.floor(Math.random() * 30) + 10;
        const sp = cp + (cp * profit / 100);
        const options = [
          `Rs. ${cp}`,
          `Rs. ${cp + 10}`,
          `Rs. ${cp - 10}`,
          `Rs. ${cp + 20}`
        ].sort(() => Math.random() - 0.5);
        return {
          id: id,
          title: 'Profit and Loss',
          question: `A shopkeeper sells an article at a profit of ${profit}%. If the selling price is Rs. ${Math.round(sp)}, find the cost price.`,
          options: options,
          correctAnswer: options.indexOf(`Rs. ${cp}`),
          explanation: `Let CP = x. SP = x + (${profit}% of x) = x + ${profit/100}x = ${1 + profit/100}x = ${Math.round(sp)}. So x = ${Math.round(sp)} / ${1 + profit/100} = Rs. ${cp}.`,
          category: 'Quantitative Aptitude'
        };
      }
    },
    {
      title: 'Speed and Distance',
      generate: (id) => {
        const speed = Math.floor(Math.random() * 50) + 30;
        const time = Math.floor(Math.random() * 5) + 2;
        const distance = speed * time;
        const options = [
          `${distance} km`,
          `${distance + 10} km`,
          `${distance - 10} km`,
          `${distance + 20} km`
        ].sort(() => Math.random() - 0.5);
        return {
          id: id,
          title: 'Speed and Distance',
          question: `A train travels at ${speed} km/hr for ${time} hours. What distance does it cover?`,
          options: options,
          correctAnswer: options.indexOf(`${distance} km`),
          explanation: `Distance = Speed × Time = ${speed} km/hr × ${time} hr = ${distance} km.`,
          category: 'Quantitative Aptitude'
        };
      }
    },
    {
      title: 'Simple Interest',
      generate: (id) => {
        const principal = Math.floor(Math.random() * 500) + 100;
        const rate = Math.floor(Math.random() * 10) + 5;
        const time = Math.floor(Math.random() * 5) + 2;
        const interest = Math.round((principal * rate * time) / 100);
        const options = [
          `${interest}`,
          `${interest + 10}`,
          `${interest - 10}`,
          `${interest + 20}`
        ].sort(() => Math.random() - 0.5);
        return {
          id: id,
          title: 'Simple Interest',
          question: `Find the simple interest on Rs. ${principal} at ${rate}% per annum for ${time} years.`,
          options: options.map(opt => `Rs. ${opt}`),
          correctAnswer: options.indexOf(`${interest}`),
          explanation: `SI = (P × R × T) / 100 = (${principal} × ${rate} × ${time}) / 100 = Rs. ${interest}.`,
          category: 'Quantitative Aptitude'
        };
      }
    },
    {
      title: 'Average',
      generate: (id) => {
        const num1 = Math.floor(Math.random() * 50) + 10;
        const num2 = Math.floor(Math.random() * 50) + 10;
        const num3 = Math.floor(Math.random() * 50) + 10;
        const num4 = Math.floor(Math.random() * 50) + 10;
        const avg = Math.round((num1 + num2 + num3 + num4) / 4);
        const options = [
          `${avg}`,
          `${avg + 1}`,
          `${avg - 1}`,
          `${avg + 2}`
        ].sort(() => Math.random() - 0.5);
        return {
          id: id,
          title: 'Average',
          question: `Find the average of ${num1}, ${num2}, ${num3}, and ${num4}.`,
          options: options,
          correctAnswer: options.indexOf(`${avg}`),
          explanation: `Average = Sum of numbers / Count = (${num1} + ${num2} + ${num3} + ${num4}) / 4 = ${num1 + num2 + num3 + num4} / 4 = ${avg}.`,
          category: 'Quantitative Aptitude'
        };
      }
    },
    {
      title: 'Logical Reasoning',
      generate: (id) => {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const start = Math.floor(Math.random() * 4);
        const code = letters.slice(start, start + 4).map((l, i) => `${l}-${l.charCodeAt(0) - 64}`).join(', ');
        const nextLetter = letters[start + 4];
        const options = [
          `${nextLetter}-${nextLetter.charCodeAt(0) - 64}`,
          `${letters[start + 3]}-${letters[start + 3].charCodeAt(0) - 64}`,
          `${letters[start + 2]}-${letters[start + 2].charCodeAt(0) - 64}`,
          `${letters[start + 1]}-${letters[start + 1].charCodeAt(0) - 64}`
        ].sort(() => Math.random() - 0.5);
        return {
          id: id,
          title: 'Logical Reasoning',
          question: `If ${letters[start]} is coded as ${letters[start].charCodeAt(0) - 64}, ${letters[start + 1]} as ${letters[start + 1].charCodeAt(0) - 64}, ${letters[start + 2]} as ${letters[start + 2].charCodeAt(0) - 64}, ${letters[start + 3]} as ${letters[start + 3].charCodeAt(0) - 64}, how will ${nextLetter} be coded?`,
          options: options,
          correctAnswer: options.indexOf(`${nextLetter}-${nextLetter.charCodeAt(0) - 64}`),
          explanation: `Each letter is coded as its position in the alphabet. ${nextLetter} is the ${nextLetter.charCodeAt(0) - 64}th letter, so it is coded as ${nextLetter.charCodeAt(0) - 64}.`,
          category: 'Logical Reasoning'
        };
      }
    },
    {
      title: 'Percentage Calculation',
      generate: (id) => {
        const total = Math.floor(Math.random() * 100) + 100;
        const part = Math.floor(Math.random() * (total - 20)) + 10;
        const percentage = Math.round((part / total) * 100);
        const options = [
          `${percentage}%`,
          `${percentage + 5}%`,
          `${percentage - 5}%`,
          `${percentage + 10}%`
        ].sort(() => Math.random() - 0.5);
        return {
          id: id,
          title: 'Percentage Calculation',
          question: `What percentage of ${total} is ${part}?`,
          options: options,
          correctAnswer: options.indexOf(`${percentage}%`),
          explanation: `Percentage = (Part / Total) × 100 = (${part} / ${total}) × 100 = ${percentage}%.`,
          category: 'Quantitative Aptitude'
        };
      }
    }
  ];

  const questions = [];
  for (let i = 0; i < amount; i++) {
    const template = questionTemplates[i % questionTemplates.length];
    questions.push(template.generate(Date.now() + i + Math.random() * 1000));
  }

  return questions;
}

module.exports = router;
