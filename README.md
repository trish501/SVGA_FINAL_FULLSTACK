# 📚 SVGA Book Bank Management System

> A digital Book Bank Management System designed to simplify the process of requesting, approving, and managing academic books for students while helping educational communities reuse resources efficiently.

---

## 📖 About the Project

The **SVGA Book Bank Management System** is a web-based application developed to digitize the traditional book bank process followed by educational institutions and community organizations.

Instead of manually maintaining registers and book records, students can browse available books, submit requests, generate challans, and track their requests online. Administrators can review these requests, manage inventory, approve or reject applications, and monitor the complete lifecycle of every book.

The system also supports **Special Book Requests**, allowing students to request books that are not currently available in the library. These requests can later be purchased by the organization or through reimbursement workflows.

The project aims to make education more affordable by promoting the reuse of academic books and reducing unnecessary purchases.

---

# 🎯 Real-World Problem

Many educational institutions and community organizations maintain book banks manually.

This creates several challenges:

- Lost or misplaced records
- Long approval process
- Difficulty tracking inventory
- No transparency for students
- Duplicate book purchases
- Time-consuming administration

Students often end up purchasing expensive books because they are unaware that the same books are already available within the community.

The SVGA Book Bank solves these problems by providing a centralized digital platform for managing the complete borrowing process.

---

# 💡 Solution

The application digitizes the complete workflow:

Student Registration
⬇

Browse Available Books
⬇

Select Required Books
⬇

Generate Digital Challan
⬇

Admin Verification
⬇

Book Approval / Rejection
⬇

Inventory Update
⬇

Book Collection

For unavailable books:

Student Request
⬇

Special Book Request
⬇

Admin Review
⬇

Purchase / Reimbursement Process

---

# 🚀 Key Features

## 👨‍🎓 Student Portal

- Student Registration
- Browse Available Books
- Smart Search & Filters
- Book Details View
- Add Books to Request
- Generate Digital Challan
- View Application Status
- Track Request History
- Special Book Request
- Profile Management

---

## 👨‍💼 Admin Portal

- Secure Admin Login
- Dashboard Overview
- Student Management
- Inventory Management
- Book Approval Workflow
- Challan Verification
- Manage Special Requests
- Procurement Workflow
- Book Return Management
- Reports & Analytics

---

# 📂 Modules

### Student Module

- Registration
- Authentication
- Browse Books
- Search Books
- Book Requests
- Challan Generation
- Request History

### Admin Module

- Dashboard
- Student Verification
- Inventory
- Book Management
- Special Book Approval
- Challan Management
- Procurement
- Reports

---

# 📚 Book Request Workflow

```text
Student Registration
        │
        ▼
Browse Available Books
        │
        ▼
Select Books
        │
        ▼
Generate Challan
        │
        ▼
Admin Reviews Request
        │
 ┌──────┴────────┐
 │               │
Approved      Rejected
 │               │
 ▼               ▼
Book Issued   Student Notified
```

---

# 📘 Special Book Workflow

```text
Book Not Available
        │
        ▼
Special Book Request
        │
        ▼
Admin Review
        │
        ▼
Purchase Decision
        │
        ▼
Book Procured
        │
        ▼
Issued to Student
```

---

# 🛠 Tech Stack

### Frontend

- React.js
- JavaScript
- HTML5
- CSS3
- Tailwind CSS
- Bootstrap

### Backend

- Node.js
- Express.js

### Database

- PostgreSQL

### Authentication

- JWT Authentication

### Tools

- Git
- GitHub
- Postman
- VS Code

---

# 📂 Project Structure

```text
SVGA_BOOK_BANK/

│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── config/
│   └── package.json
│
├── database/
│
├── README.md
│
└── .gitignore
```

---

# ⚙ Prerequisites

Before running the project, install:

- Node.js (v18+ Recommended)
- npm / yarn
- PostgreSQL
- Git
- VS Code

---

# 📥 Clone the Repository

```bash
git clone https://github.com/het-visariya/SVGA_BOOK_BANK.git
```

Move inside the project

```bash
cd SVGA_BOOK_BANK
```

---

# 📦 Install Dependencies

Frontend

```bash
cd frontend
npm install
```

Backend

```bash
cd backend
npm install
```

---

# 🗄 Configure Environment Variables

Create a `.env` file inside the backend folder.

Example:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookbank
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key
```

---

# ▶ Run Backend

```bash
cd backend

npm run dev
```

or

```bash
npm start
```

---

# ▶ Run Frontend

```bash
cd frontend

npm start
```

or

```bash
npm run dev
```

---

# 🌍 Open the Application

Frontend

```
http://localhost:3000
```

Backend

```
http://localhost:5000
```

*(Update these ports if your project uses different ones.)*

---

# 🎯 Future Enhancements

- QR Code Based Book Issue
- Barcode Integration
- Email Notifications
- WhatsApp Notifications
- Digital Student ID Verification
- AI Book Recommendation System
- Fine Management
- Online Book Reservation
- Analytics Dashboard
- Multi-Branch Support

---

# 📈 Project Impact

The SVGA Book Bank Management System helps educational institutions:

- Reduce manual paperwork
- Improve transparency
- Simplify inventory management
- Minimize duplicate book purchases
- Speed up approval workflows
- Increase accessibility to academic resources
- Promote sustainable book reuse within the community

---

# 👨‍💻 Contributors

Developed as part of an internship project to modernize and digitize the traditional Book Bank workflow.

---

# 📄 License

This project is intended for educational and internship purposes.
