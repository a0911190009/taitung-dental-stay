# Task 8 執行成果摘要：台東看牙住宿推薦「Vogue & Kinfolk 雙頁對開雜誌版」全面升級

## 一、核心項目總覽

| 項目 | 實作結果與規格明細 |
| :--- | :--- |
| **總頁數** | **共 10 頁**（偶數對稱編排：手機單頁 `01 / 10`～`10 / 10`；電腦版 `≥1024px` 為 **5 組左右對開雙頁 Spread** `01–02`、`03–04`、`05–06`、`07–08`、`09–10`） |
| **翻頁方式** | **電腦版（`≥1024px`）**：左右對開雙頁（Spread）搭配中央書脊陰影（`.book-spine`）與自製 **3D CSS 書頁翻折動畫**（右頁以書脊為軸 `rotateY(0deg -> -145deg)` 翻過、反向左頁翻回），保留鍵盤左右鍵與兩側懸浮箭頭。<br>**手機版（`<1024px`）**：單頁滿版（`100dvh` + `safe-area`），支援左右滑動翻頁（Touch Swipe）與右下角輕晃折角按鈕（`#pageCurl`）。 |
| **真實飯店照片（優先需求 8）** | **5 間住宿全數成功取得真實照片**（無任何抓不到的住宿，亦無使用生成圖代替）。每間住宿各取 **3 張（建築外觀、推薦房型、衛浴空間，共 15 張）**，直接取自各住宿之 Booking.com 公開相簿（唯讀不登入、不訂房），壓縮為 WebP（品質 78）存於 `magazine/img/hotels/<住宿英文代號>/`。每張照片右下角均標註「**照片來源：Booking.com／業者**」，完整來源網址記錄於 `magazine/img/hotels/SOURCES.md`。 |
| **風景與氛圍生圖工具（需求 3 & 9）** | **Nano Banana 2.0**（透過 Antigravity `image-generator` 代理人調用 Google Imagen 寫實攝影模型）**生成成功**。共生成 **6 張寫實雜誌攝影圖**（台東山海、太平洋晨光、熱氣球、縱谷稻田、溫馨採光房間意象、晨光早餐意象），逐張檢驗確認無文字、無浮水印、無電話號碼，壓縮為 `1600px` 寬、品質 `78` 之 WebP 存於 `magazine/img/`，並於 `magazine/img/CREDITS.md` 記錄生圖工具、模型與完整 Prompt。<br>**嚴格遵守範圍**：Nano Banana 2.0 生成圖**僅用於封面（P.01）、牙醫位置頁（P.02）、行前訂房叮嚀頁（P.08）、台東慢旅手札頁（P.09）與封底（P.10）**，絕不放在住宿頁或冒充飯店照片。 |
| **語音是否重新生成（需求 5）** | **是，已全數重新生成（`p01.mp3`～`p10.mp3` 共 10 軌）**。因總頁數擴充為 10 頁（5 組雙頁對開），已更新 `magazine/audio/generate_tts.py` 與 `magazine/audio/scripts.md`，由背景執行呼叫 **MiniMax TTS**（`speech-01-turbo`，Voice ID `Chinese (Mandarin)_Warm_Bestie`，情緒 `happy`，金鑰由 macOS Keychain 安全讀取且絕不印出），執行紀錄留存於 `magazine/audio/tts.log`。<br>**對開與單頁播放規則**：手機版以單頁為單位播放並自動翻下一頁；電腦版對開時，依序先播放左頁語音（左頁頂部顯示金色閱讀焦點線與手指提示），左頁播畢自動接續播放右頁語音，右頁播畢後自動執行 3D 翻頁進入下一組對開頁。 |
| **首頁與既有功能保留（需求 4）** | 原本首頁 `index.html` 完全未動。雜誌版完整保留：5 間住宿全部資訊、每頁住宿之「`Booking 訂房頁`」與「`🚶 步行路線`」按鈕、封面「`👉 點我開始聆聽`」與「`🔊 請打開手機音量（iPhone 請關閉靜音）`」、旁白提及按鈕時晃動的 `👉`、右下角輕晃折角、播放/暫停/重聽/靜音控制、`100dvh` + `safe-area`、以及 `js/mp3/css` 版本參數（`?v=20261017_1415`）。 |

---

## 二、10 頁編排與配圖對照表

| 頁碼 | 電腦對開組別 | 頁面主題 | 圖片配置與來源 |
| :--- | :--- | :--- | :--- |
| **P. 01** | Spread 1 左頁 | **封面**：台東看牙・住宿推薦專刊 | `img/taitung_mountain_sea.webp`（Nano Banana 2.0 台東山海） |
| **P. 02** | Spread 1 右頁 | **牙醫診所地理位置**（更生路689巷） | `img/taitung_rice_paddies.webp`（Nano Banana 2.0 縱谷稻田） |
| **P. 03** | Spread 2 左頁 | **主推 01：松柏文旅**（步行 550m / 8 分） | 真實照片 3 張：`img/hotels/evergreen/{room,exterior,bathroom}.webp` |
| **P. 04** | Spread 2 右頁 | **主推 02：翠安儂風旅**（步行約 8–9 分） | 真實照片 3 張：`img/hotels/trianon/{room,exterior,bathroom}.webp` |
| **P. 05** | Spread 3 左頁 | **主推 03：湯園民宿**（步行 700m / 10 分） | 真實照片 3 張：`img/hotels/siang/{room,exterior,bathroom}.webp` |
| **P. 06** | Spread 3 右頁 | **備案 01：康橋大飯店 台東館**（步行 800m / 11 分） | 真實照片 3 張：`img/hotels/kindness/{room,exterior,bathroom}.webp` |
| **P. 07** | Spread 4 左頁 | **備案 02：月光夏民宿**（一樓免爬梯・免費接送） | 真實照片 3 張：`img/hotels/moonlight/{room,exterior,bathroom}.webp` |
| **P. 08** | Spread 4 右頁 | **行前訂房 6 大叮嚀** | `img/editorial_cozy_room.webp` + `img/editorial_breakfast.webp`（Nano Banana 2.0 情境裝飾） |
| **P. 09** | Spread 5 左頁 | **台東慢旅・山海之間靜心休養** | `img/taitung_hot_air_balloon.webp`（Nano Banana 2.0 鹿野縱谷熱氣球） |
| **P. 10** | Spread 5 右頁 | **專刊封底・鳴謝閱讀** | `img/pacific_dawn.webp`（Nano Banana 2.0 太平洋晨光） |

---

## 三、Playwright 三視口逐頁實測結果（需求 6）

使用 Headless Chromium 針對 `375×667`、`390×844`、`1366×768` 逐頁／逐組對開實測（截圖存於 `magazine/screenshots/`）：

| 測試視口 | 模式 | 測試頁數 / 對開數 | `scrollHeight <= clientHeight`（零捲動） | 內文最小字級（`minBodyFontPx`） | 按鈕裁切數（`clippedBtns`） | 圖片載入率 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`375 × 667`** | 手機單頁（iPhone SE） | 10 頁全測（`step01`～`step10`） | **100% 通過**（`slide: 569/569`、`inner: 557/557`、`zoom: 1`，`Overflow = False`） | **18px**（符合 `≥18px`） | `0` | 100% |
| **`390 × 844`** | 手機單頁（iPhone 13/14） | 10 頁全測（`step01`～`step10`） | **100% 通過**（`slide: 746/746`、`inner: 734/734`、`zoom: 1`，`Overflow = False`） | **18px**（符合 `≥18px`） | `0` | 100% |
| **`1366 × 768`** | 電腦左右對開（Spread） | 5 組對開全測（`01–02`～`09–10`） | **100% 通過**（左頁 `x=94, w=589`、右頁 `x=683, w=589`，`slide: 622/622`、`zoom: 1`，`Overflow = False`） | **18px**（符合 `≥18px`） | `0` | 100% |

---

## 四、邊界聲明（但這不代表……）
- 本次已完成 `magazine/` 雜誌版 10 頁升級、15 張真實飯店照片與 6 張風景配圖壓縮、10 軌 MiniMax TTS 語音重生、Playwright 三視口零溢出實測及本地 `git commit`，**但這不代表**已推送至遠端 GitHub Pages（依指示「這一步只 commit 不 push」）。
- 5 間住宿之價格與房況沿用 2026/10/17 01:08 Booking.com 查核數據且照片取自公開相簿，**但這不代表**訂房當下即時房況不會變動，實際仍以訂房頁面即時結果與電話確認為準。
