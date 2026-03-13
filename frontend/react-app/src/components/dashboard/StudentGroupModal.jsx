import React, { useState, useEffect } from "react";
import { getTrainerStudents, addGroupMembers, removeGroupMember } from "../../services/courseService";

const StudentGroupModal = ({ isOpen, onClose, group, trainerId, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capacity: 20,
  });
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (group) {
      const attrs = group.attributes || group;
      setFormData({
        name: attrs.name || "",
        description: attrs.description || "",
        capacity: attrs.capacity || 20,
      });
      const currentStudents = attrs.students?.data || attrs.students || [];
      setSelectedStudents(currentStudents.map(s => s.documentId || s.id));
    } else {
      setFormData({ name: "", description: "", capacity: 20 });
      setSelectedStudents([]);
    }
  }, [group, isOpen]);

  useEffect(() => {
    if (isOpen && trainerId) {
      const fetchStudents = async () => {
        try {
          const res = await getTrainerStudents(trainerId);
          setStudents(res.data || []);
        } catch (error) {
          console.error("Error fetching students:", error);
        }
      };
      fetchStudents();
    }
  }, [isOpen, trainerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      students: selectedStudents
    });
  };

  const handleToggleStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {group ? "Modifier le Groupe" : "Nouveau Groupe"} 📂
              </h2>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Organisez vos étudiants en classes
              </p>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nom du groupe</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all outline-none"
                    placeholder="ex: Masterclass 2024"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Capacité max</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all outline-none h-32 resize-none"
                    placeholder="Objectifs de ce groupe..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Membres ({selectedStudents.length} / {formData.capacity})
                </label>
                <div className="bg-slate-50 rounded-3xl p-4 h-[300px] overflow-y-auto border-2 border-slate-100">
                  {students.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <div className="text-2xl mb-2">🤷‍♂️</div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Aucun étudiant trouvé</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {students.map((student) => {
                        const isSelected = selectedStudents.includes(student.documentId || student.id);
                        return (
                          <div
                            key={student.id}
                            onClick={() => handleToggleStudent(student.documentId || student.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isSelected ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white hover:bg-slate-200 text-slate-700"}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isSelected ? "bg-white/20" : "bg-slate-100"}`}>
                              {student.fullname?.[0] || student.username?.[0] || "?"}
                            </div>
                            <div className="flex-1">
                              <p className="text-[11px] font-black leading-tight">{student.fullname || student.username}</p>
                              <p className={`text-[9px] font-bold ${isSelected ? "text-white/70" : "text-slate-400"}`}>ID: {student.id}</p>
                            </div>
                            {isSelected && <span className="text-xs">✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-[2] px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl"
              >
                {group ? "Enregistrer les modifications" : "Créer le groupe"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentGroupModal;
