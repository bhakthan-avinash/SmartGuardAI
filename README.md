<<<<<<< HEAD
SmartGuard (OpenCV LBPH) - Real-time Attendance

This project uses OpenCV's Haar cascades for face detection and LBPH recognizer for simple face recognition.
This approach avoids dlib and heavy deep-learning models; it's suitable for proof-of-concept and small classrooms.

Quickstart (Windows):
1) py -3.10 -m venv venv
2) .\venv\Scripts\activate
3) pip install -r requirements.txt
4) python manage.py makemigrations
5) python manage.py migrate
6) python manage.py createsuperuser
7) python manage.py runserver

Usage:
- Register a user (student). Login as that student and open Dashboard. Click 'Save Face' to upload one or more face images (saved to media/faces/<username>/).
- Teacher or student: Start Real-time Marking. The server will train LBPH on saved images and try to recognize faces in frames posted by the browser. LBPH's threshold can be tuned in attendance/utils.py
Notes:
- Haar cascade XML is included as a placeholder. If detection fails, download OpenCV's haarcascade_frontalface_default.xml into smartguard/ directory.
- This is a simple approach and not production-grade. For higher accuracy use DeepFace/Facenet or client-side face-api.js.
=======
﻿# SmartGuardAI


>>>>>>> c0627f5009e338af908cce9c262a30d365c36dcd
