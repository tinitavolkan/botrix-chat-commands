# Yöntem: bir chat komutunu internetten metin döndüren küçük servise çevirmek

## Sistemi hangi parçalara böldük?

Sohbet bağlantısını BotRix'e, yanıt seçimini Cloudflare Worker'a, yazıları da JSON
dosyalarına bıraktık. BotRix'in hazır değişkenleriyle gelen mesajı URL'ye çevirip
Worker'ın düz metin yanıtını sohbette gösterebiliyoruz. Bu nedenle kendi Kick
oturumu açma, websocket bağlantısı yönetme veya mesaj gönderme servisi yazma
işlemlerini bu projede üstlenmiyoruz.

| Parça | Sorumluluğu | Projedeki karşılığı |
| --- | --- | --- |
| BotRix | Komutu tanır, göndereni ve hedef metni ekler, yanıtı sohbete yollar | Üretilen `!addcom` / `!editcom` satırları |
| Worker | Parametreleri doğrular, doğru havuzdan yanıt seçer | `src/worker.js` |
| Hazır içerik | Düzenlenebilir Türkçe yorumlar ve menüler | `data/*.json` |
| Ayarlar | Yayıncı/kafe adı, burç döngüsü başlangıcı | `settings.json` |
| Wrangler | Yerel çalıştırma, derleme ve Cloudflare yayını | `package.json`, `wrangler.jsonc` |

## Bir isteğin yolculuğu

Örnek sohbet girdisi `!yemek @arkadas` olsun. BotRix yanıt şablonu şu parçaları taşır:

```text
fetch[https://KENDI-ADRESIN.workers.dev/?komut=yemek&kullanici=$(sender)&hedef=$(optionalvariable)]
```

BotRix `$(sender)` alanına komutu yazanın adını, `$(optionalvariable)` alanına
komuttan sonraki isteğe bağlı metni koyar. İstek Worker'a geldiğinde
`new URL(request.url).searchParams` sorguyu ayrıştırır. `serve` fonksiyonu
`komut=yemek` rotasını seçer, `serveMeal` alıcıyı bulur ve hazır menüyü seçer.
Yanıt `text/plain; charset=utf-8` olarak döner.

BotRix bu metni sohbet mesajı olarak gösterir. Worker'ın kendisi Kick'e mesaj
göndermez; yalnız gelen HTTP isteğine yanıt verir.
[BotRix değişken ve fetch açıklamaları](https://botrix.live/docs/#/?id=_3-variables).

## Neden hazır metinler?

Burçlar için 30 × 12 = 360 metin, yüzdeler için 0'dan 100'e kadar ayrı yorumlar,
diğer komutlar için de kendi havuzları hazırlandı. Sonraki dil incelemelerinde
anlamsız veya bozuk ifadeler düzeltilip paketler güncellendi. Bu depoda bu son
hazır havuzlar taşınabilir JSON olarak bulunur.

İstek geldiğinde metin üretimi yapılmadığından yanıtın biçimini, uzunluğunu ve
üslubunu önceden görebiliriz. Bir yemek veya espri eklemek için kodun içine
metin aramak yerine ilgili JSON dosyasını düzenleriz. İçerikler eğlence amaçlı
hazır yazılardır; güncel astroloji verisi ya da kişiler hakkında ölçüm değildir.

## İki farklı seçim yöntemi

### Her çağrıda rastgele

`!gergin`, `!andaval`, `!enayi`, `!bok` ve `!yemek` her GET isteğinde yeni seçim yapar.

Yüzde için:

```javascript
const percent = Math.floor(Math.random() * 101);
```

0 ve 100 dahildir; seçilen yüzde kendi dizisindeki yorumla eşleşir. Menüde aynı
işlem 200 eleman için yapılır. Tek bir rastgele sayı kullanılması testte bütün
seçenekleri ayrı ayrı sınamayı kolaylaştırır. Aynı değer arka arkaya gelebilir;
tekrar etmemeyi sağlamak için son sonucu saklayan bir veritabanı kullanılmaz.

`Math.random` eğlence amaçlı seçim için kullanılır; güvenlik veya çekiliş
doğrulama mekanizması değildir.

### Gün içinde sabit, ertesi gün farklı

`!aşk`, `!çiçek`, `!ilişki` ve `!yancı` sonuçlarını kullanıcı anahtarı ve günden
hesaplar. Sonucu kullanıcı başına kaydetmek yerine aynı girdilerden aynı indeksi
yeniden üretiriz. Böylece her çağrıda bir veritabanı okuması gerekmez.

Genel formül:

```text
offset = hash(komut + kullanıcı) mod havuz_boyutu
index = (offset + gün_sırası × adım) mod havuz_boyutu
```

Kaynakta `hash32` FNV-1a benzeri 32 bit bir hesap kullanır. Paket sürümü de
kimliğe dahildir. `adım`, havuz boyutuyla aralarında asal olacak şekilde seçilir.
Böylece bir döngüde bütün indeksler ziyaret edilir. Ardışık günlerde aynı
indeks seçilmez; belirli bir gün sayısı sonunda döngü tekrar eder.

| Komut | Döngü | Kimlik anahtarı |
| --- | --- | --- |
| Aşk | 101 gün | Tek kullanıcı veya sıralanmış kullanıcı çifti |
| Çiçek | 96 gün | Hedef kullanıcı |
| İlişki | 8 gün | Hedef kullanıcı |
| Yancı | 240 gün | Hedef kullanıcı |

Kullanıcı adı küçük harfe çevrilerek anahtar yapılır; yanıtta gönderilen yazım
korunur. Aşk ikilisinde adlar sıralandığından A–B ile B–A aynı yüzdeyi alır.
Çiçek/ilişki/yancı komutunda çağıran değişse de hedef aynıysa günlük seçim aynıdır.
Yancı menüsünün tamamı ertesi gün değişir; içecek türü tek başına tekrar edebilir.

### Burçlar

Burç sonucu kullanıcıya bağlı değildir. `settings.startDate` tarihinden itibaren
geçen yayın günü, 30'a göre mod alınarak kullanılır. İlgili günün 12 yorumundan
seçilen burcun metni döndürülür. Başlangıçtan önce 1. gün gösterilir. Yanıttaki
tarih her zaman geçerli yayın günüdür; 30 günlük paketin başlangıç tarihi değildir.

## İstanbul 00.01 sınırını nasıl sağladık?

`dayAt`, istek saatinden bir dakika çıkarıp `Europe/Istanbul` zaman diliminde
takvim gününü hesaplar. Bu, 00.00.59'a kadar önceki günün; 00.01.00'dan itibaren
yeni günün kullanılmasını sağlar. Cron çalıştırmak veya gece veritabanındaki
sonuçları sıfırlamak gerekmez. Ay, yıl ve artık gün sınırları da aynı hesapla işler.

Testte zamanı gerçek saati bekleyerek değil, `serve(request, now, random)`
fonksiyonunun `now` parametresine kontrollü değer vererek ilerletiriz. Bu test
parametresi URL'den okunmaz; kullanıcı `?day=...` ekleyerek sonucu zorlayamaz.

## Kişi etiketleme: iki önemli hata ve çözümü

### Kişi yokken rastgele izleyici seçilmesi

`optionalrandomuser`, isteğe bağlı hedef boşsa rastgele bir izleyici getirebilir.
Bizim akışımızda hedef yoksa komutu yazanın seçilmesi isteniyordu. Bu nedenle
BotRix şablonunda `$(sender)` ve `$(optionalvariable)` ayrı alanlarda gönderilir.
Worker, eksik/boş/`null` hedefte çağırana döner.

Baştaki tek `@` kaldırılır, ad doğrulanır ve yanıt içine etiket yalnız gereken
yerde eklenir. Aşk ikili modunda iki kişi gösterilir; diğer hedefli komutlar tek
kişiyi etiketler. `!gergin` doğrudan ayarlardaki yayıncı adıyla çalışır.

### Komuttan sonra cümle yazınca hata verilmesi

`!yemek yazınca yemek mi geliyor` girdisindeki bütün metni bir kullanıcı adı
saymak 400 hatasına neden oluyordu. Yemek rotası yalnız geçerli tek kullanıcı
adını hedef olarak kabul eder; diğer isteğe bağlı metinlerde çağırana döner.
Bu esneklik yemek rotasına özeldir. Diğer hedefli rotalar geçersiz hedefi reddeder.

Worker'ın kabul ettiği kullanıcı biçimi ASCII harf/rakam, `_` ve `-`, 1–32
karakterdir. Bu uygulamanın giriş doğrulamasıdır; Kick'ten gerçek hesap sorgusu
yapıldığı veya hesabın varlığının doğrulandığı anlamına gelmez.

## Yanıt ve hata tasarımı

UTF-8 düz metin, BotRix'in yanıtı doğrudan göstermesini sağlar. `Cache-Control:
no-store`, aracı önbelleklerin rastgele veya günlük sonucu eskisiyle karıştırmasını
önler. Uygulama belleğinde de kullanıcı sonucu önbelleği tutulmaz.

GET metni, HEAD yalnız başlıkları verir; HEAD rastgele seçim yapmaz. Geçersiz
komut, yinelenen gerekli parametre veya karışık burç/komut isteği 400; desteklenmeyen
yöntem 405 döndürür. Uç nokta dışarıdan gelen kullanıcı adına güvenir; bu bir
kimlik doğrulama servisi değildir. Ayrıntılar [SECURITY.md](../SECURITY.md).

## Geliştirme döngüsü

1. İlgili JSON metnini veya küçük bir rota davranışını düzenle.
2. `npm test` ile bütün komutları, günlük sınırları ve kişi seçimini kontrol et.
3. `npm run dev` ile tarayıcıdan yerel yanıtı gör.
4. `npm run build` ile Cloudflare derlemesini yayın yapmadan doğrula.
5. Kendi Worker'ına `npm run deploy` ile yayınla.
6. Worker adresi aynı kaldıysa BotRix şablonu çalışmaya devam eder; adres veya
   şablon değiştiyse kendi komut kayıtlarını `!editcom` ile güncelle.

Bu depo son hazır metin yöntemini içerir. Eski içerik toplama denemeleri,
kişisel dağıtım geçmişi ve üretim yardımcıları kurulumun parçası değildir.
