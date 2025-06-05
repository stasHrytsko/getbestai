// api/models.js
export default async function handler(req, res) {
  // Разрешаем только GET запросы
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    // API ключ из переменных окружения Vercel
    const API_KEY = process.env.ARTIFICIAL_ANALYSIS_API_KEY;
    
    if (!API_KEY) {
      console.error('API ключ отсутствует в переменных окружения');
      return res.status(500).json({ 
        error: 'API key not configured',
        message: 'Please add ARTIFICIAL_ANALYSIS_API_KEY to Vercel environment variables'
      });
    }

    console.log('Отправляем запрос к Artificial Analysis API...');
    
    // Запрос к Artificial Analysis API
    const response = await fetch('https://artificialanalysis.ai/api/v2/data/llms/models', {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'GetBestAI/1.0'
      }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      
      return res.status(response.status).json({
        error: 'Artificial Analysis API error',
        status: response.status,
        message: errorText
      });
    }

    const data = await response.json();
    console.log('Успешно получены данные, моделей:', data.data?.length || 0);

    // Возвращаем данные клиенту
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      models_count: data.data?.length || 0,
      data: data
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}