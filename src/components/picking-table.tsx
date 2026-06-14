import Link from "next/link";

export type PartLite = { runnerName: string; gateNo: string; quantity: number };
export type SectionLite = { name: string; color: string | null; parts: PartLite[] };

function natCmp(a: string, b: string) {
  return a.localeCompare(b, "en", { numeric: true });
}
function fmtPart(p: PartLite) {
  return p.quantity > 1 ? `${p.gateNo}×${p.quantity}` : p.gateNo;
}

/** 取件表展示：按部位 / 按板件 两视图切换。基于 basePath 拼视图链接。 */
export function PickingTable({
  sections,
  basePath,
  byRunner,
}: {
  sections: SectionLite[];
  basePath: string;
  byRunner: boolean;
}) {
  return (
    <>
      <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-0.5 text-sm">
        <Link
          href={basePath}
          className={`rounded-md px-3 py-1 ${!byRunner ? "bg-neutral-900 text-white" : "text-neutral-600"}`}
        >
          按部位
        </Link>
        <Link
          href={`${basePath}?view=runner`}
          className={`rounded-md px-3 py-1 ${byRunner ? "bg-neutral-900 text-white" : "text-neutral-600"}`}
        >
          按板件
        </Link>
      </div>

      <div className="mt-4">
        {byRunner ? <RunnerView sections={sections} /> : <SectionView sections={sections} />}
      </div>
    </>
  );
}

function SectionView({ sections }: { sections: SectionLite[] }) {
  return (
    <div className="space-y-3">
      {sections.map((s, i) => {
        const byRunner = new Map<string, PartLite[]>();
        for (const p of s.parts) {
          if (!byRunner.has(p.runnerName)) byRunner.set(p.runnerName, []);
          byRunner.get(p.runnerName)!.push(p);
        }
        const runners = [...byRunner.keys()].sort(natCmp);
        return (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white">
            <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-2.5">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: s.color ?? "#999" }} />
              <span className="font-medium">{s.name}</span>
              <span className="text-xs text-neutral-400">
                {s.parts.reduce((m, p) => m + p.quantity, 0)} 件
              </span>
            </div>
            <div className="space-y-1.5 px-4 py-3 text-sm">
              {runners.map((rn) => (
                <div key={rn} className="flex gap-2">
                  <span className="w-10 shrink-0 font-mono font-medium text-neutral-700">{rn}</span>
                  <span className="text-neutral-600">{byRunner.get(rn)!.map(fmtPart).join("、")}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RunnerView({ sections }: { sections: SectionLite[] }) {
  const map = new Map<string, { name: string; color: string | null; parts: PartLite[] }[]>();
  for (const s of sections) {
    const perRunner = new Map<string, PartLite[]>();
    for (const p of s.parts) {
      if (!perRunner.has(p.runnerName)) perRunner.set(p.runnerName, []);
      perRunner.get(p.runnerName)!.push(p);
    }
    for (const [rn, parts] of perRunner) {
      if (!map.has(rn)) map.set(rn, []);
      map.get(rn)!.push({ name: s.name, color: s.color, parts });
    }
  }
  const runners = [...map.keys()].sort(natCmp);

  return (
    <div className="space-y-3">
      {runners.map((rn) => {
        const groups = map.get(rn)!;
        const qty = groups.reduce((m, g) => m + g.parts.reduce((k, p) => k + p.quantity, 0), 0);
        return (
          <div key={rn} className="rounded-xl border border-neutral-200 bg-white">
            <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-2.5">
              <span className="font-mono font-semibold">{rn}</span>
              <span className="text-xs text-neutral-400">板件 · {qty} 件</span>
            </div>
            <div className="space-y-1.5 px-4 py-3 text-sm">
              {groups.map((g, i) => (
                <div key={i} className="flex gap-2">
                  <span className="flex w-16 shrink-0 items-center gap-1 text-neutral-700">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: g.color ?? "#999" }} />
                    {g.name}
                  </span>
                  <span className="text-neutral-600">{g.parts.map(fmtPart).join("、")}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
