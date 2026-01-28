// API Configuration
const API_URL = 'http://localhost:5000/api/v1';

// Global State
let currentToken = localStorage.getItem('accessToken') || '';
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (currentToken && currentUser) {
        updateUserDisplay();
        showModule('auth');
    } else {
        showModule('auth');
    }
});

// Update User Display
function updateUserDisplay() {
    document.getElementById('currentUser').textContent = currentUser?.email || 'Not logged in';
    document.getElementById('tokenDisplay').value = currentToken || '';
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

// Logout
function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    currentToken = '';
    currentUser = null;
    updateUserDisplay();
    showToast('Logged out successfully', 'info');
    showModule('auth');
}

// Show Module
function showModule(moduleName) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Find and activate the clicked nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.textContent.toLowerCase().includes(moduleName.substring(0, 4))) {
            item.classList.add('active');
        }
    });
    
    // Update title
    const titles = {
        auth: 'Authentication',
        profile: 'Profile Management',
        menu: 'Menu Management',
        catalog: 'Catalog Management',
        booking: 'Booking Management',
        leads: 'Lead Management',
        upload: 'File Upload',
        stats: 'Statistics',
        analytics: 'Analytics',
        search: 'Search',
        payment: 'Payment',
        subscription: 'Subscription',
        team: 'Team Management',
        notification: 'Notifications',
        webhook: 'Webhooks',
        apikey: 'API Keys',
        nfc: 'NFC Cards',
        batch: 'Batch Operations',
        export: 'Export Data'
    };
    
    document.getElementById('moduleTitle').textContent = titles[moduleName] || moduleName;
    
    // Load module content
    loadModuleContent(moduleName);
}

// Load Module Content
function loadModuleContent(moduleName) {
    const contentArea = document.getElementById('contentArea');
    
    const modules = {
        auth: getAuthModule(),
        profile: getProfileModule(),
        menu: getMenuModule(),
        catalog: getCatalogModule(),
        booking: getBookingModule(),
        leads: getLeadsModule(),
        upload: getUploadModule(),
        stats: getStatsModule(),
        analytics: getAnalyticsModule(),
        search: getSearchModule(),
        payment: getPaymentModule(),
        subscription: getSubscriptionModule(),
        team: getTeamModule(),
        notification: getNotificationModule(),
        webhook: getWebhookModule(),
        apikey: getApiKeyModule(),
        nfc: getNFCModule(),
        batch: getBatchModule(),
        export: getExportModule()
    };
    
    contentArea.innerHTML = modules[moduleName] || '<p>Module not found</p>';
}

// API Helper
async function apiCall(endpoint, method = 'GET', body = null, useToken = true) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (useToken && currentToken) {
        options.headers['Authorization'] = `Bearer ${currentToken}`;
    }
    
    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Handle Form Submit
async function handleSubmit(event, endpoint, method = 'POST', useToken = true) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Convert numbers and handle empty values
    Object.keys(data).forEach(key => {
        if (data[key] === '') {
            // Remove empty fields instead of converting to number
            delete data[key];
        } else if (data[key] === 'true') {
            data[key] = true;
        } else if (data[key] === 'false') {
            data[key] = false;
        } else if (!isNaN(data[key]) && data[key] !== '' && 
                   !['email', 'phone', 'password', 'username', 'name', 'full_name', 
                     'card_uid', 'card_type', 'url', 'token', 'new_password'].includes(key)) {
            // Only convert to number if it's not a text field
            data[key] = Number(data[key]);
        }
    });
    
    const btn = form.querySelector('button[type="submit"]');
    if (btn) {
        btn.disabled = true;
        btn.classList.add('loading');
    }
    
    try {
        const result = await apiCall(endpoint, method, data, useToken);
        
        if (result.success) {
            showToast(result.message || 'Operation successful!', 'success');
            form.reset();
            
            // Special handling for login
            if (endpoint === '/auth/login' && result.data.access_token) {
                currentToken = result.data.access_token;
                currentUser = result.data.user;
                localStorage.setItem('accessToken', currentToken);
                localStorage.setItem('user', JSON.stringify(currentUser));
                updateUserDisplay();
            }
            
            // Display response
            displayResponse(result, form);
        } else {
            showToast(result.error?.message || 'Operation failed', 'error');
            displayResponse(result, form);
        }
    } catch (error) {
        showToast('Network error: ' + error.message, 'error');
        console.error('Submit error:', error);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.classList.remove('loading');
        }
    }
}

// Display Response
function displayResponse(data, formElement) {
    const section = formElement ? formElement.closest('.section') : null;
    const responseBox = section ? section.querySelector('.response-box') : null;
    if (responseBox) {
        responseBox.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }
}

// Display Response by Button
function displayResponseByButton(data, buttonText) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        const button = Array.from(section.querySelectorAll('button')).find(btn => 
            btn.textContent.includes(buttonText) || btn.getAttribute('onclick')?.includes(buttonText)
        );
        if (button) {
            const responseBox = section.querySelector('.response-box');
            if (responseBox) {
                responseBox.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
            }
        }
    });
}

// AUTH MODULE
function getAuthModule() {
    return `
        <div class="tabs">
            <button class="tab active" onclick="showTab(event, 'register-tab')">Register</button>
            <button class="tab" onclick="showTab(event, 'login-tab')">Login</button>
            <button class="tab" onclick="showTab(event, 'forgot-tab')">Forgot Password</button>
            <button class="tab" onclick="showTab(event, 'reset-tab')">Reset Password</button>
        </div>
        
        <div id="register-tab" class="tab-content active">
            <div class="section">
                <h3>Register New User</h3>
                <form onsubmit="handleSubmit(event, '/auth/register', 'POST', false)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Full Name *</label>
                            <input type="text" name="full_name" required>
                        </div>
                        <div class="form-group">
                            <label>Email *</label>
                            <input type="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="tel" name="phone">
                        </div>
                        <div class="form-group">
                            <label>Password *</label>
                            <input type="password" name="password" required minlength="6">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Register</button>
                </form>
                <div class="response-box"></div>
            </div>
        </div>
        
        <div id="login-tab" class="tab-content">
            <div class="section">
                <h3>Login</h3>
                <form onsubmit="handleSubmit(event, '/auth/login', 'POST', false)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Email *</label>
                            <input type="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label>Password *</label>
                            <input type="password" name="password" required>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Login</button>
                </form>
                <div class="response-box"></div>
            </div>
        </div>
        
        <div id="forgot-tab" class="tab-content">
            <div class="section">
                <h3>Forgot Password</h3>
                <form onsubmit="handleSubmit(event, '/auth/forgot-password', 'POST', false)">
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" name="email" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Send Reset Token</button>
                </form>
                <div class="response-box"></div>
            </div>
        </div>
        
        <div id="reset-tab" class="tab-content">
            <div class="section">
                <h3>Reset Password</h3>
                <form onsubmit="handleSubmit(event, '/auth/reset-password', 'POST', false)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Reset Token *</label>
                            <input type="text" name="token" required>
                        </div>
                        <div class="form-group">
                            <label>New Password *</label>
                            <input type="password" name="new_password" required minlength="6">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Reset Password</button>
                </form>
                <div class="response-box"></div>
            </div>
        </div>
    `;
}

// Tab Switching
function showTab(event, tabId) {
    if (!event || !event.target) return;
    
    const parent = event.target.closest('.content-area');
    if (!parent) return;
    
    parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    parent.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
        tabElement.classList.add('active');
    }
}

// PROFILE MODULE
function getProfileModule() {
    return `
        <div class="tabs">
            <button class="tab active" onclick="showTab(event, 'create-profile')">Create Profile</button>
            <button class="tab" onclick="showTab(event, 'get-profile')">Get Profile</button>
            <button class="tab" onclick="showTab(event, 'update-profile')">Update Profile</button>
            <button class="tab" onclick="showTab(event, 'delete-profile')">Delete Profile</button>
        </div>
        
        <div id="create-profile" class="tab-content active">
            <div class="section">
                <h3>Create Profile</h3>
                <form onsubmit="handleSubmit(event, '/profiles', 'POST')">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Profile Name *</label>
                            <input type="text" name="profile_name" required>
                        </div>
                        <div class="form-group">
                            <label>Username</label>
                            <input type="text" name="username">
                        </div>
                        <div class="form-group">
                            <label>Company</label>
                            <input type="text" name="company">
                        </div>
                        <div class="form-group">
                            <label>Designation</label>
                            <input type="text" name="designation">
                        </div>
                        <div class="form-group full-width">
                            <label>Bio</label>
                            <textarea name="bio"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Website</label>
                            <input type="url" name="website">
                        </div>
                        <div class="form-group">
                            <label>Public Profile</label>
                            <select name="is_public">
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Create Profile</button>
                </form>
                <div class="response-box"></div>
            </div>
        </div>
        
        <div id="get-profile" class="tab-content">
            <div class="section">
                <h3>Get Profile by ID</h3>
                <form onsubmit="event.preventDefault(); getProfile()">
                    <div class="form-group">
                        <label>Profile ID *</label>
                        <input type="number" id="getProfileId" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Get Profile</button>
                </form>
                <div class="response-box"></div>
            </div>
        </div>
        
        <div id="update-profile" class="tab-content">
            <div class="section">
                <h3>Update Profile</h3>
                <form onsubmit="updateProfile(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Profile ID *</label>
                            <input type="number" name="profile_id" required>
                        </div>
                        <div class="form-group">
                            <label>Profile Name</label>
                            <input type="text" name="profile_name">
                        </div>
                        <div class="form-group">
                            <label>Company</label>
                            <input type="text" name="company">
                        </div>
                        <div class="form-group">
                            <label>Designation</label>
                            <input type="text" name="designation">
                        </div>
                        <div class="form-group full-width">
                            <label>Bio</label>
                            <textarea name="bio"></textarea>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Update Profile</button>
                </form>
                <div class="response-box"></div>
            </div>
        </div>
        
        <div id="delete-profile" class="tab-content">
            <div class="section">
                <h3>Delete Profile</h3>
                <form onsubmit="deleteProfile(event)">
                    <div class="form-group">
                        <label>Profile ID *</label>
                        <input type="number" name="profile_id" required>
                    </div>
                    <button type="submit" class="btn btn-danger">Delete Profile</button>
                </form>
                <div class="response-box"></div>
            </div>
        </div>
    `;
}

async function getProfile() {
    const id = document.getElementById('getProfileId').value;
    try {
        const result = await apiCall(`/profiles/${id}`, 'GET');
        showToast('Profile fetched successfully', 'success');
        document.querySelector('#get-profile .response-box').innerHTML = 
            `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) {
        showToast('Error fetching profile', 'error');
    }
}

async function updateProfile(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    const profileId = data.profile_id;
    delete data.profile_id;
    
    Object.keys(data).forEach(key => {
        if (data[key] === '') delete data[key];
    });
    
    try {
        const result = await apiCall(`/profiles/${profileId}`, 'PUT', data);
        showToast('Profile updated successfully', 'success');
        document.querySelector('#update-profile .response-box').innerHTML = 
            `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) {
        showToast('Error updating profile', 'error');
    }
}

async function deleteProfile(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const profileId = formData.get('profile_id');
    
    if (!confirm('Are you sure you want to delete this profile?')) return;
    
    try {
        const result = await apiCall(`/profiles/${profileId}`, 'DELETE');
        showToast('Profile deleted successfully', 'success');
        document.querySelector('#delete-profile .response-box').innerHTML = 
            `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) {
        showToast('Error deleting profile', 'error');
    }
}

// MENU MODULE
function getMenuModule() {
    return `
        <div class="tabs">
            <button class="tab active" onclick="showTab(event, 'add-category')">Add Category</button>
            <button class="tab" onclick="showTab(event, 'add-item')">Add Menu Item</button>
            <button class="tab" onclick="showTab(event, 'get-menu')">Get Menu</button>
        </div>
        
        <div id="add-category" class="tab-content active">
            <div class="section">
                <h3>Add Menu Category</h3>
                <form onsubmit="addMenuCategory(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Profile ID *</label>
                            <input type="number" name="profile_id" required>
                        </div>
                        <div class="form-group">
                            <label>Category Name *</label>
                            <input type="text" name="category_name" required>
                        </div>
                        <div class="form-group full-width">
                            <label>Description</label>
                            <textarea name="description"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Display Order</label>
                            <input type="number" name="display_order" value="0">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Add Category</button>
                </form>
                <div class="response-box"></div>
            </div>
        </div>
        
        <div id="add-item" class="tab-content">
            <div class="section">
                <h3>Add Menu Item</h3>
                <form onsubmit="addMenuItem(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Profile ID *</label>
                            <input type="number" name="profile_id" required>
                        </div>
                        <div class="form-group">
                            <label>Category ID *</label>
                            <input type="number" name="category_id" required>
                        </div>
                        <div class="form-group">
                            <label>Item Name *</label>
                            <input type="text" name="item_name" required>
                        </div>
                        <div class="form-group">
                            <label>Price *</label>
                            <input type="number" name="price" step="0.01" required>
                        </div>
                        <div class="form-group full-width">
                            <label>Description</label>
                            <textarea name="description"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Discount Price</label>
                            <input type="number" name="discount_price" step="0.01">
                        </div>
                        <div class="form-group">
                            <label>Preparation Time (min)</label>
                            <input type="number" name="preparation_time">
                        </div>
                        <div class="form-group">
                            <label>Calories</label>
                            <input type="number" name="calories">
                        </div>
                        <div class="form-group">
                            <label>Type</label>
                            <select name="is_veg">
                                <option value="true">Veg</option>
                                <option value="false">Non-Veg</option>
                            </select>
                        </div>
                        <div class="form-group full-width">
                            <label>Tags (comma separated)</label>
                            <input type="text" name="tags">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Add Menu Item</button>
                </form>
                <div class="response-box"></div>
            </div>
        </div>
        
        <div id="get-menu" class="tab-content">
            <div class="section">
                <h3>Get Menu</h3>
                <form onsubmit="getMenu(event)">
                    <div class="form-group">
                        <label>Profile ID *</label>
                        <input type="number" name="profile_id" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Get Menu</button>
                </form>
                <div class="response-box"></div>
            </div>
        </div>
    `;
}

async function addMenuCategory(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    const profileId = data.profile_id;
    delete data.profile_id;
    
    try {
        const result = await apiCall(`/menu/${profileId}/categories`, 'POST', data);
        showToast('Category added successfully', 'success');
        event.target.reset();
        document.querySelector('#add-category .response-box').innerHTML = 
            `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) {
        showToast('Error adding category', 'error');
    }
}

async function addMenuItem(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    const profileId = data.profile_id;
    delete data.profile_id;
    
    // Convert types
    ['category_id', 'price', 'discount_price', 'preparation_time', 'calories'].forEach(key => {
        if (data[key]) data[key] = Number(data[key]);
    });
    data.is_veg = data.is_veg === 'true';
    
    try {
        const result = await apiCall(`/menu/${profileId}/items`, 'POST', data);
        showToast('Menu item added successfully', 'success');
        event.target.reset();
        document.querySelector('#add-item .response-box').innerHTML = 
            `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) {
        showToast('Error adding menu item', 'error');
    }
}

async function getMenu(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const profileId = formData.get('profile_id');
    
    try {
        const result = await apiCall(`/menu/${profileId}`, 'GET');
        showToast('Menu fetched successfully', 'success');
        document.querySelector('#get-menu .response-box').innerHTML = 
            `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) {
        showToast('Error fetching menu', 'error');
    }
}

// CATALOG MODULE
function getCatalogModule() {
    return `
        <div class="section">
            <h3>Add Product</h3>
            <form onsubmit="addProduct(event)">
                <div class="form-grid">
                    <div class="form-group"><label>Profile ID *</label><input type="number" name="profile_id" required></div>
                    <div class="form-group"><label>Product Name *</label><input type="text" name="product_name" required></div>
                    <div class="form-group"><label>SKU</label><input type="text" name="sku"></div>
                    <div class="form-group"><label>Price *</label><input type="number" name="price" step="0.01" required></div>
                    <div class="form-group full-width"><label>Description</label><textarea name="description"></textarea></div>
                    <div class="form-group"><label>Discount Price</label><input type="number" name="discount_price" step="0.01"></div>
                    <div class="form-group"><label>Stock Quantity</label><input type="number" name="stock_quantity"></div>
                    <div class="form-group"><label>Category</label><input type="text" name="category"></div>
                    <div class="form-group"><label>Brand</label><input type="text" name="brand"></div>
                </div>
                <button type="submit" class="btn btn-primary">Add Product</button>
            </form>
            <div class="response-box"></div>
        </div>
        
        <div class="section">
            <h3>Get Products</h3>
            <form onsubmit="getProducts(event)">
                <div class="form-group"><label>Profile ID *</label><input type="number" name="profile_id" required></div>
                <button type="submit" class="btn btn-primary">Get Products</button>
            </form>
            <div class="response-box"></div>
        </div>
    `;
}

async function addProduct(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    const profileId = data.profile_id;
    delete data.profile_id;
    ['price', 'discount_price', 'stock_quantity'].forEach(k => { if(data[k]) data[k] = Number(data[k]); });
    try {
        const result = await apiCall(`/catalog/${profileId}/products`, 'POST', data);
        showToast('Product added!', 'success');
        event.target.reset();
        event.target.closest('.section').querySelector('.response-box').innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) { showToast('Error', 'error'); }
}

async function getProducts(event) {
    event.preventDefault();
    const profileId = new FormData(event.target).get('profile_id');
    try {
        const result = await apiCall(`/catalog/${profileId}/products`, 'GET');
        showToast('Products fetched!', 'success');
        event.target.closest('.section').querySelector('.response-box').innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) { showToast('Error', 'error'); }
}

// BOOKING MODULE
function getBookingModule() {
    return `
        <div class="section">
            <h3>Create Booking Service</h3>
            <form onsubmit="createBookingService(event)">
                <div class="form-grid">
                    <div class="form-group"><label>Profile ID *</label><input type="number" name="profile_id" required></div>
                    <div class="form-group"><label>Service Name *</label><input type="text" name="service_name" required></div>
                    <div class="form-group"><label>Duration (min) *</label><input type="number" name="duration_minutes" required></div>
                    <div class="form-group"><label>Price *</label><input type="number" name="price" step="0.01" required></div>
                    <div class="form-group full-width"><label>Description</label><textarea name="description"></textarea></div>
                    <div class="form-group"><label>Buffer Time (min)</label><input type="number" name="buffer_time"></div>
                </div>
                <button type="submit" class="btn btn-primary">Create Service</button>
            </form>
            <div class="response-box"></div>
        </div>
        
        <div class="section">
            <h3>Create Booking</h3>
            <form onsubmit="createBooking(event)">
                <div class="form-grid">
                    <div class="form-group"><label>Profile ID *</label><input type="number" name="profile_id" required></div>
                    <div class="form-group"><label>Service ID *</label><input type="number" name="service_id" required></div>
                    <div class="form-group"><label>Customer Name *</label><input type="text" name="customer_name" required></div>
                    <div class="form-group"><label>Customer Phone *</label><input type="tel" name="customer_phone" required></div>
                    <div class="form-group"><label>Customer Email</label><input type="email" name="customer_email"></div>
                    <div class="form-group"><label>Booking Date *</label><input type="date" name="booking_date" required></div>
                    <div class="form-group"><label>Booking Time *</label><input type="time" name="booking_time" required></div>
                    <div class="form-group full-width"><label>Notes</label><textarea name="notes"></textarea></div>
                </div>
                <button type="submit" class="btn btn-primary">Create Booking</button>
            </form>
            <div class="response-box"></div>
        </div>
    `;
}

async function createBookingService(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    const profileId = data.profile_id;
    delete data.profile_id;
    ['duration_minutes', 'price', 'buffer_time'].forEach(k => { if(data[k]) data[k] = Number(data[k]); });
    try {
        const result = await apiCall(`/booking/${profileId}/services`, 'POST', data);
        showToast('Service created!', 'success');
        event.target.reset();
        event.target.closest('.section').querySelector('.response-box').innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) { showToast('Error', 'error'); }
}

async function createBooking(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    const profileId = data.profile_id;
    delete data.profile_id;
    data.service_id = Number(data.service_id);
    try {
        const result = await apiCall(`/booking/${profileId}`, 'POST', data);
        showToast('Booking created!', 'success');
        event.target.reset();
        event.target.closest('.section').querySelector('.response-box').innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) { showToast('Error', 'error'); }
}

// LEADS MODULE
function getLeadsModule() {
    return `
        <div class="section">
            <h3>Add Lead</h3>
            <form onsubmit="handleSubmit(event, '/leads', 'POST')">
                <div class="form-grid">
                    <div class="form-group"><label>Profile ID *</label><input type="number" name="profile_id" required></div>
                    <div class="form-group"><label>Name *</label><input type="text" name="name" required></div>
                    <div class="form-group"><label>Email</label><input type="email" name="email"></div>
                    <div class="form-group"><label>Phone</label><input type="tel" name="phone"></div>
                    <div class="form-group"><label>Company</label><input type="text" name="company"></div>
                    <div class="form-group"><label>Source</label><input type="text" name="source"></div>
                    <div class="form-group full-width"><label>Message</label><textarea name="message"></textarea></div>
                </div>
                <button type="submit" class="btn btn-primary">Add Lead</button>
            </form>
            <div class="response-box"></div>
        </div>
        
        <div class="section">
            <h3>Get Leads</h3>
            <form onsubmit="getLeads(event)">
                <div class="form-group"><label>Profile ID *</label><input type="number" name="profile_id" required></div>
                <button type="submit" class="btn btn-primary">Get Leads</button>
            </form>
            <div class="response-box"></div>
        </div>
    `;
}

async function getLeads(event) {
    event.preventDefault();
    const profileId = new FormData(event.target).get('profile_id');
    try {
        const result = await apiCall(`/leads/profile/${profileId}`, 'GET');
        showToast('Leads fetched!', 'success');
        event.target.closest('.section').querySelector('.response-box').innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) { showToast('Error', 'error'); }
}

// UPLOAD MODULE
function getUploadModule() {
    return `
        <div class="section">
            <h3>Upload Profile Avatar</h3>
            <form onsubmit="uploadFile(event, '/upload/profile-avatar')">
                <div class="form-group"><label>Profile ID *</label><input type="number" name="profile_id" required></div>
                <div class="form-group"><label>File *</label><input type="file" name="file" accept="image/*" required></div>
                <button type="submit" class="btn btn-primary">Upload Avatar</button>
            </form>
            <div class="response-box"></div>
        </div>
        
        <div class="section">
            <h3>Upload Menu Item Image</h3>
            <form onsubmit="uploadFile(event, '/upload/menu-item')">
                <div class="form-group"><label>Item ID *</label><input type="number" name="item_id" required></div>
                <div class="form-group"><label>File *</label><input type="file" name="file" accept="image/*" required></div>
                <button type="submit" class="btn btn-primary">Upload Image</button>
            </form>
            <div class="response-box"></div>
        </div>
    `;
}

async function uploadFile(event, endpoint) {
    event.preventDefault();
    const formData = new FormData(event.target);
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${currentToken}` },
            body: formData
        });
        const result = await response.json();
        showToast(result.success ? 'File uploaded!' : 'Upload failed', result.success ? 'success' : 'error');
        event.target.closest('.section').querySelector('.response-box').innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) { showToast('Error', 'error'); }
}

// STATS MODULE
function getStatsModule() {
    return `
        <div class="section">
            <h3>Dashboard Stats</h3>
            <button onclick="getDashboardStats()" class="btn btn-primary">Get Dashboard Stats</button>
            <div class="response-box"></div>
        </div>
        
        <div class="section">
            <h3>Profile Stats</h3>
            <form onsubmit="getProfileStats(event)">
                <div class="form-group"><label>Profile ID *</label><input type="number" name="profile_id" required></div>
                <button type="submit" class="btn btn-primary">Get Profile Stats</button>
            </form>
            <div class="response-box"></div>
        </div>
    `;
}

async function getDashboardStats() {
    try {
        const result = await apiCall('/stats/dashboard', 'GET');
        showToast('Stats fetched!', 'success');
        displayResponseByButton(result, 'getDashboardStats');
    } catch (error) { 
        showToast('Error', 'error'); 
        console.error('Error:', error);
    }
}

async function getProfileStats(event) {
    event.preventDefault();
    const profileId = new FormData(event.target).get('profile_id');
    try {
        const result = await apiCall(`/stats/profile/${profileId}`, 'GET');
        showToast('Stats fetched!', 'success');
        displayResponse(result, event.target);
    } catch (error) { showToast('Error', 'error'); }
}

// ANALYTICS MODULE
function getAnalyticsModule() {
    return `
        <div class="section">
            <h3>Get Profile Analytics</h3>
            <form onsubmit="getAnalytics(event)">
                <div class="form-group"><label>Profile ID *</label><input type="number" name="profile_id" required></div>
                <button type="submit" class="btn btn-primary">Get Analytics</button>
            </form>
            <div class="response-box"></div>
        </div>
        
        <div class="section">
            <h3>Track Event</h3>
            <form onsubmit="handleSubmit(event, '/analytics/track', 'POST')">
                <div class="form-grid">
                    <div class="form-group"><label>Profile ID *</label><input type="number" name="profile_id" required></div>
                    <div class="form-group"><label>Event Type *</label><input type="text" name="event_type" required></div>
                </div>
                <button type="submit" class="btn btn-primary">Track Event</button>
            </form>
            <div class="response-box"></div>
        </div>
    `;
}

async function getAnalytics(event) {
    event.preventDefault();
    const profileId = new FormData(event.target).get('profile_id');
    try {
        const result = await apiCall(`/analytics/profile/${profileId}`, 'GET');
        showToast('Analytics fetched!', 'success');
        event.target.closest('.section').querySelector('.response-box').innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) { showToast('Error', 'error'); }
}

// SEARCH MODULE
function getSearchModule() {
    return `
        <div class="section">
            <h3>Search Profiles</h3>
            <form onsubmit="searchProfiles(event)">
                <div class="form-grid">
                    <div class="form-group"><label>Query *</label><input type="text" name="q" required></div>
                    <div class="form-group"><label>Location</label><input type="text" name="location"></div>
                </div>
                <button type="submit" class="btn btn-primary">Search</button>
            </form>
            <div class="response-box"></div>
        </div>
        
        <div class="section">
            <h3>Global Search</h3>
            <form onsubmit="globalSearch(event)">
                <div class="form-group"><label>Query *</label><input type="text" name="q" required></div>
                <button type="submit" class="btn btn-primary">Search</button>
            </form>
            <div class="response-box"></div>
        </div>
    `;
}

async function searchProfiles(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const params = new URLSearchParams(formData).toString();
    try {
        const result = await apiCall(`/search/profiles?${params}`, 'GET');
        showToast('Search complete!', 'success');
        event.target.closest('.section').querySelector('.response-box').innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) { showToast('Error', 'error'); }
}

async function globalSearch(event) {
    event.preventDefault();
    const q = new FormData(event.target).get('q');
    try {
        const result = await apiCall(`/search/global?q=${q}`, 'GET');
        showToast('Search complete!', 'success');
        event.target.closest('.section').querySelector('.response-box').innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) { showToast('Error', 'error'); }
}

// PAYMENT MODULE
function getPaymentModule() {
    return `
        <div class="section">
            <h3>Create Payment Order</h3>
            <form onsubmit="handleSubmit(event, '/payment/create-order', 'POST')">
                <div class="form-grid">
                    <div class="form-group"><label>Amount *</label><input type="number" name="amount" step="0.01" required></div>
                    <div class="form-group"><label>Currency *</label><input type="text" name="currency" value="PKR" required></div>
                    <div class="form-group full-width"><label>Description</label><input type="text" name="description"></div>
                </div>
                <button type="submit" class="btn btn-primary">Create Order</button>
            </form>
            <div class="response-box"></div>
        </div>
        
        <div class="section">
            <h3>Get Payment History</h3>
            <button onclick="getPaymentHistory()" class="btn btn-primary">Get History</button>
            <div class="response-box"></div>
        </div>
    `;
}

async function getPaymentHistory() {
    try {
        const result = await apiCall('/payment/history', 'GET');
        showToast('History fetched!', 'success');
        displayResponseByButton(result, 'getPaymentHistory');
    } catch (error) { showToast('Error', 'error'); }
}

// SUBSCRIPTION MODULE
function getSubscriptionModule() {
    return `
        <div class="section">
            <h3>Get Subscription Plans</h3>
            <button onclick="getPlans()" class="btn btn-primary">Get Plans</button>
            <div class="response-box"></div>
        </div>
        
        <div class="section">
            <h3>Subscribe to Plan</h3>
            <form onsubmit="handleSubmit(event, '/subscription/subscribe', 'POST')">
                <div class="form-grid">
                    <div class="form-group"><label>Plan ID *</label><input type="number" name="plan_id" required></div>
                    <div class="form-group"><label>Payment Method *</label><input type="text" name="payment_method" value="card" required></div>
                </div>
                <button type="submit" class="btn btn-primary">Subscribe</button>
            </form>
            <div class="response-box"></div>
        </div>
        
        <div class="section">
            <h3>Get Current Subscription</h3>
            <button onclick="getCurrentSubscription()" class="btn btn-primary">Get Subscription</button>
            <div class="response-box"></div>
        </div>
    `;
}

async function getPlans() {
    try {
        const result = await apiCall('/subscription/plans', 'GET');
        showToast('Plans fetched!', 'success');
        displayResponseByButton(result, 'getPlans');
    } catch (error) { showToast('Error', 'error'); }
}

async function getCurrentSubscription() {
    try {
        const result = await apiCall('/subscription/current', 'GET');
        showToast('Subscription fetched!', 'success');
        displayResponseByButton(result, 'getCurrentSubscription');
    } catch (error) { showToast('Error', 'error'); }
}

// TEAM MODULE
function getTeamModule() {
    return `
        <div class="section">
            <h3>Add Team Member</h3>
            <form onsubmit="handleSubmit(event, '/teams/members', 'POST')">
                <div class="form-grid">
                    <div class="form-group"><label>Email *</label><input type="email" name="email" required></div>
                    <div class="form-group"><label>Role *</label><select name="role"><option>editor</option><option>viewer</option><option>admin</option></select></div>
                </div>
                <button type="submit" class="btn btn-primary">Add Member</button>
            </form>
            <div class="response-box"></div>
        </div>
        
        <div class="section">
            <h3>Get Team Members</h3>
            <button onclick="getTeamMembers()" class="btn btn-primary">Get Members</button>
            <div class="response-box"></div>
        </div>
    `;
}

async function getTeamMembers() {
    try {
        const result = await apiCall('/teams/members', 'GET');
        showToast('Members fetched!', 'success');
        displayResponseByButton(result, 'getTeamMembers');
    } catch (error) { showToast('Error', 'error'); }
}

// NOTIFICATION MODULE
function getNotificationModule() {
    return `
        <div class="section">
            <h3>Get Notifications</h3>
            <button onclick="getNotifications()" class="btn btn-primary">Get Notifications</button>
            <div class="response-box"></div>
        </div>
        
        <div class="section">
            <h3>Mark All as Read</h3>
            <button onclick="markAllRead()" class="btn btn-primary">Mark All Read</button>
            <div class="response-box"></div>
        </div>
    `;
}

async function getNotifications() {
    try {
        const result = await apiCall('/notifications', 'GET');
        showToast('Notifications fetched!', 'success');
        displayResponseByButton(result, 'getNotifications');
    } catch (error) { showToast('Error', 'error'); }
}

async function markAllRead() {
    try {
        const result = await apiCall('/notifications/read-all', 'PUT');
        showToast('Marked as read!', 'success');
        displayResponseByButton(result, 'markAllRead');
    } catch (error) { showToast('Error', 'error'); }
}

// WEBHOOK MODULE
function getWebhookModule() {
    return `
        <div class="section">
            <h3>Create Webhook</h3>
            <form onsubmit="handleSubmit(event, '/webhooks', 'POST')">
                <div class="form-grid">
                    <div class="form-group full-width"><label>URL *</label><input type="url" name="url" required></div>
                    <div class="form-group full-width"><label>Events (comma separated) *</label><input type="text" name="events" placeholder="lead.created,booking.confirmed" required></div>
                </div>
                <button type="submit" class="btn btn-primary">Create Webhook</button>
            </form>
            <div class="response-box"></div>
        </div>
        
        <div class="section">
            <h3>Get Webhooks</h3>
            <button onclick="getWebhooks()" class="btn btn-primary">Get Webhooks</button>
            <div class="response-box"></div>
        </div>
    `;
}

async function getWebhooks() {
    try {
        const result = await apiCall('/webhooks', 'GET');
        showToast('Webhooks fetched!', 'success');
        displayResponseByButton(result, 'getWebhooks');
    } catch (error) { showToast('Error', 'error'); }
}

// API KEY MODULE
function getApiKeyModule() {
    return `
        <div class="section">
            <h3>Create API Key</h3>
            <form onsubmit="handleSubmit(event, '/api-keys', 'POST')">
                <div class="form-grid">
                    <div class="form-group"><label>Name *</label><input type="text" name="name" required></div>
                    <div class="form-group"><label>Permissions</label><input type="text" name="permissions" placeholder="read,write"></div>
                </div>
                <button type="submit" class="btn btn-primary">Create API Key</button>
            </form>
            <div class="response-box"></div>
        </div>
        
        <div class="section">
            <h3>Get API Keys</h3>
            <button onclick="getApiKeys()" class="btn btn-primary">Get API Keys</button>
            <div class="response-box"></div>
        </div>
    `;
}

async function getApiKeys() {
    try {
        const result = await apiCall('/api-keys', 'GET');
        showToast('API Keys fetched!', 'success');
        displayResponseByButton(result, 'getApiKeys');
    } catch (error) { showToast('Error', 'error'); }
}

// NFC MODULE
function getNFCModule() {
    return `
        <div class="section">
            <h3>Create NFC Card</h3>
            <form onsubmit="handleSubmit(event, '/nfc/cards', 'POST')">
                <div class="form-grid">
                    <div class="form-group"><label>Profile ID *</label><input type="number" name="profile_id" required></div>
                    <div class="form-group"><label>Card UID *</label><input type="text" name="card_uid" required></div>
                    <div class="form-group"><label>Card Type *</label><input type="text" name="card_type" value="ntag215" required></div>
                </div>
                <button type="submit" class="btn btn-primary">Create NFC Card</button>
            </form>
            <div class="response-box"></div>
        </div>
        
        <div class="section">
            <h3>Get NFC Cards</h3>
            <button onclick="getNFCCards()" class="btn btn-primary">Get NFC Cards</button>
            <div class="response-box"></div>
        </div>
    `;
}

async function getNFCCards() {
    try {
        const result = await apiCall('/nfc/cards', 'GET');
        showToast('NFC Cards fetched!', 'success');
        displayResponseByButton(result, 'getNFCCards');
    } catch (error) { showToast('Error', 'error'); }
}

// BATCH MODULE
function getBatchModule() {
    return `
        <div class="section">
            <h3>Bulk Update Leads</h3>
            <form onsubmit="handleSubmit(event, '/batch/leads/update', 'POST')">
                <div class="form-grid">
                    <div class="form-group full-width"><label>Lead IDs (comma separated) *</label><input type="text" name="lead_ids" required></div>
                    <div class="form-group"><label>Status</label><input type="text" name="status" placeholder="contacted"></div>
                </div>
                <button type="submit" class="btn btn-primary">Bulk Update</button>
            </form>
            <div class="response-box"></div>
        </div>
    `;
}

// EXPORT MODULE
function getExportModule() {
    return `
        <div class="section">
            <h3>Export Leads (CSV)</h3>
            <form onsubmit="exportLeads(event)">
                <div class="form-group"><label>Profile ID *</label><input type="number" name="profile_id" required></div>
                <button type="submit" class="btn btn-primary">Export CSV</button>
            </form>
            <div class="response-box"></div>
        </div>
        
        <div class="section">
            <h3>Export Analytics (CSV)</h3>
            <form onsubmit="exportAnalytics(event)">
                <div class="form-grid">
                    <div class="form-group"><label>Profile ID *</label><input type="number" name="profile_id" required></div>
                    <div class="form-group"><label>Start Date</label><input type="date" name="start_date"></div>
                    <div class="form-group"><label>End Date</label><input type="date" name="end_date"></div>
                </div>
                <button type="submit" class="btn btn-primary">Export CSV</button>
            </form>
            <div class="response-box"></div>
        </div>
    `;
}

async function exportLeads(event) {
    event.preventDefault();
    const profileId = new FormData(event.target).get('profile_id');
    try {
        const result = await apiCall(`/export/leads/csv?profile_id=${profileId}`, 'GET');
        showToast('Export initiated!', 'success');
        event.target.closest('.section').querySelector('.response-box').innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) { showToast('Error', 'error'); }
}

async function exportAnalytics(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const params = new URLSearchParams(formData).toString();
    try {
        const result = await apiCall(`/export/analytics/csv?${params}`, 'GET');
        showToast('Export initiated!', 'success');
        event.target.closest('.section').querySelector('.response-box').innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) { showToast('Error', 'error'); }
}

// Add CSS for tab content
const style = document.createElement('style');
style.textContent = `
    .tab-content { display: none; }
    .tab-content.active { display: block; }
`;
document.head.appendChild(style);

console.log('🎴 TAPONN Admin Panel Loaded - All 19 Modules Ready!');
