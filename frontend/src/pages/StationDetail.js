import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Stations.css';

function StationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStationDetail();
  }, [id]);

  const fetchStationDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/stations/${id}`);
      setStation(response.data);
    } catch (err) {
      setError('Failed to load station details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="spinner"></div>;
  if (error || !station) return <div className="container"><div className="alert alert-error">{error || 'Station not found'}</div><button className="btn btn-secondary" onClick={() => navigate('/stations')}>Back to Stations</button></div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Station Details</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/stations')}>Back</button>
      </div>
      <div className="card">
        <h2 className="card-title">{station.StationName}</h2>
        <div className="detail-grid">
          <div className="detail-item"><label>Station ID</label><p>{station.Id}</p></div>
          <div className="detail-item"><label>Water Level</label><p>{station.WaterLevel ? `${station.WaterLevel} m` : 'N/A'}</p></div>
          <div className="detail-item"><label>Normal Pool Level</label><p>{station.NormalPoolLevel ? `${station.NormalPoolLevel} m` : 'N/A'}</p></div>
          <div className="detail-item"><label>Flood Control Level</label><p>{station.FloodControlLevel ? `${station.FloodControlLevel} m` : 'N/A'}</p></div>
          <div className="detail-item"><label>Installed Capacity</label><p>{station.InstalledCapacity ? `${station.InstalledCapacity} MW` : 'N/A'}</p></div>
          <div className="detail-item"><label>Regulation Type</label><p>{station.RegulationType || 'N/A'}</p></div>
          <div className="detail-item"><label>Province</label><p>{station.Province || 'N/A'}</p></div>
          <div className="detail-item"><label>Parent Organization</label><p>{station.ParentOrganization || 'N/A'}</p></div>
          <div className="detail-item"><label>Longitude/Latitude</label><p>{station.LongitudeLatitude || 'N/A'}</p></div>
          <div className="detail-item"><label>Creation Time</label><p>{station.CreationTime ? new Date(station.CreationTime).toLocaleString() : 'N/A'}</p></div>
        </div>
      </div>
    </div>
  );
}

export default StationDetail;
