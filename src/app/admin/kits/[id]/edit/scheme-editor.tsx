"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { saveScheme } from "../../actions";
import { SubmitButton } from "@/app/admin/_components/submit-button";

type PartRow = { uid: number; runnerName: string; gateNo: string; quantity: number };
type SectionRow = { uid: number; name: string; color: string; parts: PartRow[] };

let _uid = 1;
const uid = () => _uid++;

const inputCls =
  "rounded border border-neutral-300 px-2 py-1 text-sm focus:border-neutral-500 focus:outline-none";

export function SchemeEditor({
  modelKitId,
  kitName,
  initial,
}: {
  modelKitId: string;
  kitName: string;
  initial: { name: string; color: string; parts: { runnerName: string; gateNo: string; quantity: number }[] }[];
}) {
  const [sections, setSections] = useState<SectionRow[]>(
    initial.map((s) => ({
      uid: uid(),
      name: s.name,
      color: s.color || "#3b82f6",
      parts: s.parts.map((p) => ({ uid: uid(), ...p })),
    })),
  );

  function update(fn: (draft: SectionRow[]) => void) {
    setSections((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }

  const payload = useMemo(
    () =>
      JSON.stringify({
        modelKit: { name: kitName },
        sections: sections.map((s) => ({
          name: s.name.trim() || "未命名",
          color: s.color || undefined,
          parts: s.parts
            .filter((p) => p.runnerName.trim() && p.gateNo.trim())
            .map((p) => ({
              runnerName: p.runnerName.trim(),
              gateNo: p.gateNo.trim(),
              quantity: Math.max(1, Number(p.quantity) || 1),
            })),
        })),
      }),
    [sections, kitName],
  );

  return (
    <form action={saveScheme} className="mt-6">
      <input type="hidden" name="modelKitId" value={modelKitId} />
      <input type="hidden" name="json" value={payload} />

      <div className="sticky top-0 z-10 mb-4 flex items-center gap-3 bg-neutral-50/90 py-2 backdrop-blur">
        <SubmitButton pendingText="保存中…">保存</SubmitButton>
        <Link
          href={`/admin/kits/${modelKitId}`}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100"
        >
          取消
        </Link>
        <span className="text-xs text-neutral-400">
          {sections.length} 部位 ·{" "}
          {sections.reduce((n, s) => n + s.parts.length, 0)} 取件项
        </span>
      </div>

      <div className="space-y-4">
        {sections.map((s, si) => (
          <div key={s.uid} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={s.color}
                onChange={(e) => update((d) => { d[si].color = e.target.value; })}
                className="h-8 w-8 shrink-0 cursor-pointer rounded border border-neutral-300"
                title="部位颜色"
              />
              <input
                value={s.name}
                onChange={(e) => update((d) => { d[si].name = e.target.value; })}
                placeholder="部位名，如 头部"
                className={`${inputCls} flex-1 font-medium`}
              />
              <button
                type="button"
                onClick={() => update((d) => { d.splice(si, 1); })}
                className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                删除部位
              </button>
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="flex gap-2 px-1 text-xs text-neutral-400">
                <span className="w-20">板件</span>
                <span className="w-20">剪口号</span>
                <span className="w-16">数量</span>
              </div>
              {s.parts.map((p, pi) => (
                <div key={p.uid} className="flex items-center gap-2">
                  <input
                    value={p.runnerName}
                    onChange={(e) => update((d) => { d[si].parts[pi].runnerName = e.target.value; })}
                    placeholder="A"
                    className={`${inputCls} w-20 font-mono`}
                  />
                  <input
                    value={p.gateNo}
                    onChange={(e) => update((d) => { d[si].parts[pi].gateNo = e.target.value; })}
                    placeholder="26"
                    className={`${inputCls} w-20 font-mono`}
                  />
                  <input
                    type="number"
                    min={1}
                    value={p.quantity}
                    onChange={(e) => update((d) => { d[si].parts[pi].quantity = Number(e.target.value); })}
                    className={`${inputCls} w-16`}
                  />
                  <button
                    type="button"
                    onClick={() => update((d) => { d[si].parts.splice(pi, 1); })}
                    className="rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-100 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  update((d) => {
                    d[si].parts.push({ uid: uid(), runnerName: "", gateNo: "", quantity: 1 });
                  })
                }
                className="mt-1 text-xs text-neutral-600 hover:text-neutral-900"
              >
                + 添加取件项
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          update((d) => {
            d.push({ uid: uid(), name: "", color: "#3b82f6", parts: [] });
          })
        }
        className="mt-4 rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:border-neutral-500"
      >
        + 添加部位
      </button>
    </form>
  );
}
