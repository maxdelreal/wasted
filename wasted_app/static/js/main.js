// Global state
let wasteEntries = [];
let currentTab = 'track';

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Waste Tracker App initialized');
    
    updateDateDisplay();
    loadWasteEntries();
    renderTodayWaste();
    renderAllWaste();
    updateAddButton();
    
    // Add input event listener for real-time validation
    const wasteInput = document.getElementById('wasteInput');
    if (wasteInput) {
        wasteInput.addEventListener('input', updateAddButton);
        wasteInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const form = e.target.closest('form');
                if (form) {
                    addWaste(e);
                }
            }
        });
    }
});

/**
 * Switch between tabs (Today's Activity and Overview)
 */
function switchTab(tab) {
    const trackTab = document.getElementById('trackTab');
    const overviewTab = document.getElementById('overviewTab');
    const tabButtons = document.querySelectorAll('.tab-button');
    
    if (!trackTab || !overviewTab) {
        console.error('Tab elements not found');
        return;
    }
    
    // Update tab buttons
    tabButtons.forEach((button, index) => {
        if ((tab === 'track' && index === 0) || (tab === 'overview' && index === 1)) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Show/hide content
    if (tab === 'track') {
        trackTab.classList.remove('hidden');
        overviewTab.classList.add('hidden');
    } else {
        trackTab.classList.add('hidden');
        overviewTab.classList.remove('hidden');
        renderAllWaste(); // Refresh the overview when switching
    }
    
    currentTab = tab;
}

/**
 * Update the date display
 */
function updateDateDisplay() {
    const dateElement = document.getElementById('dateDisplay');
    if (!dateElement) return;
    
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    
    const dayName = days[today.getDay()];
    const month = months[today.getMonth()];
    const day = today.getDate().toString().padStart(2, '0');
    const year = today.getFullYear().toString().slice(-2);
    
    dateElement.textContent = `Today is ${dayName} ${month}/${day}/${year}`;
}

/**
 * Add a new waste item
 */
 async function addWaste(event) {
    event.preventDefault();
    
    const input = document.getElementById('wasteInput');
    if (!input) {
        console.error('Waste input not found');
        return;
    }
    
    const wasteItem = input.value.trim();
    
    if (!wasteItem) {
        showAlert('Please enter a waste item', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/waste', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ item: wasteItem })
        });
        
        if (!response.ok) {
            throw new Error('Failed to add waste item');
        }
        
        const newEntry = await response.json();
        
        // Add to local array and re-render
        wasteEntries.push(newEntry);
        input.value = '';
        
        renderTodayWaste();
        updateAddButton();
        
        showAlert(`Added "${newEntry.item}" to your waste list`, 'success');
        
        console.log('Added waste item:', newEntry);
        
    } catch (error) {
        console.error('Error adding waste:', error);
        showAlert('Failed to add waste item', 'error');
    }
}

/**
 * Delete a waste entry
 */
function deleteWaste(id) {
    const entryToDelete = wasteEntries.find(entry => entry.id === id);
    
    if (!entryToDelete) {
        console.error('Entry not found:', id);
        return;
    }
    
    
        wasteEntries = wasteEntries.filter(entry => entry.id !== id);
        renderTodayWaste();
        renderAllWaste();
        
        showAlert('Entry deleted successfully', 'success');
        
        console.log('Deleted waste item:', entryToDelete);
    
}

/**
 * Render today's waste items
 */
function renderTodayWaste() {
    const container = document.getElementById('todayWasteList');
    if (!container) {
        console.error('Today waste list container not found');
        return;
    }
    
    const today = new Date();
    const todayString = today.toLocaleDateString();
    const todayStringPadded = today.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });

    //check both formats for safety
    const todayEntries = wasteEntries.filter(entry => 
        entry.date === todayString || entry.date === todayStringPadded
    );
    
    if (todayEntries.length === 0) {
        container.innerHTML = '<div class="empty-state">NO WASTE TRACKED TODAY</div>';
        return;
    }
    
    const sortedEntries = todayEntries.sort((a, b) => b.timestamp - a.timestamp);
    
    container.innerHTML = sortedEntries.map(entry => `
        <div class="waste-item">
            <span class="waste-item-text">${escapeHtml(entry.item)}</span>
            <button class="btn btn-danger" onclick="deleteWaste('${entry.id}')" title="Delete ${escapeHtml(entry.item)}">
                <span class="icon-minus"></span>
            </button>
        </div>
    `).join('');
}

/**
 * Render all waste entries in overview
 */
function renderAllWaste() {
    const container = document.getElementById('allWasteList');
    const statsContainer = document.getElementById('totalStats');
    
    if (!container || !statsContainer) {
        console.error('Overview containers not found');
        return;
    }
    
    statsContainer.textContent = `TOTAL ENTRIES: ${wasteEntries.length}`;
    
    if (wasteEntries.length === 0) {
        container.innerHTML = '<div class="empty-state">No waste entries yet</div>';
        return;
    }
    
    const sortedEntries = [...wasteEntries].sort((a, b) => b.timestamp - a.timestamp);
    
    container.innerHTML = sortedEntries.map(entry => `
        <div class="waste-item">
            <div>
                <div class="waste-item-text">${escapeHtml(entry.item)}</div>
                <div class="waste-item-date">${escapeHtml(entry.date)}</div>
            </div>
            <button class="btn btn-danger btn-sm" onclick="deleteWaste('${entry.id}')" title="Delete ${escapeHtml(entry.item)}">
                <span class="icon-trash"></span>
            </button>
        </div>
    `).join('');
}

/**
 * Update the state of the add button based on input
 */
function updateAddButton() {
    const input = document.getElementById('wasteInput');
    const button = document.getElementById('addButton');
    
    if (!input || !button) return;
    
    if (input.value.trim()) {
        button.disabled = false;
    } else {
        button.disabled = true;
    }
}

/**
 * Show alert messages (can be replaced with a more sophisticated notification system)
 */
function showAlert(message, type = 'info') {
    
    // Alternative: You could create a custom notification div
     const notification = document.createElement('div');
     notification.className = `notification notification-${type}`;
     notification.textContent = message;
     
     // Find existing notifications to stack properly
    const existingNotifications = document.querySelectorAll('.notification');
    let bottomOffset = 20; // Base offset from bottom
    
    // Calculate position based on existing notifications (FIFO - newest at bottom)
    existingNotifications.forEach(existing => {
        const existingHeight = existing.offsetHeight || 60; // fallback height
        const marginBetween = 10;
        bottomOffset += existingHeight + marginBetween;
    });
    
    // Set the position
    notification.style.bottom = `${bottomOffset}px`;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after 3 seconds and adjust other notifications
    setTimeout(() => {
        if (notification.parentNode) {
            const notificationHeight = notification.offsetHeight;
            
            // Remove the notification
            notification.remove();
            
            // Move all remaining notifications down
            const remainingNotifications = document.querySelectorAll('.notification');
            remainingNotifications.forEach(remaining => {
                const currentBottom = parseInt(remaining.style.bottom);
                if (currentBottom > bottomOffset) {
                    remaining.style.bottom = `${currentBottom - notificationHeight - 10}px`;
                }
            });
        }
    }, 3000);
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

/**
 * Get today's entries (utility function)
 */
function getTodayEntries() {
    const today = new Date().toLocaleDateString();
    return wasteEntries.filter(entry => entry.date === today);
}

/**
 * Get entries by date (utility function)
 */
function getEntriesByDate(date) {
    return wasteEntries.filter(entry => entry.date === date);
}

/**
 * Clear all entries (utility function - could be used for a "clear all" button)
 */
function clearAllEntries() {
    if (confirm('Are you sure you want to delete all waste entries? This cannot be undone.')) {
        wasteEntries = [];
        renderTodayWaste();
        renderAllWaste();
        showAlert('All entries cleared', 'success');
        console.log('All entries cleared');
    }
}

// Export functions for potential use in other scripts or testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        switchTab,
        addWaste,
        deleteWaste,
        updateDateDisplay,
        renderTodayWaste,
        renderAllWaste,
        getTodayEntries,
        getEntriesByDate,
        clearAllEntries
    };
}

// sep 30 function to load waste entries from the server 

/**
 * Load waste entries from the server
 */
 async function loadWasteEntries() {
    try {
        const response = await fetch('/api/waste');
        
        if (!response.ok) {
            throw new Error('Failed to load waste entries');
        }
        
        wasteEntries = await response.json();
        
        renderTodayWaste();
        renderAllWaste();
        
        console.log('Loaded waste entries:', wasteEntries.length);
        
    } catch (error) {
        console.error('Error loading waste entries:', error);
        showAlert('Failed to load waste entries', 'error');
    }
}

