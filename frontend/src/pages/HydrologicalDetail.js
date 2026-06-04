import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Stations.css';

function HydrologicalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHydrologicalDetail();
  }, [id]);

  const fetchHydrologicalDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/hydrological/${id}`);
      setRecord(response.data);
    } catch (err) {
      setError('Failed to load hydrological details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="spinner"></div>;
  if (error || !record) return <div className="container"><div className="alert alert-error">{error || 'Record not found'}</div><button className="btn btn-secondary" onClick={() => navigate('/hydrological')}>Back to Data</button></div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Hydrological Record Details</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/hydrological')}>Back</button>
      </div>
      <div className="card">
        <h2 className="card-title">Record #{record.Id}</h2>
        <div className="detail-grid">
          <div className="detail-item"><label>Record ID</label><p>{record.Id}</p></div>
          <div className="detail-item"><label>Station ID</label><p>{record.StationId}</p></div>
          <div className="detail-item"><label>Record Date</label><p>{record.RecordDate}</p></div>
          <div className="detail-item"><label>Reservoir Water Level (m)</label><p>{record.ReservoirWaterLevel || 'N/A'}</p></div>
          <div className="detail-item"><label>Inbound Flow (m³/s)</label><p>{record.InboundFlow || 'N/A'}</p></div>
          <div className="detail-item"><label>Outbound Flow (m³/s)</label><p>{record.OutboundFlow || 'N/A'}</p></div>
          <div className="detail-item"><label>Water Storage Capacity (m³)</label><p>{record.WaterStorageCapacity || 'N/A'}</p></div>
          <div className="detail-item"><label>Creation Time</label><p>{record.CreationTime ? new Date(record.CreationTime).toLocaleString() : 'N/A'}</p></div>
        </div>
      </div>
    </div>
  );
}

export default HydrologicalDetail;
