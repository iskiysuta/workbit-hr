import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary/10">
      <main className="w-full max-w-md bg-white shadow-lg rounded-2xl border border-primary/30 p-8 space-y-6">
        <h1 className="text-2xl font-semibold text-center text-primary">
          HR App
        </h1>
        <p className="text-center text-zinc-600">
          Silakan login untuk masuk ke dashboard HR.
        </p>
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full text-center rounded-full border border-primary px-4 py-2 text-primary hover:bg-primary/5 transition-colors"
          >
            Login
          </Link>
        </div>
      </main>
    </div>
  );
}
