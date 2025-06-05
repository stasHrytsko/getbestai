import React, { useState } from 'react';

const App = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    taskTypes: [],
    priorityOrder: ['quality', 'speed', 'budget'], // Убрали volume
    inputLanguage: 'ru',
    outputLanguage: 'ru'
  });
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
 
  const API_KEY = 'aa_UBeRmofLZUpndgJhNQKYXwzEcbqHEGrl';

  // ⭐ ИСПРАВЛЕННАЯ API ФУНКЦИЯ ⭐
  const fetchModelsFromAPI = async () => {
    if (!API_KEY) {
      setModels(mockModels);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://artificialanalysis.ai/api/v2/data/llms/models', {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
     
      if (response.ok) {
        const data = await response.json();
        const formattedModels = data.data?.map(model => {
          // Правильный расчет цены
          const inputPrice = model.pricing?.price_1m_input_tokens || 0;
          const outputPrice = model.pricing?.price_1m_output_tokens || 0;
          const blendedPrice = (inputPrice * 3 + outputPrice * 1) / 4 / 1000;
          
          return {
            id: model.id,
            name: model.name,
            creator: model.model_creator?.name || 'Unknown',
            quality_score: Math.round(model.evaluations?.artificial_analysis_intelligence_index || 50),
            speed_score: Math.min(100, Math.round((model.median_output_tokens_per_second || 50) / 2)),
            price_per_1k_tokens: blendedPrice,
            description: `AI модель от ${model.model_creator?.name || 'Unknown'}`,
            best_for: ['general']
          };
        }) || [];
        
        setModels(formattedModels.length > 0 ? formattedModels : mockModels);
      } else {
        setModels(mockModels);
      }
    } catch (error) {
      setModels(mockModels);
    } finally {
      setLoading(false);
    }
  };

  const taskTypes = [
    { id: 'translation', name: 'Перевод текстов', description: 'Перевод между языками, локализация', icon: '🌐' },
    { id: 'generation', name: 'Генерация текста', description: 'Создание статей, постов, контента', icon: '✍️' },
    { id: 'qa', name: 'Ответы на вопросы', description: 'Поиск информации и объяснения', icon: '❓' },
    { id: 'coding', name: 'Написание кода', description: 'Программирование и отладка', icon: '💻' },
    { id: 'creative', name: 'Креативные задачи', description: 'Истории, поэзия, сценарии', icon: '🎨' },
    { id: 'analysis', name: 'Анализ данных', description: 'Обработка и интерпретация информации', icon: '📊' }
  ];

  const languages = [
    { id: 'ru', name: 'Русский', flag: '🇷🇺' },
    { id: 'en', name: 'English', flag: '🇺🇸' },
    { id: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { id: 'fr', name: 'Français', flag: '🇫🇷' },
    { id: 'es', name: 'Español', flag: '🇪🇸' },
    { id: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  // Убрали volume из приоритетов
  const priorityItems = [
    { 
      key: 'quality', 
      label: 'Качество результата', 
      icon: '⭐', 
      description: 'Точность, креативность, глубина ответов',
      positionComment: {
        1: 'Главный критерий - готов доплатить за лучшее качество',
        2: 'Важно, но могу пожертвовать ради других факторов', 
        3: 'Средняя важность - хорошее качество достаточно'
      }
    },
    { 
      key: 'speed', 
      label: 'Скорость работы', 
      icon: '⚡', 
      description: 'Время от запроса до получения ответа',
      positionComment: {
        1: 'Критично - каждая секунда на счету',
        2: 'Важно - желательно быстро',
        3: 'Терпимо - могу подождать'
      }
    },
    { 
      key: 'budget', 
      label: 'Экономичность', 
      icon: '💰', 
      description: 'Стоимость использования модели',
      positionComment: {
        1: 'Главное - бюджет ограничен',
        2: 'Важно - ищу баланс цена/качество',
        3: 'Средне - готов доплатить за лучшее'
      }
    }
  ];

  const mockModels = [
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      creator: 'OpenAI',
      quality_score: 95,
      speed_score: 75,
      price_per_1k_tokens: 0.03,
      description: 'Самая мощная модель для сложных задач',
      best_for: ['complex reasoning', 'creative writing']
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      creator: 'Anthropic',
      quality_score: 88,
      speed_score: 85,
      price_per_1k_tokens: 0.015,
      description: 'Сбалансированная модель для большинства задач',
      best_for: ['analysis', 'writing']
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      creator: 'Google',
      quality_score: 82,
      speed_score: 90,
      price_per_1k_tokens: 0.0005,
      description: 'Быстрая и экономичная модель',
      best_for: ['fast responses', 'cost-effective']
    }
  ];

  const getQualityComment = (score) => {
    if (score >= 90) return 'превосходное качество';
    if (score >= 80) return 'высокое качество';
    if (score >= 70) return 'хорошее качество';
    return 'базовое качество';
  };

  const getSpeedComment = (score) => {
    if (score >= 90) return 'очень быстро';
    if (score >= 80) return 'быстро';
    if (score >= 70) return 'средняя скорость';
    return 'медленно';
  };

  const getPriceComment = (price) => {
    if (price <= 0.001) return 'очень дешево';
    if (price <= 0.01) return 'недорого';
    if (price <= 0.02) return 'средняя цена';
    return 'дорого';
  };

  const getScoreComment = (score) => {
    if (score >= 90) return 'Идеальное совпадение с вашими критериями';
    if (score >= 80) return 'Отлично подходит для ваших задач';
    if (score >= 70) return 'Хороший компромисс для ваших потребностей';
    if (score >= 60) return 'Приемлемый вариант с небольшими компромиссами';
    if (score >= 50) return 'Средний вариант - есть более подходящие';
    return 'Слабое соответствие вашим критериям';
  };

  const calculatePricePerWord = (pricePerToken, inputLang, outputLang) => {
    const tokenRatios = {
      'en': 0.75, 'ru': 0.5, 'de': 1.2, 'fr': 1.1, 'es': 1.0, 'zh': 1.8
    };
    const inputRatio = tokenRatios[inputLang] || 1;
    const outputRatio = tokenRatios[outputLang] || 1;
    const avgRatio = (inputRatio + outputRatio) / 2;
    return (pricePerToken * avgRatio).toFixed(6);
  };

  const handleTaskTypeToggle = (taskId) => {
    setFormData(prev => ({
      ...prev,
      taskTypes: prev.taskTypes.includes(taskId)
        ? prev.taskTypes.filter(id => id !== taskId)
        : [...prev.taskTypes, taskId]
    }));
  };

  // Drag & Drop функции
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedItem === null) return;
    
    const newOrder = [...formData.priorityOrder];
    const draggedPriority = newOrder[draggedItem];
    
    newOrder.splice(draggedItem, 1);
    newOrder.splice(dropIndex, 0, draggedPriority);
    
    setFormData(prev => ({
      ...prev,
      priorityOrder: newOrder
    }));
    
    setDraggedItem(null);
  };

  // Исправленный алгоритм - только 3 критерия
  const calculateModelScore = (model) => {
    const weights = {
      [formData.priorityOrder[0]]: 0.5,  // 50%
      [formData.priorityOrder[1]]: 0.3,  // 30%
      [formData.priorityOrder[2]]: 0.2   // 20%
    };

    const qualityNorm = model.quality_score;
    const speedNorm = model.speed_score;
    const priceNorm = Math.max(0, 100 - (model.price_per_1k_tokens * 1000));

    const score = (
      qualityNorm * (weights.quality || 0) +
      speedNorm * (weights.speed || 0) +
      priceNorm * (weights.budget || 0)
    );

    return Math.min(100, Math.round(score));
  };

  const getRecommendedModels = () => {
    return models
      .map(model => ({
        ...model,
        score: calculateModelScore(model)
      }))
      .sort((a, b) => b.score - a.score);
  };

  const getMedalIcon = (place) => {
    switch (place) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${place}`;
    }
  };

  const getMedalBg = (place) => {
    switch (place) {
      case 1: return 'bg-yellow-500';
      case 2: return 'bg-gray-400';
      case 3: return 'bg-amber-600';
      default: return 'bg-gray-300';
    }
  };

  const handleNextStep = async () => {
    await fetchModelsFromAPI();
    setStep(2);
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
          {/* Логотип и описание */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-blue-600 mb-4">
              GetBestAI
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Умный подбор AI моделей под ваши задачи. Сравниваем качество, скорость и стоимость, 
              чтобы найти идеальное решение.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">1</div>
              <div className="w-12 h-1 mx-2 bg-gray-200" />
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">2</div>
            </div>
            <div className="text-center text-sm text-gray-600">
              Шаг 1 из 2: Настройка параметров
            </div>
          </div>

          {/* Task Types Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Типы задач 
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              💡 Выберите что планируете делать с AI. Это поможет подобрать специализированные модели.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {taskTypes.map(task => (
                <button
                  key={task.id}
                  onClick={() => handleTaskTypeToggle(task.id)}
                  className={`p-4 text-left border rounded-lg transition-all ${
                    formData.taskTypes.includes(task.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{task.icon}</span>
                    <div className="font-medium">{task.name}</div>
                  </div>
                  <div className="text-sm text-gray-500">{task.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Priority Ranking - Drag & Drop */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Расставьте приоритеты по важности
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              💡 Перетащите самое важное наверх. 1 место получает больший вес при выборе модели.
            </p>
            
            <div className="space-y-3">
              {formData.priorityOrder.map((priorityKey, index) => {
                const item = priorityItems.find(p => p.key === priorityKey);
                return (
                  <div
                    key={priorityKey}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className="flex items-center p-4 bg-white border-2 border-gray-200 rounded-lg cursor-move hover:border-gray-300 transition-all"
                  >
                    <span className="text-gray-400 mr-3 text-xl">⋮⋮</span>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 text-white ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-xl mr-3">{item?.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{item?.label}</div>
                      <div className="text-sm text-gray-500">{item?.description}</div>
                      <div className="text-xs text-blue-600 mt-1">
                        {item?.positionComment[index + 1]}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Languages */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Языки работы</h3>
            <p className="text-sm text-gray-500 mb-4">
              💡 Разные языки имеют разную эффективность токенизации, что влияет на стоимость.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Язык ввода данных
                </label>
                <select
                  value={formData.inputLanguage}
                  onChange={(e) => setFormData(prev => ({ ...prev, inputLanguage: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  {languages.map(lang => (
                    <option key={lang.id} value={lang.id}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Язык вывода результата
                </label>
                <select
                  value={formData.outputLanguage}
                  onChange={(e) => setFormData(prev => ({ ...prev, outputLanguage: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  {languages.map(lang => (
                    <option key={lang.id} value={lang.id}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNextStep}
            disabled={formData.taskTypes.length === 0}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Подобрать модели
            <span>→</span>
          </button>
         
          {formData.taskTypes.length === 0 && (
            <p className="text-center text-sm text-red-500 mt-2">
              Выберите хотя бы один тип задачи
            </p>
          )}
        </div>
      </div>
    );
  }

  if (step === 2) {
    const recommendedModels = getRecommendedModels();

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <button
              onClick={() => setStep(1)}
              className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-1"
            >
              ← Изменить параметры
            </button>
           
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">1</div>
                <div className="w-12 h-1 mx-2 bg-blue-600" />
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">2</div>
              </div>
              <div className="text-center text-sm text-gray-600">
                Шаг 2 из 2: Результаты подбора
              </div>
            </div>
           
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Рекомендации для вас
            </h1>
            <p className="text-gray-600 mb-4">
              Ранжировано по вашим приоритетам: {formData.priorityOrder.map((p, i) => 
                `${i + 1}. ${priorityItems.find(item => item.key === p)?.label}`
              ).join(', ')}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Найдено {recommendedModels.length} моделей. Показаны все результаты от лучшего к худшему.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Анализируем все доступные модели...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {recommendedModels.map((model, index) => (
                <div key={model.id} className={`bg-white rounded-lg shadow-lg p-4 border-l-4 ${
                  index === 0 ? 'border-yellow-500' :
                  index === 1 ? 'border-gray-400' :
                  index === 2 ? 'border-amber-600' : 'border-blue-300'
                }`}>
                  {/* Header с рейтингом */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${getMedalBg(index + 1)}`}>
                        {getMedalIcon(index + 1)}
                      </span>
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-600">{model.score}/100</div>
                        <div className="text-xs text-gray-500">совпадение</div>
                      </div>
                    </div>
                  </div>

                  {/* Название модели */}
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-gray-800">{model.name}</h3>
                    <p className="text-sm text-gray-500">by {model.creator}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {getScoreComment(model.score)}
                    </p>
                  </div>

                  {/* Метрики */}
                  <div className="grid grid-cols-1 gap-3 mb-4">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-lg font-semibold text-gray-800">{model.quality_score}/100</div>
                      <div className="text-xs text-gray-500">Качество</div>
                      <div className="text-xs text-blue-600">{getQualityComment(model.quality_score)}</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-lg font-semibold text-gray-800">{model.speed_score}/100</div>
                      <div className="text-xs text-gray-500">Скорость</div>
                      <div className="text-xs text-blue-600">{getSpeedComment(model.speed_score)}</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-lg font-semibold text-gray-800">${model.price_per_1k_tokens.toFixed(3)}</div>
                      <div className="text-xs text-gray-500">за 1K токенов</div>
                      <div className="text-xs text-blue-600">{getPriceComment(model.price_per_1k_tokens)}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        ${calculatePricePerWord(model.price_per_1k_tokens, formData.inputLanguage, formData.outputLanguage)} за слово
                      </div>
                    </div>
                  </div>

                  {/* Описание */}
                  <div className="text-xs text-gray-600 mb-3">
                    {model.description}
                  </div>

                  {/* Теги */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {model.best_for?.map(feature => (
                      <span key={feature} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Ссылка */}
                  <a
                    href="https://artificialanalysis.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-xs block"
                  >
                    Подробнее на Artificial Analysis →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
};

export default App;