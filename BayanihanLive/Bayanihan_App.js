/**
 * BayanihanLive - Bayanihan_App.js
 * --------------------------
 * This global script manages all local data storage and dynamic content updates
 * for the website using the browser's localStorage.
 *
 * It handles:
 * - Data Seeding (for first-time use)
 * - User Authentication (Login, Signup, Logout)
 * - Session Management
 * - Data Models
 * - Dynamic content rendering
 * - NEW: Notification System
 */

// --- CORE DATA MANAGEMENT ---
const DB = {
    get: (key) => {
        const data = localStorage.getItem(key);
        try {
            if (data === null) { return null; }
            return JSON.parse(data);
        } catch (e) {
            console.error(`Error parsing localStorage item "${key}":`, e);
            return null;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) { // <-- FIXED: Added curly braces
            console.error(`Error setting localStorage item "${key}":`, e);
        }
    },
    remove: (key) => {
        localStorage.removeItem(key);
    }
};

// --- DATA SEEDING ---
const Seed = {
    init: () => {
        if (!DB.get('users')) {
            console.log("Seeding initial user data into localStorage...");
            DB.set('users', [
                {
                    username: 'admin',
                    email: 'admin@bayanihan.com',
                    password: 'password', 
                    role: 'admin',
                    donations: [],
                },
                {
                    username: 'juan_delacruz',
                    email: 'juan@example.com',
                    password: 'password',
                    role: 'user',
                    donations: [
                        { id: 'DON-1001', amount: 500, date: '2025-06-15', method: 'GCash', foundation: 'Philippine Red Cross' },
                        { id: 'DON-1002', amount: 1000, date: '2025-07-01', method: 'GCash', foundation: 'GMA Kapuso Foundation' }
                    ],
                }
            ]);
        }
        if (!DB.get('donations')) {
            DB.set('donations', [
                { id: 'DON-1001', amount: 500, method: 'GCash', name: 'Juan Dela Cruz', email: 'juan@example.com', date: '2025-06-15', foundation: 'Philippine Red Cross' },
                { id: 'DON-1002', amount: 1000, method: 'GCash', name: 'Maria Santos', email: 'maria.santos@email.com', date: '2025-06-20', foundation: 'GMA Kapuso Foundation' },
                { id: 'DON-1003', amount: 250, method: 'GCash', name: 'Juan Dela Cruz', email: 'juan@example.com', date: '2025-07-01', foundation: 'Philippine Red Cross' }
            ]);
        }
        // NEW: Seed mock notifications
        if (!DB.get('notifications')) {
            console.log("Seeding initial notifications...");
            DB.set('notifications', [
                { id: 1, text: "PAGASA: New weather bulletin issued for Masbate.", date: "2h ago", read: false },
                { id: 2, text: "GMA Kapuso Foundation has posted a new report.", date: "5h ago", read: false },
                { id: 3, text: "Welcome to BayanihanLive!", date: "1d ago", read: true }
            ]);
        }
    }
};

// --- SESSION & UI MANAGEMENT ---
const Session = {
    
    login: (email, password) => {
        const users = DB.get('users') || [];
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            console.log('Login successful:', user.username);
            DB.set('currentUser', user);
            window.location.href = 'Bayanihan_Dashboard.html'; // <-- FIXED: Updated link
            return { success: true, user: user };
        } else {
            console.warn('Login failed: Invalid credentials');
            return { success: false, message: 'Invalid email or password.' };
        }
    },

    signup: (username, email, password) => {
        let users = DB.get('users') || [];
        const userExists = users.some(u => u.email === email || u.username === username);
        if (userExists) {
            console.warn('Signup failed: User already exists');
            return { success: false, message: 'A user with this email or username already exists.' };
        }
        const newUser = {
            id: `U-${Date.now()}`,
            username: username,
            email: email,
            password: password, 
            role: 'user',
            donations: []
        };
        users.push(newUser);
        DB.set('users', users);
        DB.set('currentUser', newUser);
        console.log('Signup successful:', newUser.username);
        window.location.href = 'Bayanihan_Dashboard.html'; // <-- FIXED: Updated link
        return { success: true, user: newUser };
    },

    logout: (e) => {
        if (e) e.preventDefault();
        DB.remove('currentUser');
        console.log('You have been logged out.');
        window.location.href = 'Bayanihan_Login.html'; // <-- FIXED: Updated link
    },

    getCurrentUser: () => {
        return DB.get('currentUser');
    },

    init: () => {
        const currentUser = Session.getCurrentUser();
        const mainNavList = document.querySelector('.main-nav ul');

        if (mainNavList) {
            // Clear existing auth links
            let lastItem = mainNavList.querySelector('li:last-of-type');
            while(lastItem && (lastItem.innerText.includes('Login') || lastItem.innerText.includes('Profile') || lastItem.innerText.includes('Logout'))) {
                lastItem.remove();
                lastItem = mainNavList.querySelector('li:last-of-type');
            }

            if (currentUser) {
                // User is LOGGED IN
                const profileLi = document.createElement('li');
                profileLi.innerHTML = `<a href="Bayanihan_Profile.html">${currentUser.username} (Profile)</a>`; // <-- FIXED: Updated link
                mainNavList.appendChild(profileLi);

                const logoutLi = document.createElement('li');
                logoutLi.innerHTML = `<a href="#" id="logoutButton">Logout</a>`;
                mainNavList.appendChild(logoutLi);
                
                logoutLi.querySelector('#logoutButton').addEventListener('click', Session.logout);
                
            } else {
                // User is LOGGED OUT
                const loginLi = document.createElement('li');
                loginLi.innerHTML = `<a href="Bayanihan_Login.html">Login</a>`; // <-- FIXED: Updated link
                mainNavList.appendChild(loginLi);
            }
        }
    },
};

// --- NEW: NOTIFICATION SYSTEM ---
const Notifications = {
    init: () => {
        const bell = document.getElementById('notificationBell');
        const panel = document.getElementById('notificationPanel');
        const countBadge = document.getElementById('notificationCount');
        const list = document.getElementById('notificationList');

        if (!bell || !panel || !countBadge || !list) {
            console.warn('Notification elements not found. Skipping init.');
            return;
        }
        
        const notifications = DB.get('notifications') || [];
        const unreadCount = notifications.filter(n => !n.read).length;

        // Update count badge
        if (unreadCount > 0) {
            countBadge.textContent = unreadCount;
            countBadge.classList.remove('hidden');
        } else {
            countBadge.classList.add('hidden');
        }

        // Populate list
        list.innerHTML = ''; // Clear list
        if (notifications.length === 0) {
            list.innerHTML = '<div class="notification-item"><p>No new notifications.</p></div>';
        } else {
            notifications.forEach(n => {
                const item = document.createElement('div');
                item.className = 'notification-item';
                item.innerHTML = `
                    <p>${n.text}</p>
                    <small>${n.date}</small>
                `;
                list.appendChild(item);
            });
        }
        
        // Toggle panel
        bell.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent document click from firing
            panel.classList.toggle('show');
            
            // Mark all as read when opened (simple approach)
            if (panel.classList.contains('show')) {
                Notifications.markAllAsRead();
                countBadge.classList.add('hidden');
            }
        });

        // Hide panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && e.target !== bell) {
                panel.classList.remove('show');
            }
        });
    },

    markAllAsRead: () => {
        let notifications = DB.get('notifications') || [];
        notifications.forEach(n => n.read = true);
        DB.set('notifications', notifications);
        console.log("Notifications marked as read.");
    }
};

// --- GLOBAL INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    Seed.init();
    Session.init();
    Notifications.init(); // Initialize the notification system
});

