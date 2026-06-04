# Hydrological Data Management Dashboard

A React-based frontend dashboard for managing hydrological data and water station information.

## Features

- **Authentication**: User registration and login with JWT tokens
- **Role-Based Access**: Support for Admin, Manager, and Normal users
- **Station Management**: View and manage water stations
- **Hydrological Data**: Track water levels, inflows, and outflows
- **Bulk Upload**: Admin-only feature for uploading large datasets
- **User Management**: Manage user accounts and permissions

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The dashboard will open at `http://localhost:3000`

## Environment Setup

Make sure your Flask backend is running on `http://localhost:5000`

## API Endpoints

The dashboard connects to the following backend API endpoints:

- `POST /register` - User registration
- `POST /login` - User authentication
- `GET /stations` - Fetch all stations
- `GET /stations/<id>` - Get station details
- `GET /hydrological` - Fetch hydrological data
- `GET /hydrological/<id>` - Get hydrological record details
- `POST /admin/stations/bulk` - Bulk upload stations
- `POST /admin/hydrological/bulk` - Bulk upload hydrological data
- `GET /manager/users` - List all users
- `PUT /manager/users/<user_id>/status` - Update user status

## Technologies Used

- React 18
- React Router DOM
- Axios
- CSS3

## License

MIT
