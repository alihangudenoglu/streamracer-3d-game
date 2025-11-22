<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# StreamRacer 3D - AI Destekli Yarış Oyunu

Bu proje, yapay zeka spikerlik özellikli 3D bir yarış oyunudur. YouTube canlı yayınlarından gelen yorumlarla etkileşime geçebilir.

View your app in AI Studio: https://ai.studio/apps/drive/14HsWw8A2jWTfnRoroHIy3tzy6Yc62nP7

## 🚀 Coolify ile Linux Sunucuda Deploy Etme

Bu uygulamayı Linux sunucunuzda Coolify ile kolayca deploy edebilirsiniz.

### Ön Gereksinimler
- Linux sunucu (Ubuntu/Debian tavsiye edilir)
- Docker ve Docker Compose yüklü
- Coolify kurulu ([Kurulum için](https://coolify.io/docs/knowledge-base/installation))

### Adım 1: Repository'yi Klonlayın
```bash
git clone <repository-url>
cd streamracer-3d-game
```

### Adım 2: Coolify'da Yeni Proje Oluşturun
1. Coolify panelinize giriş yapın
2. "New Project" > "From Git Repository" seçin
3. Repository'nizi bağlayın
4. "Docker Compose" seçeneğini seçin

### Adım 3: Ortam Değişkenlerini Ayarlayın
Coolify panelinde:
- Environment Variables bölümüne gidin
- `GEMINI_API_KEY` değişkenini ekleyin
- Google Gemini API anahtarınızı buraya girin

### Adım 4: Deploy Edin
1. "Deploy" butonuna tıklayın
2. Coolify otomatik olarak Docker imajını oluşturacak ve çalıştıracak
3. Deploy tamamlandığında uygulamanız erişime hazır olacak

### Adım 5: Domain Ayarları (Opsiyonel)
Kendi domain'inizi kullanmak için:
1. Coolify'da projenizin "Domains" bölümüne gidin
2. Domain'inizi ekleyin
3. DNS ayarlarınızı Coolify'ın verdiği IP adresine yönlendirin
4. SSL sertifikası otomatik olarak kurulacaktır

## 🏃‍♂️ Yerel Çalıştırma

**Gereksinimler:** Node.js

1. Bağımlılıkları kurun:
   ```bash
   npm install
   ```

2. [.env.local](.env.local) dosyasında `GEMINI_API_KEY`'i kendi Gemini API anahtarınızla değiştirin

3. Uygulamayı çalıştırın:
   ```bash
   npm run dev
   ```

## 📁 Proje Yapısı

- [`Dockerfile`](Dockerfile) - Uygulamayı container'a paketlemek için
- [`docker-compose.yml`](docker-compose.yml) - Coolify ile deploy için
- [`coolify.yaml`](coolify.yaml) - Coolify yapılandırma dosyası
- [`nginx.conf`](nginx.conf) - Production web sunucu ayarları
- [`.dockerignore`](.dockerignore) - Docker'da hariç tutulacak dosyalar

## 🔧 Yapılandırma

Uygulama aşağıdaki ortam değişkenlerini kullanır:
- `GEMINI_API_KEY` - Google Gemini API anahtarı (zorunlu)

## 🐛 Hata Ayıklama

Eğer deploy sırasında sorun yaşarsanız:
1. Coolify loglarını kontrol edin
2. `GEMINI_API_KEY`'in doğru ayarlandığından emin olun
3. Docker imajının başarıyla oluşturulduğunu doğrulayın
