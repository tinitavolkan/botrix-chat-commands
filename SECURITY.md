# Güvenlik ve veri akışı

Worker, yanıta yerleştirmek için gelen kullanıcı adlarını işler; kaynak kodu
bu adları veritabanına yazmaz veya günlüklemez. Cloudflare ve BotRix kendi
hizmet politikaları kapsamında istek bilgilerini işleyebilir. URL'lere parola,
token, özel mesaj veya kişisel hesap bilgisi koymayın.

Uç nokta herkese açıktır. URL'deki kullanıcı adı, isteği yapanın o kişi olduğunu
kanıtlamaz. Sonuçlar sohbet oyunu içindir; kullanıcı kimliğini doğrulamak veya
yetki vermek için kullanılmamalıdır. Worker yalnız sabit metin döndürür;
moderasyon, mesaj gönderme veya hesap üzerinde işlem yapma yetkisi yoktur.

Bu proje için Kick uygulaması, API anahtarı, kullanıcı çerezi, veritabanı ya da
AI anahtarı gerekmez. Cloudflare giriş bilgilerinizi ve yerel `.wrangler`
dosyalarını Git'e eklemeyin. GitHub Actions yalnız test ve yerel derleme yapar;
Cloudflare'a otomatik dağıtım yapmaz.

Güvenlik açığı bildirirken gerçek anahtarları veya özel kullanıcı kayıtlarını
issue'ya eklemeyin. Varsa GitHub Security bölümündeki özel bildirim yolunu kullanın.
