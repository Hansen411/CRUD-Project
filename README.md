# ALA Employee Management System
A full-stack employee management web application built with Node.js, Express, MongoDB, and EJS. Features include shift scheduling, time-off requests, payroll management, and role-based access control.

## Features
### For Employees:
- Request and manage shifts
- Submit time-off requests
- View payroll and payment history
- Personal to-do list with full CRUD operations
- Profile management

### For Admins:
- Approve/deny shift and time-off requests
- Create and manage open shifts, view employee shifts
- Approve payroll records
- Manage personal to-do list

## Testing Instructions
1. git clone https://github.com/Hansen411/CRUD-Project.git
2. cd CRUD-Project
3. npm install 
4. Install node.js and dotenv 
5. Make .env file in the root directory to set up env variables. I will add the specific information (mongodb password, session key) in the Canvas report submission, as this is a public repository. 
6. Run node app.js
7. Go to http://localhost:3000

You can log in with the following credentials:
Admin: admin@admin.com / admin123
Employee: john@example.com / password123

You can also sign up, then log in with your new credentials. 

We have added fake test data to the MongoDB so you can see how this will work. Test out the shift submission, to-do list, and time-off functions on both the employee and admin side. You cannot log in to both pages on one browser due to access permission requirements. 

