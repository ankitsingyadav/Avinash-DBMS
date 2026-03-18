import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
const cards = [
  {
    id: "school",
    label: "Schools",
    route: "/organisation/school",
    img: "/school.png",
    alt: "School building",
    description: "Register schools, principals, and institutional contact details.",
    accent: "#6366f1",
    gradient: "from-indigo-600/20 to-violet-600/10",
    border: "border-indigo-500/30",
    stat: "Academic Institutions",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-4-4v4m8-4v4M3 21h18"/>
      </svg>
    ),
  },
  {
    id: "college",
    label: "Colleges",
    route: "/organisation/college",
    img: "/college.png",
    alt: "College campus",
    description: "Register colleges, universities, and their directors or heads.",
    accent: "#0ea5e9",
    gradient: "from-sky-600/20 to-cyan-600/10",
    border: "border-sky-500/30",
    stat: "Higher Education",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4"/>
      </svg>
    ),
  },
  {
    id: "ngo",
    label: "NGOs",
    route: "/organisation/ngo",
    img: "/ngo.png",
    alt: "NGO organization",
    description: "Register non-governmental organizations and their core focus areas.",
    accent: "#10b981",
    gradient: "from-emerald-600/20 to-teal-600/10",
    border: "border-emerald-500/30",
    stat: "Non-Profit Orgs",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
      </svg>
    ),
  },
  {
    id: "volunteer",
    label: "Volunteers",
    route: "/organisation/volunteer",
    img: "/volunteer.png",
    alt: "Volunteer workers",
    description: "Register volunteers, their skills, and assign to organisations.",
    accent: "#f59e0b",
    gradient: "from-amber-600/20 to-orange-600/10",
    border: "border-amber-500/30",
    stat: "Field Workers",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    ),
  },
];

export default function OrganisationPage() {
  const navigate = useNavigate();

  return (
      <div className="min-h-screen bg-[#0c0c14]">
      <Navbar/>
      {/* Page Header */}
      <div className="max-w-6xl mx-auto px-5 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full" />
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
            Admin Panel · Organisation Management
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Select Organisation Type</h1>
        <p className="text-slate-400 text-sm max-w-lg">
          Each organisation type is stored in its own dedicated collection. Choose a category
          below to register a new entry.
        </p>
      </div>

      {/* Cards */}
      <div className="max-w-6xl mx-auto px-5 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => navigate(card.route)}
              className={`group relative text-left bg-[#13131f] border ${card.border} rounded-2xl p-6 transition-all duration-300 cursor-pointer overflow-hidden`}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 20px 60px ${card.accent}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* BG gradient on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
              />
              {/* Decorative blob */}
              <div
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-[0.07] group-hover:opacity-[0.14] transition-opacity duration-300 pointer-events-none"
                style={{ background: card.accent }}
              />

              <div className="relative z-10">
                {/* Icon Box */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 overflow-hidden"
                  style={{ background: `${card.accent}15`, border: `1.5px solid ${card.accent}30` }}
                >
                  <img
                    src={card.img}
                    alt={card.alt}
                    className="w-9 h-9 object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                  <span
                    className="hidden items-center justify-center"
                    style={{ color: card.accent }}
                  >
                    {card.icon}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-white text-lg font-bold mb-1">{card.label}</h3>

                {/* Badge */}
                <span
                  className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-3 tracking-wide"
                  style={{
                    background: `${card.accent}15`,
                    color: card.accent,
                    border: `1px solid ${card.accent}30`,
                  }}
                >
                  {card.stat}
                </span>

                {/* Description */}
                <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">
                  {card.description}
                </p>

                {/* CTA */}
                <div
                  className="mt-5 flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: card.accent }}
                >
                  <span>Add</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14" height="14"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Info strip */}
        <div className="mt-8 bg-[#13131f] border border-slate-700/40 rounded-xl p-4 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <p className="text-slate-400 text-xs">
            <span className="text-white font-semibold">Admin only · </span>
            All registrations are logged with timestamps. Each type maintains its own MongoDB collection with dedicated validation schemas.
          </p>
        </div>
      </div>
    </div>
  );
}