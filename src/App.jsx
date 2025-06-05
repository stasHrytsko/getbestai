// Сюда вставим наш компонент ModelSelector
// (упрощенную версию без ошибок)
import React, { useState } from 'react';

const App = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    taskTypes: [],
    qualityPriority: 5,
    volumePriority: 3,
    speedPriority: 3,
    budgetPriority: 3,
    languages: []
  });

  const taskTypes = [
    { 
      id: 'translation', 
      name: 'Перевод текстов', 
      description: 'Перевод между языками, локализация',
      icon: '🌐'
    },
    { 
      id: 'generation', 
      name: 'Генерация текста', 
      description: 'Создание статей, постов, контента',
      icon: '✍️'
    },
    { 
      id: 'qa', 
      name: 'Ответы на вопросы', 
      description: 'Поиск информации и объяснения',
      icon: '❓'
    },
    { 
      id: 'coding', 
      name: 'Написание кода', 
      description: 'Программирование и отладка',
      icon: '💻'
    },
    { 
      id: 'creative', 
      name: 'Креативные задачи', 
      description: 'Истории, поэзия, сценарии',
      icon: '🎨'
    },
    { 
      id: 'analysis', 
      name: 'Анализ данных', 
      description: 'Обработка и интерпретация информации',
      icon: '📊'
    }
  ];

  const languages = [
    { id: 'ru', name: 'Русский', flag: '🇷🇺' },
    { id: 'en', name: 'English', flag: '🇺🇸' },
    { id: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { id: 'fr', name: 'Français', flag: '🇫🇷' },
    { id: 'es', name: 'Español', flag: '🇪🇸' },
    { id: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  const mockModels = [
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      creator: 'OpenAI',
      quality_score: 95,
      speed_score: 75,
      price_per_1k_tokens: 0.03,
      context_length: 128000,
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
      context_length: 200000,
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
      context_length: 32000,
      description: 'Быстрая и экономичная модель',
      best_for: ['fast responses', 'cost-effective']
    }
  ];

  const handleTaskTypeToggle = (taskId) => {
    setFormData(prev => ({
      ...prev,
      taskTypes: prev.taskTypes.includes(taskId)
        ? prev.taskTypes.filter(id => id !== taskId)
        : [...prev.taskTypes, taskId]
    }));
  };

  const handleLanguageToggle = (langId) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(langId)
        ? prev.languages.filter(id => id !== langId)
        : [...prev.languages, langId]
    }));
  };

  const calculateModelScore = (model) => {
    const weights = {
      quality: formData.qualityPriority / 10,
      speed: formData.speedPriority / 10,
      budget: (10 - formData.budgetPriority) / 10,
      volume: formData.volumePriority / 10
    };

    const qualityNorm = model.quality_score;
    const speedNorm = model.speed_score;
    const priceNorm = Math.max(0, 100 - (model.price_per_1k_tokens * 1000));
    const contextNorm = Math.min(100, (model.context_length / 1000) * 2);

    const score = (
      qualityNorm * weights.quality +
      speedNorm * weights.speed +
      priceNorm * weights.budget +
      contextNorm * weights.volume
    );

    return Math.round(score);
  };

  const getRecommendedModels = () => {
    return mockModels
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

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              GetBestAI
            </h1>
            <p className="text-gray-600">
              Подберем оптимальную AI модель для ваших задач
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div className="w-12 h-1 mx-2 bg-gray-200" />
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">
                2
              </div>
            </div>
            <div className="text-center text-sm text-gray-600">
              Шаг 1 из 2: Настройка параметров
            </div>
          </div>

          {/* Task Types Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Типы задач <span className="text-sm text-gray-500">(можно выбрать несколько)</span>
            </h3>
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

          {/* Priority Sliders */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Приоритеты (1 = неважно, 10 = критично)
            </h3>
            
            <div className="space-y-6">
              {[
                { key: 'qualityPriority', label: 'Качество результата', icon: '⭐' },
                { key: 'speedPriority', label: 'Скорость работы', icon: '⚡' },
                { key: 'budgetPriority', label: 'Экономичность', icon: '💰' },
                { key: 'volumePriority', label: 'Работа с большими объемами', icon: '📊' }
              ].map(({ key, label, icon }) => (
                <div key={key} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{icon}</span>
                    <label className="text-sm font-medium text-gray-700">{label}</label>
                    <span className="text-sm text-gray-500">({formData[key]}/10)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData[key]}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      [key]: parseInt(e.target.value)
                    }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Неважно</span>
                    <span>Критично</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Языки работы
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {languages.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => handleLanguageToggle(lang.id)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                    formData.languages.includes(lang.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={() => setStep(2)}
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
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div className="w-12 h-1 mx-2 bg-blue-600" />
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                  2
                </div>
              </div>
              <div className="text-center text-sm text-gray-600">
                Шаг 2 из 2: Результаты подбора
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Рекомендации для вас
            </h1>
            <p className="text-gray-600">
              Модели ранжированы по соответствию вашим требованиям
            </p>
          </div>

          <div className="space-y-6">
            {recommendedModels.map((model, index) => (
              <div key={model.id} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getMedalEmoji(index + 1)}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-gray-800">
                          {model.name}
                        </h3>
                        <span className="text-gray-500">by {model.creator}</span>
                      </div>
                      <p className="text-blue-600 text-sm mb-1">
                        {index === 0 && "🥇 Лучший выбор для ваших задач"}
                        {index === 1 && "🥈 Отличная альтернатива"}
                        {index === 2 && "🥉 Хороший бюджетный вариант"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {model.score}/100
                    </div>
                    <div className="text-sm text-gray-500">совпадение</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-gray-800">
                      {model.quality_score}/100
                    </div>
                    <div className="text-sm text-gray-500">Качество</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-gray-800">
                      {model.speed_score}/100
                    </div>
                    <div className="text-sm text-gray-500">Скорость</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-gray-800">
                      ${model.price_per_1k_tokens}
                    </div>
                    <div className="text-sm text-gray-500">за 1K токенов</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-gray-800">
                      {(model.context_length / 1000).toFixed(0)}K
                    </div>
                    <div className="text-sm text-gray-500">Контекст</div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 mb-2">{model.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {model.best_for?.map(feature => (
                      <span key={feature} className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
};

export default App;