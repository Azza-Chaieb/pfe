import React, { useState } from "react";

const LiveSessionModal = ({ isOpen, onClose, onCreate, courses = [], trainerId }) => {
  const [formData, setFormData] = useState({
    title: "",
    course: "",
    date: "",
    time: "",
    duration: 60,
    sessionType: "live_webinar",
    meetingUrl: "",
    maxCapacity: 50,
    isRecurring: false,
  });

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate(formData);
      onClose();
      // Reset form
      setFormData({
        title: "",
        course: "",
        date: "",
        time: "",
        duration: 60,
        sessionType: "live_webinar",
        meetingUrl: "",
        maxCapacity: 50,
        isRecurring: false,
      });
    } catch (error) {
      console.error("Error creating session:", error);
      alert("Erreur lors de la création de la session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700 p-8 flex items-end">
          <div className="absolute top-6 right-8">
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-full transition-all"
            >
              ✕
            </button>
          </div>
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-white mb-2">
              🗓️ Planification
            </span>
            <h2 className="text-2xl font-black text-white leading-tight">
              Nouvelle Session en Direct
            </h2>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">
                Titre de la Session
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="Ex: Architecture Microservices - Session 1"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-medium"
              />
            </div>

            {/* Course Selection */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">
                Cours Associé
              </label>
              <select
                name="course"
                required
                value={formData.course}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-medium appearance-none"
              >
                <option value="">Sélectionner un cours</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.documentId || course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-medium"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">
                Heure
              </label>
              <input
                type="time"
                name="time"
                required
                value={formData.time}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-medium"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">
                Durée (minutes)
              </label>
              <input
                type="number"
                name="duration"
                required
                min="15"
                step="15"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-medium"
              />
            </div>

            {/* Session Type */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">
                Type de Session
              </label>
              <select
                name="sessionType"
                value={formData.sessionType}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-medium appearance-none"
              >
                <option value="live_webinar">💻 Webinare en direct</option>
                <option value="workshop">🛠️ Atelier pratique</option>
              </select>
            </div>

            {/* Meeting URL */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">
                Lien Visioconférence
              </label>
              <div className="relative">
                <input
                  type="url"
                  name="meetingUrl"
                  required
                  value={formData.meetingUrl}
                  onChange={handleChange}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-medium pl-12"
                />
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl">🔗</span>
              </div>
            </div>

            {/* Max Capacity */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">
                Capacité Max
              </label>
              <input
                type="number"
                name="maxCapacity"
                required
                min="1"
                value={formData.maxCapacity}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-medium"
              />
            </div>

            {/* Recurrence */}
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
              <input
                type="checkbox"
                id="isRecurring"
                name="isRecurring"
                checked={formData.isRecurring}
                onChange={handleChange}
                className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
              />
              <label htmlFor="isRecurring" className="text-xs font-bold text-slate-600 cursor-pointer">
                Répéter cette session chaque semaine
              </label>
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] px-8 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Création en cours..." : "✅ Programmer la Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LiveSessionModal;
