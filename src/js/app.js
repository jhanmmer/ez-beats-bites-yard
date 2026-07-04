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
    container.innerHTML = '';
    
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

    itemsToRender.forEach((item, index) => {
        const delay = (index % 3) * 100; // Staggered animation
        
        const cardHTML = `
            <div class="menu-card group cursor-pointer" data-aos="fade-up" data-aos-delay="${delay}">
                <div class="h-44 sm:h-56 w-full overflow-hidden relative bg-brand-border/30">
                    <img src="${item.ImageURL || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1500&auto=format&fit=crop'}" 
                         alt="${item.Name}" 
                         class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                         loading="lazy">
                    <div class="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 backdrop-blur-sm text-brand-green font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-md border border-brand-border text-sm sm:text-base">
                        ₱${item.Price}
                    </div>
                    <div class="absolute top-3 left-3 sm:top-4 sm:left-4 bg-brand-cream text-brand-green text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full shadow-sm uppercase tracking-wide opacity-90">
                        ${item.Category}
                    </div>
                </div>
                <div class="p-5 sm:p-8">
                    <h3 class="text-lg sm:text-2xl font-serif font-bold text-brand-green mb-2 sm:mb-3">${item.Name}</h3>
                    <p class="text-brand-muted text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed line-clamp-2 sm:line-clamp-3">${item.Description}</p>
                    <button class="w-full py-2.5 sm:py-3 rounded-full border-2 border-brand-green text-brand-green text-sm sm:text-base font-medium group-hover:bg-brand-green group-hover:text-white transition-all duration-300 transform group-hover:shadow-md">Add to Order</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });

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

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    // Show loaders initially
    renderSkeletons();
    
    // Fetch data
    const rawItems = await fetchMenu();
    
    // Filter out inactive items (defaults to active if Status is empty or doesn't exist)
    menuItems = rawItems.filter(item => {
        if (!item.Status || item.Status.trim() === '') return true;
        const status = item.Status.trim().toLowerCase();
        return status !== 'inactive' && status !== 'false' && status !== '0' && status !== 'no';
    });
    
    // Render Filters and Menu dynamically
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
});
