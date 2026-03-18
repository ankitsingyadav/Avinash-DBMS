import { useEffect, useRef, useState } from "react";

// ─── SEO Meta Helper ────────────────────────────────────────────────────────
const SEOMeta = ({ title, description, keywords }) => {
  useEffect(() => {
    document.title = title;
    const setMeta = (name, content, prop = "name") => {
      let el = document.querySelector(`meta[${prop}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(prop, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", description);
    setMeta("keywords", keywords);
    setMeta("robots", "index, follow");
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", "website", "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
  }, [title, description, keywords]);
  return null;
};

// ─── Default Icon Components ─────────────────────────────────────────────────
const SchoolIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="64" height="64" rx="16" fill="url(#schoolGrad)" />
    <defs>
      <linearGradient id="schoolGrad" x1="0" y1="0" x2="64" y2="64">
        <stop stopColor="#3B82F6" /><stop offset="1" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    <path d="M32 12L10 24l22 12 22-12-22-12z" fill="white" fillOpacity="0.9" />
    <path d="M18 30v10c0 3 6.27 8 14 8s14-5 14-8V30" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <circle cx="52" cy="24" r="2" fill="white" />
    <path d="M52 24v10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="50" y="34" width="4" height="4" rx="1" fill="white" />
  </svg>
);

const CollegeIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="64" height="64" rx="16" fill="url(#collegeGrad)" />
    <defs>
      <linearGradient id="collegeGrad" x1="0" y1="0" x2="64" y2="64">
        <stop stopColor="#8B5CF6" /><stop offset="1" stopColor="#6D28D9" />
      </linearGradient>
    </defs>
    <rect x="12" y="28" width="40" height="24" rx="2" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2" />
    <rect x="18" y="34" width="8" height="8" rx="1" fill="white" fillOpacity="0.8" />
    <rect x="28" y="34" width="8" height="8" rx="1" fill="white" fillOpacity="0.8" />
    <rect x="38" y="34" width="8" height="8" rx="1" fill="white" fillOpacity="0.8" />
    <rect x="26" y="42" width="12" height="10" rx="1" fill="white" />
    <path d="M8 28h48" stroke="white" strokeWidth="2" />
    <path d="M32 10v18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M24 16l8-6 8 6" stroke="white" strokeWidth="2" fill="none" />
  </svg>
);

const NGOIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="64" height="64" rx="16" fill="url(#ngoGrad)" />
    <defs>
      <linearGradient id="ngoGrad" x1="0" y1="0" x2="64" y2="64">
        <stop stopColor="#10B981" /><stop offset="1" stopColor="#047857" />
      </linearGradient>
    </defs>
    <path d="M32 14c-9.94 0-18 8.06-18 18 0 6.16 3.1 11.6 7.84 14.87L32 52l10.16-5.13C47.9 43.6 50 38.16 50 32c0-9.94-8.06-18-18-18z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2" />
    <path d="M25 32l5 5 10-10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const VolunteerIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="64" height="64" rx="16" fill="url(#volunteerGrad)" />
    <defs>
      <linearGradient id="volunteerGrad" x1="0" y1="0" x2="64" y2="64">
        <stop stopColor="#F59E0B" /><stop offset="1" stopColor="#B45309" />
      </linearGradient>
    </defs>
    <path d="M32 20c-2.21 0-4 1.79-4 4 0 2.21 1.79 4 4 4s4-1.79 4-4c0-2.21-1.79-4-4-4z" fill="white" />
    <path d="M20 44c0-6.63 5.37-12 12-12s12 5.37 12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M14 38c0-4.42 2.69-8 6-8" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
    <circle cx="14" cy="26" r="3" fill="white" fillOpacity="0.8" />
    <path d="M50 38c0-4.42-2.69-8-6-8" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
    <circle cx="50" cy="26" r="3" fill="white" fillOpacity="0.8" />
  </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────────
const aboutData = [
  {
    id: 1,
    type: "school",
    badge: "Education",
    badgeColor: "bg-blue-100 text-blue-700 border border-blue-200",
    accentColor: "from-blue-500 to-blue-700",
    dotColor: "bg-blue-500",
    title: "All Public School",
    subtitle: "Excellence in Primary & Secondary Education",
    imageSrc: "/about/img1.jpg",
    imageAlt: "All Public School campus building and students",
    stats: [
      { label: "Students Enrolled", value: "1,200+" },
      { label: "Faculty Members", value: "85" },
      { label: "Years of Excellence", value: "32" },
      { label: "Pass Rate", value: "98.6%" },
    ],
    shortDescription:
      "All Public School has been nurturing young minds since 1992, offering a comprehensive curriculum that blends academic rigour with holistic development. Recognised by the CBSE board, we foster creativity, critical thinking, and character.",
    fullDescription:
      "Founded in 1992, All Public School stands as a beacon of educational excellence in the region. Our CBSE-affiliated institution offers classes from Nursery to Grade XII, with specialised streams in Science, Commerce, and Humanities. We maintain a low student-to-teacher ratio of 15:1, ensuring personalised attention for every learner. Our state-of-the-art infrastructure includes smart classrooms, a 10,000-volume library, three science laboratories, a dedicated computer lab with 100 high-speed workstations, and a sprawling sports complex. Beyond academics, students participate in more than 40 co-curricular activities ranging from robotics clubs to classical dance. Our alumni network spans 50+ countries, with graduates holding positions at leading global organisations. The school is certified under the National Green Schools Programme and runs active community outreach initiatives every quarter.",
    highlights: [
      "CBSE Affiliated (Affiliation No. 2730456)",
      "ISO 9001:2015 Certified Institution",
      "National Science Olympiad Winners 2023",
      "Smart Classroom Technology in all rooms",
      "Free transport for economically weaker sections",
    ],
    website: "https://Allschool.edu.in",
    contact: "+91-98765-43210",
    location: "Sector 12, New Delhi – 110001",
    established: "1992",
  },
  {
    id: 2,
    type: "college",
    badge: "Higher Education",
    badgeColor: "bg-purple-100 text-purple-700 border border-purple-200",
    accentColor: "from-purple-500 to-purple-700",
    dotColor: "bg-purple-500",
    title: "All Institute of Technology",
    subtitle: "Shaping Innovators & Industry Leaders",
    imageSrc: "/about/img2.jpg",
    imageAlt: "All Institute of Technology campus and engineering labs",
    stats: [
      { label: "UG & PG Programmes", value: "24" },
      { label: "Research Papers", value: "340+" },
      { label: "Placement Rate", value: "94%" },
      { label: "Industry Partners", value: "120+" },
    ],
    shortDescription:
      "All Institute of Technology is an AICTE-approved autonomous college renowned for its engineering, management, and design programmes. We combine rigorous academics with industry immersion to create career-ready professionals.",
    fullDescription:
      "Established in 2003 and accredited with an 'A+' grade by NAAC, All Institute of Technology has grown into one of the region's most sought-after higher education institutions. We offer 24 undergraduate and postgraduate programmes across Engineering, Management, Design, and Computer Applications. Our dedicated Research & Innovation Centre has filed 48 patents in the last five years, with active funding from DST and SERB. The campus spans 52 acres and includes world-class facilities: a 250-seat auditorium, a central library with access to 30,000+ digital journals via JSTOR and IEEE Xplore, advanced fabrication labs, an entrepreneurship incubator supporting 60 startups, and a 500-bed hostel. Industry tie-ups with Microsoft, TCS, Infosys, and 117 other organisations ensure our placement rate consistently exceeds 94%. Annual tech fest TechNova and cultural fest Mosaic attract participation from over 200 colleges nationwide.",
    highlights: [
      "NAAC 'A+' Accredited (2022 Cycle)",
      "Top 50 Engineering Colleges – NIRF 2024",
      "48 Patents Filed in 5 Years",
      "MoU with 120+ Industry Partners",
      "Incubation Centre – 60+ Active Startups",
    ],
    website: "https://Alltech.ac.in",
    contact: "+91-98765-11223",
    location: "Tech Park Road, Bengaluru – 560045",
    established: "2003",
  },
  {
    id: 3,
    type: "ngo",
    badge: "Non-Profit Organisation",
    badgeColor: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    accentColor: "from-emerald-500 to-emerald-700",
    dotColor: "bg-emerald-500",
    title: "Samarpan Foundation",
    subtitle: "Empowering Communities, Transforming Lives",
    imageSrc: "/about/img4.jpg",
    imageAlt: "Samarpan Foundation volunteers working with rural communities",
    stats: [
      { label: "Lives Impacted", value: "50,000+" },
      { label: "Villages Covered", value: "220" },
      { label: "Active Projects", value: "38" },
      { label: "Years of Service", value: "18" },
    ],
    shortDescription:
      "Samarpan Foundation works at the intersection of education, health, and livelihoods to break the cycle of poverty for marginalised communities across rural India. Every programme is co-designed with beneficiaries for lasting impact.",
    fullDescription:
      "Incorporated in 2006 under the Societies Registration Act, Samarpan Foundation operates across four thematic pillars: Education, Health, Livelihoods, and Environment. Over the past 18 years, we have directly impacted over 50,000 individuals across 220 villages in Rajasthan, Madhya Pradesh, and Jharkhand. Our flagship Bal Shakti Programme has enrolled 8,400 out-of-school children, with 91% of graduates continuing to secondary education. The Aarogya Health Initiative has set up 14 mobile medical units conducting over 2,000 free consultations monthly. Through Self-Help Group (SHG) federations, we have created sustainable livelihoods for 6,200 rural women with a collective annual income generation of ₹4.2 crores. Environmental programmes include planting 1.8 lakh trees, constructing 320 rainwater-harvesting structures, and training 3,500 farmers in organic agriculture. The organisation holds 12A and 80G tax exemptions and is registered on the Darpan portal (NGO-Darpan ID: RJ/2006/0142).",
    highlights: [
      "NGO-Darpan Registered | 12A & 80G Certified",
      "8,400 Children Enrolled via Bal Shakti",
      "14 Mobile Medical Units Operational",
      "6,200 Women in SHG Federations",
      "1.8 Lakh Trees Planted Across 3 States",
    ],
    website: "https://samarpanfoundation.org",
    contact: "+91-98765-77889",
    location: "Civil Lines, Jaipur – 302006",
    established: "2006",
  },
  {
    id: 4,
    type: "volunteer",
    badge: "Volunteer Network",
    badgeColor: "bg-amber-100 text-amber-700 border border-amber-200",
    accentColor: "from-amber-500 to-amber-600",
    dotColor: "bg-amber-500",
    title: "YouthServe Volunteer Corps",
    subtitle: "Youth-Powered Change Across Every Community",
    imageSrc: "/about/img3.jpg",
    imageAlt: "YouthServe volunteers engaged in community service activities",
    stats: [
      { label: "Registered Volunteers", value: "8,500+" },
      { label: "Service Hours Logged", value: "2.1 Lakh" },
      { label: "Cities Active", value: "46" },
      { label: "Campaigns Completed", value: "610" },
    ],
    shortDescription:
      "YouthServe Volunteer Corps is India's fastest-growing youth-led volunteering network, mobilising students and young professionals to drive meaningful change in education, environment, disaster relief, and elder care.",
    fullDescription:
      "Founded in 2015 by a group of university students, YouthServe Volunteer Corps has scaled to become one of India's most recognised youth volunteering platforms, with 8,500+ registered volunteers across 46 cities. Our digital platform matches volunteers with verified opportunities in real time, enabling seamless scheduling, impact tracking, and certification. In the last calendar year alone, our members logged 2.1 lakh service hours across 610 campaigns — equivalent to approximately ₹6.3 crores worth of professional services delivered to civil society organisations at zero cost. Key verticals include EduReach (remedial tutoring for government school students), GreenCities (urban afforestation and waste segregation drives), DisasterFirst (trained rapid-response teams deployed in 12 flood and cyclone events), and SilverCare (regular visits and digital literacy sessions for senior citizens). Volunteers receive verified digital certificates recognised by 85 academic institutions and endorsed by 12 corporates for CSR credit. Annual volunteer conclave VolFest draws 2,000+ attendees and features workshops, hackathons, and social innovation pitches.",
    highlights: [
      "2.1 Lakh Service Hours in 2024",
      "ISO-Verified Impact Reporting Framework",
      "Certificates Recognised by 85 Institutions",
      "Deployed in 12 Disaster Relief Operations",
      "SilverCare Active in 20 Cities",
    ],
    website: "https://youthserve.in",
    contact: "+91-98765-55667",
    location: "Koramangala, Bengaluru – 560034",
    established: "2015",
  },
];

const iconMap = {
  school: SchoolIcon,
  college: CollegeIcon,
  ngo: NGOIcon,
  volunteer: VolunteerIcon,
};

// ─── Intersection Observer Hook ───────────────────────────────────────────────
const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
};

// ─── Image Component ──────────────────────────────────────────────────────────
const CardImage = ({ src, alt, type, accentColor }) => {
  const [error, setError] = useState(false);
  const Icon = iconMap[type];
  return (
    <div className="relative w-full h-full min-h-[300px] lg:min-h-[420px] rounded-2xl overflow-hidden shadow-xl group">
      {!error ? (
        <>
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={() => setError(true)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${accentColor} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
        </>
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${accentColor} flex flex-col items-center justify-center gap-6 p-8`}>
          <div className="w-28 h-28 drop-shadow-2xl">
            <Icon />
          </div>
          <p className="text-white/80 text-sm font-medium tracking-wide uppercase text-center">
            {alt}
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Stats Grid ───────────────────────────────────────────────────────────────
const StatsGrid = ({ stats, dotColor }) => (
  <div className="grid grid-cols-2 gap-3 my-5">
    {stats.map((s) => (
      <div key={s.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
        <div className={`text-xl font-black text-gray-900 leading-tight`}>{s.value}</div>
        <div className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</div>
      </div>
    ))}
  </div>
);

// ─── Highlights List ──────────────────────────────────────────────────────────
const HighlightsList = ({ highlights, dotColor }) => (
  <ul className="space-y-2 my-4" aria-label="Key highlights">
    {highlights.map((h) => (
      <li key={h} className="flex items-start gap-2 text-sm text-gray-600">
        <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} aria-hidden="true" />
        {h}
      </li>
    ))}
  </ul>
);

// ─── Contact Row ──────────────────────────────────────────────────────────────
const ContactRow = ({ contact, location, website, established }) => (
  <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
    <span className="flex items-center gap-1.5">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
      {contact}
    </span>
    <span className="flex items-center gap-1.5">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      {location}
    </span>
    <span className="flex items-center gap-1.5">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      Est. {established}
    </span>
    <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
      Visit Website
    </a>
  </div>
);

// ─── Single About Card ────────────────────────────────────────────────────────
const AboutCard = ({ item, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [ref, inView] = useInView(0.12);
  const isEven = index % 2 === 0; // even = image left, odd = image right

  const transitionClass = inView
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-16";

  return (
    <article
      ref={ref}
      id={`${item.type}-${item.id}`}
      aria-label={item.title}
      className={`transition-all duration-700 ease-out ${transitionClass}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-500 overflow-hidden border border-gray-100">
        <div className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} gap-0`}>

          {/* ── Image Column ── */}
          <div className="lg:w-[42%] flex-shrink-0 p-5 lg:p-6">
            <CardImage
              src={item.imageSrc}
              alt={item.imageAlt}
              type={item.type}
              accentColor={item.accentColor}
            />
          </div>

          {/* ── Content Column ── */}
          <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between">
            <div>
              {/* Badge + Title */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${item.badgeColor}`}>
                  {item.badge}
                </span>
                <span className="text-xs text-gray-400 font-medium">Est. {item.established}</span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight mb-1">
                {item.title}
              </h2>
              <p className="text-sm font-semibold text-gray-500 mb-4">{item.subtitle}</p>

              {/* Stats */}
              <StatsGrid stats={item.stats} dotColor={item.dotColor} />

              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed">
                {expanded ? item.fullDescription : item.shortDescription}
              </p>

              {/* Highlights */}
              {expanded && (
                <div className="mt-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Key Highlights
                  </h3>
                  <HighlightsList highlights={item.highlights} dotColor={item.dotColor} />
                </div>
              )}

              {/* Contact */}
              {expanded && (
                <ContactRow
                  contact={item.contact}
                  location={item.location}
                  website={item.website}
                  established={item.established}
                />
              )}
            </div>

            {/* Show More / Less */}
            <div className="mt-5">
              <button
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
                aria-controls={`detail-${item.id}`}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r ${item.accentColor} text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400`}
              >
                {expanded ? (
                  <>
                    Show Less
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    Show More Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = () => {
  const [ref, inView] = useInView(0.2);
  return (
    <header
      ref={ref}
      className={`text-center mb-14 transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
    >
      <p className="inline-block text-xs font-bold tracking-[0.25em] uppercase text-blue-600 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-4">
        Our Network
      </p>
      <h1 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
        Schools, Colleges,{" "}
        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
          NGOs & Volunteers
        </span>
      </h1>
      <p className="max-w-2xl mx-auto text-gray-500 text-base leading-relaxed">
        A unified database of verified educational institutions, non-profit organisations, and volunteer networks — all the detail you need, exactly where you need it.
      </p>
    </header>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AboutData() {
  return (
    <>
      <SEOMeta
        title="About Our Network – Schools, Colleges, NGOs & Volunteers | DBMS"
        description="Explore detailed profiles of verified schools, colleges, NGOs, and volunteer networks. View stats, highlights, contact information, and more in our comprehensive database management system."
        keywords="school database, college directory, NGO profiles, volunteer network, education management system, institution details, CBSE schools, NAAC colleges, non-profit organisations India"
      />

      <section
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 py-16 px-4 sm:px-6 lg:px-8"
        aria-labelledby="about-section-heading"
      >
        <div className="max-w-6xl mx-auto">
          <SectionHeader />

          {/* Cards */}
          <div className="space-y-8" role="list" aria-label="Organisation profiles">
            {aboutData.map((item, index) => (
              <div key={item.id} role="listitem">
                <AboutCard item={item} index={index} />
              </div>
            ))}
          </div>

          {/* Footer note */}
          <footer className="mt-16 text-center text-xs text-gray-400">
            <p>
              All profiles are verified and maintained by the database administrators.
              Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}.
            </p>
          </footer>
        </div>
      </section>
    </>
  );
}