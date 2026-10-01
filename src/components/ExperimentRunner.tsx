import React, { useState, useRef } from "react";
import {
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  FileSpreadsheet,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import {
  EXPERIMENT_SEQUENCE,
  ExperimentRecord,
  getTestCase,
  computeVersionSummary,
} from "../testSuite";

interface ExperimentRunnerProps {
  onClose?: () => void;
}

export default function ExperimentRunner({ onClose }: ExperimentRunnerProps) {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [records, setRecords] = useState<ExperimentRecord[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0); // 0 to 20
  const [currentStatus, setCurrentStatus] = useState<string>("Ready to start");
  const [copied, setCopied] = useState<boolean>(false);

  const abortControllerRef = useRef<boolean>(false);

  const totalSteps = EXPERIMENT_SEQUENCE.length; // 20
  const activeStep =
    currentStepIndex > 0 && currentStepIndex <= totalSteps
      ? EXPERIMENT_SEQUENCE[currentStepIndex - 1]
      : null;
  const activeTestCase = activeStep ? getTestCase(activeStep.testId) : null;

  const handleStartExperiment = async () => {
    setConfirmed(true);
    setIsRunning(true);
    setRecords([]);
    setCurrentStepIndex(0);
    abortControllerRef.current = false;

    const experimentRunId = `exp-${Date.now()}`;
    const newRecords: ExperimentRecord[] = [];

    for (let i = 0; i < totalSteps; i++) {
      if (abortControllerRef.current) {
        setCurrentStatus("Experiment cancelled by user.");
        break;
      }

      const step = EXPERIMENT_SEQUENCE[i];
      const testCase = getTestCase(step.testId);
      if (!testCase) continue;

      setCurrentStepIndex(i + 1);
      setCurrentStatus(
        `Evaluating ${step.testId} (${testCase.category}) with Version ${step.version} (Run ${step.runNumber}/2)...`
      );

      let record: ExperimentRecord;

      try {
        const response = await fetch("/api/guardrails/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claim: testCase.claim,
            evidence: testCase.evidence,
            version: step.version,
            testId: testCase.id,
            expectedLabel: testCase.expectedLabel,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMessage =
            errData.error || `HTTP ${response.status} evaluation failure`;
          record = {
            experimentRunId,
            testId: step.testId,
            testCategory: testCase.category,
            version: step.version,
            runNumber: step.runNumber,
            expectedLabel: testCase.expectedLabel,
            actualLabel: "ERROR",
            validationPassed: false,
            expectedLabelMatch: false,
            model: "none",
            latencyMs: 0,
            evaluatedAt: new Date().toISOString(),
            error: errMessage,
          };
        } else {
          const data = await response.json();
          record = {
            experimentRunId,
            testId: step.testId,
            testCategory: testCase.category,
            version: step.version,
            runNumber: step.runNumber,
            expectedLabel: testCase.expectedLabel,
            actualLabel: data.verdict || "UNKNOWN",
            validationPassed: Boolean(data.validationPassed),
            expectedLabelMatch: Boolean(data.expectedLabelMatch),
            model: data.model || "unknown",
            latencyMs: data.latencyMs || 0,
            evaluatedAt: data.evaluatedAt || new Date().toISOString(),
            error: data.error,
          };
        }
      } catch (err: unknown) {
        const errMessage =
          err instanceof Error ? err.message : "Network/execution error";
        record = {
          experimentRunId,
          testId: step.testId,
          testCategory: testCase.category,
          version: step.version,
          runNumber: step.runNumber,
          expectedLabel: testCase.expectedLabel,
          actualLabel: "ERROR",
          validationPassed: false,
          expectedLabelMatch: false,
          model: "none",
          latencyMs: 0,
          evaluatedAt: new Date().toISOString(),
          error: errMessage,
        };
      }

      newRecords.push(record);
      setRecords([...newRecords]);

      // Polite delay between sequential calls to stay comfortably within free-tier rate limits
      if (i < totalSteps - 1 && !abortControllerRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setIsRunning(false);
    if (!abortControllerRef.current) {
      setCurrentStatus("Complete: 20 evaluations finished.");
    }
  };

  const handleStopExperiment = () => {
    abortControllerRef.current = true;
    setIsRunning(false);
    setCurrentStatus("Stopping experiment...");
  };

  const handleReset = () => {
    setConfirmed(false);
    setIsRunning(false);
    setRecords([]);
    setCurrentStepIndex(0);
    setCurrentStatus("Ready to start");
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(records, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const summaryA = computeVersionSummary(records, "A");
  const summaryB = computeVersionSummary(records, "B");
  const progressPercent = Math.round((records.length / totalSteps) * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Automated Robustness Experiment Runner
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              20 Evaluations Matrix
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Executes 5 test cases &times; 2 versions &times; 2 repetitions sequentially with independent deterministic validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {records.length > 0 && !isRunning && (
            <button
              type="button"
              onClick={handleCopyJson}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied JSON</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy 20 Records</span>
                </>
              )}
            </button>
          )}

          {records.length > 0 && !isRunning && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
            >
              Back to Manual Tester
            </button>
          )}
        </div>
      </div>

      {/* Confirmation State Before Starting */}
      {!confirmed && records.length === 0 && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col items-center text-center max-w-xl mx-auto my-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>

          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Confirm Experiment Execution
          </h3>

          <div className="my-3 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 font-mono text-sm font-semibold">
            5 tests &times; 2 versions &times; 2 runs = 20 evaluations
          </div>

          <p className="text-xs text-slate-600 leading-relaxed max-w-md mb-5">
            The runner will evaluate each test sequentially across Version A (Baseline) and Version B (Guardrailed) twice, collecting independent deterministic validation and expected-label match records for each run.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleStartExperiment}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start 20 Evaluations</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Live Execution Panel */}
      {(confirmed || isRunning || records.length > 0) && (
        <div className="flex flex-col gap-4">
          {/* Progress Header Box */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4.5 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {isRunning ? (
                  <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                ) : records.length === totalSteps ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-xs font-semibold text-slate-800">
                  {currentStatus}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-slate-700">
                  {records.length} / {totalSteps} completed
                </span>
                {isRunning && (
                  <button
                    type="button"
                    onClick={handleStopExperiment}
                    className="text-xs px-2.5 py-1 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Square className="w-3 h-3 fill-rose-800" />
                    <span>Stop</span>
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Live Step Status Grid */}
            {activeStep && isRunning && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/70 text-xs">
                <div className="bg-white rounded p-2 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">
                    Current Test
                  </span>
                  <span className="font-semibold text-slate-800">
                    {activeStep.testId} &ndash; {activeTestCase?.category}
                  </span>
                </div>
                <div className="bg-white rounded p-2 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">
                    Current Version
                  </span>
                  <span className="font-semibold text-indigo-700 font-mono">
                    Version {activeStep.version} ({activeStep.version === "A" ? "Baseline" : "Guardrailed"})
                  </span>
                </div>
                <div className="bg-white rounded p-2 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">
                    Current Repetition
                  </span>
                  <span className="font-semibold text-slate-800 font-mono">
                    Run {activeStep.runNumber} of 2
                  </span>
                </div>
                <div className="bg-white rounded p-2 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">
                    Expected Label
                  </span>
                  <span className="font-mono text-slate-700 font-semibold">
                    {activeTestCase?.expectedLabel}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Descriptive Summaries for Each Version */}
          {records.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Version A Summary */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                      Version A
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      Baseline Summary
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {summaryA.totalEvaluations} / 10 runs
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Total Evaluations</span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {summaryA.totalEvaluations}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Valid-Format Outputs</span>
                    <span className="text-base font-bold text-emerald-700 font-mono">
                      {summaryA.validFormatOutputs}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Expected-Label Matches</span>
                    <span className="text-base font-bold text-indigo-700 font-mono">
                      {summaryA.expectedLabelMatches}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Validation Failures</span>
                    <span className="text-base font-bold text-rose-700 font-mono">
                      {summaryA.validationFailures}
                    </span>
                  </div>
                  <div className="col-span-2 bg-slate-50 rounded-lg p-2.5 border border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Expected-Label Mismatches</span>
                    <span className="text-base font-bold text-amber-700 font-mono">
                      {summaryA.expectedLabelMismatches}
                    </span>
                  </div>
                </div>
              </div>

              {/* Version B Summary */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Version B
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      Guardrailed Summary
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {summaryB.totalEvaluations} / 10 runs
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Total Evaluations</span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {summaryB.totalEvaluations}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Valid-Format Outputs</span>
                    <span className="text-base font-bold text-emerald-700 font-mono">
                      {summaryB.validFormatOutputs}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Expected-Label Matches</span>
                    <span className="text-base font-bold text-indigo-700 font-mono">
                      {summaryB.expectedLabelMatches}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Validation Failures</span>
                    <span className="text-base font-bold text-rose-700 font-mono">
                      {summaryB.validationFailures}
                    </span>
                  </div>
                  <div className="col-span-2 bg-slate-50 rounded-lg p-2.5 border border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Expected-Label Mismatches</span>
                    <span className="text-base font-bold text-amber-700 font-mono">
                      {summaryB.expectedLabelMismatches}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Complete 20-Record Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Individual Evaluation Records ({records.length} / 20)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Order: T1 vA (R1, R2) &rarr; T1 vB (R1, R2) &hellip; T5 vB (R1, R2)
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
                  {records.map((rec, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        rec.error ? "bg-rose-50/40" : ""
                      }`}
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
                            rec.error
                              ? "text-rose-600"
                              : rec.actualLabel === rec.expectedLabel
                              ? "text-emerald-700"
                              : "text-slate-800"
                          }`}
                        >
                          {rec.actualLabel}
                        </span>
                        {rec.error && (
                          <div className="text-[10px] text-rose-500 font-sans truncate max-w-[140px]" title={rec.error}>
                            {rec.error}
                          </div>
                        )}
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

                  {/* Empty state rows */}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                        No evaluations executed yet. Click &ldquo;Start 20 Evaluations&rdquo; above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
