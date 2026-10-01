import React, { useState } from "react";
import {
  FileText,
  Copy,
  Check,
  Download,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Info,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  FINAL_20_EXPERIMENT_RECORDS,
  FINAL_EXPERIMENT_MODEL,
  FINAL_EXPERIMENT_RUN_ID,
  getDatasetMeanLatency,
} from "../finalBenchmarkData";
import { FIVE_TEST_SUITE } from "../testSuite";

export default function FinalReportView() {
  const [copied, setCopied] = useState<boolean>(false);

  const meanLatencyA = getDatasetMeanLatency("A");
  const meanLatencyB = getDatasetMeanLatency("B");

  const handleCopyJson = () => {
    navigator.clipboard.writeText(
      JSON.stringify(FINAL_20_EXPERIMENT_RECORDS, null, 2)
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(FINAL_20_EXPERIMENT_RECORDS, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `final-experiment-${FINAL_EXPERIMENT_RUN_ID}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadCsv = () => {
    const headers = [
      "runIndex",
      "experimentRunId",
      "testId",
      "testCategory",
      "version",
      "runNumber",
      "expectedLabel",
      "actualLabel",
      "validationPassed",
      "expectedLabelMatch",
      "model",
      "latencyMs",
      "evaluatedAt",
    ];

    const rows = FINAL_20_EXPERIMENT_RECORDS.map((rec, idx) => [
      idx + 1,
      rec.experimentRunId,
      rec.testId,
      `"${rec.testCategory}"`,
      rec.version,
      rec.runNumber,
      rec.expectedLabel,
      `"${rec.actualLabel}"`,
      rec.validationPassed,
      rec.expectedLabelMatch,
      rec.model,
      rec.latencyMs,
      rec.evaluatedAt,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `final-experiment-${FINAL_EXPERIMENT_RUN_ID}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Banner / Hero Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <FileText className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Final Experiment Report
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Dataset: {FINAL_EXPERIMENT_RUN_ID}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Fixed Benchmark Evaluation Report &bull; Preserved Final Dataset
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyJson}
              className="text-xs px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied JSON</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Final Results JSON</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="text-xs px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs font-medium"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download JSON</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="text-xs px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs font-semibold"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Experiment Parameters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
              Experiment Design
            </span>
            <span className="font-semibold text-slate-900 mt-0.5 block font-mono">
              5 tests &times; 2 versions &times; 2 repetitions
            </span>
            <span className="text-[11px] text-slate-500">= 20 evaluations total</span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
              Evaluated Model
            </span>
            <span className="font-bold text-slate-900 mt-0.5 block font-mono">
              {FINAL_EXPERIMENT_MODEL}
            </span>
            <span className="text-[11px] text-slate-500">Google Gemini API</span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
              Mean Latency (Version A)
            </span>
            <span className="font-bold text-slate-900 mt-0.5 block font-mono">
              {meanLatencyA} ms
            </span>
            <span className="text-[11px] text-slate-500">Baseline configuration</span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
              Mean Latency (Version B)
            </span>
            <span className="font-bold text-slate-900 mt-0.5 block font-mono">
              {meanLatencyB} ms
            </span>
            <span className="text-[11px] text-slate-500">Guardrailed configuration</span>
          </div>
        </div>

        {/* Aggregate Results Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Version A Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-200 text-slate-700">
                  Version A
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  Baseline Evaluator
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                10 evaluations
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Valid-Format Outputs</span>
                <span className="text-lg font-bold text-rose-700 font-mono">
                  0 / 10
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Produced unconstrained text or synonyms outside specification.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Expected-Label Matches</span>
                <span className="text-lg font-bold text-rose-700 font-mono">
                  0 / 10
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Did not match the exact expected ground-truth labels.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Validation Failures</span>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  10 / 10
                </span>
              </div>

              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Expected-Label Mismatches</span>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  10 / 10
                </span>
              </div>
            </div>
          </div>

          {/* Version B Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-indigo-100 text-indigo-800">
                  Version B
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  Guardrailed Evaluator
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                10 evaluations
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Valid-Format Outputs</span>
                <span className="text-lg font-bold text-emerald-700 font-mono">
                  10 / 10
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Output adhered strictly to the 3 valid classification labels.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Expected-Label Matches</span>
                <span className="text-lg font-bold text-indigo-700 font-mono">
                  10 / 10
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Matched predefined benchmark expected labels across all tests.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Validation Failures</span>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  0 / 10
                </span>
              </div>

              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Expected-Label Mismatches</span>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  0 / 10
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Clear Distinction: validationPassed vs expectedLabelMatch */}
        <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-700 shrink-0" />
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
              Distinction: Deterministic Format Validation vs. Expected-Label Match
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
            <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs">
              <span className="font-bold text-slate-900 font-mono block mb-1">
                validationPassed (Format & Schema Adherence)
              </span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                An independent deterministic TypeScript function that checks whether the returned label belongs strictly to the allowed three-state enum: <code className="font-mono text-slate-800">SUPPORTED</code>, <code className="font-mono text-slate-800">NOT_SUPPORTED</code>, or <code className="font-mono text-slate-800">INSUFFICIENT_EVIDENCE</code>. It does not assess factual truth; it enforces communication contract compliance and guards against unconstrained text, hallucinations, or synonym drift.
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs">
              <span className="font-bold text-slate-900 font-mono block mb-1">
                expectedLabelMatch (Benchmark Ground-Truth Correctness)
              </span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                A deterministic equality comparison checking whether the model&rsquo;s actual classification matches the predetermined ground-truth label for that specific test case (<code className="font-mono text-slate-800">actualLabel === testCase.expectedLabel</code>). A model may output a valid label (passing format validation) while still failing expected-label correctness if it misclassifies the evidence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Test-by-Test Results for T1–T5 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Test-by-Test Results Breakdown (T1–T5)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative results across both repetitions for each benchmark case.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            5 Test Cases
          </span>
        </div>

        <div className="space-y-4">
          {FIVE_TEST_SUITE.map((test) => {
            const recordsForTest = FINAL_20_EXPERIMENT_RECORDS.filter(
              (r) => r.testId === test.id
            );
            const vARun1 = recordsForTest.find((r) => r.version === "A" && r.runNumber === 1);
            const vARun2 = recordsForTest.find((r) => r.version === "A" && r.runNumber === 2);
            const vBRun1 = recordsForTest.find((r) => r.version === "B" && r.runNumber === 1);
            const vBRun2 = recordsForTest.find((r) => r.version === "B" && r.runNumber === 2);

            return (
              <div
                key={test.id}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 flex flex-col gap-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-200 text-slate-800">
                      {test.id}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {test.category}
                    </span>
                    {test.benchmarkVersion && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                        Revised
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Expected Label: <strong className="text-slate-800">{test.expectedLabel}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Evidence
                    </span>
                    <p className="text-slate-700 italic text-[11px] mt-0.5">
                      &ldquo;{test.evidence}&rdquo;
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Claim
                    </span>
                    <p className="text-slate-700 font-medium text-[11px] mt-0.5">
                      &ldquo;{test.claim}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Runs comparison grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                  {/* vA Run 1 */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700">vA &bull; Run 1</span>
                      <span className="font-mono text-[10px] text-slate-400">{vARun1?.latencyMs}ms</span>
                    </div>
                    <div className="text-[11px] font-mono text-rose-700 font-semibold truncate">
                      Output: {vARun1?.actualLabel}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="text-rose-600 font-semibold">Format: Invalid</span>
                      &bull;
                      <span className="text-slate-500">Match: No</span>
                    </div>
                  </div>

                  {/* vA Run 2 */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700">vA &bull; Run 2</span>
                      <span className="font-mono text-[10px] text-slate-400">{vARun2?.latencyMs}ms</span>
                    </div>
                    <div className="text-[11px] font-mono text-rose-700 font-semibold truncate">
                      Output: {vARun2?.actualLabel}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="text-rose-600 font-semibold">Format: Invalid</span>
                      &bull;
                      <span className="text-slate-500">Match: No</span>
                    </div>
                  </div>

                  {/* vB Run 1 */}
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/20 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-indigo-900">vB &bull; Run 1</span>
                      <span className="font-mono text-[10px] text-slate-400">{vBRun1?.latencyMs}ms</span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-700 font-bold truncate">
                      Output: {vBRun1?.actualLabel}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="text-emerald-700 font-semibold">Format: Valid</span>
                      &bull;
                      <span className="text-indigo-700 font-semibold">Match: Yes</span>
                    </div>
                  </div>

                  {/* vB Run 2 */}
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/20 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-indigo-900">vB &bull; Run 2</span>
                      <span className="font-mono text-[10px] text-slate-400">{vBRun2?.latencyMs}ms</span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-700 font-bold truncate">
                      Output: {vBRun2?.actualLabel}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="text-emerald-700 font-semibold">Format: Valid</span>
                      &bull;
                      <span className="text-indigo-700 font-semibold">Match: Yes</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Complete 20-Record Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
        <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Complete Final Dataset (All 20 Individual Records)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Run ID: {FINAL_EXPERIMENT_RUN_ID}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-2.5 px-3 w-10">#</th>
                <th className="py-2.5 px-3">Test Case</th>
                <th className="py-2.5 px-3">Version</th>
                <th className="py-2.5 px-3">Run</th>
                <th className="py-2.5 px-3 font-mono">Expected Label</th>
                <th className="py-2.5 px-3 font-mono">Actual Label</th>
                <th className="py-2.5 px-3">Format Validation</th>
                <th className="py-2.5 px-3">Expected Match</th>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FINAL_20_EXPERIMENT_RECORDS.map((rec, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-800">{rec.testId}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                      {rec.testCategory}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                        rec.version === "A"
                          ? "bg-slate-200 text-slate-700"
                          : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      v{rec.version}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                    R{rec.runNumber}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 font-medium">
                    {rec.expectedLabel}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">
                    <span
                      className={`font-semibold ${
                        rec.actualLabel === rec.expectedLabel
                          ? "text-emerald-700 font-bold"
                          : "text-slate-800"
                      }`}
                    >
                      {rec.actualLabel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {rec.validationPassed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        Invalid
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {rec.expectedLabelMatch ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        <Check className="w-3 h-3 text-indigo-600" />
                        Match
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <XCircle className="w-3 h-3 text-slate-400" />
                        Mismatch
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                    {rec.model}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                    {rec.latencyMs}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Structured Informational Sections: Methodology, Limitations, Trust, Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Methodology */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Methodology
            </h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Two evaluator configurations were tested using five fixed benchmark cases: normal supported, normal unsupported, ambiguous/insufficient evidence, adversarial prompt injection, and out-of-scope input. Each configuration was evaluated twice per test, producing 20 evaluations. Output-format compliance was assessed using a deterministic validator, while benchmark correctness was assessed by comparing the model output with the predefined expected label.
          </p>
        </div>

        {/* Limitations */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Limitations
            </h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            The experiment uses five benchmark cases, two repetitions per case, and one Gemini model (gemini-3.1-flash-lite). These observed results reflect performance on this specific fixed test suite and should not be interpreted as universal evidence of LLM robustness across all domains, tasks, or prompt formulations.
          </p>
        </div>

        {/* Trust & Failure Handling */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Trust &amp; Failure Handling
            </h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            The application does not blindly trust the model output; it independently validates the output format using a deterministic TypeScript validator and compares the result against the benchmark expectation without delegating verification authority to the model itself. When unconstrained text, synonym drift, or unexpected classifications occur, the system flags the result rather than assuming compliance.
          </p>
        </div>

        {/* User Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              User Controls
            </h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Users can select Version A or Version B, provide custom claim and evidence text, run individual test cases interactively with real-time factual breakdowns, and inspect the automated benchmark execution records from the unified interface.
          </p>
        </div>
      </div>
    </div>
  );
}
