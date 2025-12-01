import type { ReactNode } from "react";

export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen">
        {children}
      </div>
    </div>
  );
}
