# Quick Start Guide

## 🚀 Launch the Application

1. **Install dependencies:**
   ```bash
   cd /workspaces/OdooxAmalthea/client
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   ```
   http://localhost:5173
   ```

## 🎭 Test the Workflow

### Scenario 1: Employee Submitting a Request

1. Go to `http://localhost:5173/signin`
2. Enter any email and password (authentication is simulated)
3. Click "Sign In" → Redirected to Employee View
4. Fill out the request form:
   - Reason: "Family vacation"
   - Start Date: Select a future date
   - End Date: Select end date
   - Category: "Annual Leave"
   - Leave Type: Select "Paid"
5. Click "Submit Request"

### Scenario 2: Manager Reviewing Requests

1. From Employee View, click "Manager View" in header
2. View the list of pending approvals
3. Click on different status tabs (Pending, Approved, Rejected, All)
4. Review a pending request
5. Click "Approve" or "Reject"

### Scenario 3: Admin Monitoring

1. From any view, click "Admin View" in header
2. Use the search bar to find specific employees
3. Filter by category using the dropdown
4. View the comprehensive approval table
5. Click "View Details" on any approval

### Scenario 4: Admin Sign In

1. Go to Sign In page
2. Click "Admin Sign In" link at bottom
3. Fill out the admin registration form
4. Click "Submit" → Redirected to Admin View

## 🎨 Features to Explore

### Admin View (`/admin`)
- ✅ Search functionality
- ✅ Category filters
- ✅ Status badges (color-coded)
- ✅ Sortable table
- ✅ View details button

### Employee View (`/employee`)
- ✅ Multi-field form
- ✅ Date pickers
- ✅ Category dropdown
- ✅ Radio buttons for leave type
- ✅ File upload
- ✅ Form validation
- ✅ Cancel and submit actions

### Manager View (`/manager`)
- ✅ Status filter tabs
- ✅ Request count badges
- ✅ Detailed approval cards
- ✅ Approve/Reject buttons
- ✅ Color-coded status
- ✅ Manager guidelines

## 🔄 Navigation Flow

```
/ (root)
  └─→ /signin (Sign In Page)
       ├─→ /employee (Employee View)
       ├─→ /manager (Manager View)
       └─→ /admin-signin (Admin Sign In)
            └─→ /admin (Admin View)
```

## 📱 Responsive Testing

Test on different screen sizes:
- Desktop: Full width (1920px+)
- Laptop: Standard (1024px - 1919px)
- Tablet: Medium (768px - 1023px)
- Mobile: Small (320px - 767px)

Use browser DevTools to toggle device emulation.

## 🎯 Key Components

### Pages
- `AdminSignIn.tsx` - Admin authentication
- `SignIn.tsx` - User authentication
- `AdminView.tsx` - Approval monitoring dashboard
- `EmployeeView.tsx` - Request submission form
- `ManagerView.tsx` - Approval review interface

### Styles
Each page has corresponding CSS file in `src/styles/`

### Routing
All routes configured in `App.tsx` using React Router v6

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
npx kill-port 5173
# Or use different port
npm run dev -- --port 3000
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clean build
npm run build
```

### TypeScript Errors
```bash
# Check types
npx tsc --noEmit
```

## 📊 Sample Data

The application includes sample data for demonstration:
- 3 approval requests with different statuses
- Multiple categories
- Various employees

In production, this would be replaced with API calls.

## 🔧 Development Tips

1. **Hot Module Replacement (HMR):** Changes auto-reload
2. **React DevTools:** Install browser extension for debugging
3. **Console Logs:** Check browser console for any warnings
4. **Network Tab:** Monitor future API calls

## 📝 Next Steps

1. ✅ UI is complete
2. ✅ Routing is functional
3. ✅ Forms are validated
4. 🔄 Add backend API integration
5. 🔄 Implement real authentication
6. 🔄 Connect to database
7. 🔄 Add email notifications

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [React Router](https://reactrouter.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

---

**Happy Coding! 🚀**
