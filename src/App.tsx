import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  History,
  Info,
  Quote,
  Sliders,
  Target,
  FlaskConical,
  PlayCircle,
  BarChart3,
} from "lucide-react";
import {
  FIVE_TEST_SUITE,
  TestCase,
  TestId,
  VALID_CLASSIFICATION_LABELS,
} from "./testSuite.ts";
import ExperimentRunner from "./components/ExperimentRunner";
import FinalReportView from "./components/FinalReportView";

export type VerdictType =
  | "SUPPORTED"
  | "NOT_SUPPORTED"
  | "INSUFFICIENT_EVIDENCE"
  | string;

export type DecisionType = "PASS" | "FLAG" | "FAIL";
export type RiskType = "LOW" | "MEDIUM" | "HIGH";
export type EvaluatorVersion = "A" | "B";

export interface SubClaimAnalysis {
  subClaim: string;
  status: "VERIFIED" | "CONTRADICTED" | "UNSUBSTANTIATED";
  evidenceQuote: string;
  note: string;
}

export interface EvaluationResult {
  id: string;
  claim: string;
  evidence: string;
  version: EvaluatorVersion;
  versionName?: string;
  testId?: TestId | null;
  testCategory?: string | null;
  expectedLabel?: string | null;
  expectedLabelMatch?: boolean | null;
  verdict: VerdictType;
  guardrailDecision: DecisionType;
  confidenceScore: number;
  hallucinationRisk: RiskType;
  summary: string;
  reasoning: string;
  factualBreakdown: SubClaimAnalysis[];
  recommendation: string;
  validationPassed: boolean;
  validationMessage: string;
  latencyMs: number;
  model: string;
  evaluatedAt: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"report" | "manual" | "runner">("report");

  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(
    FIVE_TEST_SUITE[0]
  );
  const [claim, setClaim] = useState<string>(FIVE_TEST_SUITE[0].claim);
  const [evidence, setEvidence] = useState<string>(FIVE_TEST_SUITE[0].evidence);
  const [selectedVersion, setSelectedVersion] = useState<EvaluatorVersion>("B");
  const [customGuidance, setCustomGuidance] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [history, setHistory] = useState<EvaluationResult[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectTestCase = (test: TestCase) => {
    setSelectedTestCase(test);
    setClaim(test.claim);
    setEvidence(test.evidence);
    setError(null);
  };

  const handleRunEvaluation = async () => {
    if (!claim.trim()) {
      setError("Please enter a claim to evaluate.");
      return;
    }
    if (!evidence.trim()) {
      setError("Please enter supporting evidence to evaluate the claim against.");
      return;
    }

    setIsLoading(true);
    setError(null);

    // If claim and evidence still match the selected test case, pass its metadata
    const activeTest =
      selectedTestCase &&
      selectedTestCase.claim.trim() === claim.trim() &&
      selectedTestCase.evidence.trim() === evidence.trim()
        ? selectedTestCase
        : null;

    try {
      const response = await fetch("/api/guardrails/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim: claim.trim(),
          evidence: evidence.trim(),
          customGuidance: customGuidance.trim() || undefined,
          version: selectedVersion,
          testId: activeTest?.id || undefined,
          expectedLabel: activeTest?.expectedLabel || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Evaluation failed with status ${response.status}`
        );
      }

      const data = await response.json();
      const evalItem: EvaluationResult = {
        id: `eval-${Date.now()}`,
        claim,
        evidence,
        version: selectedVersion,
        ...data,
      };

      setResult(evalItem);
      setHistory((prev) => [evalItem, ...prev.slice(0, 9)]); // keep last 10
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while communicating with the model."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setClaim("");
    setEvidence("");
    setCustomGuidance("");
    setSelectedTestCase(null);
    setResult(null);
    setError(null);
  };

  const handleCopyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getVerdictBadge = (verdict: VerdictType) => {
    switch (verdict) {
      case "SUPPORTED":
        return {
          icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
          badgeBg: "bg-emerald-600 text-white",
          title: "SUPPORTED",
          desc: "The claim is substantiated by the evidence.",
        };
      case "NOT_SUPPORTED":
        return {
          icon: <ShieldX className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
          bg: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
          badgeBg: "bg-rose-600 text-white",
          title: "NOT_SUPPORTED",
          desc: "The claim conflicts with or is contradicted by facts in the evidence.",
        };
      case "INSUFFICIENT_EVIDENCE":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          bg: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
          badgeBg: "bg-amber-600 text-white",
          title: "INSUFFICIENT_EVIDENCE",
          desc: "The evidence lacks the facts needed to prove or disprove the claim.",
        };
      default:
        return {
          icon: <ShieldAlert className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
          bg: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
          badgeBg: "bg-purple-600 text-white",
          title: `UNRECOGNIZED: ${verdict}`,
          desc: "The model returned a classification label outside the valid specification.",
        };
    }
  };

  const getSubClaimBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </span>
        );
      case "CONTRADICTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
            <XCircle className="w-3.5 h-3.5" />
            Contradicted
          </span>
        );
      case "UNSUBSTANTIATED":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            <HelpCircle className="w-3.5 h-3.5" />
            Unsubstantiated
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  LLM Guardrail Tester
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Submission Ready
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Independent Deterministic Validation & Robustness Benchmark
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Primary Tab Switcher */}
            <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("report")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "report"
                    ? "bg-indigo-600 text-white shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Final Report</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("manual")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "manual"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                <span>Single Test</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("runner")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "runner"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
                <span>Live Runner</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Predefined 5-Test Suite Bar */}
      <section className="bg-slate-100/80 border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <FlaskConical className="w-4 h-4 text-indigo-600" />
              <span>Robustness Experiment Test Cases (5 Fixed Tests):</span>
            </div>

            <div className="flex items-center gap-2">
              {selectedTestCase && (
                <span className="text-[11px] text-slate-500 hidden sm:inline mr-2">
                  Selected: <strong className="text-slate-700">{selectedTestCase.name}</strong> &bull; Expected:{" "}
                  <code className="text-indigo-700 font-bold font-mono">{selectedTestCase.expectedLabel}</code>
                </span>
              )}

              <button
                type="button"
                onClick={() => setActiveTab("report")}
                className={`px-3 py-1 rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "report"
                    ? "bg-slate-800 text-white"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>View Final Report</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("runner")}
                className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Run Full Experiment</span>
              </button>
            </div>
          </div>

          {/* Test buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {FIVE_TEST_SUITE.map((test) => {
              const isSelected = selectedTestCase?.id === test.id && activeTab === "manual";
              return (
                <button
                  key={test.id}
                  type="button"
                  onClick={() => {
                    handleSelectTestCase(test);
                    if (activeTab !== "manual") setActiveTab("manual");
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? "bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                      : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {test.id}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        test.expectedLabel === "SUPPORTED"
                          ? "bg-emerald-100 text-emerald-800"
                          : test.expectedLabel === "NOT_SUPPORTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      Exp: {test.expectedLabel.replace("_EVIDENCE", "")}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-slate-900 leading-tight">
                        {test.category}
                      </p>
                      {test.benchmarkVersion && (
                        <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                          Revised
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {test.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {activeTab === "report" && (
          /* Final Results / Experiment Report View */
          <FinalReportView />
        )}

        {activeTab === "runner" && (
          /* Live 20-Run Experiment Runner */
          <ExperimentRunner onClose={() => setActiveTab("report")} />
        )}

        {activeTab === "manual" && (
          /* Single Manual Test Mode */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Input Form (6 cols) */}
            <section className="lg:col-span-6 flex flex-col gap-5">
              {/* Version Selector Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    Evaluator Configuration
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Active: Version {selectedVersion}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedVersion("A")}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      selectedVersion === "A"
                        ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-2xs"
                        : "bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">Version A</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-slate-200 text-slate-700">
                        Baseline
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Minimal prompt assistant. Standard verification without strict defenses.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedVersion("B")}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      selectedVersion === "B"
                        ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-2xs"
                        : "bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">Version B</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-indigo-100 text-indigo-800">
                        Guardrailed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Strict evidence classifier with prompt injection resistance & strict labels.
                    </p>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Target Claim to Test
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400">
                    {claim.length} chars
                  </span>
                </div>

                <div>
                  <textarea
                    value={claim}
                    onChange={(e) => setClaim(e.target.value)}
                    rows={3}
                    placeholder="Enter the generative statement or claim you want to test against guardrails..."
                    className="w-full text-sm rounded-lg border border-slate-300 p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans leading-relaxed resize-y"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    The specific statement, assertion, or model response being checked.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Supporting Evidence / Ground Truth
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400">
                    {evidence.length} chars
                  </span>
                </div>

                <div>
                  <textarea
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    rows={6}
                    placeholder="Paste the reference document, verified knowledge base paragraph, or authoritative facts..."
                    className="w-full text-sm rounded-lg border border-slate-300 p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans leading-relaxed resize-y"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    The ground-truth document against which the claim will be verified.
                  </p>
                </div>

                {/* Advanced criteria accordion */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-medium text-slate-700 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-slate-500" />
                      Optional Guardrail Policy / Custom Instructions
                    </span>
                    {showAdvanced ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                  {showAdvanced && (
                    <div className="p-3 bg-white border-t border-slate-200">
                      <textarea
                        value={customGuidance}
                        onChange={(e) => setCustomGuidance(e.target.value)}
                        rows={2}
                        placeholder="e.g. Treat numerical discrepancies greater than 5% as immediate contradictions. Be strict on medical claims."
                        className="w-full text-xs rounded-md border border-slate-300 p-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Add domain-specific boundary rules or strictness levels for this evaluation.
                      </p>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                      <div>
                        <p className="font-semibold">Unable to process evaluation</p>
                        <p className="mt-0.5 leading-relaxed">{error}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRunEvaluation}
                      disabled={isLoading}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-100 hover:bg-rose-200 text-rose-800 transition-colors shrink-0 cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleRunEvaluation}
                    disabled={isLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Evaluating with Version {selectedVersion}...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Test Guardrail ({selectedVersion === "A" ? "Version A" : "Version B"})</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={isLoading || (!claim && !evidence)}
                    className="px-3.5 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                    title="Clear inputs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Quick Session History */}
              {history.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-slate-500" />
                      <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Recent Evaluations ({history.length})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHistory([])}
                      className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Clear history
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setClaim(item.claim);
                          setEvidence(item.evidence);
                          setSelectedVersion(item.version || "B");
                          setResult(item);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between gap-3 ${
                          result?.id === item.id
                            ? "border-indigo-400 bg-indigo-50/50"
                            : "border-slate-200 hover:border-slate-300 bg-slate-50/40"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {item.testId && (
                              <span className="text-[9px] font-mono font-bold px-1 rounded bg-indigo-100 text-indigo-700">
                                {item.testId}
                              </span>
                            )}
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                item.version === "A"
                                  ? "bg-slate-200 text-slate-700"
                                  : "bg-indigo-100 text-indigo-700"
                              }`}
                            >
                              v{item.version}
                            </span>
                            <p className="font-medium text-slate-800 truncate">
                              {item.claim}
                            </p>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {new Date(item.evaluatedAt).toLocaleTimeString()} &middot;{" "}
                            {item.latencyMs}ms
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              item.verdict === "SUPPORTED"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.verdict === "NOT_SUPPORTED"
                                ? "bg-rose-100 text-rose-800"
                                : item.verdict === "INSUFFICIENT_EVIDENCE"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {item.verdict}
                          </span>
                          {item.validationPassed ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Validation Passed" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-rose-500" title="Validation Failed" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Right Column: Classification Results (6 cols) */}
            <section className="lg:col-span-6 flex flex-col gap-5">
              {result ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col gap-5 animate-in fade-in duration-200">
                  {/* Test Case & Expected Label Match Banner (If benchmark test was run) */}
                  {result.testId && (
                    <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200 text-xs flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-indigo-600" />
                          Benchmark Case: {result.testId} &ndash; {result.testCategory}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          Expected: <strong className="text-slate-800">{result.expectedLabel}</strong>
                        </span>
                      </div>

                      {/* Deterministic expectedLabelMatch Check */}
                      <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {result.expectedLabelMatch ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span className="text-slate-700">
                            Expected Label Match:{" "}
                            <strong className={result.expectedLabelMatch ? "text-emerald-700" : "text-amber-700"}>
                              {result.expectedLabelMatch ? "MATCH (Accurate)" : "MISMATCH (Discrepancy)"}
                            </strong>
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                            result.expectedLabelMatch
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                              : "bg-amber-100 text-amber-900 border border-amber-200"
                          }`}
                        >
                          Benchmark Check
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Independent Deterministic Validation Banner (Strict Schema & Label Format) */}
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                      result.validationPassed
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                        : "bg-rose-50/80 border-rose-300 text-rose-900"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {result.validationPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold tracking-tight">
                            Deterministic Validation: {result.validationPassed ? "PASSED" : "FAILED"}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                          {result.validationMessage}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          result.validationPassed
                            ? "bg-emerald-200/80 text-emerald-900"
                            : "bg-rose-200/80 text-rose-900"
                        }`}
                      >
                        TypeScript Check
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        Evaluator: v{result.version}
                      </span>
                    </div>
                  </div>

                  {/* Top Verdict Banner */}
                  {(() => {
                    const badge = getVerdictBadge(result.verdict);
                    return (
                      <div
                        className={`rounded-xl border p-4.5 flex flex-col gap-3 ${badge.bg}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            {badge.icon}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-bold font-mono tracking-tight">
                                  {badge.title}
                                </span>
                                <span
                                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.badgeBg}`}
                                >
                                  Decision: {result.guardrailDecision}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-medium">
                                  Version {result.version}
                                </span>
                              </div>
                              <p className="text-xs opacity-90 mt-0.5">{badge.desc}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleCopyJson}
                            className="text-xs px-2.5 py-1 rounded-md bg-white/70 hover:bg-white text-slate-700 border border-slate-200/60 shadow-2xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                            title="Copy raw JSON result"
                          >
                            {copied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[11px]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-[11px]">JSON</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Quick Metric Pills */}
                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                          <div className="bg-white/80 dark:bg-black/20 rounded-lg p-2 text-center">
                            <span className="block text-[10px] text-slate-500 uppercase tracking-wide font-medium">
                              Config
                            </span>
                            <span className="text-xs font-bold text-slate-800 font-mono">
                              v{result.version} ({result.version === "A" ? "Base" : "Guard"})
                            </span>
                          </div>
                          <div className="bg-white/80 dark:bg-black/20 rounded-lg p-2 text-center">
                            <span className="block text-[10px] text-slate-500 uppercase tracking-wide font-medium">
                              Confidence
                            </span>
                            <span className="text-sm font-bold text-slate-800">
                              {result.confidenceScore}%
                            </span>
                          </div>
                          <div className="bg-white/80 dark:bg-black/20 rounded-lg p-2 text-center">
                            <span className="block text-[10px] text-slate-500 uppercase tracking-wide font-medium">
                              Risk
                            </span>
                            <span
                              className={`text-sm font-bold ${
                                result.hallucinationRisk === "LOW"
                                  ? "text-emerald-700"
                                  : result.hallucinationRisk === "MEDIUM"
                                  ? "text-amber-700"
                                  : "text-rose-700"
                              }`}
                            >
                              {result.hallucinationRisk}
                            </span>
                          </div>
                          <div className="bg-white/80 dark:bg-black/20 rounded-lg p-2 text-center">
                            <span className="block text-[10px] text-slate-500 uppercase tracking-wide font-medium">
                              Latency
                            </span>
                            <span className="text-sm font-bold text-slate-800">
                              {result.latencyMs}ms
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Recommendation Callout */}
                  <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Guardrail Policy Recommendation:</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {result.recommendation}
                    </p>
                  </div>

                  {/* High-Level Summary */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Executive Summary
                    </h3>
                    <p className="text-sm text-slate-800 leading-relaxed bg-white border border-slate-100 rounded-lg p-3 shadow-2xs">
                      {result.summary}
                    </p>
                  </div>

                  {/* Granular Sub-claim Breakdown */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Factual Claims Breakdown ({result.factualBreakdown.length})
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        Assertion Grounding
                      </span>
                    </div>

                    <div className="space-y-3">
                      {result.factualBreakdown.map((item, idx) => (
                        <div
                          key={idx}
                          className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col gap-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-semibold text-slate-800">
                                {item.subClaim}
                              </span>
                            </div>
                            {getSubClaimBadge(item.status)}
                          </div>

                          {/* Evidence quote */}
                          <div className="text-xs bg-white rounded-md border border-slate-200 p-2.5 text-slate-600 flex items-start gap-2">
                            <Quote className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-slate-700">
                                Evidence Excerpt:{" "}
                              </span>
                              <span className="italic">
                                &ldquo;{item.evidenceQuote}&rdquo;
                              </span>
                            </div>
                          </div>

                          {item.note && (
                            <p className="text-[11px] text-slate-500 pl-1">
                              <span className="font-medium text-slate-600">Note: </span>
                              {item.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Evidence-Based Explanation */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Evidence-Based Explanation
                    </h3>
                    <div className="text-xs text-slate-700 bg-slate-50 rounded-lg p-3.5 border border-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                      {result.reasoning}
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty State */
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 flex flex-col items-center justify-center text-center h-full min-h-[420px] shadow-2xs">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    Awaiting Guardrail Test
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                    Select one of the 5 benchmark tests above or enter custom inputs, select{" "}
                    <strong className="text-slate-700">Version A (Baseline)</strong> or{" "}
                    <strong className="text-slate-700">Version B (Guardrailed)</strong>, and click{" "}
                    <strong className="text-slate-700">Test Guardrail</strong>. Or view the{" "}
                    <strong className="text-indigo-600">Final Report</strong> for the complete benchmark dataset.
                  </p>

                  <div className="w-full max-w-xs bg-slate-50 rounded-lg p-3 text-left border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide block mb-2">
                      Allowed Classification Labels:
                    </span>
                    <div className="space-y-1.5 text-xs text-slate-600 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span><strong className="font-mono">SUPPORTED:</strong> Fully substantiated</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span><strong className="font-mono">NOT_SUPPORTED:</strong> Contradicted or refuted</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span><strong className="font-mono">INSUFFICIENT_EVIDENCE:</strong> Missing facts</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <p>
          LLM Guardrail Robustness Benchmark &bull; Evaluator Configurations A &amp; B &bull; Google Gemini API
        </p>
      </footer>
    </div>
  );
}
