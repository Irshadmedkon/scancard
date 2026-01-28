// API Base URL
const API_URL = 'http://localhost:5000/api/v1';

// Show/Hide Forms
function showForm(formName) {
    // Hide all forms
    document.querySelectorAll('.form-container').forEach(form => {
        form.classList.remove('active');
    });
    
    // Show selected form
    const formMap = {
        'login': 'loginForm',
        'register': 'registerForm',
        'forgot': 'forgotForm',
        'reset': 'resetForm',
        'dashboard': 'dashboard'
    };
    
    document.getElementById(formMap[formName]).classList.add('active');
    hideMessage();
}

// Show Message
function showMessage(message, type = 'success') {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = `message-box show ${type}`;
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideMessage();
    }, 5000);
}

// Hide Message
function hideMessage() {
    const messageBox = document.getElementById('messageBox');
    messageBox.classList.remove('show');
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    try {
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Logging in';
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store token
            localStorage.setItem('accessToken', data.data.access_token);
            localStorage.setItem('refreshToken', data.data.refresh_token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            
            // Show success message
            showMessage('Login successful! Welcome back! 🎉', 'success');
            
            // Show dashboard
            setTimeout(() => {
                displayDashboard(data.data.user, data.data.access_token);
            }, 1000);
        } else {
            showMessage(data.error?.message || 'Login failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error. Please check your connection.', 'error');
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Login';
    }
}

// Handle Register
async function handleRegister(event) {
    event.preventDefault();
    
    const full_name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    try {
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Registering';
        
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ full_name, email, phone, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Registration successful! Please login. ✅', 'success');
            
            // Clear form
            event.target.reset();
            
            // Switch to login form after 2 seconds
            setTimeout(() => {
                showForm('login');
                // Pre-fill email
                document.getElementById('loginEmail').value = email;
            }, 2000);
        } else {
            showMessage(data.error?.message || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showMessage('Network error. Please check your connection.', 'error');
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Register';
    }
}

// Handle Forgot Password
async function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    try {
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Sending';
        
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Password reset token sent! Check console for token (in production, check email). 📧', 'success');
            
            // Pre-fill email in reset form
            document.getElementById('resetEmail').value = email;
            
            // Clear form
            event.target.reset();
            
            // Switch to reset password form after 2 seconds
            setTimeout(() => {
                showForm('reset');
            }, 2000);
        } else {
            showMessage(data.error?.message || 'Failed to send reset token. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        showMessage('Network error. Please check your connection.', 'error');
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Send Reset Token';
    }
}

// Handle Reset Password
async function handleResetPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('resetEmail').value;
    const token = document.getElementById('resetToken').value;
    const new_password = document.getElementById('resetPassword').value;
    const confirmPassword = document.getElementById('resetConfirmPassword').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    // Validate passwords match
    if (new_password !== confirmPassword) {
        showMessage('Passwords do not match! Please try again.', 'error');
        return;
    }
    
    try {
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Resetting';
        
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, new_password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Password reset successful! You can now login with your new password. ✅', 'success');
            
            // Clear form
            event.target.reset();
            
            // Switch to login form after 2 seconds
            setTimeout(() => {
                showForm('login');
                // Pre-fill email if available
                if (email) {
                    document.getElementById('loginEmail').value = email;
                }
            }, 2000);
        } else {
            showMessage(data.error?.message || 'Password reset failed. Please check your token and try again.', 'error');
        }
    } catch (error) {
        console.error('Reset password error:', error);
        showMessage('Network error. Please check your connection.', 'error');
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Reset Password';
    }
}

// Display Dashboard
function displayDashboard(user, token) {
    document.getElementById('userName').textContent = user.full_name;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userPhone').textContent = user.phone || 'N/A';
    document.getElementById('accessToken').value = token;
    
    showForm('dashboard');
}

// Handle Logout
function handleLogout() {
    // Clear storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Show message
    showMessage('Logged out successfully! 👋', 'success');
    
    // Show login form
    setTimeout(() => {
        showForm('login');
    }, 1000);
}

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        try {
            const userData = JSON.parse(user);
            displayDashboard(userData, token);
        } catch (error) {
            console.error('Error parsing user data:', error);
            showForm('login');
        }
    } else {
        showForm('login');
    }
});

// Test API Connection
async function testConnection() {
    try {
        const response = await fetch(`${API_URL}/../health`);
        const data = await response.json();
        console.log('✅ API Connection:', data);
    } catch (error) {
        console.error('❌ API Connection Failed:', error);
    }
}

// Test connection on load
testConnection();

// Dashboard Section Navigation
function showDashboardSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active from all nav buttons
    document.querySelectorAll('.btn-nav').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    const sectionMap = {
        'profile': 'profileSection',
        'menu': 'menuSection',
        'catalog': 'catalogSection',
        'booking': 'bookingSection',
        'leads': 'leadsSection'
    };
    
    document.getElementById(sectionMap[sectionName]).classList.add('active');
    
    // Set active nav button
    event.target.classList.add('active');
}

// Handle Create Profile
async function handleCreateProfile(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
        showMessage('Please login first!', 'error');
        return;
    }
    
    const profileData = {
        profile_name: document.getElementById('profileName').value,
        username: document.getElementById('profileUsername').value || undefined,
        company: document.getElementById('profileCompany').value || undefined,
        designation: document.getElementById('profileDesignation').value || undefined,
        bio: document.getElementById('profileBio').value || undefined,
        website: document.getElementById('profileWebsite').value || undefined,
        is_public: document.getElementById('profilePublic').value === 'true'
    };
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Creating';
        
        const response = await fetch(`${API_URL}/profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(`Profile created successfully! Profile ID: ${data.data.profile_id} ✅`, 'success');
            event.target.reset();
        } else {
            showMessage(data.error?.message || 'Failed to create profile', 'error');
        }
    } catch (error) {
        console.error('Create profile error:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Create Profile';
    }
}

// Handle Add Menu Item
async function handleAddMenuItem(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
        showMessage('Please login first!', 'error');
        return;
    }
    
    const profileId = document.getElementById('menuProfileId').value;
    const menuData = {
        category_id: parseInt(document.getElementById('menuCategoryId').value),
        item_name: document.getElementById('menuItemName').value,
        description: document.getElementById('menuDescription').value || undefined,
        price: parseFloat(document.getElementById('menuPrice').value),
        discount_price: document.getElementById('menuDiscountPrice').value ? parseFloat(document.getElementById('menuDiscountPrice').value) : undefined,
        preparation_time: document.getElementById('menuPrepTime').value ? parseInt(document.getElementById('menuPrepTime').value) : undefined,
        calories: document.getElementById('menuCalories').value ? parseInt(document.getElementById('menuCalories').value) : undefined,
        is_veg: document.getElementById('menuIsVeg').value === 'true',
        tags: document.getElementById('menuTags').value || undefined
    };
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Adding';
        
        const response = await fetch(`${API_URL}/menu/${profileId}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(menuData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(`Menu item added successfully! Item ID: ${data.data.item_id} ✅`, 'success');
            event.target.reset();
        } else {
            showMessage(data.error?.message || 'Failed to add menu item', 'error');
        }
    } catch (error) {
        console.error('Add menu item error:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Add Menu Item';
    }
}

// Handle Add Product
async function handleAddProduct(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
        showMessage('Please login first!', 'error');
        return;
    }
    
    const profileId = document.getElementById('catalogProfileId').value;
    const productData = {
        product_name: document.getElementById('productName').value,
        sku: document.getElementById('productSku').value || undefined,
        description: document.getElementById('productDescription').value || undefined,
        price: parseFloat(document.getElementById('productPrice').value),
        discount_price: document.getElementById('productDiscountPrice').value ? parseFloat(document.getElementById('productDiscountPrice').value) : undefined,
        stock_quantity: document.getElementById('productStock').value ? parseInt(document.getElementById('productStock').value) : undefined,
        category: document.getElementById('productCategory').value || undefined,
        brand: document.getElementById('productBrand').value || undefined,
        tags: document.getElementById('productTags').value || undefined
    };
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Adding';
        
        const response = await fetch(`${API_URL}/catalog/${profileId}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(`Product added successfully! Product ID: ${data.data.product_id} ✅`, 'success');
            event.target.reset();
        } else {
            showMessage(data.error?.message || 'Failed to add product', 'error');
        }
    } catch (error) {
        console.error('Add product error:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Add Product';
    }
}

// Handle Create Booking Service
async function handleCreateBookingService(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
        showMessage('Please login first!', 'error');
        return;
    }
    
    const profileId = document.getElementById('bookingProfileId').value;
    const serviceData = {
        service_name: document.getElementById('serviceName').value,
        description: document.getElementById('serviceDescription').value || undefined,
        duration_minutes: parseInt(document.getElementById('serviceDuration').value),
        price: parseFloat(document.getElementById('servicePrice').value),
        buffer_time: document.getElementById('serviceBuffer').value ? parseInt(document.getElementById('serviceBuffer').value) : undefined
    };
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Creating';
        
        const response = await fetch(`${API_URL}/booking/${profileId}/services`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(serviceData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(`Service created successfully! Service ID: ${data.data.service_id} ✅`, 'success');
            event.target.reset();
        } else {
            showMessage(data.error?.message || 'Failed to create service', 'error');
        }
    } catch (error) {
        console.error('Create service error:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Create Service';
    }
}

// Handle Add Lead
async function handleAddLead(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
        showMessage('Please login first!', 'error');
        return;
    }
    
    const leadData = {
        profile_id: parseInt(document.getElementById('leadProfileId').value),
        name: document.getElementById('leadName').value,
        email: document.getElementById('leadEmail').value || undefined,
        phone: document.getElementById('leadPhone').value || undefined,
        company: document.getElementById('leadCompany').value || undefined,
        message: document.getElementById('leadMessage').value || undefined,
        source: document.getElementById('leadSource').value || undefined
    };
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Adding';
        
        const response = await fetch(`${API_URL}/leads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(leadData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(`Lead added successfully! Lead ID: ${data.data.lead_id} ✅`, 'success');
            event.target.reset();
        } else {
            showMessage(data.error?.message || 'Failed to add lead', 'error');
        }
    } catch (error) {
        console.error('Add lead error:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Add Lead';
    }
}
