import os
import sys
import json
import time
import binascii
import subprocess
import urllib.request

LOG_FILE = "magazine/audio/tts.log"

def log(msg):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}\n"
    sys.stdout.write(line)
    sys.stdout.flush()
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line)

def get_minimax_key():
    try:
        k = subprocess.check_output(['security', 'find-generic-password', '-s', 'minimax-api-key', '-w']).decode('utf-8').strip()
        if k:
            log("API key successfully retrieved from macOS Keychain.")
            return k
    except Exception as e:
        log(f"Keychain lookup failed: {e}")
    
    env_file = os.path.expanduser('~/.openclaw/secrets/minimax.env')
    if os.path.exists(env_file):
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith('MINIMAX_API_KEY='):
                    k = line.strip().split('=', 1)[1].strip('"\'')
                    if k:
                        log("API key successfully retrieved from ~/.openclaw/secrets/minimax.env.")
                        return k
    return None

SCRIPTS = {
    "p01": "歡迎翻開台東看牙住宿推薦專刊。<#0.5#>這本雜誌為您精選二零二六年十一月十一號，到十一月十八號、七個晚上的舒適旅宿。<#0.5#>您可以隨時滑動翻頁，或點右下角的小折角。<#0.5#>讓我們一起出發吧！",
    "p02": "第二頁，我們先來看看牙醫診所的地理位置。<#0.5#>診所位於台東市更生路六百八十九巷一帶，周圍生活機能完善，夜晚也很清幽安靜。<#0.5#>我們挑選的主推旅宿，散步八到十分鐘就能抵達。<#0.5#>點擊下方地圖按鈕，就能直接開啟導航喔。",
    "p03": "第三頁為您推薦第一間主推旅宿，松柏文旅。<#0.5#>距離診所只有五百五十公尺，走路大約八分鐘。<#0.5#>大樓配有電梯，出入平穩輕鬆。<#0.5#>推薦二十平方公尺的雙床房或加大雙人床房，附有獨立陽台。<#0.5#>七晚含稅總價是一萬三千七百九十四元。<#0.5#>點擊下方按鈕，就能查看訂房頁與步行路線囉！",
    "p04": "第四頁是充滿法式優雅風情的翠安儂風旅。<#0.5#>散步到牙醫診所大約八到九分鐘。<#0.5#>館內有電梯、二十四小時櫃檯，浴室還設有緊急呼救設備，住起來特別安心。<#0.5#>標準雙人房二十五平方公尺，每天附贈美味早餐。<#0.5#>七晚總價是一萬一千九百二十元。<#0.5#>下方按鈕可以直接查看訂房與路線喔。",
    "p05": "第五頁是評價高達八點九分的湯園民宿。<#0.5#>走路到診所大約七百公尺、十分鐘。<#0.5#>民宿有電梯並附每日早餐。<#0.5#>最貼心的是房間裡就有專屬洗衣機與免治馬桶，連住一週非常方便。<#0.5#>特大雙人床房，七晚總價是一萬六千零九十二元。<#0.5#>點擊下方按鈕來看看吧！",
    "p06": "第六頁是我們的第一間安心備案，康橋大飯店台東館。<#0.5#>步行到診所大約八百公尺、十一分鐘。<#0.5#>飯店有電梯，還提供豐盛早餐與暖心宵夜點心。<#0.5#>舒適四人間二十六平方公尺，七晚總價是三萬八千七百九十元，入住時再付款即可。<#0.5#>下方按鈕可查看訂房頁與散步路線。",
    "p07": "第七頁是第二間備案，月光夏民宿。<#0.5#>距離診所約一點九公里，搭車五分鐘即可抵達。<#0.5#>雖然沒有電梯，但客房位於一樓免爬樓梯，還提供車站與機場免費接送服務。<#0.5#>雙人房七晚總價兩萬五千九百四十五元。<#0.5#>點擊下方按鈕就能查看詳情與路線喔！",
    "p08": "第八頁是主編為您整理的六大訂房叮嚀。<#0.5#>第一，訂房前請務必致電業者確認房間是否有對外窗。<#0.5#>第二，十一月空房流動快，建議提早預訂。<#0.5#>第三，連住七晚可先電話洽詢長住優惠。<#0.5#>第四，優先挑選可免費取消的方案。<#0.5#>第五，瑞士返台有時差，可詢問能否提早入住。<#0.5#>第六，確認房內有冰箱，看牙後冰敷更方便。",
    "p09": "第九頁，為您獻上台東山海的慢活休養手札。<#0.5#>十一月的台東秋高氣爽，太平洋的晨光與縱谷山嵐讓人心情平靜。<#0.5#>看牙休養期間，不妨在晨間散步呼吸新鮮空氣，品嚐溫軟清淡的在地早點與熱湯，讓身心在山海之間好好充電。",
    "p10": "最後一頁，感謝您的細心聆聽與閱讀。<#0.5#>本專刊所有價格與空房狀況，皆為二零二六年十月十七號於 Booking.com 查詢的最新結果，實際以訂房當下為準。<#0.5#>祝您看牙順利，在台東度過平安舒心的美好時光！"
}

def generate_minimax(key, name, text):
    url = "https://api.minimaxi.com/v1/t2a_v2"
    payload = {
        "model": "speech-01-turbo",
        "text": text,
        "stream": False,
        "voice_setting": {
            "voice_id": "Chinese (Mandarin)_Warm_Bestie",
            "speed": 1.0,
            "vol": 1.0,
            "pitch": 0,
            "emotion": "happy"
        },
        "audio_setting": {
            "sample_rate": 32000,
            "bitrate": 128000,
            "format": "mp3",
            "channel": 1
        }
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        base_resp = res.get("base_resp", {})
        code = base_resp.get("status_code")
        msg = base_resp.get("status_msg")
        if code != 0:
            raise RuntimeError(f"MiniMax API returned error code {code}: {msg}")
        audio_hex = res.get("data", {}).get("audio", "")
        if not audio_hex:
            raise RuntimeError("MiniMax response missing audio payload")
        return binascii.unhexlify(audio_hex)

def main():
    os.makedirs("magazine/audio", exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"=== MiniMax TTS Generation Started {time.strftime('%Y-%m-%d %H:%M:%S')} ===\n")
    
    key = get_minimax_key()
    if not key:
        log("ERROR: MiniMax API key not found. Exiting.")
        sys.exit(1)
        
    target_keys = sys.argv[1:] if len(sys.argv) > 1 else sorted(SCRIPTS.keys())
    for name in target_keys:
        text = SCRIPTS[name]
        out_path = f"magazine/audio/{name}.mp3"
        log(f"Generating {out_path} with MiniMax TTS (voice_id=Warm_Bestie, emotion=happy)...")
        try:
            audio_bytes = generate_minimax(key, name, text)
            with open(out_path, "wb") as f:
                f.write(audio_bytes)
            log(f"SUCCESS: {out_path} generated ({len(audio_bytes)} bytes).")
        except Exception as e:
            log(f"FAILURE generating {out_path}: {e}")
            raise
        time.sleep(0.4)

    log(f"=== Audio clips ({', '.join(target_keys)}) generated successfully ===")

if __name__ == "__main__":
    main()
