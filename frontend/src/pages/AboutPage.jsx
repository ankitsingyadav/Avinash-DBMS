import Navbar from '../components/Navbar'

const features = [
  {
    icon: "🔐",
    title: "JWT Authentication",
    desc: "Secure access & refresh token system with HttpOnly cookies. Auto token rotation on expiry.",
  },
  {
    icon: "👥",
    title: "Role Based Access",
    desc: "User and Admin roles with protected routes. Admins get exclusive panel access.",
  },
  {
    icon: "☁️",
    title: "Cloud Storage",
    desc: "Profile images stored on Cloudinary with automatic face-crop and WebP optimization.",
  },
  {
    icon: "📧",
    title: "Email System",
    desc: "Nodemailer powered transactional emails for welcome, password reset, and security alerts.",
  },
  {
    icon: "🛡️",
    title: "Security First",
    desc: "bcrypt hashing, rate limiting, Helmet.js headers, and CORS protection out of the box.",
  },
  {
    icon: "🔑",
    title: "Password Recovery",
    desc: "SHA-256 hashed reset tokens with 15 min expiry. Secure end-to-end flow.",
  },
];

export default function AboutPage() {
  return (
    <div className="auth-bg min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium px-4 py-1.5 rounded-full mb-4">
            About the System
          </span>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
            Built for Production
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
            A full-stack authentication and database management system built with
            modern technologies and production-grade security practices.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {features.map((f) => (
            <div
              key={f.title}
              className="auth-card hover:border-indigo-500/30 transition-all duration-300 group"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold text-sm mb-2 group-hover:text-indigo-300 transition-colors">
                {f.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Tech Stack */}
        <div className="auth-card">
          <h2 className="text-white font-bold text-lg mb-6">Tech Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Node.js", role: "Runtime", color: "text-emerald-400" },
              { name: "Express", role: "Backend", color: "text-slate-300" },
              { name: "MongoDB", role: "Database", color: "text-green-400" },
              { name: "Mongoose", role: "ODM", color: "text-red-400" },
              { name: "React", role: "Frontend", color: "text-cyan-400" },
              { name: "Tailwind", role: "Styling", color: "text-sky-400" },
              { name: "Zustand", role: "State", color: "text-orange-400" },
              { name: "Cloudinary", role: "Storage", color: "text-blue-400" },
            ].map((t) => (
              <div key={t.name} className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30 text-center">
                <p className={`font-semibold text-sm ${t.color}`}>{t.name}</p>
                <p className="text-slate-500 text-xs mt-0.5">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/60 py-5 text-center">
        <p className="text-slate-600 text-xs">© {new Date().getFullYear()} DB Manager. All rights reserved.</p>
      </footer>
    </div>
  );
}
