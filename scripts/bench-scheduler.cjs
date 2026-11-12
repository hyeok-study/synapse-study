const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const {performance} = require('node:perf_hooks');
const root = path.resolve(process.argv[2] || 'checkout');
const output = process.argv[3] || 'results/scheduler-remove-baseline.json';
const localRequire = createRequire(path.join(root, 'packages/backend/package.json'));
const ts = localRequire('typescript');
const source = fs.readFileSync(path.join(root, 'packages/backend/src/interview/stores/min-heap.scheduler.ts'), 'utf8');
const code = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const benchmarkExports = {};
vm.runInNewContext(code, {exports:benchmarkExports});
const Scheduler = benchmarkExports.MinHeapScheduler;
const rows = [];
for (const size of [100, 1000, 10000, 50000]) {
  const scheduler = new Scheduler();
  for (let i=0;i<size;i++) scheduler.push('key-'+i, i);
  // Count actual predicate evaluations once, then measure without instrumentation.
  const original = scheduler.heap.findIndex;
  let comparisons = 0;
  scheduler.heap.findIndex = function(fn) {return original.call(this, (...args)=>{comparisons++;return fn(...args);});};
  scheduler.remove('absent');
  scheduler.heap.findIndex = original;
  if (comparisons !== size) throw new Error('unexpected comparison count');
  for (let i=0;i<100;i++) scheduler.remove('absent');
  const rounds=[];
  for (let r=0;r<7;r++) {
    const start=performance.now();
    for (let i=0;i<1000;i++) scheduler.remove('absent');
    rounds.push((performance.now()-start)*1e6/1000);
  }
  rows.push({heap_size:size,comparisons,mean_ns_per_remove_by_batch:rounds});
}
fs.writeFileSync(output, JSON.stringify({date:'2026-11-12',node:process.version,arch:process.arch,source_sha256:crypto.createHash('sha256').update(source).digest('hex'),workload:'remove missing key; heap unchanged; setup excluded; 100 warmup calls and 7 batches of 1000 calls; batch averages are not request percentiles',rows},null,2)+'\n');
console.log('Recorded scheduler remove scan counts and batch timing');
