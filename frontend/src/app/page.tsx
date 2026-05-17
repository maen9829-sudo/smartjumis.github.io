import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-64px)] flex flex-col items-center justify-center py-20 px-4">
      {/* Background Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-300/30 blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-300/20 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-5xl w-full relative z-10 text-center space-y-10">
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium border border-primary-100 animate-slide-up">
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
          SmartJumis v1.0 is Live!
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight animate-slide-up-delayed">
          The Next Generation of <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">
            Freelance Economy
          </span>
        </h1>
        
        <p className="text-xl text-slate-600 max-w-2xl mx-auto animate-slide-up-delayed" style={{ animationDelay: '0.4s' }}>
          Connect with top-tier talent and visionary clients. Powered by AI to match you with the perfect opportunities, faster than ever.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 animate-slide-up-delayed" style={{ animationDelay: '0.6s' }}>
          <Link
            href="/projects"
            className="btn-primary px-8 py-4 text-lg"
          >
            Find Work
          </Link>
          <Link
            href="/freelancers"
            className="glass px-8 py-4 text-lg font-medium text-slate-700 rounded-xl hover:bg-white/90 transition-all border border-slate-200"
          >
            Hire Talent
          </Link>
        </div>

        {/* Dashboard Preview Glass Card */}
        <div className="mt-20 glass-card p-6 md:p-12 mx-auto w-full max-w-4xl border border-white/40 animate-slide-up-delayed" style={{ animationDelay: '0.8s' }}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">SJ</div>
              <div>
                <h3 className="font-bold text-slate-900">Dashboard Preview</h3>
                <p className="text-sm text-slate-500">Live Workspace</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-200"></div>
              <div className="w-3 h-3 rounded-full bg-slate-200"></div>
              <div className="w-3 h-3 rounded-full bg-slate-200"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-primary-100 mb-4"></div>
                <div className="w-3/4 h-4 bg-slate-200 rounded mb-2"></div>
                <div className="w-1/2 h-3 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
