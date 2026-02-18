import React, { useState } from 'react';
import {
  Globe, PenLine, HelpCircle, Code2, Sparkles, BarChart2,
  Zap, Star, DollarSign, Check, ChevronDown, ChevronUp,
  GripVertical, X, SlidersHorizontal, ArrowLeft, Loader2,
  TrendingUp,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const TASK_TYPES = [
  { id: 'translation', name: 'Translation', description: 'Between languages',     Icon: Globe },
  { id: 'generation',  name: 'Text Gen',    description: 'Articles & posts',      Icon: PenLine },
  { id: 'qa',          name: 'Q&A',         description: 'Search & explain',       Icon: HelpCircle },
  { id: 'coding',      name: 'Code',        description: 'Programming & debug',   Icon: Code2 },
  { id: 'creative',    name: 'Creative',    description: 'Stories & poetry',      Icon: Sparkles },
  { id: 'analysis',    name: 'Analysis',    description: 'Data & insights',       Icon: BarChart2 },
];

const LANGUAGES = [
  { id: 'en', name: 'English',    flag: '🇺🇸' },
  { id: 'ua', name: 'Українська', flag: '🇺🇦' },
  { id: 'de', name: 'Deutsch',    flag: '🇩🇪' },
  { id: 'fr', name: 'Français',   flag: '🇫🇷' },
  { id: 'es', name: 'Español',    flag: '🇪🇸' },
  { id: 'zh', name: '中文',        flag: '🇨🇳' },
];

const PROVIDERS = [
  'OpenAI', 'Anthropic', 'Google', 'Meta', 'Mistral', 'Cohere',
  'DeepSeek', 'Qwen', 'Microsoft', 'Amazon', 'AI21 Labs', 'Nvidia',
];

const PRIORITY_ITEMS = [
  {
    key: 'quality',
    label: 'Result Quality',
    Icon: Star,
    description: 'Accuracy and depth of responses',
  },
  {
    key: 'speed',
    label: 'Work Speed',
    Icon: Zap,
    description: 'Time from request to response',
  },
  {
    key: 'budget',
    label: 'Economy',
    Icon: DollarSign,
    description: 'Model usage cost',
  },
];

const PRIORITY_COLORS = {
  quality: { bar: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'text-emerald-600' },
  speed:   { bar: '#f59e0b', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   icon: 'text-amber-600'   },
  budget:  { bar: '#3b82f6', bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    icon: 'text-blue-600'    },
};

// Position-based weights: 1st → 50%, 2nd → 33%, 3rd → 17%
const POSITION_WEIGHTS = [0.50, 0.33, 0.17];
const WEIGHT_LABELS    = ['50%', '33%', '17%'];

// Task 5: monthly cost presets per task type
const TASK_PRESETS = {
  qa:          { inputTokens: 100,  outputTokens: 300,  defaultReqsPerDay: 20, label: 'Q&A' },
  generation:  { inputTokens: 200,  outputTokens: 1500, defaultReqsPerDay: 5,  label: 'Text Gen' },
  coding:      { inputTokens: 300,  outputTokens: 1000, defaultReqsPerDay: 15, label: 'Coding' },
  translation: { inputTokens: 500,  outputTokens: 500,  defaultReqsPerDay: 10, label: 'Translation' },
  analysis:    { inputTokens: 2000, outputTokens: 1000, defaultReqsPerDay: 5,  label: 'Analysis' },
  creative:    { inputTokens: 150,  outputTokens: 2000, defaultReqsPerDay: 3,  label: 'Creative' },
};

const TOKEN_RATIOS = { en: 0.75, ua: 0.5, de: 1.2, fr: 1.1, es: 1.0, zh: 1.8 };

// Interactive tasks factor in TTFT for speed scoring (Task 3)
const INTERACTIVE_TASKS = new Set(['qa', 'creative', 'translation']);

const MOCK_MODELS = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    creator: 'OpenAI',
    quality_score: 95,
    coding_score:  88,
    math_score:    92,
    output_tps:    150,
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
function getTaskQualityLabel(taskTypes) {
  if (taskTypes.includes('coding'))      return 'Coding';
  if (taskTypes.includes('analysis'))    return 'Reasoning';
  if (taskTypes.includes('translation')) return 'Translation Quality';
  if (taskTypes.includes('creative'))    return 'Creativity';
  if (taskTypes.includes('generation'))  return 'Writing Quality';
  return 'Quality';
}

function getTaskQualityScore(model, taskTypes) {
  const intel  = model.quality_score;
  const coding = model.coding_score;
  const math   = model.math_score;
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
function ttftToScore(ttft) {
  return Math.round(Math.max(0, 100 - Math.log1p(ttft) * 35));
}

function getModelSpeedScore(model, taskTypes) {
  const tpsScore    = Math.min(100, Math.round((model.output_tps || 50) / 2));
  const isInteractive = [...INTERACTIVE_TASKS].some(t => taskTypes.includes(t));
  if (isInteractive) {
    const ttft = model.ttft_answer ?? model.time_to_first_token ?? null;
    if (ttft != null) return Math.round(0.4 * ttftToScore(ttft) + 0.6 * tpsScore);
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
  if (cost === 0)   return '$0.00/mo';
  if (cost < 0.005) return '<$0.01/mo';
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

function getModelAge(releaseDate) {
  if (!releaseDate) return null;
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

/** Normalise API creator names to match PROVIDERS entries */
function normalizeCreator(name) {
  if (!name) return 'Unknown';
  const n = name.toLowerCase();
  if (n.includes('openai'))                          return 'OpenAI';
  if (n.includes('anthropic'))                       return 'Anthropic';
  if (n.includes('google') || n.includes('deepmind'))return 'Google';
  if (n.includes('meta') || n.includes('llama'))     return 'Meta';
  if (n.includes('mistral'))                         return 'Mistral';
  if (n.includes('cohere'))                          return 'Cohere';
  if (n.includes('deepseek'))                        return 'DeepSeek';
  if (n.includes('alibaba') || n.includes('qwen'))   return 'Qwen';
  if (n.includes('microsoft') || n.includes('phi'))  return 'Microsoft';
  if (n.includes('amazon') || n.includes('aws') || n.includes('titan')) return 'Amazon';
  if (n.includes('ai21'))                            return 'AI21 Labs';
  if (n.includes('nvidia') || n.includes('nemotron'))return 'Nvidia';
  return name;
}

/* ─────────────────────────────────────────────────────────────
   D1: SORTABLE PRIORITY ITEM (@dnd-kit)
───────────────────────────────────────────────────────────── */
function SortablePriorityItem({ id, item, position }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    zIndex: isDragging ? 10 : 'auto',
    position: 'relative',
  };

  const c = PRIORITY_COLORS[id];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3.5 rounded-xl border bg-white select-none ${
        isDragging
          ? 'shadow-xl opacity-50 border-gray-300'
          : 'shadow-sm border-gray-200'
      }`}
    >
      {/* Rank square */}
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-500 shrink-0">
        {position + 1}
      </div>

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        <GripVertical size={16} />
      </button>

      {/* Color bar */}
      <div
        className="w-0.5 h-9 rounded-full shrink-0"
        style={{ backgroundColor: c.bar }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`font-semibold text-sm ${c.text}`}>{item.label}</div>
        <div className="text-xs text-gray-400 mt-0.5 leading-snug">{item.description}</div>
      </div>

      {/* Weight badge */}
      <div className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
        {WEIGHT_LABELS[position]}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION LABEL (D5)
───────────────────────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <p className="text-[13px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-3">
      {children}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────
   APP
───────────────────────────────────────────────────────────── */
const App = () => {
  const [step, setStep]         = useState(1);
  const [formData, setFormData] = useState({
    taskTypes:         [],
    priorityOrder:     ['quality', 'speed', 'budget'],
    language:          'en',
    excludedProviders: [],
  });
  const [models,          setModels]          = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [advancedOpen,    setAdvancedOpen]    = useState(false);
  const [compareIds,      setCompareIds]      = useState([]);
  const [showCompareView, setShowCompareView] = useState(false);
  const [requestsPerDay,  setRequestsPerDay]  = useState(20);

  /* ── D1: @dnd-kit sensors ── */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDndEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setFormData(p => {
      const oldIdx = p.priorityOrder.indexOf(active.id);
      const newIdx = p.priorityOrder.indexOf(over.id);
      return { ...p, priorityOrder: arrayMove(p.priorityOrder, oldIdx, newIdx) };
    });
  };

  /* ── Score (computed inside getRecommendedModels with normalized budget) ── */

  /* ── Unique feature badges ── */
  const getUniqueFeature = (model, allModels, taskTypes) => {
    const features = [];
    if (model.release_date) {
      const toMs = d => { const n = /^\d{4}-\d{2}$/.test(d) ? `${d}-01` : d; return new Date(n).getTime(); };
      const newestDate = Math.max(...allModels.map(m => m.release_date ? toMs(m.release_date) : 0));
      if (toMs(model.release_date) === newestDate)
        features.push({ label: 'Newest Model', colorClass: 'bg-green-100 text-green-700' });
    }
    const fastestSpeed = Math.max(...allModels.map(m => m.speed_score ?? 0));
    const isTrulyFast  = model.time_to_first_token != null
      ? model.time_to_first_token < 3
      : (model.speed_score ?? 0) >= 85;
    if ((model.speed_score ?? 0) === fastestSpeed && isTrulyFast)
      features.push({ label: 'Fastest Response', colorClass: 'bg-amber-100 text-amber-700' });
    const highestQ = Math.max(...allModels.map(m => getTaskQualityScore(m, taskTypes)));
    if (getTaskQualityScore(model, taskTypes) === highestQ)
      features.push({ label: 'Highest Quality', colorClass: 'bg-purple-100 text-purple-700' });
    return features[0] || null;
  };

  /* ── Recommended models with value + budget scores ── */
  const getRecommendedModels = () => {
    const EPSILON = 0.01;

    // First pass: raw per-model metrics
    const raw = models.map(m => {
      const task_quality = getTaskQualityScore(m, formData.taskTypes);
      const speed_score  = getModelSpeedScore(m, formData.taskTypes);
      return {
        ...m,
        task_quality,
        speed_score,
        best_for:  getModelSpecialization(m, formData.taskTypes),
        _valueRaw: task_quality / ((m.price_input_per_1m || 0) + EPSILON),
      };
    });

    // Budget score: log-scale normalised 0–100 across ALL models.
    // Log scale prevents $0.001/1k and $0.002/1k both getting ≈99 while
    // expensive models get 70–80, giving a fairer distribution.
    const logPrices = raw.map(m => Math.log1p((m.price_per_1k_tokens || 0) * 1000));
    const minLog    = Math.min(...logPrices);
    const maxLog    = Math.max(...logPrices, minLog + 0.001);

    // Value score normalisation
    const vals   = raw.map(m => m._valueRaw);
    const maxVal = Math.max(...vals, 1);
    const minVal = Math.min(...vals);

    return raw
      .map(m => {
        // Cheaper = higher budget score (inverted, log scale)
        const logP         = Math.log1p((m.price_per_1k_tokens || 0) * 1000);
        const budget_score = Math.round((1 - (logP - minLog) / (maxLog - minLog)) * 100);

        const scoreMap = { quality: m.task_quality, speed: m.speed_score, budget: budget_score };
        const score    = Math.min(100, Math.round(
          formData.priorityOrder.reduce((sum, key, i) => sum + scoreMap[key] * POSITION_WEIGHTS[i], 0)
        ));

        const valueNorm = maxVal > minVal
          ? Math.round((m._valueRaw - minVal) / (maxVal - minVal) * 100) : 50;
        const value_label =
          valueNorm >= 90 ? 'Best value'  :
          valueNorm >= 70 ? 'Good value'  :
          valueNorm <= 20 ? 'Premium'     : null;

        return { ...m, budget_score, score, value_score: valueNorm, value_label };
      })
      .sort((a, b) => b.score - a.score);
  };

  /* ── API fetch ── */
  const fetchModelsFromAPI = async (excluded = []) => {
    setLoading(true);
    let loaded = false;

    // If ANY providers are unchecked, show ONLY the checked ones.
    // This ensures models from providers not in the list (xAI, etc.)
    // are also excluded when the user has made explicit selections.
    const activeProviders = new Set(PROVIDERS.filter(p => !excluded.includes(p)));
    const filterByProvider = (m) => {
      if (excluded.length === 0) return true; // all checked → show everything
      return activeProviders.has(m.creator);
    };
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.data) {
          const formatted = result.data.data.map(m => {
            const inputPer1M  = m.pricing?.price_1m_input_tokens  || 0;
            const outputPer1M = m.pricing?.price_1m_output_tokens || 0;
            const blendedPerM = m.pricing?.price_1m_blended_3_to_1 != null
              ? m.pricing.price_1m_blended_3_to_1
              : (inputPer1M * 3 + outputPer1M) / 4;
            const qi = m.evaluations?.artificial_analysis_intelligence_index;
            const qc = m.evaluations?.artificial_analysis_coding_index;
            const qm = m.evaluations?.artificial_analysis_math_index;
            return {
              id:                  m.id,
              name:                m.name,
              creator:             normalizeCreator(m.model_creator?.name),
              quality_score:       qi != null ? Math.round(qi) : null,
              coding_score:        qc != null ? Math.round(qc) : null,
              math_score:          qm != null ? Math.round(qm) : null,
              output_tps:          m.median_output_tokens_per_second || null,
              price_per_1k_tokens: blendedPerM / 1000,
              price_input_per_1m:  inputPer1M,
              price_output_per_1m: outputPer1M,
              release_date:        m.release_date || null,
              time_to_first_token: m.median_time_to_first_token_seconds || null,
              ttft_answer:         m.median_time_to_first_answer_token  || null,
              description:         `AI model from ${m.model_creator?.name || 'Unknown'}`,
            };
          });
          setModels(formatted.filter(filterByProvider));
          loaded = true;
        }
      }
    } catch (err) {
      console.error('[fetchModels] error:', err);
    } finally {
      if (!loaded) setModels(MOCK_MODELS.filter(filterByProvider));
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    const primaryTask = formData.taskTypes.find(t => TASK_PRESETS[t]) || 'qa';
    setRequestsPerDay(TASK_PRESETS[primaryTask].defaultReqsPerDay);
    await fetchModelsFromAPI(formData.excludedProviders);
    setStep(2);
  };

  const toggleCompare = (id) =>
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  /* ─────────────────────────────────────────────────────────────
     STEP 1
  ───────────────────────────────────────────────────────────── */
  if (step === 1) {
    const activeProviders = PROVIDERS.filter(p => !formData.excludedProviders.includes(p));

    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <div className="max-w-[480px] mx-auto px-4 pb-[132px] pt-8">

          {/* ── D5: Header ── */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[28px] font-bold text-gray-900 tracking-[-0.02em] leading-none">
                GetBestAI
              </h1>
              <span className="text-[11px] font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                401 models · Updated daily
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Compare quality, speed & cost to find the perfect AI.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">1</div>
            <div className="h-px w-10 bg-gray-300" />
            <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-semibold">2</div>
            <span className="ml-1 text-xs text-gray-400">Configure preferences</span>
          </div>

          {/* ── D2: Task Types — 3-column compact grid ── */}
          <section className="mb-8">
            <SectionLabel>What will you use it for?</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
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
                    className={`relative flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 transition-all duration-150 ${
                      active
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {active && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check size={9} className="text-white" strokeWidth={3} />
                      </span>
                    )}
                    <Icon
                      size={18}
                      className={active ? 'text-blue-600' : 'text-gray-400'}
                      strokeWidth={1.75}
                    />
                    <span className={`text-[13px] font-semibold leading-tight ${active ? 'text-blue-700' : 'text-gray-700'}`}>
                      {name}
                    </span>
                    <span className="text-[11px] text-gray-400 leading-tight text-center px-1">
                      {description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── D1: Priority Ranking — vertical @dnd-kit list ── */}
          <section className="mb-8">
            <SectionLabel>What matters most?</SectionLabel>
            <p className="text-xs text-gray-400 mb-3">
              Drag to rank · 1st&nbsp;=&nbsp;50%&nbsp;·&nbsp;2nd&nbsp;=&nbsp;33%&nbsp;·&nbsp;3rd&nbsp;=&nbsp;17%
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDndEnd}
            >
              <SortableContext
                items={formData.priorityOrder}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2">
                  {formData.priorityOrder.map((key, position) => {
                    const item = PRIORITY_ITEMS.find(p => p.key === key);
                    if (!item) return null;
                    return (
                      <SortablePriorityItem
                        key={key}
                        id={key}
                        item={item}
                        position={position}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </section>

          {/* ── D3: Advanced Settings ── */}
          <section className="mb-6">
            <button
              onClick={() => setAdvancedOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors duration-150"
            >
              <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-600 uppercase tracking-[0.06em]">
                <SlidersHorizontal size={14} className="text-gray-500" />
                Advanced
              </div>
              {advancedOpen
                ? <ChevronUp size={15} className="text-gray-400" />
                : <ChevronDown size={15} className="text-gray-400" />}
            </button>

            {advancedOpen && (
              <div className="mt-2 p-4 bg-white border border-slate-200 rounded-xl space-y-5">

                {/* D3: Single Working Language selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-[0.06em] mb-2">
                    Working Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={e => setFormData(p => ({ ...p, language: e.target.value }))}
                    className="w-full p-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 outline-none"
                  >
                    {LANGUAGES.map(l => (
                      <option key={l.id} value={l.id}>{l.flag} {l.name}</option>
                    ))}
                  </select>
                </div>

                {/* D3: Providers with Select All / None */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.06em]">
                      Providers
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFormData(p => ({ ...p, excludedProviders: [] }))}
                        className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                      >
                        All
                      </button>
                      <span className="text-gray-300 text-xs">·</span>
                      <button
                        onClick={() => setFormData(p => ({
                          ...p,
                          // Keep at least first provider active
                          excludedProviders: PROVIDERS.slice(1),
                        }))}
                        className="text-[11px] font-medium text-gray-500 hover:text-gray-700"
                      >
                        None
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                    {PROVIDERS.map(provider => {
                      const isActive = !formData.excludedProviders.includes(provider);
                      const isLastActive = isActive && activeProviders.length === 1;
                      return (
                        <label
                          key={provider}
                          className={`flex items-center gap-2 cursor-pointer ${isLastActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isActive}
                            disabled={isLastActive}
                            onChange={e => {
                              if (!e.target.checked && activeProviders.length <= 1) return;
                              setFormData(p => ({
                                ...p,
                                excludedProviders: e.target.checked
                                  ? p.excludedProviders.filter(x => x !== provider)
                                  : [...p.excludedProviders, provider],
                              }));
                            }}
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
        </div>

        {/* ── D4: Sticky CTA Button with gradient fade ── */}
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          {/* Gradient fade */}
          <div className="h-16 bg-gradient-to-t from-slate-50 to-transparent" />
          {/* Button container */}
          <div className="bg-slate-50 pb-5 px-4 pointer-events-auto">
            <div className="max-w-[480px] mx-auto">
              <button
                onClick={handleNextStep}
                disabled={formData.taskTypes.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 px-6 rounded-xl font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
              >
                Find Best Models →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     STEP 2
  ───────────────────────────────────────────────────────────── */
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

    const top5        = recommendedModels.slice(0, 5);
    const bestValueId = top5.reduce((best, m) => m.value_score > (best?.value_score ?? -1) ? m : best, null)?.id;
    const primaryTask = formData.taskTypes.find(t => TASK_PRESETS[t]) || 'qa';
    const preset      = TASK_PRESETS[primaryTask];

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
                    <th className="text-left p-4 text-gray-500 font-medium w-40">Metric</th>
                    {compareModels.map(m => (
                      <th key={m.id} className="text-center p-4 font-semibold text-gray-800">{m.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { label: 'Creator',          render: m => m.creator },
                    { label: 'Match Score',       render: m => <span className="font-bold text-blue-600">{m.score}/100</span> },
                    { label: qualityLabel,        render: m => `${m.task_quality}/100` },
                    { label: 'Speed',             render: m => `${m.speed_score}/100` },
                    { label: 'Monthly Cost',      render: m => formatMonthlyCost(calcMonthlyCost(m, formData.taskTypes, requestsPerDay)) },
                    { label: 'Time to 1st Token', render: m => (m.ttft_answer ?? m.time_to_first_token) ? `${(m.ttft_answer ?? m.time_to_first_token).toFixed(1)}s` : '—' },
                    { label: 'Budget Score',      render: m => `${m.budget_score}/100` },
                    { label: 'Value Score',       render: m => `${m.value_score}/100` },
                    { label: 'Release',           render: m => m.release_date || '—' },
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
          <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs min-w-0">
              <span className="text-gray-400">For:</span>
              <span className="font-semibold text-gray-800 truncate">{selectedTaskNames}</span>
              <span className="text-gray-300">·</span>
              <span className="text-blue-600 font-medium truncate">{prioritySummary}</span>
            </div>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 shrink-0"
            >
              <ArrowLeft size={12} /> Edit
            </button>
          </div>
        </div>

        <div className="max-w-[480px] mx-auto px-4 py-6">

          {/* Header */}
          <div className="mb-5">
            <h1 className="text-[22px] font-bold text-gray-900 tracking-[-0.02em] mb-0.5">
              Recommendations
            </h1>
            <p className="text-xs text-gray-400">
              Analyzed {models.length} models · top 5 shown ·{' '}
              <a href="https://artificialanalysis.ai/" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                Artificial Analysis
              </a>
            </p>
          </div>

          {/* ── Task 5: Requests-per-day slider ── */}
          <div className="flex items-center gap-3 bg-slate-100 rounded-xl px-4 py-2.5 mb-5">
            <TrendingUp size={14} className="text-slate-500 shrink-0" />
            <span className="text-xs font-medium text-gray-600 whitespace-nowrap">Req/day:</span>
            <input
              type="range" min="1" max="200" value={requestsPerDay}
              onChange={e => setRequestsPerDay(Number(e.target.value))}
              className="flex-1 accent-blue-600 h-1.5 cursor-pointer"
            />
            <span className="text-xs font-bold text-blue-600 w-8 text-right">{requestsPerDay}</span>
            <span className="text-[11px] text-gray-400 whitespace-nowrap">({preset.inputTokens}↑ {preset.outputTokens}↓ tok)</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
              <Loader2 size={22} className="animate-spin text-blue-500" />
              <span className="text-sm">Analyzing all available models…</span>
            </div>
          ) : (
            <div className="space-y-4">
              {top5.map((model, index) => {
                const uniqueFeature   = getUniqueFeature(model, models, formData.taskTypes);
                const speedPercentile = Math.round(
                  (1 - [...models]
                    .map(m => ({ id: m.id, s: getModelSpeedScore(m, formData.taskTypes) }))
                    .sort((a, b) => b.s - a.s)
                    .findIndex(m => m.id === model.id) / models.length) * 100
                );
                const isCompared  = compareIds.includes(model.id);
                const isBestValue = model.id === bestValueId && index > 0;
                const monthlyCost = calcMonthlyCost(model, formData.taskTypes, requestsPerDay);
                const cardAccent = [
                  'border-yellow-400 bg-gradient-to-r from-yellow-50/70 to-white',
                  'border-slate-300  bg-gradient-to-r from-slate-50/70 to-white',
                  'border-amber-400  bg-gradient-to-r from-amber-50/70 to-white',
                  'border-blue-300',
                  'border-blue-300',
                ][index] || 'border-blue-200';

                return (
                  <div key={model.id} className={`bg-white rounded-2xl border-l-4 shadow-sm hover:shadow-md transition-all duration-200 ${cardAccent}`}>

                    {/* Header row */}
                    <div className="p-4 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <span className="text-xl mt-0.5 shrink-0">{getMedalEmoji(index + 1)}</span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 mb-1">
                              <h3 className="font-bold text-gray-900 text-base leading-tight">{model.name}</h3>
                              <span className="text-xs text-gray-400">by {model.creator}</span>
                              {getModelAge(model.release_date) && (
                                <span className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                                  {getModelAge(model.release_date)}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 items-center">
                              <span className="text-xs font-semibold text-blue-600">
                                {['🥇 Best choice', '🥈 Great alternative', '🥉 Good option', '⭐ Worthy option', '⭐ Alternative'][index]}
                              </span>
                              {uniqueFeature && (
                                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${uniqueFeature.colorClass}`}>
                                  {uniqueFeature.label}
                                </span>
                              )}
                              {isBestValue && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                                  Best Value
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-2xl font-extrabold text-blue-600 leading-none">{model.score}</div>
                          <div className="text-[11px] text-gray-400">/ 100</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{getScoreComment(model.score)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Metrics grid */}
                    <div className="grid grid-cols-3 gap-px bg-gray-100 border-t border-b border-gray-100">
                      <div className="bg-white px-3 py-2.5">
                        <p className="text-[11px] font-semibold text-emerald-600 mb-1.5">{qualityLabel}</p>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                          <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-1.5 rounded-full" style={{ width: `${model.task_quality}%` }} />
                        </div>
                        <span className="text-sm font-bold text-gray-800">{model.task_quality}<span className="text-[11px] text-gray-400">/100</span></span>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{getQualityComment(model.task_quality)}</p>
                      </div>
                      <div className="bg-white px-3 py-2.5">
                        <p className="text-[11px] font-semibold text-amber-600 mb-1.5">Speed</p>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                          <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-1.5 rounded-full" style={{ width: `${model.speed_score}%` }} />
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-bold text-gray-800">{model.speed_score}<span className="text-[11px] text-gray-400">/100</span></span>
                          <span className="text-[11px] text-amber-600">Top {speedPercentile}%</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                          {getSpeedComment(model.speed_score, model.ttft_answer ?? model.time_to_first_token)}
                        </p>
                      </div>
                      <div className="bg-white px-3 py-2.5">
                        <p className="text-[11px] font-semibold text-blue-600 mb-1.5">Economy</p>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                          <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-1.5 rounded-full" style={{ width: `${model.budget_score ?? 0}%` }} />
                        </div>
                        <div className="text-sm font-extrabold text-gray-900 leading-none">
                          {formatMonthlyCost(monthlyCost)}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                          {model.value_label
                            ? <span className={`font-medium ${model.value_label === 'Best value' ? 'text-blue-600' : model.value_label === 'Premium' ? 'text-rose-500' : 'text-emerald-600'}`}>{model.value_label}</span>
                            : 'Average value'
                          }
                          {' · '}{requestsPerDay} req/d
                        </p>
                      </div>
                    </div>

                    {/* Tags + compare */}
                    <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {model.best_for?.map(tag => (
                          <span key={tag} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                        {formData.taskTypes.includes('coding') && model.coding_score != null && (
                          <span className="text-[11px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">Code: {model.coding_score}/100</span>
                        )}
                        {(formData.taskTypes.includes('analysis') || formData.taskTypes.includes('qa')) && model.math_score != null && (
                          <span className="text-[11px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Math: {model.math_score}/100</span>
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
              Compare →
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
