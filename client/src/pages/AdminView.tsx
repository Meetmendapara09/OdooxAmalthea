import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminView.css';

interface Approval {
  id: number;
  date: string;
  employee: string;
  category: string;
  leaveType: string;
  status: string;
  startDate: string;
  endDate: string;
  totalDays: number;
}

const AdminView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Sample Mock Data
  const [approvals] = useState<Approval[]>([
    {
      id: 1,
      date: '2024-01-15',
      employee: 'John Doe',
      category: 'Sick Leave',
      leaveType: 'Paid',
      status: 'Approved',
      startDate: '2024-01-20',
      endDate: '2024-01-22',
      totalDays: 3
    },
    {
      id: 2,
      date: '2024-01-16',
      employee: 'Jane Smith',
      category: 'Annual Leave',
      leaveType: 'Paid',
      status: 'Pending',
      startDate: '2024-02-01',
      endDate: '2024-02-10',
      totalDays: 10
    },
    {
      id: 3,
      date: '2024-01-17',
      employee: 'Bob Johnson',
      category: 'Personal',
      leaveType: 'Unpaid',
      status: 'Rejected',
      startDate: '2024-01-25',
      endDate: '2024-01-26',
      totalDays: 2
    }
  ]);

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         approval.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || approval.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="admin-view-container">
      <header className="admin-header">
        <h1>Admin View (Observed rules)</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/employee')} className="btn-link">Employee View</button>
          <button onClick={() => navigate('/manager')} className="btn-link">Manager View</button>
          <button onClick={() => navigate('/')} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by employee or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="category-filters">
          <label>Filter by category:</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Annual Leave">Annual Leave</option>
            <option value="Personal">Personal</option>
            <option value="Emergency">Emergency</option>
          </select>
        </div>
      </div>

      <div className="approvals-table-container">
        <table className="approvals-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Category</th>
              <th>Leave Type</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Total Days</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApprovals.map((approval) => (
              <tr key={approval.id}>
                <td>{approval.date}</td>
                <td>{approval.employee}</td>
                <td>{approval.category}</td>
                <td>{approval.leaveType}</td>
                <td>
                  <span className={`status-badge status-${approval.status.toLowerCase()}`}>
                    {approval.status}
                  </span>
                </td>
                <td>{approval.startDate}</td>
                <td>{approval.endDate}</td>
                <td>{approval.totalDays}</td>
                <td>
                  <button className="btn-view" onClick={() => navigate(`/approval/${approval.id}`)}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminView;
