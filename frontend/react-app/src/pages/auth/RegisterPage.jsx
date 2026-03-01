import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { register, checkPhone } from "../../services/authService";

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    username: "",
    password: "",
    phone: "",
    user_type: "",
    registration_date: new Date().toISOString().split("T")[0],
    level: "",
    address: "",
    birth_date: "",
    specialty: "",
    trainer_phone: "",
    org_name: "",
    association_phone: "",
    company: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    validateFields();
  }, [formData, step]);

  const validateFields = () => {
    const newErrors = {};

    // Step 1 validation
    if (!formData.fullname)
      newErrors.fullname = "Le nom complet est obligatoire.";
    if (!formData.email) {
      newErrors.email = "L'email est obligatoire.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format d'email invalide.";
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est obligatoire.";
    } else {
      if (formData.password.length < 6) {
        newErrors.password = "Au moins 6 caractères.";
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
        newErrors.password =
          (newErrors.password ? newErrors.password + " " : "") +
          "Doit contenir un caractère spécial.";
      }
    }

    if (!formData.phone) {
      newErrors.phone = "Le numéro de téléphone est obligatoire.";
    } else {
      const digitsOnly = formData.phone.replace(/\D/g, "");
      if (digitsOnly.length !== 8) {
        newErrors.phone =
          "Le numéro tunisien doit comporter exactement 8 chiffres.";
      }
    }

    if (!formData.user_type)
      newErrors.user_type = "Veuillez choisir un type de compte.";

    // Step 2 validation based on role
    if (step === 2) {
      if (formData.user_type === "student") {
        if (!formData.level)
          newErrors.level = "Le niveau d'études est obligatoire.";
        if (!formData.birth_date)
          newErrors.birth_date = "La date de naissance est obligatoire.";
      } else if (formData.user_type === "trainer") {
        if (!formData.specialty)
          newErrors.specialty = "La spécialité est obligatoire.";
      } else if (formData.user_type === "association") {
        if (!formData.org_name)
          newErrors.org_name = "Le nom de l'association est obligatoire.";
      } else if (formData.user_type === "professional") {
        if (!formData.company)
          newErrors.company = "Le nom de l'entreprise est obligatoire.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = async (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (field === "phone") {
      const digitsOnly = formData.phone.replace(/\D/g, "");
      if (digitsOnly.length === 8) {
        try {
          const { exists } = await checkPhone(digitsOnly);
          if (exists) {
            setErrors((prev) => ({
              ...prev,
              phone: "Ce numéro est déjà associé à un compte.",
            }));
          } else {
            // Clear error if it was a uniqueness error
            setErrors((prev) => {
              const newErrors = { ...prev };
              if (
                newErrors.phone === "Ce numéro est déjà associé à un compte."
              ) {
                delete newErrors.phone;
              }
              return newErrors;
            });
          }
        } catch (err) {
          console.error("Phone check error:", err);
        }
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // Auto-sync username with email
      if (
        name === "email" &&
        (prev.username === prev.email || !prev.username)
      ) {
        newData.username = value;
      }
      return newData;
    });
  };

  const handlePhoneChange = async (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Keep only digits
    if (value.length > 8) value = value.slice(0, 8); // Limit to 8 digits

    // Format: xx xxx xxx
    let formatted = value;
    if (value.length > 5) {
      formatted = `${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5, 8)}`;
    } else if (value.length > 2) {
      formatted = `${value.slice(0, 2)} ${value.slice(2, 5)}`;
    }

    setFormData((prev) => ({
      ...prev,
      phone: formatted,
    }));

    // Instant uniqueness check as soon as 8 digits are typed
    if (value.length === 8) {
      try {
        const { exists } = await checkPhone(value);
        if (exists) {
          setErrors((prev) => ({
            ...prev,
            phone: "Ce numéro est déjà associé à un compte.",
          }));
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            if (newErrors.phone === "Ce numéro est déjà associé à un compte.") {
              delete newErrors.phone;
            }
            return newErrors;
          });
        }
      } catch (err) {
        console.error("Instant phone check error:", err);
      }
    }
  };

  const nextStep = () => {
    // Touch all required fields in step 1 to show errors
    const step1Fields = ["fullname", "email", "password", "phone", "user_type"];
    const touchedFields = { ...touched };
    step1Fields.forEach((f) => (touchedFields[f] = true));
    setTouched(touchedFields);

    const step1Valid =
      !errors.fullname &&
      !errors.email &&
      !errors.password &&
      !errors.phone &&
      !errors.user_type;

    if (step === 1) {
      if (!step1Valid) {
        setError("Veuillez remplir correctement tous les champs obligatoires.");
        return;
      }
      setError("");
      setStep(2);
    }
  };

  const prevStep = () => setError("") || setStep(1);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all as touched
    const allFields = Object.keys(formData).reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {});
    setTouched(allFields);

    if (Object.keys(errors).length > 0) {
      setError("Certains champs obligatoires sont manquants ou invalides.");
      return;
    }

    if (!captchaToken) {
      setError("Veuillez valider le reCAPTCHA.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Clean phone (keep digits only)
      const cleanPhone = formData.phone.replace(/\D/g, "");

      const userPayload = {
        username: formData.username || formData.email,
        email: formData.email,
        password: formData.password,
        fullname: formData.fullname,
        phone: cleanPhone,
        user_type: formData.user_type,
      };

      const registerRes = await register({ ...userPayload, captchaToken });

      // If verification is required, we don't get a JWT or user object in the same way
      if (registerRes.requiresVerification) {
        setSuccess(true);
        // We can use a different state or just change the UI for success
        // For now, let's keep success as true but the UI will show "Redirection..."
        setTimeout(() => {
          navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        }, 2000);
        return;
      }

      const userId = registerRes.user.id;
      const jwt = registerRes.jwt;

      let profileEndpoint = "";
      let profileData = { user: userId };

      const rolesEndpoints = {
        student: "/etudiant-profils",
        trainer: "/formateur-profils",
        association: "/association-profils",
        professional: "/professionnels",
      };

      profileEndpoint = rolesEndpoints[formData.user_type];

      if (formData.user_type === "student") {
        profileData = {
          ...profileData,
          registration_date: formData.registration_date,
          level: formData.level,
          address: formData.address,
          birth_date: formData.birth_date,
        };
      } else if (formData.user_type === "trainer") {
        profileData = {
          ...profileData,
          specialty: formData.specialty,
          phone: cleanPhone,
        };
      } else if (formData.user_type === "association") {
        profileData = {
          ...profileData,
          name: formData.org_name,
          phone: cleanPhone,
        };
      } else if (formData.user_type === "professional") {
        profileData = { ...profileData, company: formData.company };
      }

      if (profileEndpoint) {
        const axios = (await import("axios")).default;
        await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:1337"}/api${profileEndpoint}`,
          { data: profileData },
          {
            headers: { Authorization: `Bearer ${jwt}` },
          },
        );
      }

      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Registration error:", err.response?.data || err);
      const errorData = err.response?.data?.error;
      setError(
        errorData?.message || "Une erreur est survenue lors de l'inscription.",
      );
    } finally {
      setLoading(false);
    }
  };

  const InputError = ({ field }) => {
    if (touched[field] && errors[field]) {
      return (
        <p className="text-red-500 text-[10px] font-bold mt-1 animate-in fade-in slide-in-from-top-1">
          {errors[field]}
        </p>
      );
    }
    return null;
  };

  const RequiredLabel = ({ children, field }) => (
    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
      {children} <span className="text-red-500">*</span>
    </label>
  );

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 animate-fade-in">
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center border border-white/60 backdrop-blur-md transition-all">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 text-3xl shadow-inner animate-bounce">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-10 h-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">
            Vérifiez vos emails
          </h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Un code de validation vous a été envoyé. <br />
            Redirection vers la vérification...
          </p>
          <div className="mt-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-2xl w-full flex flex-col md:flex-row min-h-[600px]">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex bg-gradient-to-br from-blue-700 to-indigo-900 w-1/3 p-8 text-white flex-col justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tighter mb-2">
              SUNSPACE
            </h1>
            <div className="h-1 w-12 bg-blue-400 rounded-full mb-6"></div>
            <p className="text-blue-100 text-sm leading-relaxed">
              Créez votre compte en quelques secondes et rejoignez la révolution
              éducative.
            </p>
          </div>
          <div className="space-y-4">
            <div
              className={`flex items-center gap-3 transition-all ${step === 1 ? "opacity-100" : "opacity-40"}`}
            >
              <span className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span className="text-sm font-semibold">Vérification</span>
            </div>
            <div
              className={`flex items-center gap-3 transition-all ${step === 2 ? "opacity-100" : "opacity-40"}`}
            >
              <span className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span className="text-sm font-semibold">Profil</span>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="flex-1 p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              {step === 1 ? "On commence !" : "Dernière étape"}
            </h2>
            <p className="text-gray-500 text-sm">
              Remplissez les informations ci-dessous.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm flex items-start gap-3">
              <span className="mt-0.5">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <RequiredLabel field="fullname">Nom Complet</RequiredLabel>
                  <input
                    type="text"
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleChange}
                    onBlur={() => handleBlur("fullname")}
                    className={`w-full px-4 py-3 bg-gray-50 border ${touched.fullname && errors.fullname ? "border-red-300 ring-4 ring-red-50" : "border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-50"} rounded-xl outline-none transition-all focus:bg-white`}
                    placeholder="Ex: Ahmed Ben Salem"
                  />
                  <InputError field="fullname" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <RequiredLabel field="email">Email</RequiredLabel>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur("email")}
                      className={`w-full px-4 py-3 bg-gray-50 border ${touched.email && errors.email ? "border-red-300 ring-4 ring-red-50" : "border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-50"} rounded-xl outline-none transition-all focus:bg-white`}
                      placeholder="votre@email.com"
                    />
                    <InputError field="email" />
                  </div>
                  <div>
                    <RequiredLabel field="phone">Téléphone</RequiredLabel>
                    <div className="relative">
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        onBlur={() => handleBlur("phone")}
                        className={`w-full px-4 py-3 bg-gray-50 border ${touched.phone && errors.phone ? "border-red-300 ring-4 ring-red-50" : "border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-50"} rounded-xl outline-none transition-all focus:bg-white`}
                        placeholder="xx xxx xxx"
                        maxLength={10} // 8 digits + 2 spaces
                      />
                    </div>
                    <InputError field="phone" />
                  </div>
                </div>
                <div>
                  <RequiredLabel field="password">Mot de passe</RequiredLabel>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={() => handleBlur("password")}
                      className={`w-full px-4 py-3 bg-gray-50 border ${touched.password && errors.password ? "border-red-300 ring-4 ring-red-50" : "border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-50"} rounded-xl outline-none transition-all focus:bg-white pr-12`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.036 12.322a1.012 1.012 0 010-.644C3.399 8.049 7.21 4.5 12 4.5c4.791 0 8.601 3.549 9.963 7.178.07.207.07.431 0 .639C20.601 15.501 16.791 19 12 19c-4.79 0-8.601-3.549-9.963-7.178z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  <InputError field="password" />
                </div>
                <div>
                  <RequiredLabel field="user_type">Je suis un(e)</RequiredLabel>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {["student", "trainer", "association", "professional"].map(
                      (role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, user_type: role });
                            handleBlur("user_type");
                          }}
                          className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${formData.user_type === role ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white border-gray-100 text-gray-600 hover:border-blue-200"}`}
                        >
                          {role === "student"
                            ? "Étudiant"
                            : role === "trainer"
                              ? "Formateur"
                              : role === "association"
                                ? "Association"
                                : "Pro"}
                        </button>
                      ),
                    )}
                  </div>
                  <InputError field="user_type" />
                </div>
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 group mt-4 shadow-lg active:scale-[0.98]"
                >
                  Continuer{" "}
                  <span className="group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                {formData.user_type === "student" && (
                  <>
                    <div>
                      <RequiredLabel field="level">
                        Niveau d'études
                      </RequiredLabel>
                      <input
                        type="text"
                        name="level"
                        value={formData.level}
                        onChange={handleChange}
                        onBlur={() => handleBlur("level")}
                        className={`w-full px-4 py-3 bg-gray-50 border ${touched.level && errors.level ? "border-red-300 ring-4 ring-red-50" : "border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-50"} rounded-xl outline-none transition-all focus:bg-white`}
                        placeholder="Ex: Licence 2"
                      />
                      <InputError field="level" />
                    </div>
                    <div>
                      <RequiredLabel field="birth_date">
                        Date de naissance
                      </RequiredLabel>
                      <input
                        type="date"
                        name="birth_date"
                        value={formData.birth_date}
                        onChange={handleChange}
                        onBlur={() => handleBlur("birth_date")}
                        className={`w-full px-4 py-3 bg-gray-50 border ${touched.birth_date && errors.birth_date ? "border-red-300 ring-4 ring-red-50" : "border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-50"} rounded-xl outline-none transition-all focus:bg-white`}
                      />
                      <InputError field="birth_date" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                        Adresse
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                        rows="2"
                        placeholder="Quartier, Ville..."
                      ></textarea>
                    </div>
                  </>
                )}

                {formData.user_type === "trainer" && (
                  <div>
                    <RequiredLabel field="specialty">Spécialité</RequiredLabel>
                    <input
                      type="text"
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleChange}
                      onBlur={() => handleBlur("specialty")}
                      className={`w-full px-4 py-3 bg-gray-50 border ${touched.specialty && errors.specialty ? "border-red-300 ring-4 ring-red-50" : "border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-50"} rounded-xl outline-none transition-all focus:bg-white`}
                      placeholder="Ex: Intelligence Artificielle"
                    />
                    <InputError field="specialty" />
                  </div>
                )}

                {formData.user_type === "professional" && (
                  <div>
                    <RequiredLabel field="company">Entreprise</RequiredLabel>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      onBlur={() => handleBlur("company")}
                      className={`w-full px-4 py-3 bg-gray-50 border ${touched.company && errors.company ? "border-red-300 ring-4 ring-red-50" : "border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-50"} rounded-xl outline-none transition-all focus:bg-white`}
                      placeholder="Nom de votre société"
                    />
                    <InputError field="company" />
                  </div>
                )}

                {formData.user_type === "association" && (
                  <div>
                    <RequiredLabel field="org_name">
                      Nom de l'Association
                    </RequiredLabel>
                    <input
                      type="text"
                      name="org_name"
                      value={formData.org_name}
                      onChange={handleChange}
                      onBlur={() => handleBlur("org_name")}
                      className={`w-full px-4 py-3 bg-gray-50 border ${touched.org_name && errors.org_name ? "border-red-300 ring-4 ring-red-50" : "border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-50"} rounded-xl outline-none transition-all focus:bg-white`}
                    />
                    <InputError field="org_name" />
                  </div>
                )}

                <div className="flex flex-col items-center py-4">
                  <ReCAPTCHA
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                    onChange={(token) => setCaptchaToken(token)}
                  />
                  {!captchaToken && touched.captcha && (
                    <p className="text-red-500 text-[10px] font-bold mt-2">
                      Veuillez valider le reCAPTCHA.
                    </p>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all text-slate-600 active:scale-[0.98]"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !captchaToken}
                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 active:scale-[0.98]"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Création...
                      </span>
                    ) : (
                      "Finaliser"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-12 text-center text-sm">
            <span className="text-gray-400">Déjà membre ? </span>
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 font-bold hover:underline"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
