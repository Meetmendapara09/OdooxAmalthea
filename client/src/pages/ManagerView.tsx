import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ManagerView.css';

interface ApprovalRequest {
  id: number;
  employeeName: string;
  category: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  submittedDate: string;
}

const ManagerView = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('pending');

  const [approvalRequests] = useState<ApprovalRequest[]>([
    {
      id: 1,
      employeeName: 'Alice Johnson',
      category: 'Annual Leave',
      startDate: '2024-02-15',
      endDate: '2024-02-20',
      totalDays: 6,
      reason: 'Family vacation planned for several months',
      status: 'pending',
      submittedDate: '2024-01-28'
    },
    {
      id: 2,
      employeeName: 'Michael Brown',
      category: 'Sick Leave',
      startDate: '2024-02-05',
      endDate: '2024-02-07',
      totalDays: 3,
      reason: 'Medical appointment and recovery',
      status: 'pending',
      submittedDate: '2024-01-29'
    },
    {
      id: 3,
      employeeName: 'Sarah Davis',
      category: 'Personal Leave',
      startDate: '2024-02-10',
      endDate: '2024-02-10',
      totalDays: 1,
      reason: 'Personal matter to attend to',
      status: 'approved',
      submittedDate: '2024-01-27'
    }
  ]);

  const filteredRequests = approvalRequests.filter(req => {
    if (activeFilter === 'all') return true;
    return req.status === activeFilter;
  });

  const handleApprove = (id: number) => {
    alert(`Approval request #${id} has been approved`);
  };

  const handleReject = (id: number) => {
    alert(`Approval request #${id} has been rejected`);
  };

  return (
    <div className="manager-view-container">
      <header className="manager-header">
        <h1>Manager's View - Approvals to Review</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/admin')} className="btn-link">Admin View</button>
          <button onClick={() => navigate('/employee')} className="btn-link">Employee View</button>
          <button onClick={() => navigate('/')} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="filter-tabs">
        <button
          className={activeFilter === 'pending' ? 'tab-active' : ''}
          onClick={() => setActiveFilter('pending')}
        >
          Pending ({approvalRequests.filter(r => r.status === 'pending').length})
        </button>
        <button
          className={activeFilter === 'approved' ? 'tab-active' : ''}
          onClick={() => setActiveFilter('approved')}
        >
          Approved ({approvalRequests.filter(r => r.status === 'approved').length})
        </button>
        <button
          className={activeFilter === 'rejected' ? 'tab-active' : ''}
          onClick={() => setActiveFilter('rejected')}
        >
          Rejected ({approvalRequests.filter(r => r.status === 'rejected').length})
        </button>
        <button
          className={activeFilter === 'all' ? 'tab-active' : ''}
          onClick={() => setActiveFilter('all')}
        >
          All ({approvalRequests.length})
        </button>
      </div>

      <div className="approvals-list">
        {filteredRequests.length === 0 ? (
          <div className="no-requests">
            <p>No approval requests to display</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id} className="approval-card">
              <div className="approval-header">
                <div className="approval-meta">
                  <h3>{request.employeeName}</h3>
                  <span className={`status-badge status-${request.status}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
                <span className="submission-date">Submitted: {request.submittedDate}</span>
              </div>

              <div className="approval-body">
                <div className="approval-details">
                  <div className="detail-item">
                    <label>Category:</label>
                    <span>{request.category}</span>
                  </div>
                  <div className="detail-item">
                    <label>Start Date:</label>
                    <span>{request.startDate}</span>
                  </div>
                  <div className="detail-item">
                    <label>End Date:</label>
                    <span>{request.endDate}</span>
                  </div>
                  <div className="detail-item">
                    <label>Total Days:</label>
                    <span>{request.totalDays}</span>
                  </div>
                </div>

                <div className="approval-reason">
                  <label>Reason:</label>
                  <p>{request.reason}</p>
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="approval-actions">
                  <button
                    className="btn-approve"
                    onClick={() => handleApprove(request.id)}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleReject(request.id)}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManagerView;
