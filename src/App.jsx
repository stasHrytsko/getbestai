import React, { useState } from 'react';
import {
  Globe, PenLine, HelpCircle, Code2, Sparkles, BarChart2,
  Zap, Star, DollarSign, Check, ChevronDown, ChevronUp,
  GripVertical, X, SlidersHorizontal, ArrowLeft, Loader2
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const TASK_TYPES = [
  { id: 'translation', name: 'Text Translation', description: 'Translation between languages, localization', Icon: Globe },
  { id: 'generation',  name: 'Text Generation',  description: 'Creating articles, posts, content',          Icon: PenLine },
  { id: 'qa',          name: 'Question Answering',description: 'Information search and explanations',         Icon: HelpCircle },
  { id: 'coding',      name: 'Code Writing',      description: 'Programming and debugging',                   Icon: Code2 },
  { id: 'creative',    name: 'Creative Tasks',    description: 'Stories, poetry, scripts',                   Icon: Sparkles },
  { id: 'analysis',    name: 'Data Analysis',     description: 'Data processing and interpretation',          Icon: BarChart2 },
];

const LANGUAGES = [
  { id: 'en', name: 'English',    flag: '🇺🇸' },
  { id: 'ua', name: 'Українська', flag: '🇺🇦' },
  { id: 'de', name: 'Deutsch',    flag: '🇩🇪' },
  { id: 'fr', name: 'Français',  flag: '🇫🇷' },
  { id: 'es', name: 'Español',   flag: '🇪🇸' },
  { id: 'zh', name: '中文',       flag: '🇨🇳' },
];

const PROVIDERS = ['OpenAI', 'Anthropic', 'Google', 'Mistral', 'Cohere', 'Meta'];

const PRIORITY_ITEMS = [
  {
    key: 'quality',
    label: 'Result Quality',
    Icon: Star,
    description: 'Accuracy, creativity, depth of responses',
    color: { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700', pill: 'bg-emerald-100 text-emerald-700' },
  },
  {
    key: 'speed',
    label: 'Work Speed',
    Icon: Zap,
    description: 'Time from request to response',
    color: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700', pill: 'bg-amber-100 text-amber-700' },
  },
  {
    key: 'budget',
    label: 'Economy',
    Icon: DollarSign,
    description: 'Model usage cost',
    color: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', pill: 'bg-blue-100 text-blue-700' },
  },
];

// Position-based weights: 1st → 50%, 2nd → 33%, 3rd → 17%
const POSITION_WEIGHTS = [0.50, 0.33, 0.17];

const TOKEN_RATIOS = { en: 0.75, ua: 0.5, de: 1.2, fr: 1.1, es: 1.0, zh: 1.8 };

const MOCK_MODELS = [
  {
    id: 'gpt-4-turbo', name: 'GPT-4 Turbo', creator: 'OpenAI',
    quality_score: 95, speed_score: 75, coding_score: 88, math_score: 92,
    price_per_1k_tokens: 0.03, release_date: '2024-04-09', time_to_first_token: 1.2,
    description: 'Most powerful model for complex tasks',
  },
  {
    id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', creator: 'Anthropic',
    quality_score: 88, speed_score: 85, coding_score: 82, math_score: 78,
    price_per_1k_tokens: 0.015, release_date: '2024-03-04', time_to_first_token: 0.9,
    description: 'Balanced model for most tasks',
  },
  {
    id: 'gemini-pro', name: 'Gemini Pro', creator: 'Google',
    quality_score: 82, speed_score: 90, coding_score: 75, math_score: 85,
    price_per_1k_tokens: 0.0005, release_date: '2023-12-06', time_to_first_token: 0.6,
    description: 'Fast and economical model',
  },
];

/* ─────────────────────────────────────────────────────────────
   TASK → METRIC MAPPING
───────────────────────────────────────────────────────────── */
function getQualityMetric(taskTypes) {
  if (taskTypes.includes('coding'))     return { label: 'Coding',               scoreKey: 'coding_score'   };
  if (taskTypes.includes('analysis'))   return { label: 'Reasoning',            scoreKey: 'math_score'     };
  if (taskTypes.includes('translation'))return { label: 'Translation Quality',  scoreKey: 'quality_score'  };
  if (taskTypes.includes('creative'))   return { label: 'Creativity',           scoreKey: 'quality_score'  };
  if (taskTypes.includes('generation')) return { label: 'Writing Quality',      scoreKey: 'quality_score'  };
  return                                       { label: 'Quality',              scoreKey: 'quality_score'  };
}

function getModelQualityScore(model, taskTypes) {
  const { scoreKey } = getQualityMetric(taskTypes);
  return model[scoreKey] ?? model.quality_score ?? 0;
}

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
function getModelSpecialization(model, userTaskTypes = []) {
  const coding  = model.evaluations?.artificial_analysis_coding_index       || 0;
  const math    = model.evaluations?.artificial_analysis_math_index         || 0;
  const general = model.evaluations?.artificial_analysis_intelligence_index || 0;

  if (userTaskTypes.includes('coding') && coding > 70)   return ['coding'];
  if (userTaskTypes.includes('analysis') && math > 70)   return ['math', 'analysis'];
  if (['translation','generation','qa','creative'].some(t => userTaskTypes.includes(t))) {
    if (general > coding && general > math) return ['language tasks', 'general intelligence'];
  }
  const specs = [];
  if (coding  > 80) specs.push('coding');
  if (math    > 80) specs.push('math');
  if (general > 85) specs.push('general intelligence');
  return specs.length ? specs : ['general'];
}

function getModelAge(releaseDate) {
  if (!releaseDate) return null;
  const months = Math.floor((Date.now() - new Date(releaseDate)) / (1000 * 60 * 60 * 24 * 30));
  if (months < 3)  return '🆕 New model';
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}

function getQualityComment(score) {
  if (score >= 90) return 'Handles complex tasks, understands nuances';
  if (score >= 80) return 'Performs most tasks well';
  if (score >= 70) return 'Handles basic tasks correctly';
  return 'Suitable for simple tasks';
}

function getSpeedComment(score, timeToFirst) {
  if (timeToFirst) {
    if (timeToFirst < 1)  return `${timeToFirst.toFixed(1)}s — very fast`;
    if (timeToFirst < 3)  return `${timeToFirst.toFixed(1)}s — fast`;
    if (timeToFirst < 10) return `${timeToFirst.toFixed(1)}s — average`;
    return                      `${timeToFirst.toFixed(1)}s — slow`;
  }
  if (score >= 90) return '1-2 seconds';
  if (score >= 80) return '3-5 seconds';
  if (score >= 70) return '5-10 seconds';
  return '10+ seconds';
}

function getPriceComment(price) {
  if (price <= 0.001) return 'Very cheap — saves budget';
  if (price <= 0.01)  return 'Affordable — good balance';
  if (price <= 0.02)  return 'Average price';
  return 'Premium pricing';
}

function getScoreComment(score) {
  if (score >= 90) return 'Perfect match';
  if (score >= 80) return 'Excellent fit';
  if (score >= 70) return 'Good compromise';
  if (score >= 60) return 'Acceptable option';
  return 'Average option';
}

function calculatePricePerWord(pricePerToken, inputLang, outputLang) {
  const inputRatio  = TOKEN_RATIOS[inputLang]  || 1;
  const outputRatio = TOKEN_RATIOS[outputLang] || 1;
  return (pricePerToken * (inputRatio + outputRatio) / 2).toFixed(6);
}

function getMedalEmoji(place) {
  return place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : '⭐';
}

/* ─────────────────────────────────────────────────────────────
   APP
───────────────────────────────────────────────────────────── */
const App = () => {
  const [step, setStep]     = useState(1);
  const [formData, setFormData] = useState({
    taskTypes:         [],
    priorityOrder:     ['quality', 'speed', 'budget'],
    inputLanguage:     'en',
    outputLanguage:    'en',
    excludedProviders: [],
  });
  const [models,          setModels]          = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [draggedItem,     setDraggedItem]     = useState(null);
  const [dragOver,        setDragOver]        = useState(null);
  const [advancedOpen,    setAdvancedOpen]    = useState(false);
  const [compareIds,      setCompareIds]      = useState([]);
  const [showCompareView, setShowCompareView] = useState(false);

  /* ── Score ── */
  const calculateModelScore = (model) => {
    const qualityNorm = getModelQualityScore(model, formData.taskTypes);
    const speedNorm   = model.speed_score;
    const priceNorm   = Math.max(0, 100 - model.price_per_1k_tokens * 1000);

    const scoreMap = { quality: qualityNorm, speed: speedNorm, budget: priceNorm };
    const total = formData.priorityOrder.reduce(
      (sum, key, i) => sum + scoreMap[key] * POSITION_WEIGHTS[i], 0
    );
    return Math.min(100, Math.round(total));
  };

  /* ── Unique badges ── */
  const getUniqueFeature = (model, allModels) => {
    const features = [];

    // Newest
    if (model.release_date) {
      const newestDate = Math.max(...allModels.map(m => m.release_date ? new Date(m.release_date) : 0));
      if (new Date(model.release_date).getTime() === newestDate)
        features.push({ label: 'Newest Model', colorClass: 'bg-green-100 text-green-700' });
    }

    // Fastest — only if this model actually has the highest speed_score
    // AND it's genuinely fast (time_to_first_token < 3s, or no ttft but speed_score ≥ 85)
    const fastestSpeed = Math.max(...allModels.map(m => m.speed_score));
    const isTrulyFast  = model.time_to_first_token
      ? model.time_to_first_token < 3
      : model.speed_score >= 85;
    if (model.speed_score === fastestSpeed && isTrulyFast)
      features.push({ label: 'Fastest Response', colorClass: 'bg-amber-100 text-amber-700' });

    // Best value
    const valueScore = model.quality_score / (model.price_per_1k_tokens * 1000 + 1);
    const bestValue  = Math.max(...allModels.map(m => m.quality_score / (m.price_per_1k_tokens * 1000 + 1)));
    if (Math.abs(valueScore - bestValue) < 0.01)
      features.push({ label: 'Best Value', colorClass: 'bg-blue-100 text-blue-700' });

    // Highest quality
    const highestQuality = Math.max(...allModels.map(m => m.quality_score));
    if (model.quality_score === highestQuality)
      features.push({ label: 'Highest Quality', colorClass: 'bg-purple-100 text-purple-700' });

    return features[0] || null;
  };

  /* ── Recommended list ── */
  const getRecommendedModels = () =>
    models
      .map(m => ({
        ...m,
        best_for: getModelSpecialization(m, formData.taskTypes),
        score:    calculateModelScore(m),
      }))
      .sort((a, b) => b.score - a.score);

  /* ── API ── */
  const fetchModelsFromAPI = async (excluded = []) => {
    setLoading(true);
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.data) {
          const formatted = result.data.data.map(m => {
            const inputPrice  = m.pricing?.price_1m_input_tokens  || 0;
            const outputPrice = m.pricing?.price_1m_output_tokens || 0;
            return {
              id:                m.id,
              name:              m.name,
              creator:           m.model_creator?.name || 'Unknown',
              quality_score:     Math.round(m.evaluations?.artificial_analysis_intelligence_index || 50),
              speed_score:       Math.min(100, Math.round((m.median_output_tokens_per_second || 50) / 2)),
              coding_score:      Math.round(m.evaluations?.artificial_analysis_coding_index || 50),
              math_score:        Math.round(m.evaluations?.artificial_analysis_math_index   || 50),
              price_per_1k_tokens: (inputPrice * 3 + outputPrice * 1) / 4 / 1000,
              release_date:      m.release_date || null,
              time_to_first_token: m.median_time_to_first_token_seconds || null,
              description:       `AI model from ${m.model_creator?.name || 'Unknown'}`,
            };
          });
          setModels(formatted.filter(m => !excluded.includes(m.creator)));
          return;
        }
      }
    } catch (_) { /* fall through */ }
    setModels(MOCK_MODELS.filter(m => !excluded.includes(m.creator)));
    setLoading(false);
  };

  const handleNextStep = async () => {
    await fetchModelsFromAPI(formData.excludedProviders);
    setStep(2);
  };

  /* ── Drag & Drop ── */
  const handleDragStart = (e, idx) => {
    setDraggedItem(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.45';
  };
  const handleDragEnd   = (e) => { e.target.style.opacity = '1'; setDraggedItem(null); setDragOver(null); };
  const handleDragOver  = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDragEnter = (e, idx) => { e.preventDefault(); if (draggedItem !== idx) setDragOver(idx); };
  const handleDragLeave = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX <= r.left || e.clientX >= r.right || e.clientY <= r.top || e.clientY >= r.bottom)
      setDragOver(null);
  };
  const handleDrop = (e, dropIdx) => {
    e.preventDefault();
    if (draggedItem === null) return;
    const newOrder = [...formData.priorityOrder];
    const [moved]  = newOrder.splice(draggedItem, 1);
    newOrder.splice(dropIdx, 0, moved);
    setFormData(p => ({ ...p, priorityOrder: newOrder }));
    setDraggedItem(null);
    setDragOver(null);
  };

  /* ── Comparison ── */
  const toggleCompare = (id) =>
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  /* ──────────────────────────────────────────────────────────
     STEP 1
  ────────────────────────────────────────────────────────── */
  if (step === 1) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 font-sans">
        <div className="max-w-3xl mx-auto px-4">

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-5xl font-extrabold text-blue-600 tracking-tight mb-3">GetBestAI</h1>
            <p className="text-gray-500 text-base max-w-xl mx-auto leading-relaxed">
              Smart AI model selection for your tasks. We compare quality, speed and cost
              to find the perfect solution.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">1</div>
            <div className="h-px w-16 bg-gray-300" />
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-semibold">2</div>
            <p className="ml-2 text-sm text-gray-400">Step 1 of 2 — Configure preferences</p>
          </div>

          {/* ── Task Types ── */}
          <section className="mb-10">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Task Types</h2>
            <p className="text-sm text-gray-400 mb-4">Select what you plan to do with AI. This helps us choose specialized models.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TASK_TYPES.map(({ id, name, description, Icon }) => {
                const active = formData.taskTypes.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => setFormData(p => ({
                      ...p,
                      taskTypes: p.taskTypes.includes(id)
                        ? p.taskTypes.filter(x => x !== id)
                        : [...p.taskTypes, id],
                    }))}
                    className={`relative p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                      active
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {/* Checkmark */}
                    {active && (
                      <span className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </span>
                    )}
                    <div className="flex items-center gap-3 mb-1">
                      <Icon
                        size={20}
                        className={active ? 'text-blue-600' : 'text-gray-400'}
                        strokeWidth={1.75}
                      />
                      <span className={`font-semibold text-sm ${active ? 'text-blue-700' : 'text-gray-800'}`}>
                        {name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 pl-8 leading-relaxed">{description}</p>
                  </button>
                );
              })}
            </div>

            {formData.taskTypes.length === 0 && (
              <p className="text-xs text-red-400 mt-2">Please select at least one task type to continue.</p>
            )}
          </section>

          {/* ── Priority Ranking ── */}
          <section className="mb-10">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Arrange priorities by importance</h2>
            <p className="text-sm text-gray-400 mb-5">
              Drag the cards to rank your priorities. Position automatically determines the weight
              <span className="ml-1 font-medium text-gray-500">(1st = 50% · 2nd = 33% · 3rd = 17%)</span>.
            </p>

            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map(position => {
                const key  = formData.priorityOrder[position];
                const item = PRIORITY_ITEMS.find(p => p.key === key);
                if (!item) return null;
                const { Icon, color } = item;
                const isTarget = dragOver === position;

                const positionLabels  = ['1st Priority', '2nd Priority', '3rd Priority'];
                const positionWeights = ['50%', '33%', '17%'];
                const medalColors = [
                  'from-yellow-400 to-yellow-500',
                  'from-slate-400 to-slate-500',
                  'from-amber-500 to-amber-600',
                ];

                return (
                  <div
                    key={position}
                    onDragOver={handleDragOver}
                    onDragEnter={e => handleDragEnter(e, position)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, position)}
                    className={`relative rounded-2xl border-2 transition-all duration-200 ${
                      isTarget
                        ? 'border-blue-400 bg-blue-50 scale-[1.03] shadow-lg'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Position header */}
                    <div className={`px-4 pt-4 pb-2 flex items-center gap-2`}>
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${medalColors[position]} flex items-center justify-center text-white text-xs font-bold shadow`}>
                        {position + 1}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600">{positionLabels[position]}</p>
                        <p className="text-xs text-gray-400">weight: {positionWeights[position]}</p>
                      </div>
                    </div>

                    {/* Draggable card */}
                    <div
                      draggable
                      onDragStart={e => handleDragStart(e, position)}
                      onDragEnd={handleDragEnd}
                      className={`mx-3 mb-3 p-3 rounded-xl border ${color.border} ${color.bg} cursor-grab active:cursor-grabbing transition-all duration-150 select-none`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <GripVertical size={14} className="text-gray-300 shrink-0" />
                        <Icon size={16} className={color.text} strokeWidth={2} />
                        <span className={`font-semibold text-sm ${color.text}`}>{item.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 pl-8 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Advanced Settings (accordion) ── */}
          <section className="mb-10">
            <button
              onClick={() => setAdvancedOpen(o => !o)}
              className="w-full flex items-center justify-between p-4 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors duration-200"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <SlidersHorizontal size={16} className="text-gray-500" />
                Advanced Settings
                <span className="text-xs font-normal text-gray-400">(Languages · Providers)</span>
              </div>
              {advancedOpen
                ? <ChevronUp size={16} className="text-gray-500" />
                : <ChevronDown size={16} className="text-gray-500" />}
            </button>

            {advancedOpen && (
              <div className="mt-3 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-6">

                {/* Working Languages */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Working Languages</h3>
                  <p className="text-xs text-gray-400 mb-3">Different languages affect tokenization efficiency and cost.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Input Language</label>
                      <select
                        value={formData.inputLanguage}
                        onChange={e => setFormData(p => ({ ...p, inputLanguage: e.target.value }))}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 outline-none"
                      >
                        {LANGUAGES.map(l => (
                          <option key={l.id} value={l.id}>{l.flag} {l.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Output Language</label>
                      <select
                        value={formData.outputLanguage}
                        onChange={e => setFormData(p => ({ ...p, outputLanguage: e.target.value }))}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 outline-none"
                      >
                        {LANGUAGES.map(l => (
                          <option key={l.id} value={l.id}>{l.flag} {l.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Model Providers */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Model Providers</h3>
                  <p className="text-xs text-gray-400 mb-3">Uncheck providers you want to exclude from results.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PROVIDERS.map(provider => {
                      const checked = !formData.excludedProviders.includes(provider);
                      return (
                        <label key={provider} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={e => setFormData(p => ({
                              ...p,
                              excludedProviders: e.target.checked
                                ? p.excludedProviders.filter(x => x !== provider)
                                : [...p.excludedProviders, provider],
                            }))}
                            className="w-4 h-4 rounded accent-blue-600"
                          />
                          <span className="text-sm text-gray-700">{provider}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ── CTA ── */}
          <button
            onClick={handleNextStep}
            disabled={formData.taskTypes.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            Find Best Models →
          </button>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────
     STEP 2
  ────────────────────────────────────────────────────────── */
  if (step === 2) {
    const recommendedModels = getRecommendedModels();
    const { label: qualityLabel } = getQualityMetric(formData.taskTypes);

    const selectedTaskNames = formData.taskTypes.map(
      id => TASK_TYPES.find(t => t.id === id)?.name
    ).filter(Boolean).join(', ') || 'All tasks';

    const prioritySummary = formData.priorityOrder
      .map(key => PRIORITY_ITEMS.find(p => p.key === key)?.label)
      .filter(Boolean)
      .join(' › ');

    // Models selected for comparison
    const compareModels = recommendedModels.filter(m => compareIds.includes(m.id));

    /* ── Compare table view ── */
    if (showCompareView && compareModels.length >= 2) {
      return (
        <div className="min-h-screen bg-slate-50 py-10 font-sans">
          <div className="max-w-5xl mx-auto px-4">
            <button
              onClick={() => setShowCompareView(false)}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm mb-6"
            >
              <ArrowLeft size={15} /> Back to results
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-6">Model Comparison</h2>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full text-sm bg-white">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left p-4 text-gray-500 font-medium w-36">Metric</th>
                    {compareModels.map(m => (
                      <th key={m.id} className="text-center p-4 font-semibold text-gray-800">{m.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { label: 'Creator',      render: m => m.creator },
                    { label: 'Match Score',  render: m => <span className="font-bold text-blue-600">{m.score}/100</span> },
                    { label: qualityLabel,   render: m => `${getModelQualityScore(m, formData.taskTypes)}/100` },
                    { label: 'Speed',        render: m => `${m.speed_score}/100` },
                    { label: 'Price / word', render: m => `$${calculatePricePerWord(m.price_per_1k_tokens, formData.inputLanguage, formData.outputLanguage)}` },
                    { label: 'Time to first token', render: m => m.time_to_first_token ? `${m.time_to_first_token.toFixed(1)}s` : '—' },
                    { label: 'Release Date', render: m => m.release_date || '—' },
                  ].map(({ label, render }) => (
                    <tr key={label} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-gray-500 font-medium">{label}</td>
                      {compareModels.map(m => (
                        <td key={m.id} className="p-4 text-center text-gray-700">{render(m)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 font-sans">

        {/* ── Sticky Context Header ── */}
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
          <div className="max-w-3xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-400 font-medium">Results for:</span>
              <span className="font-semibold text-gray-800">{selectedTaskNames}</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-400">Priority:</span>
              <span className="text-blue-600 font-medium">{prioritySummary}</span>
            </div>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft size={13} /> Change parameters
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">1</div>
            <div className="h-px w-16 bg-blue-500" />
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">2</div>
            <p className="ml-2 text-sm text-gray-400">Step 2 of 2 — Results</p>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-1">Recommendations for You</h1>
          <p className="text-sm text-gray-400 mb-8">
            Analyzed {models.length} models, showing top 5.{' '}
            Data from{' '}
            <a href="https://artificialanalysis.ai/" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
              Artificial Analysis
            </a>
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
              <Loader2 size={22} className="animate-spin text-blue-500" />
              <span className="text-sm">Analyzing all available models…</span>
            </div>
          ) : (
            <div className="space-y-5">
              {recommendedModels.slice(0, 5).map((model, index) => {
                const uniqueFeature   = getUniqueFeature(model, models);
                const qualityScore    = getModelQualityScore(model, formData.taskTypes);
                const speedPercentile = Math.round((1 - [...models].sort((a,b) => b.speed_score - a.speed_score).findIndex(m => m.id === model.id) / models.length) * 100);
                const isCompared      = compareIds.includes(model.id);

                const cardAccent = [
                  'border-yellow-400 bg-gradient-to-r from-yellow-50/70 to-white',
                  'border-slate-300 bg-gradient-to-r from-slate-50/70 to-white',
                  'border-amber-400 bg-gradient-to-r from-amber-50/70 to-white',
                  'border-blue-300',
                  'border-blue-300',
                ][index] || 'border-blue-200';

                return (
                  <div
                    key={model.id}
                    className={`bg-white rounded-2xl border-l-4 shadow-sm hover:shadow-md transition-all duration-200 ${cardAccent}`}
                  >
                    {/* Card top row */}
                    <div className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="text-2xl mt-0.5 shrink-0">{getMedalEmoji(index + 1)}</span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
                              <h3 className="font-bold text-gray-900 text-lg leading-tight">{model.name}</h3>
                              <span className="text-sm text-gray-400">by {model.creator}</span>
                              {getModelAge(model.release_date) && (
                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                  {getModelAge(model.release_date)}
                                </span>
                              )}
                            </div>

                            {/* Rank label + unique badge */}
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <span className="text-xs font-semibold text-blue-600">
                                {['🥇 Best choice', '🥈 Great alternative', '🥉 Good option', '⭐ Worthy option', '⭐ Alternative'][index]}
                              </span>
                              {uniqueFeature && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${uniqueFeature.colorClass}`}>
                                  {uniqueFeature.label}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right shrink-0">
                          <div className="text-3xl font-extrabold text-blue-600 leading-none">{model.score}</div>
                          <div className="text-xs text-gray-400">/ 100 match</div>
                          <div className="text-xs text-gray-400 mt-1">{getScoreComment(model.score)}</div>
                        </div>
                      </div>
                    </div>

                    {/* ── Metrics ── */}
                    <div className="grid grid-cols-3 gap-px bg-gray-100 border-t border-b border-gray-100">

                      {/* Quality / task-specific */}
                      <div className="bg-white px-4 py-3">
                        <p className="text-xs font-semibold text-emerald-600 mb-2">{qualityLabel}</p>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-1.5">
                          <div
                            className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-700"
                            style={{ width: `${qualityScore}%` }}
                          />
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-bold text-gray-800">{qualityScore}<span className="text-xs text-gray-400">/100</span></span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 leading-tight">{getQualityComment(qualityScore)}</p>
                      </div>

                      {/* Speed */}
                      <div className="bg-white px-4 py-3">
                        <p className="text-xs font-semibold text-amber-600 mb-2">Speed</p>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-1.5">
                          <div
                            className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full transition-all duration-700"
                            style={{ width: `${model.speed_score}%` }}
                          />
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-bold text-gray-800">{model.speed_score}<span className="text-xs text-gray-400">/100</span></span>
                          <span className="text-xs text-amber-600">Top {speedPercentile}%</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 leading-tight">{getSpeedComment(model.speed_score, model.time_to_first_token)}</p>
                      </div>

                      {/* Pricing */}
                      <div className="bg-white px-4 py-3">
                        <p className="text-xs font-semibold text-blue-600 mb-2">Economy</p>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-1.5">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(0, 100 - model.price_per_1k_tokens * 1000)}%` }}
                          />
                        </div>
                        {/* Prominent pricing */}
                        <div className="text-base font-extrabold text-gray-900 leading-none">
                          ${calculatePricePerWord(model.price_per_1k_tokens, formData.inputLanguage, formData.outputLanguage)}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 leading-tight">per word · {getPriceComment(model.price_per_1k_tokens)}</p>
                      </div>
                    </div>

                    {/* ── Technical Details (secondary) ── */}
                    <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {model.best_for?.map(tag => (
                          <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                        {formData.taskTypes.includes('coding') && model.coding_score && (
                          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">Code: {model.coding_score}/100</span>
                        )}
                        {(formData.taskTypes.includes('analysis') || formData.taskTypes.includes('qa')) && model.math_score && (
                          <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Math: {model.math_score}/100</span>
                        )}
                      </div>

                      {/* Compare checkbox */}
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-500 hover:text-gray-700 select-none">
                        <input
                          type="checkbox"
                          checked={isCompared}
                          onChange={() => toggleCompare(model.id)}
                          className="w-3.5 h-3.5 rounded accent-blue-600"
                        />
                        Compare
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Floating Compare Bar ── */}
        {compareIds.length >= 2 && !showCompareView && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl">
            <span className="text-sm font-medium">{compareIds.length} models selected</span>
            <button
              onClick={() => setShowCompareView(true)}
              className="bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold px-4 py-1.5 rounded-xl transition-colors"
            >
              Compare side-by-side →
            </button>
            <button
              onClick={() => setCompareIds([])}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    );
  }
};

export default App;
