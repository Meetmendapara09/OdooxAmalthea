import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminSignIn.css';

const AdminSignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to admin view after sign in
    navigate('/admin');
  };

  return (
    <div className="signin-container">
      <div className="signin-box">
        <h1>Admin Connect Space Page</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit">Submit</button>
          </div>

          <div className="form-links">
            <a href="#" onClick={() => navigate('/signin')}>Sign Page</a>
            <a href="#" onClick={() => navigate('/forgot-password')}>Forget Password?</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSignIn;
