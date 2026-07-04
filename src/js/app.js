/**
 * EZ Beats & Bites Menu App
 * Handles dynamic data fetching from Google Sheets and UI filtering.
 */

// IMPORTANT: Replace this URL with your Google Sheet published CSV link!
// To get this: File > Share > Publish to web > Link > Entire Document > Comma-separated values (.csv)
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTHXs_TK_VSVLE0ltlae277ePtdORknnAuivh-GuPHcOUX3NS92edFO8-3xGlliEQve_k0N-MAA-DI/pub?output=csv'; // e.g. 'https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv'

// Fallback data is now empty so it doesn't show fake items when Google Sheets fails
const FALLBACK_DATA = [];

let menuItems = [];
let myOrderList = []; // Interactive Wishlist state

// Robust CSV Parser
function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    
    // Function to parse a single CSV line into fields, keeping empty values and stripping quotes
    const parseCSVLine = (line) => {
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        fields.push(currentField.trim());
        return fields;
    };
    
    const headers = parseCSVLine(lines[0]);
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;
        
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            // Assign the parsed value or an empty string if missing
            obj[headers[j]] = values[j] !== undefined ? values[j] : '';
        }
        result.push(obj);
    }
    return result;
}

// Fetch menu data with LocalStorage caching (5 minutes expiry) and CDN-friendly cache busting
async function fetchMenu() {
    const CACHE_KEY = 'ez_beats_menu_data';
    const CACHE_TIME_KEY = 'ez_beats_menu_timestamp';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

    try {
        if (!GOOGLE_SHEETS_CSV_URL) {
            console.log("No Google Sheets URL provided, using fallback data.");
            // Simulate network delay for loading effect
            await new Promise(r => setTimeout(r, 1000));
            return FALLBACK_DATA;
        }

        // Check if fresh cache exists
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(CACHE_TIME_KEY);
        const now = Date.now();

        if (cachedData && cachedTimestamp && (now - cachedTimestamp < CACHE_DURATION)) {
            console.log("Loading menu from local cache...");
            return JSON.parse(cachedData);
        }
        
        // Use a 5-minute cache bucket for the URL parameter to allow Vercel/Google CDN edge caching
        const timeBucket = Math.floor(now / CACHE_DURATION);
        const fetchUrl = `${GOOGLE_SHEETS_CSV_URL}&_t=${timeBucket}`;
        
        console.log("Fetching fresh menu data from Google Sheets...");
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error("Network response was not ok");
        const csvText = await response.text();
        const parsedData = parseCSV(csvText);

        // Update local cache
        if (parsedData && parsedData.length > 0) {
            localStorage.setItem(CACHE_KEY, JSON.stringify(parsedData));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());
        }

        return parsedData;
    } catch (error) {
        console.error("Error fetching menu, checking fallback or cache:", error);
        // Fallback to expired cache if network fails, otherwise use hardcoded fallback
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            console.log("Using expired cache as emergency fallback.");
            return JSON.parse(cachedData);
        }
        return FALLBACK_DATA;
    }
}

let currentFilteredItems = [];
const INITIAL_LIMIT = 6;
let currentLimit = INITIAL_LIMIT;

// Render Menu Cards with dynamic limits (Show More)
function renderMenu(items, showAll = false) {
    const container = document.getElementById('menu-container');
    
    // Store current state for "Show More" functionality
    currentFilteredItems = items;
    
    if (items.length === 0) {
        const activeFilter = document.querySelector('#category-filters button.active');
        const isAllCategory = !activeFilter || activeFilter.getAttribute('data-category') === 'All';

        if (isAllCategory && menuItems.length === 0) {
             container.innerHTML = `
                <div class="col-span-full text-center py-10 px-4 bg-white rounded-3xl border border-brand-border shadow-sm">
                    <div class="text-5xl mb-4 animate-bounce">😢</div>
                    <h3 class="font-serif text-2xl font-bold text-brand-green mb-2">Oops! Menu is taking a break</h3>
                    <p class="text-brand-muted text-sm sm:text-base max-w-md mx-auto mb-6">Hindi namin ma-load ang menu ngayon (maybe connection issue). But don't worry, you can still order!</p>
                    <a href="https://m.me/ezbitesandbitesbytheyard" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-brand-green text-brand-cream font-semibold py-3 px-6 rounded-full hover:bg-brand-green/90 transition-all duration-300">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.145 2 11.26c0 2.92 1.5 5.518 3.86 7.234v3.506l3.525-1.933c.84.233 1.724.36 2.615.36 5.523 0 10-4.145 10-9.26S17.523 2 12 2zm1.182 12.35l-2.617-2.793-5.093 2.793 5.59-5.94 2.64 2.793 5.068-2.793-5.588 5.94z"/></svg>
                        Message Us on FB
                    </a>
                </div>
             `;
        } else {
            container.innerHTML = `
                <div class="col-span-full text-center py-16 px-4 bg-white/50 backdrop-blur-sm rounded-3xl border border-brand-border border-dashed shadow-sm animate-fade-in">
                    <div class="text-5xl mb-4 opacity-70">🔍</div>
                    <h3 class="font-serif text-xl sm:text-2xl font-bold text-brand-green mb-2">Walang nahanap</h3>
                    <p class="text-brand-muted text-sm sm:text-base max-w-md mx-auto mb-6">We couldn't find any items matching your search or category filter.</p>
                    <button onclick="document.getElementById('menu-search').value = ''; document.querySelector('[data-category=\\'All\\']').click();" class="inline-flex items-center justify-center bg-brand-gold text-brand-green font-semibold py-2.5 px-6 rounded-full hover:bg-brand-gold-light transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1">
                        Clear Filters
                    </button>
                </div>
            `;
        }
        
        const loadMoreContainer = document.getElementById('load-more-container');
        if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
        return;
    }

    // Limit elements to display
    const itemsToRender = showAll ? items : items.slice(0, currentLimit);

    // Check if we can update the existing cards in place to prevent animation re-triggers and flashing
    const existingCards = container.querySelectorAll('.menu-card:not(.animate-pulse)');
    if (existingCards.length === itemsToRender.length) {
        existingCards.forEach((card, index) => {
            const item = itemsToRender[index];
            
            // Update image
            const img = card.querySelector('img');
            if (img && img.src !== item.ImageURL) {
                img.src = item.ImageURL || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1500&auto=format&fit=crop';
                img.alt = item.Name;
            }
            
            // Update price
            const priceEl = card.querySelector('.menu-price');
            if (priceEl && priceEl.textContent.trim() !== `₱${item.Price}`) {
                priceEl.textContent = `₱${item.Price}`;
            }
            
            // Update category
            const catEl = card.querySelector('.menu-category');
            if (catEl && catEl.textContent.trim() !== item.Category) {
                catEl.textContent = item.Category;
            }
            
            // Update name
            const nameEl = card.querySelector('.menu-name');
            if (nameEl && nameEl.textContent.trim() !== item.Name) {
                nameEl.textContent = item.Name;
            }
            
            // Update description
            const descEl = card.querySelector('.menu-desc');
            if (descEl && descEl.textContent.trim() !== item.Description) {
                descEl.textContent = item.Description;
            }
        });
    } else {
        // Rebuild elements if length changed or we had skeleton loaders
        container.innerHTML = '';
        itemsToRender.forEach((item, index) => {
            const delay = (index % 3) * 100; // Staggered animation
            
            const cardHTML = `
                <div class="menu-card group cursor-pointer" data-aos="fade-up" data-aos-delay="${delay}">
                    <div class="h-44 sm:h-56 w-full overflow-hidden relative bg-brand-border/30">
                        <img src="${item.ImageURL || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1500&auto=format&fit=crop'}" 
                             alt="${item.Name}" 
                             class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                             loading="lazy">
                        <div class="menu-price absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 backdrop-blur-sm text-brand-green font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-md border border-brand-border text-sm sm:text-base">
                            ₱${item.Price}
                        </div>
                        <div class="menu-category absolute top-3 left-3 sm:top-4 sm:left-4 bg-brand-cream text-brand-green text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full shadow-sm uppercase tracking-wide opacity-90">
                            ${item.Category}
                        </div>
                    </div>
                    <div class="p-5 sm:p-8 flex flex-col grow">
                        <h3 class="menu-name text-lg sm:text-2xl font-serif font-bold text-brand-green mb-2 sm:mb-3">${item.Name}</h3>
                        <p class="menu-desc text-brand-muted text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed line-clamp-2 sm:line-clamp-3">${item.Description}</p>
                        <div class="mt-auto pt-2">
                            <button onclick="toggleOrderItem('${escapeHTML(item.Name)}', ${item.Price})" class="order-toggle-btn w-full py-2.5 sm:py-3 rounded-full border-2 font-medium transition-all duration-300 transform shadow-sm hover:shadow-md" data-item="${escapeHTML(item.Name)}">
                                <!-- JS will inject Add/Remove text and styles here based on state -->
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', cardHTML);
        });
        
        // Refresh AOS animations for the newly rendered cards
        if (window.AOS) {
            setTimeout(() => AOS.refresh(), 50);
        }
    }

    // Check if there are more items to display
    const loadMoreContainer = document.getElementById('load-more-container');
    if (loadMoreContainer) {
        if (items.length > itemsToRender.length) {
            loadMoreContainer.classList.remove('hidden');
        } else {
            loadMoreContainer.classList.add('hidden');
        }
    }
    
    // Update button states immediately after rendering
    updateMenuButtonsUI();
}

// Helper to escape HTML to prevent XSS in template literals
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Category Emoji Map for visual appeal
const CATEGORY_EMOJIS = {
    'all': '✨',
    'bites': '🍔',
    'drinks': '🍻',
    'specials': '⭐',
    'dessert': '🍰',
    'desserts': '🍰',
    'main': '🍽️',
    'mains': '🍽️',
    'snack': '🍿',
    'snacks': '🍿'
};

// Dynamically Render Category Filter Buttons based on Google Sheets data
function renderCategoryFilters(items) {
    const container = document.getElementById('category-filters');
    if (!container) return;
    
    // Keep the "All" button and clear others
    const allBtn = container.querySelector('[data-category="All"]');
    container.innerHTML = '';
    if (allBtn) {
        container.appendChild(allBtn);
    } else {
        container.insertAdjacentHTML('beforeend', `<button data-category="All" class="filter-btn active px-5 sm:px-7 py-2.5 sm:py-3 rounded-full font-medium text-xs sm:text-sm tracking-wide uppercase transition-all duration-300 whitespace-nowrap shrink-0">All</button>`);
    }
    
    // Get unique categories from items (filter out empty entries and 'All')
    const rawCategories = items.map(item => item.Category).filter(cat => cat && cat.trim() !== '' && cat.toLowerCase() !== 'all');
    const uniqueCategories = [...new Set(rawCategories)];
    
    uniqueCategories.forEach(category => {
        const lowerCategory = category.toLowerCase();
        const emoji = CATEGORY_EMOJIS[lowerCategory] || '✨';
        const label = `${emoji} ${category}`;
        
        const buttonHTML = `
            <button data-category="${category}" class="filter-btn bg-white text-brand-muted border border-brand-border hover:border-brand-green hover:text-brand-green px-5 sm:px-7 py-2.5 sm:py-3 rounded-full font-medium text-xs sm:text-sm tracking-wide uppercase transition-all duration-300 whitespace-nowrap shrink-0">
                ${label}
            </button>
        `;
        container.insertAdjacentHTML('beforeend', buttonHTML);
    });
    
    setupFilters();
}

// Filter Logic
function setupFilters() {
    const filterButtons = document.querySelectorAll('#category-filters button');
    const searchInput = document.getElementById('menu-search');
    
    function applyFilters() {
        currentLimit = INITIAL_LIMIT; // Reset pagination limit on filter change
        const activeBtn = document.querySelector('#category-filters button.active');
        const category = activeBtn ? activeBtn.getAttribute('data-category') : 'All';
        const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        let filtered = menuItems;
        
        // 1. Apply category filter
        if (category !== 'All') {
            filtered = filtered.filter(item => item.Category.toLowerCase() === category.toLowerCase());
        }
        
        // 2. Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(item => {
                const searchStr = `${item.Name} ${item.Description} ${item.Category}`.toLowerCase();
                return searchStr.includes(searchQuery);
            });
        }
        
        renderMenu(filtered);
        
        // Re-trigger AOS animations
        if (window.AOS) {
            setTimeout(() => AOS.refresh(), 100);
        }
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state of buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            applyFilters();
        });
    });
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyFilters();
        });
    }
}

// Skeleton Loader
function renderSkeletons() {
    const container = document.getElementById('menu-container');
    container.innerHTML = '';
    for(let i=0; i<6; i++) {
        container.insertAdjacentHTML('beforeend', `
            <div class="menu-card animate-pulse">
                <div class="h-44 sm:h-56 w-full bg-brand-border/40"></div>
                <div class="p-5 sm:p-8">
                    <div class="h-6 sm:h-8 bg-brand-border/40 rounded w-3/4 mb-3 sm:mb-4"></div>
                    <div class="h-3 sm:h-4 bg-brand-border/40 rounded w-full mb-2"></div>
                    <div class="h-3 sm:h-4 bg-brand-border/40 rounded w-5/6 mb-4 sm:mb-6"></div>
                    <div class="h-10 sm:h-12 bg-brand-border/40 rounded-full w-full"></div>
                </div>
            </div>
        `);
    }
}

// Filter out inactive items (defaults to active if Status is empty or doesn't exist)
function processRawItems(rawItems) {
    return rawItems.filter(item => {
        if (!item.Status || item.Status.trim() === '') return true;
        const status = item.Status.trim().toLowerCase();
        return status !== 'inactive' && status !== 'false' && status !== '0' && status !== 'no';
    });
}

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Try to load from localStorage cache immediately (even if expired) for instant render
    const cachedDataStr = localStorage.getItem('ez_beats_menu_data');
    let initialRawData = FALLBACK_DATA;
    let isUsingFallback = true;
    
    if (cachedDataStr) {
        try {
            const parsed = JSON.parse(cachedDataStr);
            if (Array.isArray(parsed) && parsed.length > 0) {
                initialRawData = parsed;
                isUsingFallback = false;
                console.log("Instant load: Using cached menu data.");
            }
        } catch (e) {
            console.error("Failed to parse cached menu data:", e);
        }
    }
    
    if (isUsingFallback) {
        console.log("Instant load: Using fallback menu data.");
        // If there's no cache, show skeletons first so user knows something is loading
        renderSkeletons();
    }
    
    // Process and store initial items
    menuItems = processRawItems(initialRawData);
    
    // Render Filters and Menu dynamically from cache/fallback instantly
    renderCategoryFilters(menuItems);
    renderMenu(menuItems);
    
    // Setup Show More click action
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentLimit = currentFilteredItems.length; // Expand limit to display all remaining items
            renderMenu(currentFilteredItems, true);
        });
    }
    
    // 2. Fetch fresh data in the background (SWR pattern)
    try {
        console.log("SWR: Fetching fresh data in background...");
        const rawItems = await fetchMenu();
        const freshItems = processRawItems(rawItems);
        
        // Only re-render if data has actually changed to prevent UI flicker
        const currentDataStr = JSON.stringify(menuItems);
        const freshDataStr = JSON.stringify(freshItems);
        
        if (currentDataStr !== freshDataStr) {
            console.log("SWR: Menu data updated, re-rendering...");
            
            // Keep track of previously selected category
            const activeBtn = document.querySelector('#category-filters button.active');
            const prevCategory = activeBtn ? activeBtn.getAttribute('data-category') : 'All';
            
            menuItems = freshItems;
            
            // Re-render filters with fresh data
            renderCategoryFilters(menuItems);
            
            // Restore active category filter
            const filterButtons = document.querySelectorAll('#category-filters button');
            let matchedBtn = null;
            filterButtons.forEach(btn => {
                const cat = btn.getAttribute('data-category');
                if (cat === prevCategory) {
                    matchedBtn = btn;
                }
            });
            
            if (matchedBtn) {
                filterButtons.forEach(b => b.classList.remove('active'));
                matchedBtn.classList.add('active');
                
                if (prevCategory === 'All') {
                    renderMenu(menuItems);
                } else {
                    const filtered = menuItems.filter(item => item.Category.toLowerCase() === prevCategory.toLowerCase());
                    renderMenu(filtered);
                }
            } else {
                // Default back to All if the category no longer exists
                renderMenu(menuItems);
            }
            
            // Re-apply search filter if there's any text in search
            const searchInput = document.getElementById('menu-search');
            if(searchInput && searchInput.value.trim() !== '') {
                searchInput.dispatchEvent(new Event('input'));
            }
        } else {
            console.log("SWR: Menu data is identical to cache. No re-render needed.");
        }
    } catch (err) {
        console.error("SWR: Background fetch failed:", err);
    }
});

// ========================================
// IMAGE MODAL (Lightbox) logic
// ========================================
const imageModal = document.getElementById('image-modal');
const imageModalImg = document.getElementById('image-modal-img');
const imageModalCaption = document.getElementById('image-modal-caption');
const imageModalClose = document.getElementById('image-modal-close');

function openImageModal(src, alt) {
    if (!imageModal || !imageModalImg) return;
    imageModalImg.src = src;
    if (imageModalCaption) imageModalCaption.textContent = alt || '';
    imageModal.classList.remove('opacity-0', 'pointer-events-none');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
}

function closeImageModal() {
    if (!imageModal) return;
    imageModal.classList.add('opacity-0', 'pointer-events-none');
    document.body.style.overflow = ''; // Restore scroll
}

// Attach image preview click listeners using event delegation
const menuContainerEl = document.getElementById('menu-container');
if (menuContainerEl) {
    menuContainerEl.addEventListener('click', (e) => {
        // Only trigger when clicking directly on an img element inside a menu card
        if (e.target.tagName === 'IMG' && e.target.closest('.menu-card')) {
            openImageModal(e.target.src, e.target.alt);
        }
    });
}

// Close events
if (imageModalClose) {
    imageModalClose.addEventListener('click', closeImageModal);
}
if (imageModal) {
    imageModal.addEventListener('click', (e) => {
        // Close if click is outside the image container (i.e. on the backdrop)
        if (e.target === imageModal) {
            closeImageModal();
        }
    });
}

// Close on Escape key press
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeImageModal();
        closeOrderList();
    }
});

// ========================================
// MY ORDER LIST (Wishlist) LOGIC
// ========================================

const ORDER_CACHE_KEY = 'ez_beats_my_list';
const orderFab = document.getElementById('order-list-fab');
const orderBadge = document.getElementById('order-list-badge');
const orderModal = document.getElementById('order-list-modal');
const orderDrawer = document.getElementById('order-list-drawer');
const orderCloseBtn = document.getElementById('order-list-close');
const orderItemsContainer = document.getElementById('order-list-items');
const orderTotalEl = document.getElementById('order-list-total');
const orderClearBtn = document.getElementById('order-list-clear');

function loadOrderList() {
    try {
        const saved = localStorage.getItem(ORDER_CACHE_KEY);
        if (saved) {
            myOrderList = JSON.parse(saved);
        }
    } catch (e) {
        console.error("Failed to load order list", e);
    }
    updateOrderUI();
}

function saveOrderList() {
    localStorage.setItem(ORDER_CACHE_KEY, JSON.stringify(myOrderList));
    updateOrderUI();
}

function toggleOrderItem(name, price) {
    const existingIndex = myOrderList.findIndex(item => item.name === name);
    
    if (existingIndex >= 0) {
        // Remove item
        myOrderList.splice(existingIndex, 1);
    } else {
        // Add item (Qty defaults to 1)
        myOrderList.push({ name, price: parseFloat(price), qty: 1 });
    }
    
    saveOrderList();
}

function updateOrderItemQty(name, delta) {
    const item = myOrderList.find(i => i.name === name);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            // Remove if qty drops to 0
            myOrderList = myOrderList.filter(i => i.name !== name);
        }
        saveOrderList();
    }
}

// Master UI Update function for the entire Order List feature
function updateOrderUI() {
    // 1. Update FAB badge & visibility
    const totalItems = myOrderList.reduce((sum, item) => sum + item.qty, 0);
    if (orderBadge) orderBadge.textContent = totalItems;
    
    if (orderFab) {
        if (totalItems > 0) {
            orderFab.classList.remove('hidden');
            orderFab.classList.add('flex');
        } else {
            orderFab.classList.add('hidden');
            orderFab.classList.remove('flex');
            // If modal is open and list becomes empty, close it cleanly
            if (orderModal && !orderModal.classList.contains('opacity-0')) {
                closeOrderList();
            }
        }
    }

    // 2. Update Menu Buttons (Add/Remove states)
    updateMenuButtonsUI();
    
    // 3. Update Modal Contents
    renderOrderListItems();
}

// Update the styling and text of the buttons inside the menu grid
function updateMenuButtonsUI() {
    const buttons = document.querySelectorAll('.order-toggle-btn');
    buttons.forEach(btn => {
        const itemName = btn.getAttribute('data-item');
        const isInList = myOrderList.some(i => i.name === itemName);
        
        if (isInList) {
            btn.innerHTML = `
                <span class="flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    Added to List
                </span>
            `;
            btn.className = "order-toggle-btn w-full py-2.5 sm:py-3 rounded-full border-2 font-medium transition-all duration-300 transform shadow-sm border-brand-gold bg-brand-gold/10 text-brand-green hover:bg-red-50 hover:border-red-500/30 hover:text-red-600";
            // Optional: change text to 'Remove' on hover via CSS/JS, but standard 'Added' state is fine.
        } else {
            btn.innerHTML = `Add to List`;
            btn.className = "order-toggle-btn w-full py-2.5 sm:py-3 rounded-full border-2 font-medium transition-all duration-300 transform shadow-sm border-brand-green text-brand-green hover:bg-brand-green hover:text-white hover:shadow-md";
        }
    });
}

function renderOrderListItems() {
    if (!orderItemsContainer) return;
    
    if (myOrderList.length === 0) {
        orderItemsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-brand-muted opacity-60">
                <div class="text-4xl mb-3">📝</div>
                <p>Your list is empty.</p>
            </div>
        `;
        if (orderTotalEl) orderTotalEl.textContent = '₱0';
        return;
    }
    
    let html = '';
    let total = 0;
    
    myOrderList.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        
        html += `
            <div class="flex items-center justify-between bg-white p-4 rounded-2xl border border-brand-border shadow-sm">
                <div class="flex-1 pr-3">
                    <h4 class="font-bold text-brand-green text-sm sm:text-base leading-tight">${escapeHTML(item.name)}</h4>
                    <p class="text-brand-gold font-medium text-xs sm:text-sm mt-1">₱${item.price}</p>
                </div>
                
                <div class="flex items-center gap-3 bg-brand-warm rounded-full px-2 py-1 border border-brand-border">
                    <button onclick="updateOrderItemQty('${escapeHTML(item.name)}', -1)" class="w-7 h-7 flex items-center justify-center rounded-full text-brand-green hover:bg-white transition-colors" aria-label="Decrease quantity">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                    </button>
                    <span class="font-bold text-sm w-4 text-center text-brand-green">${item.qty}</span>
                    <button onclick="updateOrderItemQty('${escapeHTML(item.name)}', 1)" class="w-7 h-7 flex items-center justify-center rounded-full text-brand-green hover:bg-white transition-colors" aria-label="Increase quantity">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    </button>
                </div>
            </div>
        `;
    });
    
    orderItemsContainer.innerHTML = html;
    if (orderTotalEl) orderTotalEl.textContent = `₱${total}`;
}

// Modal Toggle Functions
function openOrderList() {
    if (!orderModal || !orderDrawer) return;
    renderOrderListItems(); // Refresh content before showing
    orderModal.classList.remove('opacity-0', 'pointer-events-none');
    // Small delay to allow opacity transition to start before transform
    requestAnimationFrame(() => {
        orderDrawer.classList.add('drawer-open');
    });
    document.body.style.overflow = 'hidden';
}

function closeOrderList() {
    if (!orderModal || !orderDrawer) return;
    orderDrawer.classList.remove('drawer-open');
    setTimeout(() => {
        orderModal.classList.add('opacity-0', 'pointer-events-none');
        if (document.getElementById('image-modal').classList.contains('opacity-0')) {
            document.body.style.overflow = '';
        }
    }, 300);
}

// Event Listeners for Order List
if (orderFab) orderFab.addEventListener('click', openOrderList);
if (orderCloseBtn) orderCloseBtn.addEventListener('click', closeOrderList);
if (orderModal) {
    orderModal.addEventListener('click', (e) => {
        if (e.target === orderModal) closeOrderList();
    });
}
if (orderClearBtn) {
    orderClearBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear your entire order list?")) {
            myOrderList = [];
            saveOrderList();
        }
    });
}

// Initialize directly — script is at bottom of <body> so DOM is already ready
loadOrderList();
