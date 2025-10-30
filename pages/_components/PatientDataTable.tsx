import React from 'react';
import { PatientData } from '../../lib/api-service';

interface PatientDataTableProps {
  data: PatientData;
}

export default function PatientDataTable({ data }: PatientDataTableProps) {
  const renderArrayField = (arr: string[]) => {
    return arr.length > 0 ? arr.join(', ') : 'N/A';
  };

  return (
    <div style={{ marginTop: '24px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
        Patient Information
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
        <tbody>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5', width: '30%' }}>
              Patient Name
            </td>
            <td style={{ padding: '12px' }}>{data.patient_name || 'N/A'}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
              Date of Birth
            </td>
            <td style={{ padding: '12px' }}>{data.patient_dob || 'N/A'}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
              Gender
            </td>
            <td style={{ padding: '12px' }}>{data.patient_gender || 'N/A'}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
              Chief Complaint
            </td>
            <td style={{ padding: '12px' }}>{data.chief_complaint || 'N/A'}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
              Conditions
            </td>
            <td style={{ padding: '12px' }}>{renderArrayField(data.conditions)}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
              Current Medications
            </td>
            <td style={{ padding: '12px' }}>{renderArrayField(data.current_medications)}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
              Allergies
            </td>
            <td style={{ padding: '12px' }}>{renderArrayField(data.allergies)}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
              Past Medical History
            </td>
            <td style={{ padding: '12px' }}>{renderArrayField(data.past_medical_history)}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
              Interventions
            </td>
            <td style={{ padding: '12px' }}>{renderArrayField(data.interventions)}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
              Proposed Plan
            </td>
            <td style={{ padding: '12px' }}>{data.proposed_plan || 'N/A'}</td>
          </tr>
          <tr>
            <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
              Concerns
            </td>
            <td style={{ padding: '12px' }}>{data.concerns || 'N/A'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
