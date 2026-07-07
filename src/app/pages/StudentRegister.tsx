import React, { useState, useRef, ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { BookOpen, CheckCircle, ChevronRight, X, Shield, Wallet, CreditCard, Smartphone, Library, Camera, Check } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../components/ui/select";

const API_BASE = "http://localhost:3001/api";

type RegStep = 1 | 2 | 3;

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${compact ? "w-8 h-8" : "w-10 h-10"} rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0`}>
        <BookOpen className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-white`} />
      </div>
      <div>
        <div className={`font-extrabold text-blue-700 leading-tight ${compact ? "text-sm" : "text-base"}`}>SVGA</div>
        <div className={`text-slate-400 font-semibold uppercase tracking-widest leading-tight ${compact ? "text-[8px]" : "text-[9px]"}`}>Book Bank</div>
      </div>
    </div>
  );
}

function StepBar({ step, labels }: { step: RegStep; labels: string[] }) {
  return (
    <div className="flex items-start justify-center gap-0 mb-8">
      {labels.map((label, i) => (
        <div key={label} className="flex items-start">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                i + 1 < step
                  ? "bg-blue-600 border-blue-600 text-white"
                  : i + 1 === step
                  ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100"
                  : "bg-white border-slate-200 text-slate-400"
              }`}
            >
              {i + 1 < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={`mt-2 text-[11px] font-semibold whitespace-nowrap ${
                i + 1 === step ? "text-blue-600" : i + 1 < step ? "text-blue-400" : "text-slate-400"
              }`}
            >
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div
              className={`w-20 h-0.5 mt-[18px] mx-1 transition-all duration-300 ${
                i + 1 < step ? "bg-blue-500" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function FieldInput({
  label,
  placeholder,
  type = "text",
  options,
  span,
  value,
  onChange,
  readOnly = false,
  disabled = false,
  required = true,
  inputMode,
  maxLength,
  pattern,
  defaultValue,
}: {
  label: string;
  placeholder: string;
  type?: string;
  options?: string[];
  span?: number;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  readOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  inputMode?: string;
  maxLength?: number;
  pattern?: string;
  defaultValue?: string;
}) {
  const cls = "w-full min-h-[52px] px-4 py-3 bg-blue-50/60 border border-blue-100 rounded-[18px] text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-transparent transition-all duration-250 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed disabled:border-slate-200";
  
  // Use custom Select component if type is "select"
  if (type === "select") {
    return (
      <div className={span === 2 ? "sm:col-span-2" : ""}>
        <label className="block text-sm font-bold text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-blue-300 font-normal"> *</span>}
        </label>
        <div className="relative">
          <Select
            value={value ?? ""}
            onValueChange={(nextValue) =>
              onChange?.({ target: { value: nextValue } } as unknown as ChangeEvent<HTMLSelectElement>)
            }
            disabled={disabled}
          >
            <SelectTrigger className={`${cls} pr-10`} size="default">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="max-h-64 overflow-y-auto">
              {options?.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className={span === 2 ? "sm:col-span-2" : ""}>
      <label className="block text-sm font-bold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-blue-300 font-normal"> *</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        disabled={disabled}
        inputMode={inputMode as any}
        maxLength={maxLength}
        pattern={pattern}
        defaultValue={defaultValue}
        className={cls}
      />
    </div>
  );
}

export function StudentRegister() {
  const navigate = useNavigate();
  const { tempLoginData, token, loginStudent, setTempLoginData } = useAuth();

  React.useEffect(() => {
    if (!token) {
      navigate("/student/login");
    }
  }, [token, navigate]);

  const aadhaar = tempLoginData?.aadhaarNumber || "";
  const phone = tempLoginData?.phone || "";
  const initialEmail = tempLoginData?.email || "";

  const [step, setStep] = useState<RegStep>(1);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // --- Step 1: Personal Form State ---
  const [firstName, setFirstName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [grandfatherName, setGrandfatherName] = useState("");
  const [surname, setSurname] = useState("");
  const [showSurnameOther, setShowSurnameOther] = useState(false);
  const [manualSurname, setManualSurname] = useState("");
  const [officialSurname, setOfficialSurname] = useState("");
  
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [showOccupationOther, setShowOccupationOther] = useState(false);
  const [manualOccupation, setManualOccupation] = useState("");
  
  const [nativeVillage, setNativeVillage] = useState("");
  const [parentsContact, setParentsContact] = useState("");
  const [currentResidence, setCurrentResidence] = useState("");

  const surnameOptions = ["Bauva", "Buricha", "Charla", "Chhadwa", "Chheda", "Dagha", "Dedhia", "Furiya", "Gada", "Gala", "Gindra", "Gogri", "Karia", "Khirani-Gala", "Khuthia", "Mamania", "Mota", "Nandu", "Nisar", "Rambhia", "Rita", "Satra", "Savla", "Shah", "Vadhan", "Visaria", "Vora", "Other"];
  const occupationOptions = ["Student", "Part-time Job", "Freelancer", "Business", "Service / Employment", "Other"];
  const villageOptions = ["Adhoi", "Bhachau", "Bharudia", "Gagodar", "Ghanithar", "Halra", "Kakrava", "Kharoi", "Lakadiya", "Manafra", "Nandasar", "N. Trambo", "Rav", "Samkhiyari", "Shivlakha", "Suvai", "Thoriyari", "Trambo", "Vanoi"];

  // --- Step 2: Academic Form State ---
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("");
  const [showCourseOther, setShowCourseOther] = useState(false);
  const [manualCourse, setManualCourse] = useState("");
  const [stream, setStream] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  const courseOptions = ["FYJC Science", "SYJC Science", "FYJC Commerce", "SYJC Commerce", "FYJC Arts", "SYJC Arts", "B.Com", "B.Sc", "BA", "BBA", "BCA", "MBBS", "BDS", "B.Pharm", "Engineering", "Diploma", "Other"];

  // --- Step 3: Photo Form State ---
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Photo size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
        setError("");
      };
      reader.readAsDataURL(file);
    }
  };

  const isStep1Valid = firstName && (showSurnameOther ? manualSurname : surname) && fatherName && grandfatherName && dob && gender && (showOccupationOther ? manualOccupation : occupation) && nativeVillage && parentsContact && currentResidence;
  const isStep2Valid = college && (showCourseOther ? manualCourse : course) && stream && specialization && academicYear;

  const handleNext = () => {
    setError("");
    if (step === 1 && !isStep1Valid) {
      setError("Please fill all required personal details.");
      return;
    }
    if (step === 2 && !isStep2Valid) {
      setError("Please fill all required academic details.");
      return;
    }
    if (step < 3) {
      setStep((s) => (s + 1) as RegStep);
    } else {
      setShowPayment(true);
    }
  };

  const handleCompletePayment = async () => {
    setSaving(true);
    setError("");
    try {
      const finalSurname = showSurnameOther ? manualSurname : surname;
      const finalOccupation = showOccupationOther ? manualOccupation : occupation;
      const finalCourse = showCourseOther ? manualCourse : course;

      const payload: Record<string, unknown> = {
        firstName,
        fatherName,
        grandfatherName,
        surname: finalSurname,
        officialSurname,
        email: initialEmail,
        course: finalCourse,
        college,
        village: nativeVillage,
        dob,
        gender,
        occupation: finalOccupation,
        parentsContact,
        currentResidence,
        stream,
        specialization,
        academicYear,
      };

      // Only include profilePhoto if it's under ~5MB to avoid payload issues
      if (profilePhoto && profilePhoto.length < 5 * 1024 * 1024) {
        payload.profilePhoto = profilePhoto;
      }

      const res = await fetch(`${API_BASE}/auth/complete-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      // Handle non-JSON responses (e.g. 413 Payload Too Large returns HTML)
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", res.status, text);
        setError(`Server error (${res.status}). Please try again.`);
        setShowPayment(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        loginStudent(data.user, data.token);
        setTempLoginData(null);
        setShowPayment(false);
        setShowSuccess(true);
      } else {
        setError(data.message || "Failed to complete profile.");
        setShowPayment(false);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Network error. Please check your connection and try again.");
      setShowPayment(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50/60 to-indigo-50 px-4 py-8 relative">
      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 relative"
          >
            <button
              onClick={() => setShowPayment(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>

            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-7 h-7 text-blue-600" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800">Complete Payment</h2>
              <p className="text-slate-400 text-sm mt-1">One-time refundable security deposit</p>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-sky-500 rounded-2xl p-5 text-white text-center mb-5">
              <div className="text-4xl font-extrabold">₹500</div>
              <div className="text-blue-100 text-xs mt-1.5 flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Fully refundable deposit
              </div>
            </div>

            <div className="flex gap-2 mb-5">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all bg-blue-600 text-white shadow-md shadow-blue-200">
                <CreditCard className="w-3.5 h-3.5" /> Demo Payment
              </button>
            </div>

            <button
              onClick={handleCompletePayment}
              disabled={saving}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? "Processing..." : "Pay ₹500 Securely"}
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-3 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" /> Secured with 256-bit SSL encryption
            </p>
          </motion.div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Registration Complete!</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Your profile has been saved successfully and your membership is now active.
            </p>
            <button
              onClick={() => navigate("/student", { replace: true })}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
            >
              Go to Dashboard →
            </button>
          </motion.div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-6">
          <Logo />
          <h1 className="text-2xl font-extrabold text-slate-800 mt-4 tracking-tight">Student Registration</h1>
          <p className="text-slate-400 text-sm mt-1">Complete your profile to access the book bank</p>
        </div>

        <StepBar step={step} labels={["Personal Details", "Academic Info", "Profile Photo"]} />

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-xl shadow-blue-100/60 border border-blue-50 p-8"
        >
          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 mb-1">Personal Details</h2>
              <p className="text-slate-400 text-sm mb-6">Enter your details as per official documents</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldInput label="Email Address" placeholder="rahul.sharma@email.com" type="email" value={initialEmail} disabled readOnly span={2} />
                <FieldInput label="First Name" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <FieldInput label="Surname" placeholder="Select surname" type="select" options={surnameOptions} value={surname} onChange={(e) => {
                  const val = e.target.value;
                  setSurname(val);
                  setShowSurnameOther(val === "Other");
                }} />
                {showSurnameOther && <FieldInput label="Enter Surname" placeholder="Enter your surname" value={manualSurname} onChange={(e) => setManualSurname(e.target.value)} span={2} />}
                <FieldInput label="Father's / Husband's Name" placeholder="Father's Name" value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
                <FieldInput label="Grandfather's Name" placeholder="Grandfather's Name" value={grandfatherName} onChange={(e) => setGrandfatherName(e.target.value)} />
                <FieldInput label="Official Surname (if different)" placeholder="Optional" required={false} span={2} value={officialSurname} onChange={(e) => setOfficialSurname(e.target.value)} />
                
                <FieldInput label="Aadhaar Number" placeholder="XXXX XXXX XXXX" value={aadhaar} disabled readOnly />
                <FieldInput label="Mobile Number" placeholder="9876543210" value={phone} disabled readOnly />
                
                <FieldInput label="Date of Birth" placeholder="" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                <FieldInput label="Gender" placeholder="Select gender" type="select" options={["Male", "Female", "Other", "Prefer not to say"]} value={gender} onChange={(e) => setGender(e.target.value)} />
                
                <FieldInput label="Occupation" placeholder="Select occupation" type="select" options={occupationOptions} value={occupation} onChange={(e) => {
                  const val = e.target.value;
                  setOccupation(val);
                  setShowOccupationOther(val === "Other");
                }} />
                {showOccupationOther && <FieldInput label="Specify Occupation" placeholder="Enter your occupation" value={manualOccupation} onChange={(e) => setManualOccupation(e.target.value)} span={2} />}
                
                <FieldInput label="Native Place / Village" placeholder="Select village" type="select" options={villageOptions} value={nativeVillage} onChange={(e) => setNativeVillage(e.target.value)} />
                <FieldInput label="Parents Contact Number" placeholder="9876543210" type="tel" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" value={parentsContact} onChange={(e) => setParentsContact(e.target.value.replace(/\D/g, "").slice(0, 10))} />
                
                <FieldInput label="Where Do You Currently Live?" placeholder="Ghatkopar, Mumbai" value={currentResidence} onChange={(e) => setCurrentResidence(e.target.value)} span={2} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 mb-1">Academic Information</h2>
              <p className="text-slate-400 text-sm mb-6">Enter your academic and institutional information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldInput label="College / Institute" placeholder="Enter college name" value={college} onChange={(e) => setCollege(e.target.value)} span={2} />
                <FieldInput label="Course / Stream" placeholder="Select course or stream" type="select" options={courseOptions} value={course} onChange={(e) => {
                  const val = e.target.value;
                  setCourse(val);
                  setShowCourseOther(val === "Other");
                }} />
                {showCourseOther && <FieldInput label="Specify Course / Stream" placeholder="Enter your course or stream" value={manualCourse} onChange={(e) => setManualCourse(e.target.value)} span={2} />}
                <FieldInput label="Stream (e.g. Science)" placeholder="Stream" value={stream} onChange={(e) => setStream(e.target.value)} />
                <FieldInput label="Education Specialization" placeholder="Computer Science & Engineering" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
                <FieldInput label="Academic Year" placeholder="Select year" type="select" options={["2023-24", "2024-25", "2025-26"]} value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-extrabold text-slate-800 mb-1 text-center">Profile Photo</h2>
              <p className="text-slate-400 text-sm mb-8 text-center">Upload a clear passport-size photo with a white background</p>

              <div className="relative mb-5">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-40 h-40 rounded-full border-4 border-dashed border-blue-200 bg-blue-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-100/50 transition-all duration-200 overflow-hidden"
                >
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="w-10 h-10 text-blue-300 mb-2" />
                      <span className="text-xs text-blue-400 font-semibold">Click to upload</span>
                    </>
                  )}
                </div>
                {profilePhoto && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-7 py-2.5 border-2 border-blue-200 text-blue-700 font-bold rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all mb-7"
              >
                Choose Photo
              </button>

              <div className="bg-blue-50 rounded-2xl p-5 w-full">
                <p className="text-sm font-bold text-slate-700 mb-3">Photo Requirements</p>
                <div className="space-y-2">
                  {[
                    "Clear frontal face, no glasses or mask",
                    "White or plain light background",
                    "File size: maximum 2 MB",
                    "Format: JPG or PNG only",
                    "Recent photo taken within 6 months",
                  ].map((r) => (
                    <div key={r} className="flex items-start gap-2 text-sm text-slate-500">
                      <Check className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as RegStep)}
                className="flex-1 py-3 border-2 border-blue-200 text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-all"
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
            >
              {step < 3 ? "Continue →" : "Proceed to Payment"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
