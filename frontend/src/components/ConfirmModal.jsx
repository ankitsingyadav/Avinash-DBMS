// ConfirmModal.jsx — Reusable professional confirmation dialog

export default function ConfirmModal({ isOpen, onConfirm, onCancel, title, message, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!loading ? onCancel : undefined}
      />

      {/* Dialog */}
      <div className="relative z-10 bg-[#13131f] border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-modal">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>

        <h3 className="text-white text-lg font-bold text-center mb-2">
          {title || "Confirm Submission"}
        </h3>
        <p className="text-slate-400 text-sm text-center leading-relaxed mb-6">
          {message || "Are you sure you want to submit this form? This will create a new entry in the database."}
        </p>

        {/* Divider */}
        <div className="h-px bg-slate-800/60 mb-5" />

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/60 hover:text-white transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                Yes, Submit
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal { animation: modal-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}