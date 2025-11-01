# Workflow Guide

For Understanding the Application Workflow and User Journey

## Application Overview

This is an approval workflow management system with three main user roles:

### 1. Admin
**Access:** `/admin-signin` → `/admin`
- Monitors all approval requests
- Views comprehensive approval history
- Filters and searches across all submissions
- Tracks approval statuses and trends

### 2. Employee
**Access:** `/signin` → `/employee`
- Submits new approval requests
- Fills out detailed request forms
- Uploads supporting documents
- Tracks submission status

### 3. Manager
**Access:** `/signin` → `/manager`
- Reviews pending approvals
- Makes approval/rejection decisions
- Views employee request details
- Filters by approval status

## User Journey

### Employee Flow
1. Navigate to `/signin`
2. Enter credentials and sign in
3. Click navigation to Employee View (or auto-routed)
4. Fill out approval request form:
   - Reason for request
   - Start and end dates
   - Category selection
   - Leave type (Paid/Unpaid)
   - Optional attachments
5. Submit request
6. Notification sent to manager

### Manager Flow
1. Navigate to `/signin`
2. Enter credentials and sign in
3. Navigate to Manager View
4. Review pending requests
5. Click on request to view details
6. Make decision:
   - Approve → Updates status
   - Reject → Updates status
7. Notification sent to employee and admin

### Admin Flow
1. Navigate to `/admin-signin`
2. Enter admin credentials
3. View comprehensive dashboard
4. Use filters to find specific approvals:
   - Search by employee name
   - Filter by category
   - View by status
5. Monitor overall approval trends
6. Access detailed approval information

## Page Navigation

### From Any Page:
- Header buttons allow role switching (for demo)
- Logout returns to sign-in page

### Sign-In Pages:
- "Admin Sign In" link switches to admin login
- "Sign In" link switches to standard login
- "Forget Password?" for password recovery

## Form Fields Reference

### Employee Request Form:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Reason | Textarea | Yes | Detailed explanation |
| Start Date | Date | Yes | Cannot be in the past |
| End Date | Date | Yes | Must be >= start date |
| Category | Select | Yes | Sick/Annual/Personal/Emergency/Other |
| Leave Type | Radio | Yes | Paid or Unpaid |
| Attachments | File | No | PDF, DOC, DOCX, JPG, PNG |

### Admin/Manager Views:
| Column | Description |
|--------|-------------|
| Date | Submission date |
| Employee | Requestor name |
| Category | Type of leave |
| Leave Type | Paid/Unpaid |
| Status | Approved/Pending/Rejected |
| Start Date | Leave start date |
| End Date | Leave end date |
| Total Days | Duration calculation |


## Quick Actions

### Admin View:
- Search approvals
- Filter by category
- View details
- Switch to other views

### Employee View:
- Submit new request
- Cancel form
- View guidelines

### Manager View:
- Filter by status (Pending/Approved/Rejected/All)
- Approve request
- Reject request
- View guidelines