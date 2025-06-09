# Proyek Aplikasi Web DevSecOps (To-Do List)

## Deskripsi Proyek

Proyek ini merupakan implementasi dari aplikasi web sederhana (To-Do List) yang dibangun dengan siklus hidup pengembangan perangkat lunak yang aman (DevSecOps) secara menyeluruh. Tujuan utamanya adalah untuk membangun, menguji, dan men-deploy aplikasi secara otomatis melalui pipeline CI/CD yang mengintegrasikan praktik-praktik keamanan.

Proyek ini dibuat untuk memenuhi semua persyaratan dari Tugas Besar "Project CLO4".

## Tumpukan Teknologi (Tech Stack)

* [cite_start]**Backend**: Node.js, Express.js [cite: 67]
* [cite_start]**Frontend**: EJS (Embedded JavaScript), HTML, CSS [cite: 68]
* **Database**: In-Memory (JavaScript Array) untuk kesederhanaan
* [cite_start]**Testing**: Jest, Supertest [cite: 73]
* [cite_start]**Containerization**: Docker, Docker Compose [cite: 77]
* [cite_start]**CI/CD Platform**: GitHub Actions [cite: 72]
* **Security Scanning**:
    * [cite_start]**SAST**: npm audit [cite: 74]
    * [cite_start]**DAST**: OWASP ZAP [cite: 75]
* [cite_start]**Deployment Target**: Self-Hosted Runner di dalam VM lokal (VirtualBox Ubuntu) [cite: 83]

## Fitur Aplikasi

* [cite_start]Autentikasi pengguna berbasis sesi[cite: 69].
* [cite_start]Operasi CRUD (Create, Read, Update, Delete) penuh untuk manajemen tugas[cite: 68].
* [cite_start]Logging permintaan HTTP sederhana menggunakan `morgan`[cite: 82].
* [cite_start]Penggunaan `helmet` untuk menerapkan header keamanan HTTP dasar[cite: 80].

## Struktur Proyek

* **`.github/`** - Folder untuk konfigurasi GitHub.
    * **`workflows/`** - Folder untuk pipeline CI/CD.
        * [cite_start]`ci-cd.yml` - File definisi pipeline GitHub Actions. [cite: 86]
* **`public/`** - Folder untuk aset publik (frontend).
    * **`css/`**
        * `style.css` - File styling (CSS).
* **`views/`** - Folder untuk file template EJS (halaman HTML dinamis).
    * `index.ejs` - Tampilan halaman utama.
    * `login.ejs` - Tampilan halaman login.
* **`tests/`** - Folder untuk semua file pengujian.
    * `app.test.js` - File unit/integration test untuk aplikasi.
* `.dockerignore` - Daftar file yang diabaikan oleh Docker.
* [cite_start]`.env` - File untuk menyimpan variabel lingkungan lokal (RAHASIA). [cite: 81]
* `.gitignore` - Daftar file yang diabaikan oleh Git.
* [cite_start]`Dockerfile` - Resep untuk membangun image Docker aplikasi. [cite: 77]
* `docker-compose.yml` - File untuk menjalankan aplikasi dengan mudah di lingkungan lokal.
* `index.js` - File utama aplikasi Node.js/Express.
* `package.json` - Menyimpan daftar dependensi & skrip proyek.
* `README.md` - Dokumentasi proyek ini.

## Menjalankan Proyek Secara Lokal

Untuk menjalankan aplikasi ini di komputer lokal Anda, pastikan Docker dan Docker Compose sudah terinstal.

1.  **Clone repository ini:**
    ```bash
    git clone [URL_REPOSITORY_ANDA]
    cd devsecops-project
    ```

2.  **Buat file `.env`:**
    Buat sebuah file baru bernama `.env` di direktori utama dan tambahkan baris berikut:
    ```
    SESSION_SECRET='secret-key-lokal-yang-aman-dan-panjang'
    ```

3.  **Jalankan dengan Docker Compose:**
    ```bash
    docker-compose up --build -d
    ```

4.  **Akses Aplikasi:**
    Buka browser dan pergi ke `http://localhost:3001`.

## Alur Kerja CI/CD

[cite_start]Pipeline CI/CD proyek ini dikonfigurasi di `.github/workflows/ci-cd.yml` dan berjalan secara otomatis setiap kali ada `push` ke branch `main`. [cite: 72, 84]

Pipeline ini terdiri dari beberapa tahapan (jobs):

1.  **`build_and_test`**:
    * Berjalan di server GitHub (`ubuntu-latest`).
    * [cite_start]Melakukan instalasi dependensi (`npm install`). [cite: 73]
    * [cite_start]Menjalankan unit test (`npm test`) untuk memastikan fungsionalitas dasar tidak rusak. [cite: 73]

2.  **`sast_scan`**:
    * Berjalan di server GitHub (`ubuntu-latest`).
    * Menjalankan `npm audit --audit-level=critical` untuk memindai kerentanan pada dependensi proyek (SAST). [cite_start]Jika ditemukan kerentanan level `critical`, pipeline akan gagal. [cite: 74, 79]

3.  **`deploy_and_scan_on_staging`**:
    * Berjalan di `self-hosted runner` yang telah dikonfigurasi di VM staging.
    * [cite_start]**Deployment**: Membangun image Docker baru, mendorongnya ke Docker Hub, lalu menghentikan container lama dan menjalankan container baru di server staging. [cite: 76]
    * [cite_start]**DAST Scan**: Menjalankan OWASP ZAP Baseline Scan terhadap aplikasi yang baru saja di-deploy (`http://localhost:3001` dari perspektif runner). [cite: 75, 84]

## Kontrol Versi (Version Control)

[cite_start]Proyek ini menggunakan **Git** dan di-host di **GitHub**. [cite: 70, 85] Strategi branching yang direkomendasikan adalah:
* **`main`**: Branch utama yang selalu berisi kode stabil dan siap untuk di-deploy.
* **`develop`**: Branch untuk integrasi semua fitur baru.
* [cite_start]**`feature/*`**: Branch-branch untuk pengembangan fitur spesifik, dibuat dari `develop`. [cite: 71]