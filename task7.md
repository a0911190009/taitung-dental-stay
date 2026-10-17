製作「時尚雜誌風、可翻頁、搭配語音」的網頁，放在此 repo 子目錄 magazine/（網址 https://a0911190009.github.io/taitung-dental-stay/magazine/）。不要問問題，全部自己做完。
- 原本 index.html 內容不要動，只在首頁標題下方加一顆「雜誌版」連結按鈕（連到 magazine/）。
- 風格：高級時尚雜誌（Vogue、Kinfolk），大標題襯線字（如 Noto Serif TC）、大量留白、高質感配色，帶台東山海氣息。全繁體中文，字要大（內文至少 18px），長輩看得清楚。不要放任何委託人名字或個資。
- 翻頁：用 StPageFlip（page-flip CDN）或自製 CSS 書頁翻動動畫。手機直式單頁、可左右滑動翻頁；電腦有兩側箭頭並支援鍵盤左右鍵。
- 頁面順序：封面（標題：台東看牙住宿推薦｜2026/11/11–11/18，含「點我開始聆聽」按鈕）→ 牙醫位置頁（台東市更生路689巷一帶，連結 https://www.google.com/maps?q=22.766940279683972,121.13652461835369）→ 松柏文旅 → 翠安儂風旅 → 湯園民宿 → 備案（康橋大飯店 台東館、月光夏民宿）→ 訂房提醒頁（含首頁的提醒與窗戶提醒）→ 封底（「價格與空房為 2026/10/17 01:08（台灣時間）在 Booking.com 查詢的結果，實際以訂房時為準。」）。住宿資料全部沿用目前 index.html 上的內容（價格、房型、電話、取消期限、步行距離、Booking 網址含日期參數、Google 步行路線連結）。每個住宿頁都要有「Booking 訂房頁」和「步行路線」按鈕（備案頁兩間各有）。
- 配圖若需要可用 Nano Banana 生成（不含文字），或沿用 assets/stickers/。
- 語音：每頁寫一段溫暖口語、像雜誌主編介紹的繁體中文導覽稿（存 magazine/audio/scripts.md），用 macOS `say -v Meijia` 產生 aiff 再用 ffmpeg 轉 mp3（magazine/audio/p01.mp3…）。翻到哪頁播哪頁；有播放、暫停、靜音按鈕；第一次需點「點我開始聆聽」才開始播。數字要寫成好念的中文讀法。
- 用 headless 瀏覽器在 390px 與 1366px 實測翻頁與版面。
完成後 git commit（先不要 push），在 task7_result.md 寫摘要（頁數、使用的翻頁庫、TTS、是否用 Nano Banana）。

參考資料（請先讀，借用做法並避開踩坑）：
- ~/garrison-mag/（FIX.md、BRIEF*.md、mag/index.html）：以前做過的時尚雜誌電子書，純原生 HTML/CSS/JS、手勢滑動、鍵盤方向鍵、翻頁按鈕、頁數指示器。踩坑紀錄：封面避免帶有電話或浮水印的圖；手機 390px 頂部導覽列按鈕會換行截斷，要縮短標籤並 nowrap。
- 中央大腦編年史 ~/Library/Mobile Documents/com~apple~CloudDocs/我的程式/中央大腦/02_編年史.md 第 4047–4054 行有該案紀錄。
若上一輪已有部分檔案，請檢查後接續。

=== 追加需求（優先於上面的規格）===
參考程式寫法（只能參考程式，不可複製任何內容或客戶資料）：~/Projects/sell-calc-zhihang412/（LITE_V2_SPEC.md 有翻頁、折角、滑動的做法）。
1. 語音改用 MiniMax TTS（api.minimaxi.com，t2a），voice_id 用 Warm_Bestie，emotion 設 happy。先查這台 Mac 上以前怎麼讀 MiniMax 金鑰（環境變數、keychain、或其他專案的設定），用同樣方式讀取；絕對不要把金鑰印到 log、終端或寫進 repo。若真的找不到金鑰，才退回 macOS say -v Meijia，並在 task7_result.md 說明。TTS 放背景執行並留 log（magazine/audio/tts.log，不含金鑰）。
2. 旁白用口語短句，句子中間加停頓（用 MiniMax 的停頓標記 <#0.5#> 或標點）。
3. 封面先放「點我開始聆聽」按鈕，旁邊加「🔊 請打開手機音量（iPhone 請關閉靜音）」。
4. 用 100dvh 加 env(safe-area-inset-*)，避免 iPhone Chrome 工具列蓋住按鈕。
5. 每一頁都要塞進一個手機畫面，不能捲動；字太多就拆成兩頁（語音同步拆）。要在 375px 和 390px 寬實測。
6. mp3 和 js 的網址都加版本參數（?v=時間戳）。
7. 旁白講到按鈕時，在按鈕旁顯示會晃動的 👉 手指。
8. 邊播邊自動翻頁（該頁語音播完自動翻下一頁，使用者手動翻頁時切換到該頁語音）；右下角放一個會輕晃的小折角（點了翻下一頁）。
9. 風格仍是時尚雜誌風。
