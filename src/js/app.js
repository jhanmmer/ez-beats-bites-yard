/**
 * EZ Beats & Bites Menu App
 * Handles dynamic data fetching from Google Sheets and UI filtering.
 */

// IMPORTANT: Replace this URL with your Google Sheet published CSV link!
// To get this: File > Share > Publish to web > Link > Entire Document > Comma-separated values (.csv)
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDmgfHn2o1-0dYbDHfyRONP_ORwWETHm_p-TvHEDTDvPlImpNqOR96cxH7pEhc9lmjU8XY932in8A4/pub?gid=0&single=true&output=csv'; // e.g. 'https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv'

// Fallback data so the site works before you connect your Google Sheet
const FALLBACK_DATA = [
    { Category: "Bites", Name: "Classic Yard Burger", Description: "Juicy beef patty with melted cheese, fresh lettuce, and our secret EZ sauce.", Price: "150", ImageURL: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1500&auto=format&fit=crop" },
    { Category: "Bites", Name: "Sizzling Sisig", Description: "Crispy pork maskara perfectly seasoned, served with egg and calamansi. Perfect for sharing!", Price: "180", ImageURL: "https://images.unsplash.com/photo-1625937712144-0c6ef256073b?q=80&w=1500&auto=format&fit=crop" },
    { Category: "Bites", Name: "Loaded Fries", Description: "Crispy fries topped with melted cheese, bacon bits, and jalapenos.", Price: "120", ImageURL: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=1500&auto=format&fit=crop" },
    { Category: "Drinks", Name: "Sunset Mojito", Description: "Refreshing blend of mint, lime, and our special fruit mix to cool down your night.", Price: "95", ImageURL: "https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=1500&auto=format&fit=crop" },
    { Category: "Drinks", Name: "Iced Caramel Macchiato", Description: "Premium coffee over ice with a rich caramel drizzle.", Price: "110", ImageURL: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=1500&auto=format&fit=crop" },
    { Category: "Specials", Name: "EZ Platter (For 4)", Description: "A massive mix of BBQ, sisig, fries, and nachos. The ultimate yard experience.", Price: "499", ImageURL: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1500&auto=format&fit=crop" }
];

let menuItems = [];

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
        container.innerHTML = `<p class="text-brand-muted text-center col-span-full">No items found for this category.</p>`;
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
                    <div class="p-5 sm:p-8">
                        <h3 class="menu-name text-lg sm:text-2xl font-serif font-bold text-brand-green mb-2 sm:mb-3">${item.Name}</h3>
                        <p class="menu-desc text-brand-muted text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed line-clamp-2 sm:line-clamp-3">${item.Description}</p>
                        <button class="w-full py-2.5 sm:py-3 rounded-full border-2 border-brand-green text-brand-green text-sm sm:text-base font-medium group-hover:bg-brand-green group-hover:text-white transition-all duration-300 transform group-hover:shadow-md">Add to Order</button>
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
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state of buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter items
            currentLimit = INITIAL_LIMIT; // Reset pagination limit on filter change
            const category = btn.getAttribute('data-category');
            if (category === 'All') {
                renderMenu(menuItems);
            } else {
                const filtered = menuItems.filter(item => item.Category.toLowerCase() === category.toLowerCase());
                renderMenu(filtered);
            }
            
            // Re-trigger AOS animations
            if (window.AOS) {
                setTimeout(() => AOS.refresh(), 100);
            }
        });
    });
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
        // Trigger on any img tag inside a menu card
        const img = e.target.closest('.menu-card img');
        if (img) {
            openImageModal(img.src, img.alt);
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
    }
});
