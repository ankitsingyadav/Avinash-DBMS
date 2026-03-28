// OrganisationFormPage.jsx — Updated with all requested changes
import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import axios from "../utils/axios";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import { inputCls } from "../admin/components/ui";
import LocationSelector from "../components/LocationSelector";

const INTERACTION_MODES = ["Email", "Phone", "WhatsApp", "Visit"];

const organisationSchema = z.object({
  centreType: z.enum(["School", "College", "NGO", "Corporate", "Online", "Community Centre"], {
    errorMap: () => ({ message: "Please select a valid centre type" }),
  }),
  centreName: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name cannot exceed 100 characters"),
  website: z
    .string()
    .optional()
    .refine((val) => !val || /^https?:\/\/.+/.test(val), {
      message: "Website must start with http:// or https://",
    }),

  // ── Location now comes before address ──
  state:    z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  city:     z.string().min(1, "City is required"),
  pincode:  z.string().regex(/^\d{6}$/, "Pincode must be a 6-digit number"),

  address: z.string().min(5, "Address is required"),

  contacts: z
    .array(
      z.object({
        name:          z.string().min(1, "Contact name is required"),
        designation:   z.string().min(1, "Designation is required"),
        contactNumber: z.string().regex(/^(\+\d{1,3}[- ]?)?\d{10,15}$/, "Invalid contact number"),
        email:         z.string().email("Invalid email address"),
      })
    )
    .min(1, "At least one contact person is required")
    .max(4, "Maximum 4 contact persons allowed"),

  // ── Interaction Remarks ──
  interaction: z.object({
    interactionBy:         z.string().min(1, "Interaction by is required"),
    interactedWith:        z.string().min(1, "Interacted with is required"),
    interactionDate:       z.string().min(1, "Interaction date is required"),
    notes:                 z.string().optional(),
    ninAin:                z.string().optional(),
    nextInteractionDate:   z.string().optional(),
    interactionMode:       z.enum(["Email", "Phone", "WhatsApp", "Visit"], {
      errorMap: () => ({ message: "Please select a valid interaction mode" }),
    }),
  }),

  // ── Additional Details ──
  onboardedBy: z.string().min(1, "Onboarded by is required"),
  ninAin:      z.string().optional(), // NIN/AIN in onboarding section
});

const CENTRE_TYPES = ["School", "College", "NGO", "Corporate", "Online", "Community Centre"];

const OrganisationFormPage = () => {
  const navigate = useNavigate();
  const [loading,     setLoading]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData,    setFormData]    = useState(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(organisationSchema),
    defaultValues: {
      centreType:  "",
      centreName:  "",
      website:     "",
      state:       "",
      district:    "",
      city:        "",
      pincode:     "",
      address:     "",
      contacts:    [{ name: "", designation: "", contactNumber: "", email: "" }],
      interaction: {
        interactionBy:       "",
        interactedWith:      "",
        interactionDate:     "",
        notes:               "",
        ninAin:              "",
        nextInteractionDate: "",
        interactionMode:     "",
      },
      onboardedBy: "",
      ninAin:      "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "contacts" });
  const contactCount = fields.length;

  const onSubmit = (data) => {
    setFormData(data);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await axios.post("/organisations", formData);
      toast.success("Organisation registered successfully!");
      navigate("/organisation");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to register organisation.");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c14] text-slate-300">
      <ConfirmModal
        isOpen={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        loading={loading}
        title="Register Organisation?"
        message={`Register "${formData?.centreName}"? This will create a permanent record.`}
      />

      <div className="max-w-4xl mx-auto px-5 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-8">
          <Link to="/organisation" className="hover:text-slate-300 transition-colors">Organisation</Link>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
          <span className="text-indigo-400 font-medium">Add Organisation</span>
        </div>

        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Add New Organisation</h1>
            <p className="text-sm text-slate-500">Register a new centre or organisation to the database.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ═══════════════════════════════════════════════════════════════
              Section 1: Centre Information
              Order: Type → Name → Website → LocationSelector → Full Address
          ═══════════════════════════════════════════════════════════════ */}
          <div className="bg-[#13131f]/50 border border-slate-800/60 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />
              Centre Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Centre Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 ml-1">Insitution Type *</label>
                <select {...register("centreType")} className={inputCls(!!errors.centreType)}>
                  <option value="">Select Type</option>
                  {CENTRE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.centreType && <p className="text-[10px] text-red-400 ml-1">{errors.centreType.message}</p>}
              </div>

              {/* Centre Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 ml-1">Insitution Name *</label>
                <input
                  {...register("centreName")}
                  placeholder="e.g. St. Xavier's School"
                  className={inputCls(!!errors.centreName)}
                />
                {errors.centreName && <p className="text-[10px] text-red-400 ml-1">{errors.centreName.message}</p>}
              </div>

              {/* Website */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 ml-1">Website (Optional)</label>
                <input
                  {...register("website")}
                  placeholder="https://example.com"
                  className={inputCls(!!errors.website)}
                />
                {errors.website && <p className="text-[10px] text-red-400 ml-1">{errors.website.message}</p>}
              </div>
            </div>

            {/* ── LocationSelector (moved above Full Address) ── */}
            <div className="mt-6 pt-6 border-t border-slate-800/60">
              <LocationSelector
                mode="rhf"
                showPincode={true}
                control={control}
                register={register}
                errors={errors}
                setValue={setValue}
                getValues={getValues}
                trigger={trigger}
              />
            </div>

            {/* ── Full Address (moved below LocationSelector) ── */}
            <div className="mt-6 pt-6 border-t border-slate-800/60">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 ml-1"> Street Details *</label>
                <textarea
                  {...register("address")}
                  rows={2}
                  placeholder="Building, Street, Area..."
                  className={inputCls(!!errors.address) + " resize-none"}
                />
                {errors.address && <p className="text-[10px] text-red-400 ml-1">{errors.address.message}</p>}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              Section 2: Contact Person Details (max 4)
          ═══════════════════════════════════════════════════════════════ */}
          <div className="bg-[#13131f]/50 border border-slate-800/60 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              Contact Person Details
            </h2>
            <p className="text-[11px] text-slate-500 mb-6">
              You can add up to 4 contact persons.&nbsp;
              <span className={contactCount >= 4 ? "text-amber-400 font-semibold" : "text-slate-600"}>
                {contactCount}/4 added
              </span>
            </p>

            <div className="space-y-6">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="relative p-5 bg-slate-800/30 border border-slate-700/40 rounded-xl space-y-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Contact Person #{index + 1}
                    </span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15"/>
                        </svg>
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 ml-1">Full Name *</label>
                      <input
                        {...register(`contacts.${index}.name`)}
                        placeholder="Enter name"
                        className={inputCls(!!errors.contacts?.[index]?.name)}
                      />
                      {errors.contacts?.[index]?.name && (
                        <p className="text-[10px] text-red-400 ml-1">{errors.contacts[index].name.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 ml-1">Designation *</label>
                      <input
                        {...register(`contacts.${index}.designation`)}
                        placeholder="e.g. Principal, Director"
                        className={inputCls(!!errors.contacts?.[index]?.designation)}
                      />
                      {errors.contacts?.[index]?.designation && (
                        <p className="text-[10px] text-red-400 ml-1">{errors.contacts[index].designation.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 ml-1">Contact Number *</label>
                      <input
                        {...register(`contacts.${index}.contactNumber`)}
                        placeholder="10-digit number"
                        className={inputCls(!!errors.contacts?.[index]?.contactNumber)}
                      />
                      {errors.contacts?.[index]?.contactNumber && (
                        <p className="text-[10px] text-red-400 ml-1">{errors.contacts[index].contactNumber.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 ml-1">Email Address *</label>
                      <input
                        {...register(`contacts.${index}.email`)}
                        placeholder="email@example.com"
                        className={inputCls(!!errors.contacts?.[index]?.email)}
                      />
                      {errors.contacts?.[index]?.email && (
                        <p className="text-[10px] text-red-400 ml-1">{errors.contacts[index].email.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add contact button — hidden when limit reached */}
              {contactCount < 4 ? (
                <button
                  type="button"
                  onClick={() => append({ name: "", designation: "", contactNumber: "", email: "" })}
                  className="w-full py-3 border-2 border-dashed border-slate-700/50 rounded-xl text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-sm font-medium flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                  </svg>
                  Add another contact person
                </button>
              ) : (
                <div className="w-full py-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-400/70 text-sm text-center font-medium">
                  Maximum of 4 contact persons reached
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              Section 3: Interaction Remarks
          ═══════════════════════════════════════════════════════════════ */}
          <div className="bg-[#13131f]/50 border border-slate-800/60 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-violet-500 rounded-full" />
              Interaction Remarks
            </h2>

            {/* ── Part 1: Current Interaction Details ── */}
            <div>
              <p className="text-[11px] font-semibold text-violet-400 uppercase tracking-widest mb-4">
                Current Interaction
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Interaction By */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 ml-1">Interaction By *</label>
                  <input
                    {...register("interaction.interactionBy")}
                    placeholder="Name of person who interacted"
                    className={inputCls(!!errors.interaction?.interactionBy)}
                  />
                  {errors.interaction?.interactionBy && (
                    <p className="text-[10px] text-red-400 ml-1">{errors.interaction.interactionBy.message}</p>
                  )}
                </div>

                {/* Interacted With */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 ml-1">Interacted With *</label>
                  <input
                    {...register("interaction.interactedWith")}
                    placeholder="Name of contact person at org"
                    className={inputCls(!!errors.interaction?.interactedWith)}
                  />
                  {errors.interaction?.interactedWith && (
                    <p className="text-[10px] text-red-400 ml-1">{errors.interaction.interactedWith.message}</p>
                  )}
                </div>

                {/* Interaction Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 ml-1">Interaction Date *</label>
                  <input
                    type="date"
                    {...register("interaction.interactionDate")}
                    className={inputCls(!!errors.interaction?.interactionDate)}
                  />
                  {errors.interaction?.interactionDate && (
                    <p className="text-[10px] text-red-400 ml-1">{errors.interaction.interactionDate.message}</p>
                  )}
                </div>

                {/* AIN/NIN */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 ml-1">AIN / NIN Number</label>
                  <input
                    {...register("interaction.ninAin")}
                    placeholder="Enter AIN or NIN number"
                    className={inputCls(!!errors.interaction?.ninAin)}
                  />
                  {errors.interaction?.ninAin && (
                    <p className="text-[10px] text-red-400 ml-1">{errors.interaction.ninAin.message}</p>
                  )}
                </div>

                {/* Notes — full width */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-slate-400 ml-1">Notes</label>
                  <textarea
                    {...register("interaction.notes")}
                    rows={3}
                    placeholder="Add any relevant notes about this interaction..."
                    className={inputCls(!!errors.interaction?.notes) + " resize-none"}
                  />
                  {errors.interaction?.notes && (
                    <p className="text-[10px] text-red-400 ml-1">{errors.interaction.notes.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="my-6 border-t border-slate-700/50 relative">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#13131f] px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                Next Interaction
              </span>
            </div>

            {/* ── Part 2: Next Interaction ── */}
            <div>
              <p className="text-[11px] font-semibold text-violet-400 uppercase tracking-widest mb-4">
                Next Interaction Planned
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Next Interaction Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 ml-1">Planned Date</label>
                  <input
                    type="date"
                    {...register("interaction.nextInteractionDate")}
                    className={inputCls(!!errors.interaction?.nextInteractionDate)}
                  />
                  {errors.interaction?.nextInteractionDate && (
                    <p className="text-[10px] text-red-400 ml-1">{errors.interaction.nextInteractionDate.message}</p>
                  )}
                </div>

                {/* Interaction Mode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 ml-1">Interaction Mode *</label>
                  <select
                    {...register("interaction.interactionMode")}
                    className={inputCls(!!errors.interaction?.interactionMode)}
                  >
                    <option value="">Select Mode</option>
                    {INTERACTION_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {errors.interaction?.interactionMode && (
                    <p className="text-[10px] text-red-400 ml-1">{errors.interaction.interactionMode.message}</p>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              Section 4: Additional Details
          ═══════════════════════════════════════════════════════════════ */}
          <div className="bg-[#13131f]/50 border border-slate-800/60 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-amber-500 rounded-full" />
              Additional Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Onboarded By */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 ml-1">Centre Onboarded By *</label>
                <input
                  {...register("onboardedBy")}
                  placeholder="Enter name"
                  className={inputCls(!!errors.onboardedBy)}
                />
                {errors.onboardedBy && (
                  <p className="text-[10px] text-red-400 ml-1">{errors.onboardedBy.message}</p>
                )}
              </div>

              {/* NIN/AIN in Onboarding */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 ml-1">NIN / AIN</label>
                <input
                  {...register("ninAin")}
                  placeholder="Enter NIN or AIN number"
                  className={inputCls(!!errors.ninAin)}
                />
                {errors.ninAin && (
                  <p className="text-[10px] text-red-400 ml-1">{errors.ninAin.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
            <Link
              to="/organisation"
              className="text-sm text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
              Back
            </Link>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/organisation")}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-slate-800/60 border border-slate-700/50 hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white hover:-translate-y-0.5 transition-all shadow-lg shadow-indigo-500/20"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
              >
                Submit Organisation
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganisationFormPage;