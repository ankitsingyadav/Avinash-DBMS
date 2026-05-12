// OrganisationFormPage.jsx — Light Theme (White / Light Blue / Black)
import React, { useState, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import axios from "../utils/axios";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import { inputCls } from "../admin/components/ui";
import LocationSelector from "../components/LocationSelector";

// ─── Constants ────────────────────────────────────────────────────────────────
const INTERACTION_MODES = ["Email", "Phone", "WhatsApp", "Visit"];

const CENTRE_TYPES = [
  "School",
  "College",
  "NGO",
  "Corporate",
  "Online",
  "Community Centre",
];

const DESIGNATION_MAP = {
  School: [
    "Principal",
    "Vice Principal",
    "Head of Department (HOD)",
    "Class Teacher",
    "Counsellor",
    "Administrator",
    "Trustee / Management",
    "Other",
  ],
  College: [
    "Principal",
    "Vice Principal",
    "Dean",
    "Head of Department (HOD)",
    "Professor",
    "Associate Professor",
    "Assistant Professor",
    "Placement Officer",
    "Registrar",
    "Administrator",
    "Trustee / Management",
    "Other",
  ],
  NGO: [
    "Director",
    "Executive Director",
    "Program Manager",
    "Project Coordinator",
    "Field Officer",
    "Volunteer Coordinator",
    "Finance Manager",
    "Fundraising Manager",
    "Communications Officer",
    "Board Member",
    "Other",
  ],
  Corporate: [
    "CEO / Managing Director",
    "HR Manager",
    "HR Business Partner",
    "Talent Acquisition Manager",
    "CSR Manager",
    "Learning & Development Manager",
    "Department Head",
    "Operations Manager",
    "Admin Manager",
    "Other",
  ],
  Online: [
    "Founder / Co-Founder",
    "CEO",
    "Course Director",
    "Content Manager",
    "Community Manager",
    "Operations Head",
    "Partnership Manager",
    "Other",
  ],
  "Community Centre": [
    "Centre Head / Coordinator",
    "Programme Officer",
    "Community Manager",
    "Social Worker",
    "Welfare Officer",
    "Volunteer Coordinator",
    "Trustee / Committee Member",
    "Other",
  ],
};

// ─── Validation Schema ────────────────────────────────────────────────────────
const organisationSchema = z.object({
  centreType: z.enum(
    ["School", "College", "NGO", "Corporate", "Online", "Community Centre"],
    { errorMap: () => ({ message: "Please select a valid institution type" }) }
  ),
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
  pincode:  z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  city:     z.string().min(1, "City is required"),
  district: z.string().min(1, "District is required"),
  state:    z.string().min(1, "State is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  contacts: z
    .array(
      z.object({
        name:          z.string().min(1, "Contact name is required"),
        designation:   z.string().min(1, "Designation is required"),
        contactNumber: z
          .string()
          .regex(/^(\+\d{1,3}[- ]?)?\d{10,15}$/, "Invalid contact number"),
        email: z.string().email("Invalid email address"),
      })
    )
    .min(1, "At least one contact person is required")
    .max(4, "Maximum 4 contact persons allowed"),
  interaction: z.object({
    interactionBy:       z.string().min(1, "Interaction by is required"),
    interactedWith:      z.string().min(1, "Interacted with is required"),
    interactionDate:     z.string().min(1, "Interaction date is required"),
    interactionMode:     z.enum(["Email", "Phone", "WhatsApp", "Visit"], {
      errorMap: () => ({ message: "Please select a valid interaction mode" }),
    }),
    notes:               z.string().optional(),
    ninAin:              z.string().optional(),
    nextInteractionDate: z.string().optional(),
  }),
  onboardedBy: z.string().min(1, "Onboarded by is required"),
  ninAin:      z.string().optional(),
});

// ─── Default Values ───────────────────────────────────────────────────────────
const DEFAULT_VALUES = {
  centreType:  "",
  centreName:  "",
  website:     "",
  pincode:     "",
  city:        "",
  district:    "",
  state:       "",
  address:     "",
  contacts: [{ name: "", designation: "", contactNumber: "", email: "" }],
  interaction: {
    interactionBy:       "",
    interactedWith:      "",
    interactionDate:     "",
    interactionMode:     "",
    notes:               "",
    ninAin:              "",
    nextInteractionDate: "",
  },
  onboardedBy: "",
  ninAin:      "",
};

// ─── Input class helper ───────────────────────────────────────────────────────
const lightInput = (hasError) =>
  `w-full bg-white border ${
    hasError
      ? "border-red-400 focus:ring-red-200 focus:border-red-400"
      : "border-slate-300 focus:ring-blue-200 focus:border-blue-400"
  } rounded-xl px-3.5 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm`;

// ─── Sub-components ───────────────────────────────────────────────────────────
const SECTION_COLORS = {
  blue:   { bar: "bg-blue-500",   badge: "bg-blue-50 border-blue-200 text-blue-700",   title: "text-blue-600" },
  green:  { bar: "bg-emerald-500",badge: "bg-emerald-50 border-emerald-200 text-emerald-700", title: "text-emerald-600" },
  violet: { bar: "bg-violet-500", badge: "bg-violet-50 border-violet-200 text-violet-700", title: "text-violet-600" },
  amber:  { bar: "bg-amber-500",  badge: "bg-amber-50 border-amber-200 text-amber-700", title: "text-amber-600" },
};

function SectionHeader({ color, title }) {
  const c = SECTION_COLORS[color];
  return (
    <h2 className={`text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2 ${c.title}`}>
      <span className={`w-1.5 h-4 ${c.bar} rounded-full`} />
      {title}
    </h2>
  );
}

function FormField({ label, error, children, colSpan2 }) {
  return (
    <div className={`space-y-1.5 ${colSpan2 ? "md:col-span-2" : ""}`}>
      <label className="text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wide">{label}</label>
      {children}
      {error && (
        <p className="text-[11px] text-red-500 ml-1 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
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
    formState: { errors, isSubmitting },
  } = useForm({
    resolver:      zodResolver(organisationSchema),
    defaultValues: DEFAULT_VALUES,
    mode:          "onBlur",
    reValidateMode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({ control, name: "contacts" });
  const contactCount = fields.length;

  const selectedCentreType = watch("centreType");
  const designationOptions = DESIGNATION_MAP[selectedCentreType] ?? [];

  const handleCentreTypeChange = useCallback(
    (value) => {
      setValue("centreType", value, { shouldValidate: true, shouldDirty: true });
      fields.forEach((_, idx) => {
        setValue(`contacts.${idx}.designation`, "", { shouldValidate: false });
      });
    },
    [setValue, fields]
  );

  const onSubmit = useCallback((data) => {
    setFormData(data);
    setShowConfirm(true);
  }, []);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await axios.post("/organisations", formData);
      toast.success("Organisation registered successfully!");
      navigate("/organisation");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to register organisation. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const isFormBusy = loading || isSubmitting;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <ConfirmModal
        isOpen={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        loading={loading}
        title="Register Organisation?"
        message={`Register "${formData?.centreName}"? This will create a permanent record.`}
      />

      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-400 to-sky-300" />

      <div className="max-w-4xl mx-auto px-5 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8" aria-label="Breadcrumb">
          <Link to="/organisation" className="hover:text-blue-600 transition-colors font-medium">
            Organisation
          </Link>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-blue-600 font-semibold" aria-current="page">
            Add Organisation
          </span>
        </nav>

        {/* Page Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-200" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Add New Organisation</h1>
            <p className="text-sm text-slate-500">Register a new centre or organisation to the database.</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
          aria-label="Organisation registration form"
        >
          {/* ═══ Section 1: Centre Information ═══════════════════════════════ */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <SectionHeader color="blue" title="Centre Information" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Institution Type */}
              <FormField label="Institution Type *" error={errors.centreType?.message}>
                <Controller
                  name="centreType"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleCentreTypeChange(e.target.value);
                      }}
                      className={lightInput(!!errors.centreType)}
                      aria-required="true"
                      aria-invalid={!!errors.centreType}
                    >
                      <option value="">Select Type</option>
                      {CENTRE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  )}
                />
              </FormField>

              {/* Institution Name */}
              <FormField label="Institution Name *" error={errors.centreName?.message}>
                <input
                  {...register("centreName")}
                  placeholder="e.g. St. Xavier's School"
                  className={lightInput(!!errors.centreName)}
                  aria-required="true"
                  aria-invalid={!!errors.centreName}
                />
              </FormField>

              {/* Website */}
              <FormField label="Website (Optional)" error={errors.website?.message} colSpan2>
                <input
                  {...register("website")}
                  type="url"
                  placeholder="https://example.com"
                  className={lightInput(!!errors.website)}
                  aria-invalid={!!errors.website}
                />
              </FormField>
            </div>

            {/* Location */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <LocationSelector
                mode="rhf"
                showPincode={true}
                register={register}
                errors={errors}
                setValue={setValue}
                getValues={getValues}
                trigger={trigger}
              />
            </div>

            {/* Street Address */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <FormField label="Street Details *" error={errors.address?.message}>
                <textarea
                  {...register("address")}
                  rows={2}
                  placeholder="Building, Street, Area..."
                  className={lightInput(!!errors.address) + " resize-none"}
                  aria-required="true"
                  aria-invalid={!!errors.address}
                />
              </FormField>
            </div>
          </section>

          {/* ═══ Section 2: Contact Persons ══════════════════════════════════ */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <SectionHeader color="green" title="Contact Person Details" />
            <p className="text-[11px] text-slate-400 mb-6 -mt-4">
              You can add up to 4 contact persons.{" "}
              <span className={contactCount >= 4 ? "text-amber-500 font-semibold" : "text-slate-400"}>
                {contactCount}/4 added
              </span>
            </p>

            <div className="space-y-6">
              {fields.map((field, index) => (
                <fieldset
                  key={field.id}
                  className="relative p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4"
                  aria-label={`Contact person ${index + 1}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Contact Person #{index + 1}
                    </span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-400 hover:text-red-600 text-xs flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded"
                        aria-label={`Remove contact person ${index + 1}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                        </svg>
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Full Name *" error={errors.contacts?.[index]?.name?.message}>
                      <input
                        {...register(`contacts.${index}.name`)}
                        placeholder="Enter name"
                        className={lightInput(!!errors.contacts?.[index]?.name)}
                        aria-required="true"
                      />
                    </FormField>

                    <FormField label="Designation *" error={errors.contacts?.[index]?.designation?.message}>
                      {designationOptions.length > 0 ? (
                        <select
                          {...register(`contacts.${index}.designation`)}
                          className={lightInput(!!errors.contacts?.[index]?.designation)}
                          aria-required="true"
                        >
                          <option value="">Select Designation</option>
                          {designationOptions.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="relative">
                          <input
                            disabled
                            placeholder="Select Institution Type first"
                            className={lightInput(!!errors.contacts?.[index]?.designation) + " opacity-50 cursor-not-allowed bg-slate-100"}
                            aria-disabled="true"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-amber-500 font-semibold pointer-events-none">
                            Select type first
                          </span>
                        </div>
                      )}
                    </FormField>

                    <FormField label="Contact Number *" error={errors.contacts?.[index]?.contactNumber?.message}>
                      <input
                        {...register(`contacts.${index}.contactNumber`)}
                        type="tel"
                        placeholder="10-digit number"
                        className={lightInput(!!errors.contacts?.[index]?.contactNumber)}
                        aria-required="true"
                      />
                    </FormField>

                    <FormField label="Email Address *" error={errors.contacts?.[index]?.email?.message}>
                      <input
                        {...register(`contacts.${index}.email`)}
                        type="email"
                        placeholder="email@example.com"
                        className={lightInput(!!errors.contacts?.[index]?.email)}
                        aria-required="true"
                      />
                    </FormField>
                  </div>
                </fieldset>
              ))}

              {contactCount < 4 ? (
                <button
                  type="button"
                  onClick={() => append({ name: "", designation: "", contactNumber: "", email: "" })}
                  className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm font-medium flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add another contact person
                </button>
              ) : (
                <div role="status" className="w-full py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 text-sm text-center font-medium">
                  Maximum of 4 contact persons reached
                </div>
              )}
            </div>
          </section>

          {/* ═══ Section 3: Interaction Remarks ══════════════════════════════ */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <SectionHeader color="violet" title="Interaction Remarks" />

            <p className="text-[11px] font-bold text-violet-500 uppercase tracking-widest mb-4">
              Current Interaction
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Interaction By *" error={errors.interaction?.interactionBy?.message}>
                <input
                  {...register("interaction.interactionBy")}
                  placeholder="Name of person who interacted"
                  className={lightInput(!!errors.interaction?.interactionBy)}
                  aria-required="true"
                />
              </FormField>

              <FormField label="Interacted With *" error={errors.interaction?.interactedWith?.message}>
                <input
                  {...register("interaction.interactedWith")}
                  placeholder="Name of contact person at org"
                  className={lightInput(!!errors.interaction?.interactedWith)}
                  aria-required="true"
                />
              </FormField>

              <FormField label="Interaction Date *" error={errors.interaction?.interactionDate?.message}>
                <input
                  type="date"
                  {...register("interaction.interactionDate")}
                  className={lightInput(!!errors.interaction?.interactionDate)}
                  aria-required="true"
                  max={new Date().toISOString().split("T")[0]}
                />
              </FormField>

              <FormField label="AIN / NIN Number" error={errors.interaction?.ninAin?.message}>
                <input
                  {...register("interaction.ninAin")}
                  placeholder="Enter AIN or NIN number"
                  className={lightInput(!!errors.interaction?.ninAin)}
                />
              </FormField>

              <FormField label="Notes" error={errors.interaction?.notes?.message} colSpan2>
                <textarea
                  {...register("interaction.notes")}
                  rows={3}
                  placeholder="Add any relevant notes about this interaction..."
                  className={lightInput(!!errors.interaction?.notes) + " resize-none"}
                />
              </FormField>
            </div>

            {/* Divider */}
            <div className="my-6 border-t border-slate-200 relative">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Next Interaction
              </span>
            </div>

            <p className="text-[11px] font-bold text-violet-500 uppercase tracking-widest mb-4">
              Next Interaction Planned
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Planned Date" error={errors.interaction?.nextInteractionDate?.message}>
                <input
                  type="date"
                  {...register("interaction.nextInteractionDate")}
                  className={lightInput(!!errors.interaction?.nextInteractionDate)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </FormField>

              <FormField label="Interaction Mode *" error={errors.interaction?.interactionMode?.message}>
                <select
                  {...register("interaction.interactionMode")}
                  className={lightInput(!!errors.interaction?.interactionMode)}
                  aria-required="true"
                >
                  <option value="">Select Mode</option>
                  {INTERACTION_MODES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </section>

          {/* ═══ Section 4: Additional Details ═══════════════════════════════ */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <SectionHeader color="amber" title="Additional Details" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Centre Onboarded By *" error={errors.onboardedBy?.message}>
                <input
                  {...register("onboardedBy")}
                  placeholder="Enter name"
                  className={lightInput(!!errors.onboardedBy)}
                  aria-required="true"
                />
              </FormField>

              <FormField label="AIN / NIN Number" error={errors.ninAin?.message}>
                <input
                  {...register("ninAin")}
                  placeholder="Enter NIN or AIN number"
                  className={lightInput(!!errors.ninAin)}
                />
              </FormField>
            </div>
          </section>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Link
              to="/organisation"
              className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/organisation")}
                disabled={isFormBusy}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isFormBusy}
                className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white hover:-translate-y-0.5 transition-all shadow-lg shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
              >
                {isFormBusy && (
                  <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {isFormBusy ? "Submitting…" : "Submit Organisation"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganisationFormPage;