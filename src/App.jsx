import React, { useState } from 'react';

const App = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    taskTypes: [],
    priorityOrder: ['quality', 'speed', 'budget'],
    inputLanguage: 'ru',
    outputLanguage: 'ru'
  });
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOver, setDragOver] = useState(null);
    // Определяем специализацию модели на основе оценок
  const getModelSpecialization = (model, userTaskTypes = []) => {
    const specializations = [];
    const coding = model.evaluations?.artificial_analysis_coding_index || 0;
    const math = model.evaluations?.artificial_analysis_math_index || 0;
    const general = model.evaluations?.artificial_analysis_intelligence_index || 0;
    
    if (coding > 80) specializations.push('coding');
    if (math > 80) specializations.push('math');
    if (general > 85) specializations.push('general intelligence');
    
    if (userTaskTypes.includes('coding') && coding > 70) {
      return ['coding'];
    }
    if (userTaskTypes.includes('analysis') && math > 70) {
      return ['math', 'analysis'];
    }
    if (userTaskTypes.includes('translation') || userTaskTypes.includes('generation') || userTaskTypes.includes('qa') || userTaskTypes.includes('creative')) {
      if (general > coding && general > math) {
        return ['language tasks', 'general intelligence'];
      }
    }
    
    return specializations.length > 0 ? specializations : ['general'];
  };
 
  const API_KEY = 'aa_UBeRmofLZUpndgJhNQKYXwzEcbqHEGrl';

  // ⭐ API ФУНКЦИЯ С ДОПОЛНИТЕЛЬНЫМИ ДАННЫМИ ⭐
  const fetchModelsFromAPI = async () => {
    console.log('📡 Запрос к нашему API endpoint...');
    
    setLoading(true);
    try {
      // Теперь запрос идет к НАШЕМУ серверу
      const response = await fetch('/api/models');
      
      console.log('📊 Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Получен ответ:', result);
        
        if (result.success && result.data?.data) {
          const formattedModels = result.data.data.map(model => {
            const inputPrice = model.pricing?.price_1m_input_tokens || 0;
            const outputPrice = model.pricing?.price_1m_output_tokens || 0;
            const blendedPrice = (inputPrice * 3 + outputPrice * 1) / 4 / 1000;
            
            return {
              id: model.id,
              name: model.name,
              creator: model.model_creator?.name || 'Unknown',
              quality_score: Math.round(model.evaluations?.artificial_analysis_intelligence_index || 50),
              speed_score: Math.min(100, Math.round((model.median_output_tokens_per_second || 50) / 2)),
              coding_score: Math.round(model.evaluations?.artificial_analysis_coding_index || 50),
              math_score: Math.round(model.evaluations?.artificial_analysis_math_index || 50),
              price_per_1k_tokens: blendedPrice,
              release_date: model.release_date || null,
              time_to_first_token: model.median_time_to_first_token_seconds || null,
              description: `AI модель от ${model.model_creator?.name || 'Unknown'}`,
              best_for: getModelSpecialization(model, formData.taskTypes)
            };
          });
          
          console.log('✅ Обработано моделей:', formattedModels.length);
          setModels(formattedModels);
        } else {
          console.log('❌ Нет данных в ответе, используем mock');
          setModels(mockModels);
        }
      } else {
        const error = await response.json();
        console.error('❌ API Error:', error);
        setModels(mockModels);
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
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
      coding_score: 88,
      math_score: 92,
      price_per_1k_tokens: 0.03,
      release_date: '2024-04-09',
      time_to_first_token: 1.2,
      description: 'Самая мощная модель для сложных задач',
      best_for: ['general intelligence', 'coding']
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      creator: 'Anthropic',
      quality_score: 88,
      speed_score: 85,
      coding_score: 82,
      math_score: 78,
      price_per_1k_tokens: 0.015,
      release_date: '2024-03-04',
      time_to_first_token: 0.9,
      description: 'Сбалансированная модель для большинства задач',
      best_for: ['general intelligence']
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      creator: 'Google',
      quality_score: 82,
      speed_score: 90,
      coding_score: 75,
      math_score: 85,
      price_per_1k_tokens: 0.0005,
      release_date: '2023-12-06',
      time_to_first_token: 0.6,
      description: 'Быстрая и экономичная модель',
      best_for: ['math', 'general']
    }
  ];

  // Улучшенные комментарии
  const getQualityComment = (score) => {
    if (score >= 90) return 'Решает сложные задачи, понимает нюансы';
    if (score >= 80) return 'Справляется с большинством задач хорошо';
    if (score >= 70) return 'Выполняет базовые задачи корректно';
    return 'Подходит для простых задач';
  };

  const getSpeedComment = (score, timeToFirst) => {
    if (timeToFirst) {
      if (timeToFirst < 1) return `Отвечает за ${timeToFirst.toFixed(1)}с - очень быстро`;
      if (timeToFirst < 3) return `Отвечает за ${timeToFirst.toFixed(1)}с - быстро`;
      if (timeToFirst < 10) return `Отвечает за ${timeToFirst.toFixed(1)}с - средне`;
      return `Отвечает за ${timeToFirst.toFixed(1)}с - медленно`;
    }
    
    if (score >= 90) return 'Отвечает за 1-2 секунды';
    if (score >= 80) return 'Отвечает за 3-5 секунд';
    if (score >= 70) return 'Отвечает за 5-10 секунд';
    return 'Отвечает более 10 секунд';
  };

  const getPriceComment = (price) => {
    if (price <= 0.001) return 'Очень дешево - экономит бюджет';
    if (price <= 0.01) return 'Недорого - хороший баланс';
    if (price <= 0.02) return 'Средняя цена - разумная стоимость';
    return 'Дорого - премиум качество';
  };

  const getModelAge = (releaseDate) => {
    if (!releaseDate) return '';
    const release = new Date(releaseDate);
    const now = new Date();
    const months = Math.floor((now - release) / (1000 * 60 * 60 * 24 * 30));
    
    if (months < 3) return '🆕 Новая модель';
    if (months < 12) return `📅 ${months} мес. назад`;
    return `📅 ${Math.floor(months / 12)} г. назад`;
  };

  const getTaskSpecificScore = (model, taskTypes) => {
    if (taskTypes.includes('coding')) {
      return model.coding_score || model.quality_score;
    }
    if (taskTypes.includes('analysis')) {
      return model.math_score || model.quality_score;
    }
    return model.quality_score;
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

  // Улучшенные Drag & Drop функции с анимациями
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDragOver(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (draggedItem !== index) {
      setDragOver(index);
    }
  };

  const handleDragLeave = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setDragOver(null);
    }
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
    setDragOver(null);
  };

  const calculateModelScore = (model) => {
    const weights = {
      [formData.priorityOrder[0]]: 0.5,
      [formData.priorityOrder[1]]: 0.3,
      [formData.priorityOrder[2]]: 0.2
    };

    // Используем специализированные оценки для конкретных задач
    const qualityNorm = getTaskSpecificScore(model, formData.taskTypes);
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

  const getMedalEmoji = (place) => {
    switch (place) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '⭐';
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

          {/* Priority Ranking - Улучшенный Drag & Drop */}
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
                const isDragging = draggedItem === index;
                const isDropTarget = dragOver === index;
                
                return (
                  <div
                    key={priorityKey}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-move transition-all duration-200 ${
                      isDragging 
                        ? 'opacity-50 scale-95 transform rotate-2' 
                        : isDropTarget
                        ? 'border-blue-400 bg-blue-50 scale-105 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <span className="text-gray-400 mr-3 text-xl select-none">⋮⋮</span>
                    
                    {/* Медаль места */}
                    <div className="mr-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}

                      </div>
                      <div className="text-xs text-center text-gray-500 mt-1">
                        {index + 1} место
                      </div>
                    </div>
                    
                    {/* Карточка критерия */}
                    <div className={`flex-1 p-3 rounded-lg transition-all ${
                      isDropTarget ? 'bg-white' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{item?.icon}</span>
                        <div className="font-medium text-gray-800">{item?.label}</div>
                      </div>
                      <div className="text-sm text-gray-500 mb-2">{item?.description}</div>
                      <div className="text-xs text-blue-600 font-medium">
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
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
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
        <div className="max-w-4xl mx-auto p-6">
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
              Проанализировано {models.length} моделей, показаны топ-3. 
              Данные из <a href="https://artificialanalysis.ai/" className="text-blue-600">Artificial Analysis</a>
              {models === mockModels ? ' (демо-режим)' : ''}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Анализируем все доступные модели...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {recommendedModels.slice(0, 3).map((model, index) => (
                <div key={model.id} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getMedalEmoji(index + 1)}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-800">{model.name}</h3>
                          <span className="text-gray-500">by {model.creator}</span>
                          <span className="text-xs text-green-600">{getModelAge(model.release_date)}</span>
                        </div>
                        <p className="text-blue-600 text-sm mb-1">
                          {index === 0 && "🥇 Лучший выбор для ваших задач"}
                          {index === 1 && "🥈 Отличная альтернатива"}
                          {index === 2 && "🥉 Хороший бюджетный вариант"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{model.score}/100</div>
                      <div className="text-sm text-gray-500">совпадение</div>
                      <div className="text-xs text-gray-400 mt-1 max-w-32">
                        {getScoreComment(model.score)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-gray-800">
                      {getTaskSpecificScore(model, formData.taskTypes)}/100
                    </div>
                    <div className="text-sm text-gray-500">
                      {formData.taskTypes.includes('coding') ? 'Код' : 'Качество'}
                    </div>
                    <div className="text-xs text-blue-600">
                      {getQualityComment(getTaskSpecificScore(model, formData.taskTypes))}
                    </div>
                  </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-semibold text-gray-800">{model.speed_score}/100</div>
                      <div className="text-sm text-gray-500">Скорость</div>
                      <div className="text-xs text-blue-600">
                        {getSpeedComment(model.speed_score, model.time_to_first_token)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-semibold text-gray-800">${model.price_per_1k_tokens.toFixed(3)}</div>
                      <div className="text-sm text-gray-500">за 1K токенов</div>
                      <div className="text-xs text-blue-600">{getPriceComment(model.price_per_1k_tokens)}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        ${calculatePricePerWord(model.price_per_1k_tokens, formData.inputLanguage, formData.outputLanguage)} за слово
                      </div>
                    </div>
                  </div>

                  {/* Специализация и описание */}
                  <div className="mb-4">
                    <p className="text-gray-700 mb-2">{model.description}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                        Специализация:
                      </span>
                      {model.best_for?.map(feature => (
                        <span key={feature} className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                          {feature}
                        </span>
                      ))}
                      {formData.taskTypes.includes('coding') && model.coding_score && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm">
                          Код: {model.coding_score}/100
                        </span>
                      )}
                      {(formData.taskTypes.includes('analysis') || formData.taskTypes.includes('qa')) && model.math_score && (
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-sm">
                          Математика: {model.math_score}/100
                        </span>
                      )}
                    </div>
                    <a
                      href="https://artificialanalysis.ai/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Подробные данные на Artificial Analysis →
                    </a>
                  </div>
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