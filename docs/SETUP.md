# Kurulum: bilgisayardan sohbete

## 1. Gerekenler

- Node.js 22 veya üzeri ve npm. Kurulum: [nodejs.org](https://nodejs.org/en/download).
- Depoyu indirmek için Git veya GitHub'ın **Code → Download ZIP** seçeneği.
- Kendi Cloudflare hesabın ve kanalına bağlayacağın BotRix hesabın.
- BotRix komutlarını eklemek için ilgili kanalda komut yönetme yetkisi.

Worker tarafında veritabanı, cron, yapay zekâ anahtarı veya Kick uygulaması kurulmaz.

## 2. Projeyi indir ve bağımlılıkları kur

```powershell
git clone https://github.com/tinitavolkan/botrix-chat-commands.git
cd botrix-chat-commands
npm ci
```

ZIP kullandıysan arşivi aç, terminali `package.json` bulunan klasörde aç ve
`npm ci` çalıştır. Windows PowerShell `npm.ps1` çalıştırılmasını engellerse
aynı komutları `npm.cmd` / `npx.cmd` ile kullanabilirsin.

## 3. Kendi isimlerini ayarla

`settings.json`:

```json
{
  "startDate": "2026-01-01",
  "streamerName": "Yayıncı",
  "cafeName": "Sohbet Kafe"
}
```

`streamerName`, `!gergin` yanıtının başını; `cafeName`, `!yancı` başlığını değiştirir.
`startDate`, burç paketinin 1. gününün tarihidir. Bu tarih gelmeden önce 1. gün
gösterilir, ardından 30 günlük döngü işler. Diğer günlük komutların seçimi bu
başlangıç tarihine bağlı değildir.

`wrangler.jsonc` içindeki `name` alanını kendi hesabında kullanmak istediğin
benzersiz Worker adına değiştir. Örnek: `kanalim-chat-komutlari`.
Hesap kimliği veya özel alan adı yazman gerekmez.

## 4. Önce bilgisayarında dene

```powershell
npm test
npm run dev
```

Terminal yerel sunucunun adresini gösterir; varsayılan `http://localhost:8787`.
Tarayıcıda şu adresleri aç:

```text
http://localhost:8787/?komut=yemek&kullanici=izleyici
http://localhost:8787/?komut=andaval&kullanici=izleyici&hedef=arkadas
http://localhost:8787/?komut=ask&kullanici=izleyici&hedef=arkadas
http://localhost:8787/?burc=aslan
```

Yanıt bir JSON nesnesi yerine kısa, düz Türkçe metin olmalıdır. Sunucuyu Ctrl+C
ile kapatabilirsin. BotRix internette çalıştığı için bilgisayarındaki `localhost`
adresine erişemez; sonraki adımda herkese açık Worker adresi alınır.

## 5. Cloudflare'da yayınla

```powershell
npx wrangler login
```

Açılan tarayıcıda **kendi Cloudflare hesabınla** oturum açıp Wrangler erişimini
tamamla. Birden fazla hesabın varsa terminalde kullanacağın hesabı seç.
Ardından:

```powershell
npm run deploy
```

Bu komut `wrangler.jsonc` içindeki isimle yayın yapar. Aynı hesabında aynı isimli
Worker varsa kodunu günceller. Çıktıdaki `https://...workers.dev` adresini kopyala.
[Cloudflare'ın resmî CLI kurulum rehberi](https://developers.cloudflare.com/workers/get-started/guide/)
ve [Wrangler komutları](https://developers.cloudflare.com/workers/wrangler/commands/workers/).

Kendi adresini tarayıcıda kontrol et:

```text
https://KENDI-ADRESIN.workers.dev/?komut=yemek&kullanici=izleyici
https://KENDI-ADRESIN.workers.dev/?burc=koc
```

Yerel kaynakta değişiklik yapmak yayını kendiliğinden değiştirmez. Her güncellemede
testleri çalıştırıp yeniden `npm run deploy` kullan.

### Panel editörünü kullanmak istersen

```powershell
npm run build
```

Bu komut yayın yapmadan `dist/index.js` derlenmiş JavaScript giriş dosyasını
oluşturur. Yerel npm kurulumu yine gerekir. Cloudflare Workers panelinde kendi
Worker'ını açıp **Edit code** bölümüne derlenmiş dosyanın içeriğini koyabilir ve
Deploy ile yayınlayabilirsin. `src/index.js` veya `src/worker.js` tek başına kopyalanmaz; JSON
dosyalarını import ettiği için önce derlenmesi gerekir. Hesabına özgü panel
menüleri değişebilir; CLI yöntemi dosya yapısını doğrudan kullanır.

## 6. BotRix'i kanalına bağla

[BotRix](https://botrix.live/) paneline kendi kanal hesabınla giriş yap ve Kick
kanal bağlantısını tamamla. BotRix'in kanalda etkin olduğunu ve komut ekleyecek
hesabın komut yönetme yetkisini kontrol et. Güncel menü ve yetki açıklamaları
[BotRix belgelerinde](https://botrix.live/docs/#/?id=_24-custom-command-management).

Kendi adresinle ilk kurulum satırlarını üret:

```powershell
npm run commands -- https://KENDI-ADRESIN.workers.dev
```

Terminal 21 satır üretir. Başında `!addcom` olan satırlardan kullanacaklarını
tek tek kanalın sohbetine uygula. Örneğin yemek komutunun yapısı:

```text
!addcom !yemek fetch[https://KENDI-ADRESIN.workers.dev/?komut=yemek&kullanici=$(sender)&hedef=$(optionalvariable)]
```

BotRix panelinden elle ekliyorsan komut adı `!yemek`, yanıt alanı ise yalnız
`fetch[...]` kısmıdır. Sohbetteki `!addcom` yönetim satırını yanıt alanına yapıştırma.
Kanalında kullandığın yönetim şeklinin gerektirdiği alanları panelde doldur.

Komut zaten kayıtlıysa düzenleme satırlarını üret:

```powershell
npm run commands -- https://KENDI-ADRESIN.workers.dev --edit
```

Bu satırlarda `!editcom` kullanılır. Kaydı değiştirmek için yalnız Worker'ın
kodunu güncellemek yetmez; BotRix'te eski yanıt veya eski adres varsa komut
kaydını da düzenlemek gerekir.

## 7. Sohbette kontrol et

```text
!yemek
!yemek @arkadas
!aşk
!aşk @arkadas
!çiçek @arkadas
!aslan
```

Kişi yazılmazsa kullanıcı alanı isteyen komutlar yazanı seçer. `!gergin` ise
`settings.json` içindeki yayıncı adıyla çalışır. BotRix panelinden kanalına uygun
bekleme süresi ve kullanıcı yetkileri belirle; bu ayarlar Worker'ın görevi değildir.

## Sorun giderme

| Belirti | Kontrol |
| --- | --- |
| Worker tarayıcıda çalışıyor, sohbette çalışmıyor | BotRix'in yanıt alanındaki `fetch[...]` adresini ve komut yetkisini kontrol et. |
| `fetch[...]` aynen sohbete yazılıyor | Sözdizimini, köşeli parantezleri ve `fetch` ile `[` arasındaki boşluğu kontrol et. |
| Yanlış kişi etiketleniyor | `$(optionalvariable)` kullan; `$(optionalrandomuser)` kişi yokken başka izleyici seçebilir. |
| 400 / geçersiz kullanıcı | Tek kullanıcı adı gönder. Kullanıcı adı alanı boş, çok uzun veya birden fazla kişi olmamalı. |
| 405 | Worker GET ve HEAD kabul eder; POST kullanılmaz. |
| Yerelde JSON import hatası | Node.js sürümünü `node --version` ile kontrol et; 22 veya üzeri gerekir. |
| Dağıtım başarılı ama eski yanıt geliyor | BotRix'in doğru Worker adresini kullandığını ve son kodu Deploy ettiğini kontrol et. |
| Gece sonuç beklediğin anda değişmiyor | Gün sınırı İstanbul 00.01; 00.00.59 hâlâ önceki gündür. |
| Aynı menü tekrar geldi | Rastgele seçimde tekrar normaldir; bir önceki sonucu hatırlayan kayıt tutulmaz. |

Free plan ve kotalar zamanla değişebilir. Sabit bir ücretsiz kullanım garantisi
yerine kendi hesabının kullanım panelini ve
[güncel Workers limitlerini](https://developers.cloudflare.com/workers/platform/limits/)
izle. Her BotRix çağrısı bir Worker isteği oluşturur; başka Worker'ların da aynı
hesapta kaynak kullanabileceğini hesaba kat.
