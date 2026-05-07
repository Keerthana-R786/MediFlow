import { useState, useEffect } from 'react';
import { Pill, Calendar, User, FileText, Download } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import Badge from '../../components/common/Badge';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      // Get patient ID from user
      const patientRes = await api.get('/patients/me');
      const patientId = patientRes.data.data._id;
      
      const res = await api.get(`/prescriptions/patient/${patientId}`);
      setPrescriptions(res.data.data);
    } catch (error) {
      console.error('Failed to load prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading prescriptions...</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">My Prescriptions</h1>
          <p className="text-slate-600">View and download your prescription history</p>
        </div>

        {prescriptions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
            <Pill size={48} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Prescriptions Yet</h3>
            <p className="text-slate-600">Your prescriptions will appear here after your consultations</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Prescription List */}
            <div className="lg:col-span-1 space-y-3">
              {prescriptions.map((rx) => (
                <div
                  key={rx._id}
                  onClick={() => setSelectedPrescription(rx)}
                  className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedPrescription?._id === rx._id
                      ? 'border-teal-500 shadow-lg'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 text-sm mb-1">
                        Dr. {rx.doctorId?.firstName} {rx.doctorId?.lastName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(rx.issuedAt)}
                      </p>
                    </div>
                    <Badge variant="success">Issued</Badge>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{rx.diagnosis}</p>
                  <p className="text-xs text-teal-600 mt-2">
                    {rx.medications.length} medication{rx.medications.length !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>

            {/* Prescription Details */}
            <div className="lg:col-span-2">
              {selectedPrescription ? (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-200">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 mb-2">Prescription Details</h2>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <User size={16} />
                          <span>Dr. {selectedPrescription.doctorId?.firstName} {selectedPrescription.doctorId?.lastName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>{formatDate(selectedPrescription.issuedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700"
                    >
                      <Download size={16} />
                      Print
                    </button>
                  </div>

                  {/* Diagnosis */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Diagnosis</h3>
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                      <p className="text-slate-800">{selectedPrescription.diagnosis}</p>
                    </div>
                  </div>

                  {/* Medications */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Medications</h3>
                    <div className="space-y-3">
                      {selectedPrescription.medications.map((med, index) => (
                        <div key={index} className="bg-slate-50 border-l-4 border-teal-500 p-4 rounded-r-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-slate-800">{med.name}</p>
                              <p className="text-sm text-slate-600">{med.dosage}</p>
                            </div>
                            <Pill size={20} className="text-teal-600" />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mt-2">
                            <div>
                              <span className="font-medium">Frequency:</span> {med.frequency}
                            </div>
                            {med.timing && (
                              <div>
                                <span className="font-medium">Timing:</span> {med.timing}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Duration:</span> {med.duration}
                            </div>
                          </div>
                          {med.instructions && (
                            <div className="mt-2 text-sm text-slate-600 bg-white p-2 rounded">
                              <span className="font-medium">Instructions:</span> {med.instructions}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lab Tests */}
                  {selectedPrescription.labTests && selectedPrescription.labTests.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-slate-700 mb-3">Recommended Lab Tests</h3>
                      <ul className="space-y-2">
                        {selectedPrescription.labTests.map((test, index) => (
                          <li key={index} className="flex items-center gap-2 text-slate-700">
                            <FileText size={16} className="text-teal-600" />
                            {test}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Advice */}
                  {selectedPrescription.advice && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">General Advice</h3>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-slate-700 text-sm leading-relaxed">{selectedPrescription.advice}</p>
                      </div>
                    </div>
                  )}

                  {/* Follow-up */}
                  {selectedPrescription.followUpDate && (
                    <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-lg">
                      <h3 className="text-sm font-semibold text-teal-800 mb-2">Follow-up Appointment</h3>
                      <p className="text-sm text-teal-700">
                        <strong>Date:</strong> {formatDate(selectedPrescription.followUpDate)}
                      </p>
                      {selectedPrescription.followUpInstructions && (
                        <p className="text-sm text-teal-700 mt-1">{selectedPrescription.followUpInstructions}</p>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-6 pt-6 border-t border-slate-200 text-xs text-slate-500">
                    <p><strong>Prescription ID:</strong> {selectedPrescription._id}</p>
                    <p><strong>Valid Until:</strong> {formatDate(selectedPrescription.validUntil)}</p>
                    <p className="mt-2 text-amber-600">
                      ⚠️ Take medications as prescribed. Contact your doctor if you experience any side effects.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
                  <Pill size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Select a prescription to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Prescriptions;
