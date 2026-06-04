import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './Stations.css';

function Stations() {
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    setFilteredStations(stations.filter(station => station.StationName.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [searchTerm, stations]);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stations');
      setStations(response.data);
    } catch (err) {
      setError('Failed to load stations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>🏗️ Water Stations</h1>
        <button className="btn btn-primary" onClick={fetchStations}>Refresh</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="search-box">
        <input type="text" placeholder="Search stations by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      {loading ? (
        <div className="spinner"></div>
      ) : filteredStations.length === 0 ? (
        <div className="alert alert-info">No stations found</div>
      ) : (
        <div className="card">
          <table className="table">
            <thead><tr><th>ID</th><th>Station Name</th><th>Action</th></tr></thead>
            <tbody>
              {filteredStations.map((station) => (
                <tr key={station.Id}>
                  <td>{station.Id}</td>
                  <td>{station.StationName}</td>
                  <td><Link to={`/stations/${station.Id}`} className="btn btn-primary btn-sm">View Details</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Stations;
