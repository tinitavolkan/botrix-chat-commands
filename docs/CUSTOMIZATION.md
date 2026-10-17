# Özelleştirme ve bakım

## Yayıncı ve kafe adı

`settings.json` içindeki `streamerName`, `!gergin` cümlesindeki yayıncı adını;
`cafeName`, `!yancı` yanıtının kafe başlığını belirler. `startDate` burç paketinin
başlangıcıdır. Tarihi `YYYY-MM-DD` biçiminde yaz.

Hazır esprilerin içinde geçen genel kafe ifadeleri ayrı metinlerdir. Ayardaki
kafe adını değiştirmek bütün espri gövdelerini yeniden yazmaz; gerektiğinde
`data/percentages.json` veya `data/cafe.json` içindeki metni de düzenle.

## Hangi metin hangi dosyada?

| Dosya | Alanlar | Beklenen yapı |
| --- | --- | --- |
| `data/horoscopes.json` | `SIGNS`, `DAYS` | 12 burç ve 30 × 12 metin |
| `data/percentages.json` | `GERGIN_TEXTS`, `ANDAVAL_TEXTS`, `ENAYI_TEXTS`, `BOK_TEXTS` | Her biri 101 metin; indeks = yüzde |
| `data/love.json` | `ASK_PAIR_TEXTS`, `ASK_SOLO_TEXTS` | İkili ve tekli mod için 101'er metin |
| `data/flowers.json` | `FLOWER_ROWS` | 96 satır; `slug`, `name`, `emoji`, `text` |
| `data/relationships.json` | `RELATIONSHIP_TEXTS` | Sekiz kısa durum |
| `data/cafe.json` | `CAFE_ORDERS` | 240 satır; `drink`, `side`, `emoji`, `text` |
| `data/meals.json` | `MEAL_MENUS` | 200 satır; `id`, `category`, `label`, `main`, `side` |

Yüzde dizisinde ilk metin `%0`, son metin `%100` içindir. Metnin sertliğini yüzdeye
göre düzenleyebilirsin. Menüde ana yemeği `main`, eşlikçiyi `side` alanına yaz;
Worker bunları kısa bir cümlede birleştirir.

İlk düzenlemede eleman sayısını ve satır sırasını koruyup metinleri değiştir.
Bu, mevcut döngüyü ve yüzde eşleşmesini korur. JSON virgüllerini ve çift tırnakları
kontrol et. Kişi etiketini metin havuzuna yazma; Worker gereken etiketi ekler.

## Havuz boyutunu değiştirmek

Bu sürüm 101 yüzde, 200 menü, 96 çiçek, 8 ilişki ve 240 kafe sonucu için
hazırlanmıştır; testler bu yapıyı doğrular. Özellikle günlük havuzların boyutunu
değiştirirken `CHAT_STEPS` tablosunu ve testleri de güncellemek gerekir. Adım
değerleri yeni boyutla aralarında asal olmalıdır. Sadece satır ekleyip yayınlamak
günlük indeks hesabını bozabilir.

Burçlarda `SIGNS` anahtar sırası ile her günün yorum sırası eşleşmelidir.
`DAYS[0]` 1. gün, her satırın ilk elemanı `SIGNS` içindeki ilk burçtur.

## Komut adını değiştirmek

Sohbette görülen ad BotRix kaydıdır; Worker'ın rota kodu ayrı kalabilir. Örneğin
aynı `komut=yanci` yanıtını `!kafe` adıyla kaydedebilirsin. Üreticinin eşleştirmeleri
`scripts/commands.js` içindedir. Yeni bir davranış eklemek için `serve` yönlendirmesi,
ilgili yanıt fonksiyonu ve testleri birlikte güncellenmelidir.

## Güncelleme sırası

```powershell
npm test
npm run build
npm run deploy
```

Testler yanlış JSON'u, havuz sayısını, günlük döngüyü ve rota davranışlarını
kontrol eder. Her yeni metni dil ve anlam bakımından da kendin gözden geçir;
otomatik test edebî kaliteyi değerlendirmez.

Worker adı/adresi değişmediyse BotRix komut URL'si aynı kalır. Yeni Worker adresine
geçtiysen kendi adresinle `npm run commands -- ADRES --edit` çıktısını üretip
kullanacağın kayıtları güncelle. `ADRES` yerine gerçek HTTPS adresini yaz.

## Kendi sürümünü GitHub'da paylaşmak

Kaynak ve genel içerik dosyalarını paylaş; giriş bilgilerini, `.wrangler`,
`node_modules`, yerel günlükleri veya özel chat kayıtlarını ekleme.
`npm run check:release`, bu deponun beklenen dosyalarını ve belirli hassas
örüntüleri kontrol eder. Kendi dosyalarını eklediğinde kontrolün izin listesini
bilerek güncelle; bu yardımcı bütün olası sırları bulabilen kapsamlı bir tarayıcı
değildir. MIT lisansındaki telif/lisans bildirimini koru.
