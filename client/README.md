# Approval Workflow Application

A comprehensive approval workflow system with multiple user roles including Admin, Employee, and Manager views. Built with React, TypeScript, and React Router.

## 🎯 Features

### Admin View
- View all approval requests across the organization
- Filter approvals by category (Sick Leave, Annual Leave, Personal, Emergency)
- Search functionality for employees and categories
- Track approval status (Approved, Pending, Rejected)
- Monitor dates, leave types, and total days

### Employee View
- Submit approval requests with detailed information
- Specify reason/comments for the request
- Select start and end dates
- Choose category and leave type (Paid/Unpaid)
- Upload attachments (PDF, DOC, DOCX, JPG, PNG)

### Manager View
- Review pending approval requests
- Filter requests by status
- Approve or reject requests
- View detailed employee information

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🛣️ Routing Structure

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Redirect | Redirects to sign-in page |
| `/signin` | SignIn | Employee/Manager login |
| `/admin-signin` | AdminSignIn | Admin login |
| `/admin` | AdminView | Admin dashboard with all approvals |
| `/employee` | EmployeeView | Employee request submission form |
| `/manager` | ManagerView | Manager approval review interface |

## 🔄 Workflow

1. **Employee submits request** → Employee View
2. **Manager reviews** → Manager View
3. **Admin monitors** → Admin View
4. **Decision made** → Approved/Rejected status updated

## 🛠️ Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router v6** - Client-side routing
- **CSS3** - Styling with gradients and animations

## 📁 Project Structure

```
client/
├── src/
│   ├── pages/
│   │   ├── AdminSignIn.tsx
│   │   ├── SignIn.tsx
│   │   ├── AdminView.tsx
│   │   ├── EmployeeView.tsx
│   │   └── ManagerView.tsx
│   ├── styles/
│   │   ├── AdminSignIn.css
│   │   ├── SignIn.css
│   │   ├── AdminView.css
│   │   ├── EmployeeView.css
│   │   └── ManagerView.css
│   └── App.tsx
```

---

## React + Vite Technical Notes

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
