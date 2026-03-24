// import { useEffect, useState } from "react";
// import { useLocation } from "react-router-dom";

// // ── Leaf Spinner ──────────────────────────────────────────────
// function LeafSpinner() {
//   return (
//     <div style={{
//       display: "flex",
//       flexDirection: "column",
//       alignItems: "center",
//       gap: "14px",
//     }}>
//       {/* Leaf ring */}
//       <div style={{
//         width: "52px",
//         height: "52px",
//         position: "relative",
//         animation: "leaf-spin 1.2s linear infinite",
//       }}>
//         {[...Array(8)].map((_, i) => (
//           <div
//             key={i}
//             style={{
//               position: "absolute",
//               width: "13px",
//               height: "19px",
//               borderRadius: "50% 0 50% 0",
//               background: i % 2 === 0 ? "#6366f1" : "#8b5cf6",
//               top: "50%",
//               left: "50%",
//               marginTop: "-19px",
//               marginLeft: "-6.5px",
//               transformOrigin: "6.5px 26px",
//               transform: `rotate(${i * 45}deg)`,
//               animation: `leaf-fade 1.2s ease-in-out infinite ${(i * 0.15).toFixed(2)}s`,
//             }}
//           />
//         ))}
//       </div>

//       <p style={{
//         color: "#94a3b8",
//         fontSize: "13px",
//         margin: 0,
//         letterSpacing: "0.02em",
//       }}>
//         Loading...
//       </p>

//       <style>{`
//         @keyframes leaf-spin {
//           to { transform: rotate(360deg); }
//         }
//         @keyframes leaf-fade {
//           0%, 100% { opacity: 0.15; }
//           50%       { opacity: 1; }
//         }
//       `}</style>
//     </div>
//   );
// }

// // ── Route Change Loader ───────────────────────────────────────
// export default function RouteChangeLoader() {
//   const location = useLocation();
//   const [loading, setLoading] = useState(false);
//   const [progress, setProgress] = useState(0);

//   useEffect(() => {
//     setLoading(true);
//     setProgress(20);

//     const t1 = setTimeout(() => setProgress(60),  100);
//     const t2 = setTimeout(() => setProgress(90),  250);
//     const t3 = setTimeout(() => {
//       setProgress(100);
//       setTimeout(() => {
//         setLoading(false);
//         setProgress(0);
//       }, 200);
//     }, 500);

//     return () => {
//       clearTimeout(t1);
//       clearTimeout(t2);
//       clearTimeout(t3);
//     };
//   }, [location.pathname]);

//   if (!loading) return null;

//   return (
//     <>
//       {/* ── Top progress bar ── */}
//       <div style={{
//         position: "fixed",
//         top: 0,
//         left: 0,
//         height: "3px",
//         width: `${progress}%`,
//         background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
//         transition: "width 0.2s ease",
//         zIndex: 99999,
//         boxShadow: "0 0 8px rgba(99,102,241,0.7)",
//       }} />

//       {/* ── Overlay with leaf spinner ── */}
//       <div style={{
//         position: "fixed",
//         inset: 0,
//         background: "rgba(12, 12, 20, 0.6)",
//         backdropFilter: "blur(3px)",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         zIndex: 99998,
//       }}>
//         <LeafSpinner />
//       </div>
//     </>
//   );
// }
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function RouteChangeLoader() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setLoading(true);
    setProgress(20);

    const t1 = setTimeout(() => setProgress(60),  100);
    const t2 = setTimeout(() => setProgress(85),  250);
    const t3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    }, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <>
      {/* Sirf top progress bar — koi overlay/blur nahi */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "3px",
        width: `${progress}%`,
        background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
        transition: "width 0.2s ease",
        zIndex: 99999,
        boxShadow: "0 0 8px rgba(99,102,241,0.7)",
      }} />
    </>
  );
}