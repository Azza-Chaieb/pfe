import axios from 'axios';

const API_URL = 'http://localhost:1337/api';

const createAdminUser = async () => {
    try {
        console.log('Attempting to register new user...');

        // Attempt 1: Register via public API
        // Note: This creates an "Authenticated" user, not a Super Admin.
        // However, our current Dashboard logic accepts any authenticated user.
        const response = await axios.post(`${API_URL}/auth/local/register`, {
            username: 'admin_test',
            email: 'admin_test@example.com',
            password: 'StrongPassword123!',
        });

        console.log('User created successfully!');
        console.log('Username: admin_test');
        console.log('Email: admin_test@example.com');
        console.log('Password: StrongPassword123!');
        console.log('JWT:', response.data.jwt);

        // Optionally, if we had access to a custom endpoint to elevate role, we'd call it here.
        // For now, "Authenticated" is enough to login to the React App.

    } catch (error) {
        if (error.response) {
            if (error.response.status === 400 && error.response.data.error.message === 'Email or Username are already taken') {
                console.log('User "admin_test" already exists. You can log in with:');
                console.log('Email: admin_test@example.com');
                console.log('Password: StrongPassword123! (if default)');
            } else {
                console.error('Registration failed:', error.response.data);
            }
        } else {
            console.error('Network error or server down:', error.message);
        }
    }
};

createAdminUser();
