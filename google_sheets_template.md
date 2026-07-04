# Google Sheets Menu Template

Para madaling ma-update ang iyong website, kailangan tumugma ang mga columns sa Google Sheets mo dun sa code na ginawa natin. 

Pwede mong i-copy ang table sa ibaba at i-paste nang direkta sa **Cell A1** ng bago mong Google Sheet.

## 📋 Ang Template (Copy & Paste to Google Sheets)

| Name | Price | Category | Description | ImageURL | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Buldak Ramen | 120 | Snacks | Spicy Korean noodles with cheese on top. | https://example.com/ramen.jpg | Active |
| Classic Fries | 80 | Bites | Crispy potato fries with your choice of dip. | https://example.com/fries.jpg | Active |
| Chaw Pan | 150 | Main | Our signature chaw pan cooked fresh on the yard. | https://example.com/chawpan.jpg | Inactive |
| Iced Coffee | 95 | Drinks | Cold and refreshing brewed coffee. | https://example.com/coffee.jpg | Active |

---

## 📖 Paano Gamitin (Step-by-Step)

### 1. I-setup ang Columns
Siguraduhing ang **Row 1** (ang pinaka-unang row sa taas) ay naglalaman ng mga sumusunod na eksaktong salita (case-sensitive ito minsan, kaya mas maganda kung parehong-pareho):
1. **Name** - Pangalan ng pagkain o inumin.
2. **Price** - Presyo (numero lang, huwag lagyan ng ₱ sign para malinis).
3. **Category** - Halimbawa: *Bites, Drinks, Main, Snacks, All*. Dito nakadepende ang mga filter buttons sa website mo.
4. **Description** - Maikling paliwanag tungkol sa pagkain.
5. **ImageURL** - Link ng picture. Pwede kang gumamit ng Imgur link, Google Drive link (na public viewable), o kahit anong public image URL.
6. **Status** - Ilagay ang `Active` kung available. Kung out-of-stock o tinanggal muna sa menu, ilagay ang `Inactive`, `0`, o `No`. Automatic itong matatago sa website.

### 2. Paano i-connect sa Website
Kapag kumpleto na ang Google Sheet mo, sundin ito para maging "Database" siya ng website:
1. Sa Google Sheets, i-click ang **File** sa taas.
2. Piliin ang **Share**, tapos i-click ang **Publish to web**.
3. Sa lalabas na window, palitan ang "Web page" at gawing **Comma-separated values (.csv)**.
4. I-click ang **Publish** (at click OK/Yes).
5. Kopyahin yung **Link** na ibibigay niya.
6. Buksan ang `src/js/app.js` sa project natin. Sa **Line 8**, palitan ang value ng `GOOGLE_SHEETS_CSV_URL` gamit ang link na kinopya mo.

Ayan! Every time na magbabago ka ng menu, mag-a-update din ang website mo (minsan may delay lang na up to 5 minutes dahil sa cache pampabilis ng loading).
