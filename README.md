# Flooding System

Flooding System adalah platform monitoring dan peringatan dini banjir berbasis IoT yang dirancang untuk memberikan informasi kondisi ketinggian air secara real-time.

Sistem ini menggunakan sensor ultrasonik untuk mengukur permukaan air, kemudian data dikirim ke server untuk diproses, disimpan, dan ditampilkan melalui web dashboard. Selain itu, sistem juga mampu mengirimkan notifikasi otomatis melalui WhatsApp ketika kondisi mencapai ambang batas tertentu.

## Features

- Real-time monitoring ketinggian air
- Klasifikasi status kondisi (Aman, Waspada, Siaga)
- Notifikasi otomatis melalui WhatsApp
- Penyimpanan data (data logging)
- Web dashboard untuk visualisasi data

## How It Works

1. Sensor ultrasonik membaca jarak permukaan air
2. Data dikirim ke server
3. Server memproses dan menentukan status kondisi
4. Data disimpan ke database
5. Notifikasi dikirim jika melewati threshold
6. Data ditampilkan pada web dashboard

## Tech Stack

- Backend: Node.js
- Database: (sesuaikan, misalnya MongoDB)
- Frontend: Web-based dashboard
- IoT Device: ESP8266 + Ultrasonic Sensor
- Notification Service: WhatsApp API (Fonnte)

## Purpose

Project ini dibuat untuk membantu memberikan peringatan dini terhadap potensi banjir dengan sistem yang sederhana, terjangkau, dan mudah diimplementasikan.
