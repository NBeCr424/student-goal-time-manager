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

  const valid = useMemo(() => form.title.trim().length > 1 && form.deadline.length > 0, [form.deadline, form.title]);

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

    actions.addGoal(form);
    setForm({
      ...initialForm,
      deadline: toDateKey(addDays(new Date(), 30)),
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-ink/10 bg-white p-4">
      <h3 className="section-title">创建长期目标（SMART）</h3>

      <input
        value={form.title}
        onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
        placeholder="目标标题，例如：期末数学 90+"
        className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
      />

      <textarea
        value={form.description}
        onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
        rows={2}
        placeholder="目标描述"
        className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
      />

      <div className="grid gap-2 md:grid-cols-2">
        <textarea
          value={form.smart.specific}
          onChange={(event) => updateSmart("specific", event.target.value)}
          rows={2}
          placeholder="S: 具体"
          className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
        />
        <textarea
          value={form.smart.measurable}
          onChange={(event) => updateSmart("measurable", event.target.value)}
          rows={2}
          placeholder="M: 可衡量"
          className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
        />
        <textarea
          value={form.smart.achievable}
          onChange={(event) => updateSmart("achievable", event.target.value)}
          rows={2}
          placeholder="A: 可达成"
          className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
        />
        <textarea
          value={form.smart.relevant}
          onChange={(event) => updateSmart("relevant", event.target.value)}
          rows={2}
          placeholder="R: 相关"
          className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
        />
        <textarea
          value={form.smart.timeBound}
          onChange={(event) => updateSmart("timeBound", event.target.value)}
          rows={2}
          placeholder="T: 有期限说明"
          className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none ring-mint/50 focus:ring md:col-span-2"
        />
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
            <option value="morning">morning</option>
            <option value="afternoon">afternoon</option>
            <option value="evening">evening</option>
            <option value="flexible">flexible</option>
          </select>
        </label>

        <label className="text-xs text-ink/70">
          优先级
          <select
            value={form.priority}
            onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as NewGoalInput["priority"] }))}
            className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
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
