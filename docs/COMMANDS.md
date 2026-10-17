# Komut sözlüğü

## Ortak parametreler

| Parametre | Anlamı |
| --- | --- |
| `komut` | Sohbet rotası; aşağıdaki ASCII kodlarından biri |
| `burc` | Burç rotası; `komut` ile aynı istekte kullanılmaz |
| `kullanici` | Komutu yazan; BotRix şablonunda `$(sender)` |
| `hedef` | İsteğe bağlı tek kişi; BotRix şablonunda `$(optionalvariable)` |

Worker kullanıcı adını tek `@` olmadan da kabul eder. Görünen yazımı korur,
günlük anahtarı küçük harfe çevirir. Eksik, boş, `null`, `__solo__` veya kişinin
kendi adını hedeflemesi çağırana döner. `!gergin` kullanıcı parametresi istemez.
Doğrudan `?komut=andaval` eski etiketsiz yüzde yanıtını da destekler; üretilen
BotRix şablonu göndereni ekleyerek kişi etiketli yanıtı kullanır.

## Burçlar

| BotRix adı | Worker sorgusu |
| --- | --- |
| `!koç` | `?burc=koc` |
| `!boğa` | `?burc=boga` |
| `!ikizler` | `?burc=ikizler` |
| `!yengeç` | `?burc=yengec` |
| `!aslan` | `?burc=aslan` |
| `!başak` | `?burc=basak` |
| `!terazi` | `?burc=terazi` |
| `!akrep` | `?burc=akrep` |
| `!yay` | `?burc=yay` |
| `!oğlak` | `?burc=oglak` |
| `!kova` | `?burc=kova` |
| `!balık` | `?burc=balik` |

Her burcun 30 metni vardır. Aynı yayın gününde bütün izleyiciler o burç için
aynı yorumu görür. Yanıt `Burç | gg.aa.yyyy: yorum` biçimindedir.

## Sohbet komutları

| BotRix adı | `komut` değeri | Havuz | Davranış |
| --- | --- | --- | --- |
| `!gergin` | `gergin` | 101 espri | Yayıncı için 0–100 rastgele yüzde |
| `!andaval` | `andaval` | 101 espri | Hedef için 0–100 rastgele yüzde |
| `!aşk` | `ask` | 101 tekli + 101 ikili | Kişi/ikili için günlük yüzde |
| `!çiçek` | `cicek` | 12 çiçek × 8 yorum | Hedef için günlük çiçek/yorum |
| `!enayi` | `enayi` | 101 espri | Hedef için 0–100 rastgele yüzde |
| `!ilişki` | `iliski` | 8 durum | Hedef için günlük kısa durum |
| `!yancı` | `yanci` | 24 içecek × 10 sipariş | Hedef için günlük kafe siparişi |
| `!bok` | `bok` | 101 espri | Hedef için 0–100 rastgele yüzde |
| `!yemek` | `yemek` | 10 kategori × 20 menü | Hedef için rastgele ana yemek + eşlikçi |

### Yemek örnekleri

```text
!yemek
!yemek @arkadas
!yemek yazınca yemek mi geliyor
```

İlk ve son girdi komutu yazanı, ikinci girdi `arkadas` kullanıcısını seçer.
Geçerli görünen tek bir kelime kullanıcı adı olarak yorumlanabilir; Worker
bu hesabın gerçekten var olup olmadığını sorgulamaz.

### Aşk örnekleri

```text
!aşk
!aşk @arkadas
```

İlk girdi çağıranın flört modunu, ikincisi iki kişi arasındaki günlük oyun
sonucunu verir. Aynı ikilinin sırası ters olsa da yüzdesi değişmez; yanıttaki
anlatım çağıran/hedef rollerini takip eder.

### İlişki durumları

Bekâr, Flört, İlişkide, Platonik, Nişanlı, Evli, Karmaşık ve Friendzone.
Gerçek ilişki durumu okunmaz; hazır sekiz durum arasında günlük seçim yapılır.

## BotRix satırları

Kendi adresinle bütün satırları üretmek için:

```powershell
npm run commands -- https://KENDI-ADRESIN.workers.dev
```

İlk kurulum `!addcom`, kayıtlı komutları güncellemek için `--edit` seçeneğiyle
`!editcom` satırları üretilir. Çıktı sohbeti otomatik değiştirmez; uygulanacak
satırları kanalında sen seçersin.

## HTTP davranışı

GET kısa metin döndürür; HEAD aynı rota için boş gövde döndürür. HEAD rastgele
sayı tüketmez. Yanıtlar UTF-8 düz metin ve `Cache-Control: no-store` kullanır.

| Durum | Açıklama |
| --- | --- |
| 200 | Geçerli rota ve parametreler |
| 400 | Geçersiz komut/burç, eksik veya geçersiz kullanıcı, yinelenen gerekli parametre, karışık rota |
| 405 | GET/HEAD dışındaki yöntem |

Günlük yanıt başlıklarında seçilen yayın günü ve indeks, rastgele sonuçlarda
yüzde veya menü indeksi bulunabilir. Bunlar test ve hata inceleme içindir;
BotRix sohbet çıktısı yalnız yanıt gövdesidir. `day`, `index`, `percent` gibi
fazladan URL parametreleri seçimi değiştirmez.
