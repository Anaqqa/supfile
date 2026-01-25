import React from 'react';
import { useSearchParams } from 'react-router-dom';
import FileExplorer from '../components/Files/FileExplorer';

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  return (
    <div className="dashboard-wrapper">
      <FileExplorer searchQuery={searchQuery} />
    </div>
  );
};

export default Dashboard;