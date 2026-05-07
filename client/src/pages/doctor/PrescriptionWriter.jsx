import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Send, Pill } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

const PrescriptionWriter = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [prescription, setPrescription] = useState({
    diagnosis: '',
    medications: [],
    labTests: [],
    advice: '',
    followUpDate: '',
    followUpInstructions: '',
  });
  const [commonMeds, setCommonMeds] = useState([]);

  useEffect(() => {
    loadData();
  }, [appointmentId]);

  const loadData = async () => {
    try {
      const [apptRes, medsRes] = await Promise.all([
        api.get(`/appointments/${appointmentId}`),
        api.get('/prescriptions/medications/common'),
      ]);
      
      setAppointment(apptRes.data.data);
      setCommonMeds(medsRes.data.data);

      // Try to load existing prescription
      try {
        const prescRes = await api.get(`/prescriptions/appointment/${appointmentId}`);
        setPrescription(prescRes.data.data);
      } catch (err) {
        // No existing prescription, that's fine
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addMedication = () => {
    setPrescription(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '', timing: '' }]
    }));
  };

  const updateMedication = (index, field, value) => {
    setPrescription(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const removeMedication = (index) => {
    setPrescription(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const addLabTest = () => {
    const test = prompt('Enter lab test name:');
    if (test) {
      setPrescription(prev => ({
        ...prev,
        labTests: [...prev.labTests, test]
      }));
    }
  };

  const removeLabTest = (index) => {
    setPrescription(prev => ({
      ...prev,
      labTests: prev.labTests.filter((_, i) => i !== index)
    }));
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      await api.post('/prescriptions', {
        appointmentId,
        ...prescription,
      });
      toast.success('Prescription saved as draft');
    } catch (error) {
      toast.error('Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  const issuePrescription = async () => {
    if (!prescription.diagnosis || prescription.medications.length === 0) {
      toast.error('Please add diagnosis and at least one medication');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/prescriptions', {
        appointmentId,
        ...prescription,
      });
      
      await api.put(`/prescriptions/${res.data.data._id}/issue`);
      toast.success('Prescription issued and sent to patient email!');
      navigate(`/doctor/brief/${appointmentId}`);
    } catch (error) {
      toast.error('Failed to issue prescription');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </PageWrapper>
    );
  }

  const patient = appointment?.patientId;

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Write Prescription</h1>
          <p className="text-slate-600">
            Patient: {patient?.userId?.firstName} {patient?.userId?.lastName}
          </p>
        </div>

        <div className="space-y-6">
          {/* Diagnosis */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Diagnosis *</label>
            <textarea
              value={prescription.diagnosis}
              onChange={(e) => setPrescription(prev => ({ ...prev, diagnosis: e.target.value }))}
              placeholder="Enter diagnosis..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none transition-all"
            />
          </div>

          {/* Medications */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Pill size={20} className="text-teal-600" />
                Medications *
              </h2>
              <Button size="sm" onClick={addMedication}>
                <Plus size={16} /> Add Medication
              </Button>
            </div>

            <div className="space-y-4">
              {prescription.medications.map((med, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Medicine Name</label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        placeholder="e.g., Paracetamol"
                        list={`meds-${index}`}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-teal-500 focus:outline-none"
                      />
                      <datalist id={`meds-${index}`}>
                        {commonMeds.map(m => (
                          <option key={m.name} value={m.name} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Dosage</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        placeholder="e.g., 500mg"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Frequency</label>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        placeholder="e.g., Twice daily"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Timing</label>
                      <input
                        type="text"
                        value={med.timing}
                        onChange={(e) => updateMedication(index, 'timing', e.target.value)}
                        placeholder="e.g., 1-0-1"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Duration</label>
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        placeholder="e.g., 7 days"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Instructions</label>
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                        placeholder="e.g., Take after meals"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => removeMedication(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              {prescription.medications.length === 0 && (
                <p className="text-center text-slate-400 py-8">No medications added yet</p>
              )}
            </div>
          </div>

          {/* Lab Tests */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Lab Tests</h2>
              <Button size="sm" variant="secondary" onClick={addLabTest}>
                <Plus size={16} /> Add Test
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {prescription.labTests.map((test, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-200">
                  <span className="text-sm">{test}</span>
                  <button onClick={() => removeLabTest(index)} className="text-teal-600 hover:text-teal-800">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {prescription.labTests.length === 0 && (
                <p className="text-slate-400 text-sm">No lab tests recommended</p>
              )}
            </div>
          </div>

          {/* Advice */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">General Advice</label>
            <textarea
              value={prescription.advice}
              onChange={(e) => setPrescription(prev => ({ ...prev, advice: e.target.value }))}
              placeholder="Lifestyle advice, precautions, etc..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none transition-all"
            />
          </div>

          {/* Follow-up */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Follow-up</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Follow-up Date</label>
                <input
                  type="date"
                  value={prescription.followUpDate}
                  onChange={(e) => setPrescription(prev => ({ ...prev, followUpDate: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Instructions</label>
                <input
                  type="text"
                  value={prescription.followUpInstructions}
                  onChange={(e) => setPrescription(prev => ({ ...prev, followUpInstructions: e.target.value }))}
                  placeholder="e.g., Review after 1 week"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => navigate(-1)} className="flex-1">
              Cancel
            </Button>
            <Button variant="secondary" onClick={saveDraft} loading={saving} className="flex-1">
              <Save size={18} /> Save Draft
            </Button>
            <Button onClick={issuePrescription} loading={saving} className="flex-1">
              <Send size={18} /> Issue Prescription
            </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default PrescriptionWriter;
