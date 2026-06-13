"use client";

import { importExtractionAction } from "../actions";
import { SubmitButton } from "@/app/admin/_components/submit-button";

export function ImportJsonForm({ modelKitId }: { modelKitId: string }) {
  return (
    <form action={importExtractionAction} className="mt-3 space-y-3">
      <input type="hidden" name="modelKitId" value={modelKitId} />
      <textarea
        name="json"
        rows={8}
        required
        placeholder='粘贴识别 JSON，如 {"modelKit":{...},"runners":[...],"steps":[...]}'
        className="w-full rounded-lg border border-neutral-300 p-3 font-mono text-xs focus:border-neutral-500 focus:outline-none"
      />
      <SubmitButton pendingText="导入中…">导入 JSON（覆盖现有取件表）</SubmitButton>
    </form>
  );
}
