"use client";

import { useState } from "react";
import { createKit } from "../actions";

type GradeOption = {
  id: string;
  name: string;
  series: { id: string; name: string }[];
};

const labelCls = "block text-sm font-medium text-neutral-700";
const inputCls =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";

export function KitForm({ grades }: { grades: GradeOption[] }) {
  const [gradeId, setGradeId] = useState("");

  const series = grades.find((g) => g.id === gradeId)?.series ?? [];

  return (
    <form action={createKit} className="mt-6 space-y-5">
      <div>
        <label className={labelCls}>等级</label>
        <select
          className={inputCls}
          value={gradeId}
          onChange={(e) => setGradeId(e.target.value)}
        >
          <option value="">请选择等级</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>作品系列</label>
        <select name="seriesId" className={inputCls} disabled={!gradeId} required>
          <option value="">{gradeId ? "请选择系列" : "请先选等级"}</option>
          {series.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {gradeId && series.length === 0 && (
          <p className="mt-1 text-xs text-amber-600">
            该等级下暂无系列，可在分类管理中添加（后续功能）。
          </p>
        )}
      </div>

      <div>
        <label className={labelCls}>型号名称</label>
        <input
          name="name"
          className={inputCls}
          placeholder="如 RX-78-2 高达"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>型号编号（可选）</label>
          <input name="code" className={inputCls} placeholder="如 RG-01" />
        </div>
        <div>
          <label className={labelCls}>比例（可选）</label>
          <input name="scale" className={inputCls} placeholder="如 1/144" />
        </div>
      </div>

      <button
        type="submit"
        className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
      >
        创建型号
      </button>
    </form>
  );
}
