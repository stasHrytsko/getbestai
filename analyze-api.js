#!/usr/bin/env node
/**
 * analyze-api.js — анализ покрытия полей Artificial Analysis API
 *
 * Запуск:
 *   ARTIFICIAL_ANALYSIS_API_KEY=your_key node analyze-api.js
 *   или:
 *   node analyze-api.js your_key
 */

const API_KEY = process.env.ARTIFICIAL_ANALYSIS_API_KEY || process.argv[2];

if (!API_KEY) {
  console.error('❌  Передай ключ: ARTIFICIAL_ANALYSIS_API_KEY=xxx node analyze-api.js');
  process.exit(1);
}

async function main() {
  console.log('📡  Запрашиваем API…\n');

  const res = await fetch('https://artificialanalysis.ai/api/v2/data/llms/models', {
    headers: { 'x-api-key': API_KEY, 'User-Agent': 'GetBestAI/1.0' },
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error(`❌  HTTP ${res.status}: ${txt}`);
    process.exit(1);
  }

  const { data: models } = (await res.json());
  const total = models.length;
  console.log(`✅  Получено моделей: ${total}\n`);

  // ─── Поля для проверки ───────────────────────────────────────────────────
  const FIELDS = [
    // Identity
    { path: 'name',                                         label: 'name' },
    { path: 'slug',                                         label: 'slug' },
    { path: 'model_creator.name',                          label: 'model_creator.name' },
    { path: 'release_date',                                label: 'release_date ⚠️' },

    // Pricing
    { path: 'pricing.price_1m_blended_3_to_1',            label: 'pricing.blended' },
    { path: 'pricing.price_1m_input_tokens',               label: 'pricing.input' },
    { path: 'pricing.price_1m_output_tokens',              label: 'pricing.output' },

    // Performance
    { path: 'median_output_tokens_per_second',             label: 'output_tokens_per_sec' },
    { path: 'median_time_to_first_token_seconds',          label: 'time_to_first_token' },
    { path: 'median_time_to_first_answer_token',           label: 'time_to_first_answer' },

    // Evaluations — AA own
    { path: 'evaluations.artificial_analysis_intelligence_index', label: 'eval.intelligence_index' },
    { path: 'evaluations.artificial_analysis_coding_index',       label: 'eval.coding_index' },
    { path: 'evaluations.artificial_analysis_math_index',         label: 'eval.math_index' },

    // Evaluations — third-party
    { path: 'evaluations.mmlu_pro',        label: 'eval.mmlu_pro' },
    { path: 'evaluations.gpqa',            label: 'eval.gpqa' },
    { path: 'evaluations.hle',             label: 'eval.hle (Humanity Last Exam)' },
    { path: 'evaluations.livecodebench',   label: 'eval.livecodebench' },
    { path: 'evaluations.scicode',         label: 'eval.scicode' },
    { path: 'evaluations.math_500',        label: 'eval.math_500' },
    { path: 'evaluations.aime',            label: 'eval.aime' },
  ];

  function get(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }

  function hasValue(v) {
    return v !== null && v !== undefined && v !== '';
  }

  // ─── Подсчёт ─────────────────────────────────────────────────────────────
  const results = FIELDS.map(({ path, label }) => {
    const filled = models.filter(m => hasValue(get(m, path)));
    const pct    = ((filled.length / total) * 100).toFixed(1);
    const values = filled.map(m => get(m, path)).filter(v => typeof v === 'number');

    let stats = '';
    if (values.length > 0) {
      const min = Math.min(...values).toFixed(2);
      const max = Math.max(...values).toFixed(2);
      const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
      stats = `  min=${min}  avg=${avg}  max=${max}`;
    }

    return { label, filled: filled.length, pct, stats };
  });

  // ─── Вывод таблицы ───────────────────────────────────────────────────────
  const W = 42;
  console.log('─'.repeat(75));
  console.log(`${'Поле'.padEnd(W)} ${'Заполнено'.padStart(10)}  ${'%'.padStart(6)}  Диапазон`);
  console.log('─'.repeat(75));

  for (const { label, filled, pct, stats } of results) {
    const bar   = filled === total ? '✅' : parseFloat(pct) >= 70 ? '🟡' : '🔴';
    const count = `${filled}/${total}`.padStart(9);
    const pctFmt = `${pct}%`.padStart(7);
    console.log(`${bar}  ${label.padEnd(W)} ${count} ${pctFmt}${stats}`);
  }
  console.log('─'.repeat(75));

  // ─── Примеры первых 3 моделей целиком ────────────────────────────────────
  console.log('\n📋  Первые 3 модели (полные объекты):\n');
  models.slice(0, 3).forEach((m, i) => {
    console.log(`[${i + 1}] ${m.name} (${m.model_creator?.name})`);
    console.log(JSON.stringify(m, null, 2));
    console.log();
  });

  // ─── Рекомендации ────────────────────────────────────────────────────────
  console.log('\n💡  Рекомендации по scoring:\n');
  const safeFields  = results.filter(r => parseFloat(r.pct) >= 90).map(r => r.label);
  const riskyFields = results.filter(r => parseFloat(r.pct) > 0 && parseFloat(r.pct) < 70).map(r => r.label);
  const emptyFields = results.filter(r => parseFloat(r.pct) === 0).map(r => r.label);

  console.log('✅  Безопасно использовать в primary scoring (≥90% моделей):');
  safeFields.forEach(f => console.log(`     - ${f}`));
  console.log('\n🟡  Можно использовать с fallback (30–70% моделей):');
  riskyFields.forEach(f => console.log(`     - ${f}`));
  console.log('\n🔴  Не использовать в scoring (пустые или редкие):');
  emptyFields.forEach(f => console.log(`     - ${f}`));
}

main().catch(e => { console.error('❌', e); process.exit(1); });
