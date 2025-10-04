import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/EmployeeView.css';

const EmployeeView = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    reason: '',
    startDate: '',
    endDate: '',
    category: '',
    leaveType: 'paid',
    attachments: null as File | null
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    if (target.type === 'file' && target.files) {
      setFormData({
        ...formData,
        attachments: target.files[0]
      });
    } else {
      setFormData({
        ...formData,
        [target.name]: target.value
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit approval request
    alert('Approval request submitted successfully!');
    navigate('/admin');
  };

  return (
    <div className="employee-view-container">
      <header className="employee-header">
        <h1>Employee's View</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/admin')} className="btn-link">Admin View</button>
          <button onClick={() => navigate('/manager')} className="btn-link">Manager View</button>
          <button onClick={() => navigate('/')} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="approval-form-container">
        <h2>Request Approval</h2>
        <p className="form-description">
          How should be able to submit a request, hence the employer or person in charge of 
          the shift or payroll of the HRIS is who dispatches payroll will get notified about 
          pending or waiting approval.
        </p>

        <form onSubmit={handleSubmit} className="approval-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reason">Reason (comments)</label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows={4}
                placeholder="Please provide a detailed reason for your request..."
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                <option value="sick">Sick Leave</option>
                <option value="annual">Annual Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="emergency">Emergency Leave</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Leave Type</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="leaveType"
                    value="paid"
                    checked={formData.leaveType === 'paid'}
                    onChange={handleChange}
                  />
                  Paid
                </label>
                <label>
                  <input
                    type="radio"
                    name="leaveType"
                    value="unpaid"
                    checked={formData.leaveType === 'unpaid'}
                    onChange={handleChange}
                  />
                  Unpaid
                </label>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="attachments">Attachments (optional)</label>
              <input
                type="file"
                id="attachments"
                name="attachments"
                onChange={handleChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <small>Supported formats: PDF, DOC, DOCX, JPG, PNG</small>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/admin')}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeView;
