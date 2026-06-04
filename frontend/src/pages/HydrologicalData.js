import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './Stations.css';

function HydrologicalData() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stationFilter, setStationFilter] = useState('');

  useEffect(() => {
    fetchHydrologicalData();
  }, []);

  useEffect(() => {
    setFilteredData(data.filter(record => stationFilter === '' || record.StationId.toString() === stationFilter));
  }, [stationFilter, data]);

  const fetchHydrologicalData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hydrological');
      setData(response.data);
    } catch (err) {
      setError('Failed to load hydrological data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>💧 Hydrological Data</h1>
        <button className="btn btn-primary" onClick={fetchHydrologicalData}>Refresh</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="search-box">
        <input type="text" placeholder="Filter by Station ID..." value={stationFilter} onChange={(e) => setStationFilter(e.target.value)} />
      </div>
      {loading ? (
        <div className="spinner"></div>
      ) : filteredData.length === 0 ? (
        <div className="alert alert-info">No hydrological records found</div>
      ) : (
        <div className="card">
          <table className="table">
            <thead><tr><th>ID</th><th>Station ID</th><th>Record Date</th><th>Water Level (m)</th><th>Action</th></tr></thead>
            <tbody>
              {filteredData.map((record) => (
                <tr key={record.Id}>
                  <td>{record.Id}</td>
                  <td>{record.StationId}</td>
                  <td>{record.RecordDate}</td>
                  <td>{record.ReservoirWaterLevel || 'N/A'}</td>
                  <td><Link to={`/hydrological/${record.Id}`} className="btn btn-primary btn-sm">View Details</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default HydrologicalData;
