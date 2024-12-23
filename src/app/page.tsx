import Timer from '../components/features/Timer';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-800 text-white">
      <h1 className="text-4xl font-bold mb-8">Pomodoro 2.0</h1>
      <Timer />
    </main>
  );
}
