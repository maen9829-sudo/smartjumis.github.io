import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="max-w-4xl text-center space-y-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          The Next Generation of <span className="text-indigo-600">Freelance</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Connect with top talent and clients. Powered by AI to match you with the perfect opportunities.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            href="/projects"
            className="px-8 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Find Work
          </Link>
          <Link
            href="/freelancers"
            className="px-8 py-3 rounded-lg bg-white text-indigo-600 border border-slate-200 font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            Hire Talent
          </Link>
        </div>
      </div>
    </div>
  );
}
