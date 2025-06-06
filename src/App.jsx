import React, { useState } from 'react';

const App = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    taskTypes: [],
    priorityOrder: ['quality', 'speed', 'budget'],
    priorityImportance: { quality: 7, speed: 6, budget: 5 },
    inputLanguage: 'en',
    outputLanguage: 'en'
  });
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  // Model specialization based on evaluations
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

  // API function with additional data
  const fetchModelsFromAPI = async () => {
    console.log('📡 Request to our API endpoint...');
    
    setLoading(true);
    try {
      const response = await fetch('/api/models');
      
      console.log('📊 Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Received response:', result);
        
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
              description: `AI model from ${model.model_creator?.name || 'Unknown'}`,
            };
          });
          
          console.log('✅ Processed models:', formattedModels.length);
          setModels(formattedModels);
        } else {
          console.log('❌ No data in response, using mock');
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
    { id: 'translation', name: 'Text Translation', description: 'Translation between languages, localization', icon: '🌐' },
    { id: 'generation', name: 'Text Generation', description: 'Creating articles, posts, content', icon: '✍️' },
    { id: 'qa', name: 'Question Answering', description: 'Information search and explanations', icon: '❓' },
    { id: 'coding', name: 'Code Writing', description: 'Programming and debugging', icon: '💻' },
    { id: 'creative', name: 'Creative Tasks', description: 'Stories, poetry, scripts', icon: '🎨' },
    { id: 'analysis', name: 'Data Analysis', description: 'Data processing and interpretation', icon: '📊' }
  ];

  const languages = [
    { id: 'en', name: 'English', flag: '🇺🇸' },
    { id: 'ua', name: 'Українська', flag: 'ua' },
    { id: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { id: 'fr', name: 'Français', flag: '🇫🇷' },
    { id: 'es', name: 'Español', flag: '🇪🇸' },
    { id: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  const priorityItems = [
    { 
      key: 'quality', 
      label: 'Result Quality', 
      icon: '⭐', 
      description: 'Accuracy, creativity, depth of responses',
      positionComment: {
        1: 'Main criterion - willing to pay for best quality',
        2: 'Important, but can sacrifice for other factors', 
        3: 'Medium importance - good quality is enough'
      }
    },
    { 
      key: 'speed', 
      label: 'Work Speed', 
      icon: '⚡', 
      description: 'Time from request to response',
      positionComment: {
        1: 'Critical - every second counts',
        2: 'Important - preferably fast',
        3: 'Tolerable - can wait'
      }
    },
    { 
      key: 'budget', 
      label: 'Economy', 
      icon: '💰', 
      description: 'Model usage cost',
      positionComment: {
        1: 'Main thing - budget is limited',
        2: 'Important - looking for price/quality balance',
        3: 'Medium - willing to pay for better'
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
      description: 'Most powerful model for complex tasks',
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
      description: 'Balanced model for most tasks',
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
      description: 'Fast and economical model',
      best_for: ['math', 'general']
    }
  ];

  // Enhanced comments
  const getQualityComment = (score) => {
    if (score >= 90) return 'Handles complex tasks, understands nuances';
    if (score >= 80) return 'Performs most tasks well';
    if (score >= 70) return 'Handles basic tasks correctly';
    return 'Suitable for simple tasks';
  };

  const getSpeedComment = (score, timeToFirst) => {
    if (timeToFirst) {
      if (timeToFirst < 1) return `Responds in ${timeToFirst.toFixed(1)}s - very fast`;
      if (timeToFirst < 3) return `Responds in ${timeToFirst.toFixed(1)}s - fast`;
      if (timeToFirst < 10) return `Responds in ${timeToFirst.toFixed(1)}s - average`;
      return `Responds in ${timeToFirst.toFixed(1)}s - slow`;
    }
    
    if (score >= 90) return 'Responds in 1-2 seconds';
    if (score >= 80) return 'Responds in 3-5 seconds';
    if (score >= 70) return 'Responds in 5-10 seconds';
    return 'Responds in 10+ seconds';
  };

  const getPriceComment = (price) => {
    if (price <= 0.001) return 'Very cheap - saves budget';
    if (price <= 0.01) return 'Affordable - good balance';
    if (price <= 0.02) return 'Average price - reasonable cost';
    return 'Expensive - premium quality';
  };

  const getModelAge = (releaseDate) => {
    if (!releaseDate) return '';
    const release = new Date(releaseDate);
    const now = new Date();
    const months = Math.floor((now - release) / (1000 * 60 * 60 * 24 * 30));
    
    if (months < 3) return '🆕 New model';
    if (months < 12) return `📅 ${months} months ago`;
    return `📅 ${Math.floor(months / 12)} years ago`;
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
    if (score >= 90) return 'Perfect match for your criteria';
    if (score >= 80) return 'Excellent fit for your tasks';
    if (score >= 70) return 'Good compromise for your needs';
    if (score >= 60) return 'Acceptable option with minor compromises';
    if (score >= 50) return 'Average option - better alternatives exist';
    return 'Poor match for your criteria';
  };

  const calculatePricePerWord = (pricePerToken, inputLang, outputLang) => {
    const tokenRatios = {
      'en': 0.75, 'ua': 0.5, 'de': 1.2, 'fr': 1.1, 'es': 1.0, 'zh': 1.8
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

  // Enhanced Drag & Drop functions with animations
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
    const totalImportance = Object.values(formData.priorityImportance).reduce((a, b) => a + b, 0);
    
    const weights = {};
    formData.priorityOrder.forEach((key, index) => {
      const positionMultiplier = index === 0 ? 1.2 : index === 1 ? 1.0 : 0.8;
      const importance = formData.priorityImportance[key];
      weights[key] = (importance * positionMultiplier) / totalImportance;
    });

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
  
  const getModelRank = (model, models, metric) => {
    const sorted = models.sort((a, b) => b[metric] - a[metric]);
    const rank = sorted.findIndex(m => m.id === model.id) + 1;
    const percentile = Math.round((1 - rank / models.length) * 100);
    return { rank, percentile };
  };

  const getUniqueFeature = (model, models) => {
    const features = [];
    
    // Newest model
    if (model.release_date) {
      const modelDate = new Date(model.release_date);
      const newestDate = Math.max(...models.map(m => m.release_date ? new Date(m.release_date) : 0));
      if (modelDate.getTime() === newestDate) {
        features.push({ label: "Newest Model", color: "bg-green-100 text-green-700" });
      }
    }
    
    // Fastest
    const fastestSpeed = Math.max(...models.map(m => m.speed_score));
    if (model.speed_score === fastestSpeed) {
      features.push({ label: "Fastest Response", color: "bg-orange-100 text-orange-700" });
    }
    
    // Best value (price/quality ratio)
    const valueScore = model.quality_score / (model.price_per_1k_tokens * 1000 + 1);
    const bestValue = Math.max(...models.map(m => m.quality_score / (m.price_per_1k_tokens * 1000 + 1)));
    if (Math.abs(valueScore - bestValue) < 0.01) {
      features.push({ label: "Best Value", color: "bg-blue-100 text-blue-700" });
    }
    
    // Highest quality
    const highestQuality = Math.max(...models.map(m => m.quality_score));
    if (model.quality_score === highestQuality) {
      features.push({ label: "Highest Quality", color: "bg-purple-100 text-purple-700" });
    }
    
    return features[0] || null;
  };

  const getRecommendedModels = () => {
    return models
      .map(model => ({
        ...model,
        best_for: getModelSpecialization(model, formData.taskTypes),
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
          {/* Logo and description */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-blue-600 mb-4">
              GetBestAI
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Smart AI model selection for your tasks. We compare quality, speed and cost 
              to find the perfect solution.
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
              Step 1 of 2: Parameter setup
            </div>
          </div>

          {/* Task Types Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Task Types 
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              💡 Choose what you plan to do with AI. This helps select specialized models.
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

          {/* Priority Ranking - Enhanced Drag & Drop */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Arrange priorities by importance</h3>
            <p className="text-sm text-gray-500 mb-4">💡 Drag criteria to the right positions and adjust importance with slider (1-10)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {[0, 1, 2].map(position => {
                const priorityKey = formData.priorityOrder[position];
                const item = priorityItems.find(p => p.key === priorityKey);
                const isDropTarget = dragOver === position;
                
                // Color coding for criteria
                const getItemColors = (key) => {
                  switch(key) {
                    case 'quality': return { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' };
                    case 'speed': return { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' };
                    case 'budget': return { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' };
                    default: return { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' };
                  }
                };
                
                const colors = getItemColors(priorityKey);
                
                return (
                  <div key={position} className="border-2 border-blue-300 bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl p-4 sm:p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
                    {/* Blue block - medal (static) with animation */}
                    <div className="flex items-center justify-center mb-4 p-3 bg-white rounded-lg shadow-md transition-all duration-300 hover:scale-105">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all duration-300 hover:scale-110 ${
                        position === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                        position === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' : 
                        'bg-gradient-to-br from-amber-500 to-amber-700'
                      }`}>
                        {position === 0 ? '🥇' : position === 1 ? '🥈' : '🥉'}
                      </div>
                      <span className="ml-3 text-sm sm:text-base font-semibold text-gray-700">{position + 1} place</span>
                    </div>
                    
                    {/* Dropzone for red card with enhanced animation */}
                    <div
                      onDragOver={handleDragOver}
                      onDragEnter={(e) => handleDragEnter(e, position)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, position)}
                      className={`min-h-32 sm:min-h-28 mb-4 border-3 border-dashed rounded-xl transition-all duration-300 ${
                        isDropTarget 
                          ? 'border-red-400 bg-red-50 scale-105 shadow-lg animate-pulse' 
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {item && (
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, position)}
                          onDragEnd={handleDragEnd}
                          className={`h-full p-4 border-2 ${colors.border} ${colors.bg} rounded-lg cursor-move transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:rotate-1 active:scale-95 touch-manipulation`}
                          style={{ userSelect: 'none' }}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl sm:text-2xl">{item.icon}</span>
                            <div className={`font-semibold text-sm sm:text-base ${colors.text}`}>{item.label}</div>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.description}</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Blue block - slider (static) with dynamic colors */}
                    <div className="p-4 bg-white rounded-lg shadow-md text-center">
                      <div className="text-xs sm:text-sm text-gray-600 mb-2 font-medium">Importance</div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.priorityImportance[priorityKey] || 5}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          priorityImportance: {
                            ...prev.priorityImportance,
                            [priorityKey]: parseInt(e.target.value)
                          }
                        }))}
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer transition-all duration-200 slider"
                        style={{
                          background: `linear-gradient(to right, 
                            ${formData.priorityImportance[priorityKey] <= 3 ? '#ef4444' : 
                              formData.priorityImportance[priorityKey] <= 6 ? '#f59e0b' : '#10b981'} 0%, 
                            ${formData.priorityImportance[priorityKey] <= 3 ? '#ef4444' : 
                              formData.priorityImportance[priorityKey] <= 6 ? '#f59e0b' : '#10b981'} ${(formData.priorityImportance[priorityKey] || 5) * 10}%, 
                            #e5e7eb ${(formData.priorityImportance[priorityKey] || 5) * 10}%, 
                            #e5e7eb 100%)`
                        }}
                      />
                      <div className={`text-base sm:text-lg font-bold mt-2 transition-colors duration-300 ${
                        formData.priorityImportance[priorityKey] <= 3 ? 'text-red-600' :
                        formData.priorityImportance[priorityKey] <= 6 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {formData.priorityImportance[priorityKey] || 5}/10
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formData.priorityImportance[priorityKey] <= 3 ? 'Low' :
                        formData.priorityImportance[priorityKey] <= 6 ? 'Medium' : 'High'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* CSS styles for slider */}
            <style jsx>{`
              .slider::-webkit-slider-thumb {
                appearance: none;
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: #ffffff;
                border: 2px solid currentColor;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                transition: all 0.2s ease;
              }
              
              .slider::-webkit-slider-thumb:hover {
                transform: scale(1.2);
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              }
              
              .slider::-moz-range-thumb {
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: #ffffff;
                border: 2px solid currentColor;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
              }
              
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
              }
              
              .animate-pulse {
                animation: pulse 1.5s infinite;
              }
              
              @media (max-width: 640px) {
                .touch-manipulation {
                  touch-action: manipulation;
                  min-height: 60px;
                }
              }
            `}</style>
          </div>

          {/* Languages */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Working Languages</h3>
            <p className="text-sm text-gray-500 mb-4">
              💡 Different languages have different tokenization efficiency, which affects cost.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Input Language
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
                  Output Language
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
            Find Models
            <span>→</span>
          </button>
         
          {formData.taskTypes.length === 0 && (
            <p className="text-center text-sm text-red-500 mt-2">
              Please select at least one task type
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
              ← Change Parameters
            </button>
           
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">1</div>
                <div className="w-12 h-1 mx-2 bg-blue-600" />
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">2</div>
              </div>
              <div className="text-center text-sm text-gray-600">
                Step 2 of 2: Selection Results
              </div>
            </div>
           
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Recommendations for You
            </h1>
            <p className="text-gray-600 mb-4">
              Ranked by your priorities: {formData.priorityOrder.map((p, i) => 
                `${i + 1}. ${priorityItems.find(item => item.key === p)?.label}`
              ).join(', ')}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Analyzed {models.length} models, showing top 5. 
              Data from <a href="https://artificialanalysis.ai/" className="text-blue-600">Artificial Analysis</a>
              {models === mockModels ? ' (demo mode)' : ''}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Analyzing all available models...</span>
            </div>
          ) : (
            <>

              {/* Model Cards */}
              <div className="space-y-6">
                {recommendedModels.slice(0, 5).map((model, index) => {
                  const uniqueFeature = getUniqueFeature(model, models);
                  const qualityRank = getModelRank(model, models, 'quality_score');
                  const speedRank = getModelRank(model, models, 'speed_score');
                  
                  return (
                    <div key={model.id} 
                        className={`bg-white rounded-lg shadow-lg p-4 sm:p-6 border-l-4 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                          index === 0 ? 'border-yellow-500 bg-gradient-to-r from-yellow-50 to-white' :
                          index === 1 ? 'border-gray-400 bg-gradient-to-r from-gray-50 to-white' :
                          index === 2 ? 'border-amber-500 bg-gradient-to-r from-amber-50 to-white' :
                          'border-blue-500'
                        }`}>
                      
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-2xl sm:text-3xl">{getMedalEmoji(index + 1)}</span>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="text-lg sm:text-xl font-bold text-gray-800">{model.name}</h3>
                              <span className="text-sm text-gray-500">by {model.creator}</span>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                {getModelAge(model.release_date)}
                              </span>
                            </div>
                            
                            {/* Unique features */}
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className="text-xs sm:text-sm text-blue-600 font-medium">
                                {index === 0 && "🥇 Best choice for your tasks"}
                                {index === 1 && "🥈 Great alternative"}
                                {index === 2 && "🥉 Good budget option"}
                                {index === 3 && "⭐ Worthy option"}
                                {index === 4 && "⭐ Alternative choice"}
                              </span>
                              {uniqueFeature && (
                                <span className={`text-xs px-2 py-1 rounded-full ${uniqueFeature.color}`}>
                                  ✨ {uniqueFeature.label}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center sm:text-right">
                          <div className="text-2xl sm:text-3xl font-bold text-blue-600">{model.score}/100</div>
                          <div className="text-sm text-gray-500">match</div>
                          <div className="text-xs text-gray-400 mt-1 max-w-32">
                            {getScoreComment(model.score)}
                          </div>
                        </div>
                      </div>

                      {/* Metrics with progress bars */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              {formData.taskTypes.includes('coding') ? 'Coding' : 'Quality'}
                            </span>
                            <span className="text-sm text-blue-600">
                              Top {qualityRank.percentile}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                            <div className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000" 
                                style={{width: `${getTaskSpecificScore(model, formData.taskTypes)}%`}}>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold">{getTaskSpecificScore(model, formData.taskTypes)}/100</span>
                            <span className="text-gray-500">{getQualityComment(getTaskSpecificScore(model, formData.taskTypes))}</span>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Speed</span>
                            <span className="text-sm text-orange-600">
                              Top {speedRank.percentile}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                            <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-1000" 
                                style={{width: `${model.speed_score}%`}}>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold">{model.speed_score}/100</span>
                            <span className="text-gray-500">{getSpeedComment(model.speed_score, model.time_to_first_token)}</span>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Pricing</span>
                            <span className="text-sm text-blue-600">
                              ${(model.price_per_1k_tokens * 100).toFixed(2)} per 100K
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                            <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-1000" 
                                style={{width: `${Math.max(0, 100 - (model.price_per_1k_tokens * 1000))}%`}}>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold">
                              ${calculatePricePerWord(model.price_per_1k_tokens, formData.inputLanguage, formData.outputLanguage)} per word
                            </span>
                            <span className="text-gray-500">{getPriceComment(model.price_per_1k_tokens)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Specialization and description */}
                      <div className="mb-4">
                        <p className="text-gray-700 mb-2">{model.description}</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                            Specialization:
                          </span>
                          {model.best_for?.map(feature => (
                            <span key={feature} className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                              {feature}
                            </span>
                          ))}
                          {formData.taskTypes.includes('coding') && model.coding_score && (
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm">
                              Code: {model.coding_score}/100
                            </span>
                          )}
                          {(formData.taskTypes.includes('analysis') || formData.taskTypes.includes('qa')) && model.math_score && (
                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-sm">
                              Math: {model.math_score}/100
                            </span>
                          )}
                        </div>
                        <a
                          href="https://artificialanalysis.ai/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Detailed data on Artificial Analysis →
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}           
        </div>
      </div>
    );
  }
};

export default App;