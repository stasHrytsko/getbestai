import React, { useState } from 'react';
import {
  Globe, PenLine, HelpCircle, Code2, Sparkles, BarChart2,
  Zap, Star, DollarSign, Check, ChevronDown, ChevronUp,
  GripVertical, X, SlidersHorizontal, ArrowLeft, Loader2,
  TrendingUp,
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
    color: { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700' },
  },
  {
    key: 'speed',
    label: 'Work Speed',
    Icon: Zap,
    description: 'Time from request to response',
    color: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700' },
  },
  {
    key: 'budget',
    label: 'Economy',
    Icon: DollarSign,
    description: 'Model usage cost',
    color: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700' },
  },
];

// Position-based weights: 1st → 50%, 2nd → 33%, 3rd → 17%
const POSITION_WEIGHTS = [0.50, 0.33, 0.17];

// Task 5: monthly cost presets per task type
const TASK_PRESETS = {
  qa:          { inputTokens: 100,   outputTokens: 300,  defaultReqsPerDay: 20, label: 'Q&A' },
  generation:  { inputTokens: 200,   outputTokens: 1500, defaultReqsPerDay: 5,  label: 'Text Generation' },
  coding:      { inputTokens: 300,   outputTokens: 1000, defaultReqsPerDay: 15, label: 'Coding' },
  translation: { inputTokens: 500,   outputTokens: 500,  defaultReqsPerDay: 10, label: 'Translation' },
  analysis:    { inputTokens: 2000,  outputTokens: 1000, defaultReqsPerDay: 5,  label: 'Analysis' },
  creative:    { inputTokens: 150,   outputTokens: 2000, defaultReqsPerDay: 3,  label: 'Creative' },
};

const TOKEN_RATIOS = { en: 0.75, ua: 0.5, de: 1.2, fr: 1.1, es: 1.0, zh: 1.8 };

// Interactive tasks factor in TTFT for speed scoring (Task 3)
const INTERACTIVE_TASKS = new Set(['qa', 'creative', 'translation']);

const MOCK_MODELS = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    creator: 'OpenAI',
    quality_score: 95,    // intelligence_index
    coding_score:  88,    // coding_index
    math_score:    92,    // math_index
    output_tps:    150,   // tokens/sec
    price_per_1k_tokens:  0.030,
    price_input_per_1m:   20,
    price_output_per_1m:  60,
    release_date:  '2024-04',
    time_to_first_token:  1.2,
    ttft_answer:          1.2,
    description: 'Most powerful model for complex tasks',
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    creator: 'Anthropic',
    quality_score: 88,
    coding_score:  82,
    math_score:    78,
    output_tps:    170,
    price_per_1k_tokens:  0.015,
    price_input_per_1m:   10,
    price_output_per_1m:  30,
    release_date:  '2024-03',
    time_to_first_token:  0.9,
    ttft_answer:          0.9,
    description: 'Balanced model for most tasks',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    creator: 'Google',
    quality_score: 82,
    coding_score:  75,
    math_score:    85,
    output_tps:    180,
    price_per_1k_tokens:  0.0005,
    price_input_per_1m:   0.35,
    price_output_per_1m:  1.05,
    release_date:  '2023-12',
    time_to_first_token:  0.6,
    ttft_answer:          0.6,
    description: 'Fast and economical model',
  },
];

/* ─────────────────────────────────────────────────────────────
   TASK 1: TASK-SPECIFIC QUALITY SCORING
───────────────────────────────────────────────────────────── */

/** Label shown in the quality progress bar column */
function getTaskQualityLabel(taskTypes) {
  if (taskTypes.includes('coding'))     return 'Coding';
  if (taskTypes.includes('analysis'))   return 'Reasoning';
  if (taskTypes.includes('translation'))return 'Translation Quality';
  if (taskTypes.includes('creative'))   return 'Creativity';
  if (taskTypes.includes('generation')) return 'Writing Quality';
  return 'Quality';
}

/**
 * Weighted task-specific quality score (0–100).
 * Coding:   0.7 × coding_index  + 0.3 × intelligence_index  (fallback chain)
 * Analysis: 0.7 × math_index    + 0.3 × intelligence_index  (fallback chain)
 * Others:   intelligence_index → 50
 */
function getTaskQualityScore(model, taskTypes) {
  const intel  = model.quality_score;  // may be null
  const coding = model.coding_score;   // may be null
  const math   = model.math_score;     // may be null

  if (taskTypes.includes('coding')) {
    if (coding != null && intel != null) return Math.round(0.7 * coding + 0.3 * intel);
    return coding ?? intel ?? 50;
  }
  if (taskTypes.includes('analysis')) {
    if (math != null && intel != null) return Math.round(0.7 * math + 0.3 * intel);
    return math ?? intel ?? 50;
  }
  return intel ?? 50;
}

/* ─────────────────────────────────────────────────────────────
   TASK 3: TASK-AWARE SPEED SCORE
───────────────────────────────────────────────────────────── */

/**
 * Converts raw TTFT (seconds) to 0–100 score using a log scale.
 *   0.5s → ~86,  1s → ~76,  2s → ~62,  5s → ~37,  10s → ~16
 */
function ttftToScore(ttft) {
  return Math.round(Math.max(0, 100 - Math.log1p(ttft) * 35));
}

/**
 * Effective speed score for a model given the selected task types.
 * Interactive (qa, translation, creative): 40% TTFT + 60% throughput
 * Batch (coding, generation, analysis):    100% throughput
 * Fallback: if TTFT absent → throughput only, at full 100% weight.
 */
function getModelSpeedScore(model, taskTypes) {
  const tpsScore = Math.min(100, Math.round((model.output_tps || 50) / 2));
  const isInteractive = [...INTERACTIVE_TASKS].some(t => taskTypes.includes(t));

  if (isInteractive) {
    const ttft = model.ttft_answer ?? model.time_to_first_token ?? null;
    if (ttft != null) {
      return Math.round(0.4 * ttftToScore(ttft) + 0.6 * tpsScore);
    }
  }
  return tpsScore;
}

/* ─────────────────────────────────────────────────────────────
   TASK 5: MONTHLY COST
───────────────────────────────────────────────────────────── */

function calcMonthlyCost(model, taskTypes, requestsPerDay) {
  const primaryTask = [...taskTypes].find(t => TASK_PRESETS[t]) || 'qa';
  const { inputTokens, outputTokens } = TASK_PRESETS[primaryTask];
  const inCost  = (inputTokens  / 1_000_000) * (model.price_input_per_1m  || 0);
  const outCost = (outputTokens / 1_000_000) * (model.price_output_per_1m || 0);
  return (inCost + outCost) * requestsPerDay * 30;
}

function formatMonthlyCost(cost) {
  if (cost === 0)    return '$0.00/mo';
  if (cost < 0.005)  return '<$0.01/mo';
  return `$${cost.toFixed(2)}/mo`;
}

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

function getModelSpecialization(model, userTaskTypes = []) {
  if (userTaskTypes.includes('coding')   && (model.coding_score ?? 0) > 70) return ['coding'];
  if (userTaskTypes.includes('analysis') && (model.math_score   ?? 0) > 70) return ['math', 'analysis'];
  if (['translation', 'generation', 'qa', 'creative'].some(t => userTaskTypes.includes(t))) {
    const intel  = model.quality_score ?? 0;
    const coding = model.coding_score  ?? 0;
    const math   = model.math_score    ?? 0;
    if (intel > coding && intel > math) return ['language tasks', 'general intelligence'];
  }
  const specs = [];
  if ((model.coding_score  ?? 0) > 80) specs.push('coding');
  if ((model.math_score    ?? 0) > 80) specs.push('math');
  if ((model.quality_score ?? 0) > 85) specs.push('general intelligence');
  return specs.length ? specs : ['general'];
}

/** Task 6: handles both "YYYY-MM" and "YYYY-MM-DD" from the API */
function getModelAge(releaseDate) {
  if (!releaseDate) return null;
  // Normalise "2024-04" → "2024-04-01" so Date() parses correctly
  const normalized = /^\d{4}-\d{2}$/.test(releaseDate) ? `${releaseDate}-01` : releaseDate;
  const months = Math.floor((Date.now() - new Date(normalized)) / (1000 * 60 * 60 * 24 * 30));
  if (months < 3)  return '🆕 New';
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}

function getQualityComment(score) {
  if (score >= 90) return 'Handles complex tasks, understands nuances';
  if (score >= 80) return 'Performs most tasks well';
  if (score >= 70) return 'Handles basic tasks correctly';
  return 'Suitable for simple tasks';
}

function getSpeedComment(speedScore, ttft) {
  if (ttft != null) {
    if (ttft < 1)  return `${ttft.toFixed(1)}s first token — very fast`;
    if (ttft < 3)  return `${ttft.toFixed(1)}s first token — fast`;
    if (ttft < 10) return `${ttft.toFixed(1)}s first token — average`;
    return               `${ttft.toFixed(1)}s first token — slow`;
  }
  if (speedScore >= 90) return '1–2 seconds';
  if (speedScore >= 80) return '3–5 seconds';
  if (speedScore >= 70) return '5–10 seconds';
  return '10+ seconds';
}

function getScoreComment(score) {
  if (score >= 90) return 'Perfect match';
  if (score >= 80) return 'Excellent fit';
  if (score >= 70) return 'Good compromise';
  if (score >= 60) return 'Acceptable option';
  return 'Average option';
}

function getMedalEmoji(place) {
  return place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : '⭐';
}

/* ─────────────────────────────────────────────────────────────
   APP
───────────────────────────────────────────────────────────── */
const App = () => {
  const [step, setStep]         = useState(1);
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
  const [requestsPerDay,  setRequestsPerDay]  = useState(20); // Task 5

  /* ── Score (uses task-specific quality + task-aware speed) ── */
  const calculateModelScore = (model) => {
    const qualityNorm = getTaskQualityScore(model, formData.taskTypes);
    const speedNorm   = getModelSpeedScore(model, formData.taskTypes);
    // Task 2: free models (price = 0) get economy score 100
    const priceNorm   = model.price_per_1k_tokens != null
      ? Math.max(0, 100 - model.price_per_1k_tokens * 1000)
      : 100;

    const scoreMap = { quality: qualityNorm, speed: speedNorm, budget: priceNorm };
    const total = formData.priorityOrder.reduce(
      (sum, key, i) => sum + scoreMap[key] * POSITION_WEIGHTS[i], 0
    );
    return Math.min(100, Math.round(total));
  };

  /* ── Task 4: unique feature badges ── */
  const getUniqueFeature = (model, allModels, taskTypes) => {
    const features = [];

    // Newest model (Task 6: normalise YYYY-MM dates)
    if (model.release_date) {
      const toMs = d => {
        const n = /^\d{4}-\d{2}$/.test(d) ? `${d}-01` : d;
        return new Date(n).getTime();
      };
      const newestDate = Math.max(...allModels.map(m => m.release_date ? toMs(m.release_date) : 0));
      if (toMs(model.release_date) === newestDate)
        features.push({ label: 'Newest Model', colorClass: 'bg-green-100 text-green-700' });
    }

    // Fastest — must have highest speed_score AND genuinely fast TTFT
    const fastestSpeed = Math.max(...allModels.map(m => m.speed_score ?? 0));
    const isTrulyFast  = model.time_to_first_token != null
      ? model.time_to_first_token < 3
      : (model.speed_score ?? 0) >= 85;
    if ((model.speed_score ?? 0) === fastestSpeed && isTrulyFast)
      features.push({ label: 'Fastest Response', colorClass: 'bg-amber-100 text-amber-700' });

    // Highest quality (task-specific)
    const highestQ = Math.max(...allModels.map(m => getTaskQualityScore(m, taskTypes)));
    if (getTaskQualityScore(model, taskTypes) === highestQ)
      features.push({ label: 'Highest Quality', colorClass: 'bg-purple-100 text-purple-700' });

    return features[0] || null;
  };

  /* ── Recommended models with value scores (Task 4) ── */
  const getRecommendedModels = () => {
    const EPSILON = 0.01; // $/1M — prevents div-by-zero for free models

    const enriched = models.map(m => {
      const task_quality = getTaskQualityScore(m, formData.taskTypes);
      const speed_score  = getModelSpeedScore(m, formData.taskTypes);
      return {
        ...m,
        best_for:     getModelSpecialization(m, formData.taskTypes),
        task_quality,
        speed_score,
        score:        calculateModelScore(m),
        // raw value metric (unnormalized)
        _valueRaw:    task_quality / ((m.price_input_per_1m || 0) + EPSILON),
      };
    });

    // Normalise value score 0–100 across ALL models
    const vals   = enriched.map(m => m._valueRaw);
    const maxVal = Math.max(...vals, 1);
    const minVal = Math.min(...vals);

    return enriched
      .map(m => {
        const valueNorm = maxVal > minVal
          ? Math.round((m._valueRaw - minVal) / (maxVal - minVal) * 100)
          : 50;
        // Task 4 thresholds: top 10% → Best value, top 30% → Good value, bottom 20% → Premium
        const value_label =
          valueNorm >= 90 ? 'Best value'  :
          valueNorm >= 70 ? 'Good value'  :
          valueNorm <= 20 ? 'Premium'     : null;
        return { ...m, value_score: valueNorm, value_label };
      })
      .sort((a, b) => b.score - a.score);
  };

  /* ── API fetch (Task 2: blended price; Task 3: ttft_answer; Task 6: dates) ── */
  const fetchModelsFromAPI = async (excluded = []) => {
    setLoading(true);
    let loaded = false;
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.data) {
          const formatted = result.data.data.map(m => {
            const inputPer1M  = m.pricing?.price_1m_input_tokens  || 0;
            const outputPer1M = m.pricing?.price_1m_output_tokens || 0;

            // Task 2: prefer API blended field, fallback to manual 3:1 calculation
            const blendedPerM = m.pricing?.price_1m_blended_3_to_1 != null
              ? m.pricing.price_1m_blended_3_to_1
              : (inputPer1M * 3 + outputPer1M) / 4;

            // Task 1: store null when a benchmark is genuinely absent
            const qi = m.evaluations?.artificial_analysis_intelligence_index;
            const qc = m.evaluations?.artificial_analysis_coding_index;
            const qm = m.evaluations?.artificial_analysis_math_index;

            return {
              id:                  m.id,
              name:                m.name,
              creator:             m.model_creator?.name || 'Unknown',
              quality_score:       qi != null ? Math.round(qi) : null,
              coding_score:        qc != null ? Math.round(qc) : null,
              math_score:          qm != null ? Math.round(qm) : null,
              output_tps:          m.median_output_tokens_per_second || null,
              // Task 2: store per-1M prices for monthly cost (Task 5)
              price_per_1k_tokens: blendedPerM / 1000,
              price_input_per_1m:  inputPer1M,
              price_output_per_1m: outputPer1M,
              // Task 6: keep raw "YYYY-MM" string — getModelAge() normalises it
              release_date:        m.release_date || null,
              // Task 3: store both TTFT variants; prefer answer token latency
              time_to_first_token: m.median_time_to_first_token_seconds || null,
              ttft_answer:         m.median_time_to_first_answer_token  || null,
              description:         `AI model from ${m.model_creator?.name || 'Unknown'}`,
            };
          });
          setModels(formatted.filter(m => !excluded.includes(m.creator)));
          loaded = true;
        }
      }
    } catch (err) {
      console.error('[fetchModels] error:', err);
    } finally {
      if (!loaded) {
        setModels(MOCK_MODELS.filter(m => !excluded.includes(m.creator)));
      }
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    // Task 5: set default requests/day from the primary selected task
    const primaryTask = formData.taskTypes.find(t => TASK_PRESETS[t]) || 'qa';
    setRequestsPerDay(TASK_PRESETS[primaryTask].defaultReqsPerDay);
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
                    {active && (
                      <span className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </span>
                    )}
                    <div className="flex items-center gap-3 mb-1">
                      <Icon size={20} className={active ? 'text-blue-600' : 'text-gray-400'} strokeWidth={1.75} />
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
                      isTarget ? 'border-blue-400 bg-blue-50 scale-[1.03] shadow-lg' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${medalColors[position]} flex items-center justify-center text-white text-xs font-bold shadow`}>
                        {position + 1}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600">
                          {['1st Priority', '2nd Priority', '3rd Priority'][position]}
                        </p>
                        <p className="text-xs text-gray-400">weight: {['50%', '33%', '17%'][position]}</p>
                      </div>
                    </div>
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

          {/* ── Advanced Settings ── */}
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
              {advancedOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </button>

            {advancedOpen && (
              <div className="mt-3 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Working Languages</h3>
                  <p className="text-xs text-gray-400 mb-3">Different languages affect tokenization efficiency and cost.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'inputLanguage',  label: 'Input Language'  },
                      { key: 'outputLanguage', label: 'Output Language' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                        <select
                          value={formData[key]}
                          onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                          className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 outline-none"
                        >
                          {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.flag} {l.name}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Model Providers</h3>
                  <p className="text-xs text-gray-400 mb-3">Uncheck providers you want to exclude from results.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PROVIDERS.map(provider => (
                      <label key={provider} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!formData.excludedProviders.includes(provider)}
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
                    ))}
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
    const qualityLabel      = getTaskQualityLabel(formData.taskTypes);
    const selectedTaskNames = formData.taskTypes
      .map(id => TASK_TYPES.find(t => t.id === id)?.name)
      .filter(Boolean).join(', ') || 'All tasks';
    const prioritySummary = formData.priorityOrder
      .map(key => PRIORITY_ITEMS.find(p => p.key === key)?.label)
      .filter(Boolean).join(' › ');
    const compareModels = recommendedModels.filter(m => compareIds.includes(m.id));

    // Task 4: best value among top-5 results
    const top5 = recommendedModels.slice(0, 5);
    const bestValueId = top5.reduce((best, m) => m.value_score > (best?.value_score ?? -1) ? m : best, null)?.id;

    // Task 5: monthly cost preset for current task
    const primaryTask = formData.taskTypes.find(t => TASK_PRESETS[t]) || 'qa';
    const preset      = TASK_PRESETS[primaryTask];

    /* ── Compare table view ── */
    if (showCompareView && compareModels.length >= 2) {
      return (
        <div className="min-h-screen bg-slate-50 py-10 font-sans">
          <div className="max-w-5xl mx-auto px-4">
            <button onClick={() => setShowCompareView(false)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm mb-6">
              <ArrowLeft size={15} /> Back to results
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Model Comparison</h2>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full text-sm bg-white">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left p-4 text-gray-500 font-medium w-40">Metric</th>
                    {compareModels.map(m => <th key={m.id} className="text-center p-4 font-semibold text-gray-800">{m.name}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { label: 'Creator',         render: m => m.creator },
                    { label: 'Match Score',      render: m => <span className="font-bold text-blue-600">{m.score}/100</span> },
                    { label: qualityLabel,       render: m => `${m.task_quality}/100` },
                    { label: 'Speed',            render: m => `${m.speed_score}/100` },
                    { label: 'Monthly Cost',     render: m => formatMonthlyCost(calcMonthlyCost(m, formData.taskTypes, requestsPerDay)) },
                    { label: 'Time to 1st Token',render: m => (m.ttft_answer ?? m.time_to_first_token) ? `${(m.ttft_answer ?? m.time_to_first_token).toFixed(1)}s` : '—' },
                    { label: 'Value Score',      render: m => `${m.value_score}/100` },
                    { label: 'Release',          render: m => m.release_date || '—' },
                  ].map(({ label, render }) => (
                    <tr key={label} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-gray-500 font-medium">{label}</td>
                      {compareModels.map(m => <td key={m.id} className="p-4 text-center text-gray-700">{render(m)}</td>)}
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
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
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
          <p className="text-sm text-gray-400 mb-6">
            Analyzed {models.length} models, showing top 5.{' '}
            Data from{' '}
            <a href="https://artificialanalysis.ai/" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
              Artificial Analysis
            </a>
          </p>

          {/* ── Task 5: Requests-per-day slider ── */}
          <div className="flex items-center gap-4 bg-slate-100 rounded-xl px-4 py-3 mb-6">
            <TrendingUp size={16} className="text-slate-500 shrink-0" />
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Requests per day:</span>
            <input
              type="range" min="1" max="200" value={requestsPerDay}
              onChange={e => setRequestsPerDay(Number(e.target.value))}
              className="flex-1 accent-blue-600 h-2 cursor-pointer"
            />
            <span className="text-sm font-bold text-blue-600 w-8 text-right">{requestsPerDay}</span>
            <span className="text-xs text-gray-400 whitespace-nowrap">({preset.inputTokens}↑ {preset.outputTokens}↓ tokens)</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
              <Loader2 size={22} className="animate-spin text-blue-500" />
              <span className="text-sm">Analyzing all available models…</span>
            </div>
          ) : (
            <div className="space-y-5">
              {top5.map((model, index) => {
                const uniqueFeature   = getUniqueFeature(model, models, formData.taskTypes);
                const speedPercentile = Math.round(
                  (1 - [...models]
                    .map(m => ({ id: m.id, s: getModelSpeedScore(m, formData.taskTypes) }))
                    .sort((a, b) => b.s - a.s)
                    .findIndex(m => m.id === model.id) / models.length) * 100
                );
                const isCompared    = compareIds.includes(model.id);
                const isBestValue   = model.id === bestValueId && index > 0; // show badge only if not already #1
                const monthlyCost   = calcMonthlyCost(model, formData.taskTypes, requestsPerDay);

                const cardAccent = [
                  'border-yellow-400 bg-gradient-to-r from-yellow-50/70 to-white',
                  'border-slate-300  bg-gradient-to-r from-slate-50/70 to-white',
                  'border-amber-400  bg-gradient-to-r from-amber-50/70 to-white',
                  'border-blue-300',
                  'border-blue-300',
                ][index] || 'border-blue-200';

                return (
                  <div key={model.id} className={`bg-white rounded-2xl border-l-4 shadow-sm hover:shadow-md transition-all duration-200 ${cardAccent}`}>

                    {/* ── Header row ── */}
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
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <span className="text-xs font-semibold text-blue-600">
                                {['🥇 Best choice', '🥈 Great alternative', '🥉 Good option', '⭐ Worthy option', '⭐ Alternative'][index]}
                              </span>
                              {uniqueFeature && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${uniqueFeature.colorClass}`}>
                                  {uniqueFeature.label}
                                </span>
                              )}
                              {/* Task 4: Best Value badge for top-value model that isn't already #1 */}
                              {isBestValue && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                                  Best Value
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-3xl font-extrabold text-blue-600 leading-none">{model.score}</div>
                          <div className="text-xs text-gray-400">/ 100 match</div>
                          <div className="text-xs text-gray-400 mt-1">{getScoreComment(model.score)}</div>
                        </div>
                      </div>
                    </div>

                    {/* ── Metrics grid ── */}
                    <div className="grid grid-cols-3 gap-px bg-gray-100 border-t border-b border-gray-100">

                      {/* Quality — task-specific label + weighted score */}
                      <div className="bg-white px-4 py-3">
                        <p className="text-xs font-semibold text-emerald-600 mb-2">{qualityLabel}</p>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-1.5">
                          <div
                            className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-700"
                            style={{ width: `${model.task_quality}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-800">{model.task_quality}<span className="text-xs text-gray-400">/100</span></span>
                        <p className="text-xs text-gray-400 mt-0.5 leading-tight">{getQualityComment(model.task_quality)}</p>
                      </div>

                      {/* Speed — task-aware (TTFT for interactive tasks) */}
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
                        <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                          {getSpeedComment(model.speed_score, model.ttft_answer ?? model.time_to_first_token)}
                        </p>
                      </div>

                      {/* Economy — monthly cost prominent, value label, bar */}
                      <div className="bg-white px-4 py-3">
                        <p className="text-xs font-semibold text-blue-600 mb-2">Economy</p>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-1.5">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(0, 100 - (model.price_per_1k_tokens || 0) * 1000)}%` }}
                          />
                        </div>
                        {/* Task 5: prominent monthly cost */}
                        <div className="text-base font-extrabold text-gray-900 leading-none">
                          {formatMonthlyCost(monthlyCost)}
                        </div>
                        {/* Task 4: value label in Economy section */}
                        <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                          {model.value_label
                            ? <span className={`font-medium ${model.value_label === 'Best value' ? 'text-blue-600' : model.value_label === 'Premium' ? 'text-rose-500' : 'text-emerald-600'}`}>{model.value_label}</span>
                            : 'Average value'
                          }
                          {' · '}at {requestsPerDay} req/day
                        </p>
                      </div>
                    </div>

                    {/* ── Technical tags + compare ── */}
                    <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {model.best_for?.map(tag => (
                          <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                        {formData.taskTypes.includes('coding') && model.coding_score != null && (
                          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">Code: {model.coding_score}/100</span>
                        )}
                        {(formData.taskTypes.includes('analysis') || formData.taskTypes.includes('qa')) && model.math_score != null && (
                          <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Math: {model.math_score}/100</span>
                        )}
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-500 hover:text-gray-700 select-none">
                        <input
                          type="checkbox" checked={isCompared}
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
            <button onClick={() => setCompareIds([])} className="text-gray-400 hover:text-white transition-colors" aria-label="Clear">
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    );
  }
};

export default App;
