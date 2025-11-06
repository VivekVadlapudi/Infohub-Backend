// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    "https://info-hub-frontend-red.vercel.app",
    "https://info-hub-frontend-wdti.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// ========== QUOTE API ==========
app.get('/api/quote', async (req, res) => {
  try {
    const mockQuotes = [
      {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs"
      },
      {
        text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill"
      },
      {
        text: "Believe you can and you're halfway there.",
        author: "Theodore Roosevelt"
      },
      {
        text: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt"
      },
      {
        text: "It does not matter how slowly you go as long as you do not stop.",
        author: "Confucius"
      }
    ];

    try {
      const response = await fetch('https://api.quotable.io/random');
      
      if (response.ok) {
        const data = await response.json();
        return res.json({
          text: data.content,
          author: data.author
        });
      }
    } catch (apiError) {
      console.log('External API failed, using mock data');
    }

    const randomQuote = mockQuotes[Math.floor(Math.random() * mockQuotes.length)];
    res.json(randomQuote);

  } catch (error) {
    console.error('Quote API Error:', error);
    res.status(500).json({ error: "Could not fetch quote" });
  }
});

// ========== WEATHER API ==========
app.get('/api/weather', async (req, res) => {
  try {
    const city = req.query.city || 'London';
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return res.json({
        city: city,
        temperature: 22,
        condition: "Clear",
        description: "Clear sky",
        humidity: 60,
        icon: "01d"
      });
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: "City not found" });
      }
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    res.json({
      city: data.name,
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      icon: data.weather[0].icon
    });

  } catch (error) {
    console.error('Weather API Error:', error);
    res.status(500).json({ error: "Could not fetch weather data" });
  }
});

// ========== CURRENCY API ==========
app.get('/api/currency', async (req, res) => {
  try {
    const amount = parseFloat(req.query.amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
      
      if (response.ok) {
        const data = await response.json();
        const usdRate = data.rates.USD;
        const eurRate = data.rates.EUR;

        return res.json({
          inr: amount,
          usd: (amount * usdRate).toFixed(2),
          eur: (amount * eurRate).toFixed(2),
          rates: {
            INR_to_USD: usdRate.toFixed(6),
            INR_to_EUR: eurRate.toFixed(6)
          }
        });
      }
    } catch (apiError) {
      console.log('External API failed, using mock rates');
    }

    const mockUsdRate = 0.012;
    const mockEurRate = 0.011;

    res.json({
      inr: amount,
      usd: (amount * mockUsdRate).toFixed(2),
      eur: (amount * mockEurRate).toFixed(2),
      rates: {
        INR_to_USD: mockUsdRate.toFixed(6),
        INR_to_EUR: mockEurRate.toFixed(6)
      }
    });

  } catch (error) {
    console.error('Currency API Error:', error);
    res.status(500).json({ error: "Could not fetch currency rates" });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'InfoHub API is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'InfoHub API',
    endpoints: ['/api/weather', '/api/currency', '/api/quote']
  });
});

// Export for Vercel (IMPORTANT!)
module.exports = app;

// For local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}