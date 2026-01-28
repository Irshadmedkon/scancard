// API Configuration
const API_URL = 'http://localhost:5000/api/v1';

// Global State
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let currentToken = localStorage.getItem('accessToken') || '';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    if (currentUser && currentToken) {
        updateUIForLoggedInUser();
    }
    
    // Handle hash navigation
    handleHashNavigation();
    window.addEventListener('hashchange', handleHashNavigation);
    
    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('href').substring(1);
            showPage(page);
        });
    });
});

// Handle Hash Navigation
function handleHashNavigation() {
    const hash = window.location.hash.substring(1) || 'home';
    showPage(hash);
}

// Show Page
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const page = document.getElementById(pageName);
    if (page) {
        page.classList.add('active');
        
        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${pageName}`) {
                link.classList.add('active');
            }
        });
        
        // Update URL
        window.location.hash = pageName;
    }
}

// Update UI for Logged In User
function updateUIForLoggedInUser() {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('signupBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'block';
    document.getElementById('dashboardLink').style.display = 'block';
    
    if (document.getElementById('userName')) {
        document.getElementById('userName').textContent = currentUser.full_name || currentUser.email;
    }
    if (document.getElementById('userToken')) {
        document.getElementById('userToken').textContent = currentToken;
    }
}

// Show Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Logging in...';
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentUser = result.data.user;
            currentToken = result.data.access_token;
            localStorage.setItem('user', JSON.stringify(currentUser));
            localStorage.setItem('accessToken', currentToken);
            
            showToast('Login successful! Welcome back! 🎉', 'success');
            updateUIForLoggedInUser();
            
            setTimeout(() => {
                showPage('dashboard');
            }, 1000);
        } else {
            showToast(result.error?.message || 'Login failed', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Login';
    }
}

// Handle Signup
async function handleSignup(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password')
    };
    
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Creating account...';
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Account created successfully! Please login. ✅', 'success');
            event.target.reset();
            
            setTimeout(() => {
                showPage('login');
                // Pre-fill email
                document.querySelector('#loginForm input[name="email"]').value = data.email;
            }, 2000);
        } else {
            showToast(result.error?.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create Account';
    }
}

// Handle Logout
function handleLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    currentUser = null;
    currentToken = '';
    
    document.getElementById('loginBtn').style.display = 'block';
    document.getElementById('signupBtn').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('dashboardLink').style.display = 'none';
    
    showToast('Logged out successfully! 👋', 'success');
    showPage('home');
}

// Show Docs
function showDocs(module) {
    const docsMain = document.getElementById('docsMain');
    
    const docsContent = {
        auth: `
            <h3>Authentication</h3>
            <p>Manage user authentication and authorization.</p>
            <h4>Endpoints</h4>
            <pre><code>POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/logout</code></pre>
            <h4>Example: Register</h4>
            <pre><code>{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+923001234567",
  "password": "password123"
}</code></pre>
        `,
        profile: `
            <h3>Profile Management</h3>
            <p>Create and manage digital business card profiles.</p>
            <h4>Endpoints</h4>
            <pre><code>POST /api/v1/profiles
GET /api/v1/profiles/:id
PUT /api/v1/profiles/:id
DELETE /api/v1/profiles/:id
GET /api/v1/profiles/username/:username</code></pre>
            <h4>Example: Create Profile</h4>
            <pre><code>{
  "profile_name": "My Business",
  "username": "mybusiness",
  "company": "Tech Corp",
  "bio": "Digital business card",
  "is_public": true
}</code></pre>
        `,
        menu: `
            <h3>Menu Management</h3>
            <p>Perfect for restaurants - manage menus and items.</p>
            <h4>Endpoints</h4>
            <pre><code>POST /api/v1/menu/:profileId/categories
POST /api/v1/menu/:profileId/items
GET /api/v1/menu/:profileId
PUT /api/v1/menu/:profileId/items/:itemId
DELETE /api/v1/menu/:profileId/items/:itemId</code></pre>
        `,
        catalog: `
            <h3>Product Catalog</h3>
            <p>Showcase and manage your products.</p>
            <h4>Endpoints</h4>
            <pre><code>POST /api/v1/catalog/:profileId/products
GET /api/v1/catalog/:profileId/products
GET /api/v1/catalog/:profileId/products/:productId
PUT /api/v1/catalog/:profileId/products/:productId
DELETE /api/v1/catalog/:profileId/products/:productId</code></pre>
        `,
        booking: `
            <h3>Booking System</h3>
            <p>Accept and manage appointments.</p>
            <h4>Endpoints</h4>
            <pre><code>POST /api/v1/booking/:profileId/services
POST /api/v1/booking/:profileId
GET /api/v1/booking/:profileId
GET /api/v1/booking/:profileId/services
PUT /api/v1/booking/:profileId/:bookingId
DELETE /api/v1/booking/:profileId/:bookingId</code></pre>
        `,
        leads: `
            <h3>Lead Management</h3>
            <p>Capture and manage customer leads.</p>
            <h4>Endpoints</h4>
            <pre><code>POST /api/v1/leads
GET /api/v1/leads/profile/:profileId
GET /api/v1/leads/:leadId
PUT /api/v1/leads/:leadId
DELETE /api/v1/leads/:leadId</code></pre>
        `,
        analytics: `
            <h3>Analytics</h3>
            <p>Track views, clicks, and engagement.</p>
            <h4>Endpoints</h4>
            <pre><code>GET /api/v1/analytics/profile/:profileId
GET /api/v1/analytics/profile/:profileId/views
GET /api/v1/analytics/profile/:profileId/clicks
POST /api/v1/analytics/track
GET /api/v1/analytics/export/:profileId</code></pre>
        `,
        payment: `
            <h3>Payment Integration</h3>
            <p>Process payments and manage transactions.</p>
            <h4>Endpoints</h4>
            <pre><code>POST /api/v1/payment/create-order
POST /api/v1/payment/verify
GET /api/v1/payment/history
GET /api/v1/payment/:paymentId
POST /api/v1/payment/refund/:paymentId</code></pre>
        `
    };
    
    docsMain.innerHTML = `
        <div class="docs-section">
            ${docsContent[module] || docsContent.auth}
            <br><br>
            <button class="btn btn-primary" onclick="window.open('admin.html', '_blank')">
                🚀 Test in Admin Panel
            </button>
        </div>
    `;
    
    // Update active link
    document.querySelectorAll('.docs-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
}

console.log('🎴 TAPONN Website Loaded!');
