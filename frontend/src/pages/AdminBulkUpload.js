import React, { useState } from 'react';
import api from '../api/axios';
import './AdminBulkUpload.css';

function AdminBulkUpload() {
  const [uploadType, setUploadType] = useState('stations');
  const [jsonData, setJsonData] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!jsonData.trim()) {
      setError('Please enter JSON data');
      return;
    }

    try {
      let data;
      try {
        data = JSON.parse(jsonData);
      } catch (err) {
        setError('Invalid JSON format');
        return;
      }

      setLoading(true);
      const endpoint = uploadType === 'stations' ? '/admin/stations/bulk' : '/admin/hydrological/bulk';
      const response = await api.post(endpoint, data);
      setSuccess(response.data.msg);
      setJsonData('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => { setJsonData(event.target.result); };
      reader.readAsText(file);
    }
  };

  const stationTemplate = JSON.stringify([{"StationName": "Station 1", "WaterLevel": 150.5, "NormalPoolLevel": 148.0, "FloodControlLevel": 155.0, "InstalledCapacity": 1000.0, "RegulationType": "Run-of-river", "Province": "Province 1", "ParentOrganization": "Organization 1", "LongitudeLatitude": "39.5,115.5"}], null, 2);
  const hydrologicalTemplate = JSON.stringify([{"StationId": 1, "RecordDate": "2026-06-04", "ReservoirWaterLevel": 150.5, "InboundFlow": 500.0, "OutboundFlow": 450.0, "WaterStorageCapacity": 100000000.0}], null, 2);

  return (
    <div className="container">
      <div className="page-header"><h1>📤 Bulk Upload Data</h1></div>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <div className="card">
        <div className="upload-tabs">
          <button className={`tab ${uploadType === 'stations' ? 'active' : ''}`} onClick={() => setUploadType('stations')}>Upload Stations</button>
          <button className={`tab ${uploadType === 'hydrological' ? 'active' : ''}`} onClick={() => setUploadType('hydrological')}>Upload Hydrological Data</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select JSON File or Paste Data</label>
            <input type="file" accept=".json" onChange={handleFileUpload} />
          </div>
          <div className="form-group">
            <label>JSON Data</label>
            <textarea value={jsonData} onChange={(e) => setJsonData(e.target.value)} placeholder="Paste your JSON data here..." rows="10" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Uploading...' : 'Upload Data'}</button>
        </form>
        <div className="template-section">
          <h3>Template for {uploadType === 'stations' ? 'Stations' : 'Hydrological Data'}</h3>
          <pre>{uploadType === 'stations' ? stationTemplate : hydrologicalTemplate}</pre>
        </div>
      </div>
    </div>
  );
}

export default AdminBulkUpload;
