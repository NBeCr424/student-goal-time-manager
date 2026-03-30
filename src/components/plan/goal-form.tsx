"use client";

import { FormEvent, useMemo, useState } from "react";
import { addDays, toDateKey } from "@/lib/date";
import { NewGoalInput } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const defaultDate = toDateKey(addDays(new Date(), 30));

const initialForm: NewGoalInput = {
  title: "",
  description: "",
  smart: {
    specific: "",
    measurable: "",
    achievable: "",
    relevant: "",
    timeBound: "",
  },
  deadline: defaultDate,
  estimatedTotalHours: 20,
  suggestedSessionMinutes: 60,
  preferredTimeOfDay: "evening",
  priority: "medium",
  includeInCalendar: true,
};

export function GoalForm() {
  const { actions } = useAppStore();
  const [form, setForm] = useState<NewGoalInput>(initialForm);
  const [shakeMissing, setShakeMissing] = useState(false);

  const valid = useMemo(() => form.title.trim().length > 1 && form.deadline.length > 0, [form.deadline, form.title]);
  const smartProgress = useMemo(() => {
    const checks = [
      form.smart.specific,
      form.smart.measurable,
      form.smart.achievable,
      form.smart.relevant,
      form.deadline,
    ];
    const filled = checks.filter((value) => value.trim().length > 0).length;
    return Math.round((filled / 5) * 100);
  }, [form.deadline, form.smart.achievable, form.smart.measurable, form.smart.relevant, form.smart.specific]);
  const smartLevel = useMemo(() => {
    if (smartProgress >= 90) {
      return { label: "很清晰", tone: "border-mint/45 bg-mint/15 text-ink/80" };
    }
    if (smartProgress >= 70) {
      return { label: "比较清晰", tone: "border-sky/40 bg-sky/10 text-ink/75" };
    }
    if (smartProgress >= 40) {
      return { label: "需要补充", tone: "border-amber-300 bg-amber-50 text-amber-800" };
    }
    return { label: "待完善", tone: "border-ink/20 bg-white text-ink/60" };
  }, [smartProgress]);
  const smartMissing = useMemo(() => {
    const missing: string[] = [];
    if (!form.smart.specific.trim()) {
      missing.push("具体目标");
    }
    if (!form.smart.measurable.trim()) {
      missing.push("完成标准");
    }
    if (!form.smart.achievable.trim()) {
      missing.push("当前基础");
    }
    if (!form.smart.relevant.trim()) {
      missing.push("重要性");
    }
    return missing;
  }, [form.smart.achievable, form.smart.measurable, form.smart.relevant, form.smart.specific]);
  const smartSteps = useMemo(
    () => [
      { key: "S", filled: Boolean(form.smart.specific.trim()), color: "bg-emerald-400" },
      { key: "M", filled: Boolean(form.smart.measurable.trim()), color: "bg-sky-400" },
      { key: "A", filled: Boolean(form.smart.achievable.trim()), color: "bg-amber-400" },
      { key: "R", filled: Boolean(form.smart.relevant.trim()), color: "bg-rose-400" },
      { key: "T", filled: Boolean(form.deadline.trim()), color: "bg-lime-400" },
    ],
    [form.deadline, form.smart.achievable, form.smart.measurable, form.smart.relevant, form.smart.specific],
  );
  const smartSuggestion = useMemo(() => {
    if (smartProgress >= 90) {
      return "已很清晰，可以直接创建。";
    }
    if (smartProgress >= 70) {
      return smartMissing.length > 0 ? `再补充${smartMissing[0]}会更完整。` : "再补充一点细节更扎实。";
    }
    if (smartProgress >= 40) {
      return smartMissing.length > 0 ? `建议补充${smartMissing.slice(0, 2).join("、")}。` : "可以再补充一些细节。";
    }
    return "先补充具体目标和完成标准，会更容易执行。";
  }, [smartMissing, smartProgress]);

  function triggerShake() {
    setShakeMissing(false);
    window.setTimeout(() => setShakeMissing(true), 0);
    window.setTimeout(() => setShakeMissing(false), 360);
  }

  function updateSmart(field: keyof NewGoalInput["smart"], value: string) {
    setForm((prev) => ({
      ...prev,
      smart: {
        ...prev.smart,
        [field]: value,
      },
    }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid) {
      return;
    }

    const cleanTitle = form.title.trim();
    const specific = form.smart.specific.trim() || cleanTitle;
    const hasMissing = smartMissing.length > 0;
    if (hasMissing) {
      triggerShake();
    }
    const payload: NewGoalInput = {
      ...form,
      title: cleanTitle,
      description: specific || cleanTitle,
      smart: {
        ...form.smart,
        specific,
        timeBound: form.deadline ? `截止于 ${form.deadline}` : "",
      },
      estimatedTotalHours: Math.max(1, form.estimatedTotalHours || 1),
      suggestedSessionMinutes: Math.max(15, form.suggestedSessionMinutes || 60),
    };
    actions.addGoal(payload);
    const resetForm = () =>
      setForm({
        ...initialForm,
        deadline: toDateKey(addDays(new Date(), 30)),
      });
    if (hasMissing) {
      window.setTimeout(resetForm, 220);
    } else {
      resetForm();
    }
  }

  const templates = [
    {
      id: "exam",
      label: "考试类",
      values: {
        title: "英语六级 560+",
        specific: "4 月底前完成 10 套六级阅读并整理错题",
        measurable: "完成 10 套阅读、3 轮错题复习、模拟成绩达到 560+",
        achievable: "当前六级水平约 480，已完成 2 套阅读练习",
        relevant: "为了通过六级、提升期末成绩",
        estimatedTotalHours: 40,
        priority: "high" as NewGoalInput["priority"],
      },
    },
    {
      id: "habit",
      label: "习惯类",
      values: {
        title: "晨跑习惯 30 天",
        specific: "接下来 30 天，每周至少 5 天晨跑 20 分钟",
        measurable: "累计完成 30 次晨跑打卡",
        achievable: "目前能跑 10 分钟，逐步适应到 20 分钟",
        relevant: "改善作息与体能",
        estimatedTotalHours: 15,
        priority: "medium" as NewGoalInput["priority"],
      },
    },
    {
      id: "project",
      label: "项目类",
      values: {
        title: "数据结构期末 A",
        specific: "期末前完成所有作业并复习 8 章重点",
        measurable: "完成 8 章复习提纲 + 5 套模拟题",
        achievable: "已完成 2 章复习，继续每周推进 2 章",
        relevant: "为了期末成绩达到 A",
        estimatedTotalHours: 30,
        priority: "high" as NewGoalInput["priority"],
      },
    },
  ];

  function pickTemplateId(title: string) {
    const clean = title.trim();
    if (!clean) {
      return "exam";
    }
    if (/(六级|期末|考试|分数|成绩)/.test(clean)) {
      return "exam";
    }
    if (/(习惯|晨跑|早起|打卡|坚持)/.test(clean)) {
      return "habit";
    }
    return "project";
  }

  function applyTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }
    setForm((prev) => {
      const fresh = prev.title.trim().length === 0;
      return {
        ...prev,
        title: fresh ? template.values.title : prev.title,
        smart: {
          ...prev.smart,
          specific: fresh || !prev.smart.specific.trim() ? template.values.specific : prev.smart.specific,
          measurable: fresh || !prev.smart.measurable.trim() ? template.values.measurable : prev.smart.measurable,
          achievable: fresh || !prev.smart.achievable.trim() ? template.values.achievable : prev.smart.achievable,
          relevant: fresh || !prev.smart.relevant.trim() ? template.values.relevant : prev.smart.relevant,
        },
        estimatedTotalHours: fresh ? template.values.estimatedTotalHours : prev.estimatedTotalHours,
        priority: fresh ? template.values.priority : prev.priority,
      };
    });
  }

  function fillSmartSuggestion() {
    const templateId = pickTemplateId(form.title);
    applyTemplate(templateId);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-ink/10 bg-white p-4">
      <h3 className="section-title">创建长期目标（SMART）</h3>

      <input
        value={form.title}
        onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
        placeholder="目标名称，例如：英语六级 560+"
        className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
      />

      <div className="flex flex-wrap gap-2">
        {templates.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => applyTemplate(item.id)}
            className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/70"
          >
            {item.label}模板
          </button>
        ))}
        <button
          type="button"
          onClick={fillSmartSuggestion}
          className="rounded-full border border-ink/15 bg-ink/5 px-3 py-1.5 text-xs text-ink/70"
        >
          一键补全建议
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
        <label className="text-xs text-ink/70">
          截止日期
          <input
            type="date"
            value={form.deadline}
            onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-xs text-ink/70">
          预计总时长（小时）
          <input
            type="number"
            min={1}
            value={form.estimatedTotalHours}
            onChange={(event) => setForm((prev) => ({ ...prev, estimatedTotalHours: Number(event.target.value) || 0 }))}
            className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-xs text-ink/70">
          建议单次时长（分钟）
          <input
            type="number"
            min={15}
            step={5}
            value={form.suggestedSessionMinutes}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                suggestedSessionMinutes: Number(event.target.value) || 60,
              }))
            }
            className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-xs text-ink/70">
          偏好时段
          <select
            value={form.preferredTimeOfDay}
            onChange={(event) => setForm((prev) => ({ ...prev, preferredTimeOfDay: event.target.value as NewGoalInput["preferredTimeOfDay"] }))}
            className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="morning">上午</option>
            <option value="afternoon">下午</option>
            <option value="evening">晚上</option>
            <option value="flexible">灵活安排</option>
          </select>
        </label>

        <label className="text-xs text-ink/70">
          优先级
          <select
            value={form.priority}
            onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as NewGoalInput["priority"] }))}
            className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </label>

        <label className="flex items-center gap-2 rounded-xl border border-ink/15 px-3 py-2 text-sm text-ink/70">
          <input
            type="checkbox"
            checked={form.includeInCalendar}
            onChange={(event) => setForm((prev) => ({ ...prev, includeInCalendar: event.target.checked }))}
            className="h-4 w-4 accent-mint"
          />
          加入日历
        </label>
      </div>

      <div className="rounded-xl border border-ink/10 bg-white p-3">
        <div className="flex items-center justify-between text-xs text-ink/65">
          <span>SMART 完成度</span>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${smartLevel.tone}`}>{smartLevel.label}</span>
        </div>
        <div className="mt-2 grid grid-cols-5 gap-1">
          {smartSteps.map((step) => (
            <div key={step.key} className={`h-2 rounded-full ${step.filled ? step.color : "bg-ink/10"}`} />
          ))}
        </div>
        <div className="mt-1 grid grid-cols-5 text-[10px] text-ink/45">
          {smartSteps.map((step) => (
            <span key={step.key} className="text-center">
              {step.key}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink/55">完成度 {smartProgress}% · {smartSuggestion}</p>
      </div>

      <details className="rounded-xl border border-ink/10 bg-white p-3">
        <summary className="cursor-pointer text-sm font-semibold text-ink">
          SMART 补充
          <span className="ml-2 text-xs font-normal text-ink/60">更具体、更可衡量</span>
        </summary>
        <div className="mt-3 space-y-2">
          <label className="block text-xs text-ink/65">
            具体目标说明（S）
            {!form.smart.specific.trim() && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500 align-middle" />}
            <textarea
              value={form.smart.specific}
              onChange={(event) => updateSmart("specific", event.target.value)}
              rows={3}
              placeholder="例：4 月底前完成 10 套六级阅读并整理错题"
              className={`mt-1 w-full resize-none rounded-xl border px-3 py-2 text-sm ${
                form.smart.specific.trim() ? "border-ink/15" : "border-amber-300 bg-amber-50/40"
              } ${shakeMissing && !form.smart.specific.trim() ? "shake" : ""}`}
            />
          </label>

          <label className="block text-xs text-ink/65">
            完成标准（M）
            {!form.smart.measurable.trim() && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500 align-middle" />}
            <textarea
              value={form.smart.measurable}
              onChange={(event) => updateSmart("measurable", event.target.value)}
              rows={3}
              placeholder="例：完成 10 套阅读、3 轮错题复习、模拟成绩达到 560+"
              className={`mt-1 w-full resize-none rounded-xl border px-3 py-2 text-sm ${
                form.smart.measurable.trim() ? "border-ink/15" : "border-amber-300 bg-amber-50/40"
              } ${shakeMissing && !form.smart.measurable.trim() ? "shake" : ""}`}
            />
          </label>

          <label className="block text-xs text-ink/65">
            当前基础 / 当前进度（A）
            {!form.smart.achievable.trim() && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500 align-middle" />}
            <textarea
              value={form.smart.achievable}
              onChange={(event) => updateSmart("achievable", event.target.value)}
              rows={3}
              placeholder="例：当前六级水平约 480，已完成 2 套阅读练习"
              className={`mt-1 w-full resize-none rounded-xl border px-3 py-2 text-sm ${
                form.smart.achievable.trim() ? "border-ink/15" : "border-amber-300 bg-amber-50/40"
              } ${shakeMissing && !form.smart.achievable.trim() ? "shake" : ""}`}
            />
          </label>

          <label className="block text-xs text-ink/65">
            为什么重要（R）
            {!form.smart.relevant.trim() && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500 align-middle" />}
            <textarea
              value={form.smart.relevant}
              onChange={(event) => updateSmart("relevant", event.target.value)}
              rows={3}
              placeholder="例：为了通过六级、提升期末成绩、改善作息"
              className={`mt-1 w-full resize-none rounded-xl border px-3 py-2 text-sm ${
                form.smart.relevant.trim() ? "border-ink/15" : "border-amber-300 bg-amber-50/40"
              } ${shakeMissing && !form.smart.relevant.trim() ? "shake" : ""}`}
            />
          </label>
        </div>
      </details>

      <p className="text-xs text-ink/60">
        {smartMissing.length > 0 ? `提示：建议补充 ${smartMissing.join("、")}。` : "SMART 信息较完整，可直接创建。"}
      </p>

      <button
        type="submit"
        disabled={!valid}
        className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        创建目标
      </button>
    </form>
  );
}
