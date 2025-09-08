import cv2
import face_recognition
import os
import threading

known_faces_dir = "known_faces"
known_face_encodings = []
known_face_names = []

# Load known faces
for filename in os.listdir(known_faces_dir):
    if filename.endswith(".jpg") or filename.endswith(".png"):
        image = face_recognition.load_image_file(os.path.join(known_faces_dir, filename))
        encodings = face_recognition.face_encodings(image)
        if encodings:
            known_face_encodings.append(encodings[0])
            known_face_names.append(os.path.splitext(filename)[0])

recognized_name = "Unknown"
last_printed_name = None  # Add this before the while loop

def recognize_face(frame):
    global recognized_name
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    face_locations = face_recognition.face_locations(rgb_frame)
    face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
    name = "Unknown"
    for face_encoding in face_encodings:
        # Compare with all known faces
        matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
        face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
        if len(face_distances) > 0:
            best_match_index = face_distances.argmin()
            if matches[best_match_index]:
                name = known_face_names[best_match_index]
                break
    recognized_name = name

cap = cv2.VideoCapture(0)
background_thread = None

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Start recognition in background if not already running
    if background_thread is None or not background_thread.is_alive():
        background_thread = threading.Thread(target=recognize_face, args=(frame.copy(),))
        background_thread.start()

    # Show only the recognized name
    cv2.putText(frame, f"Name: {recognized_name}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
    cv2.imshow("Webcam", frame)

    # Print to terminal only when the name changes
    if recognized_name != last_printed_name and recognized_name != "Unknown":
        print(f"Recognized Name: {recognized_name}")
        last_printed_name = recognized_name

    key = cv2.waitKey(1)
    if key == 27:  # ESC to exit
        break

cap.release()
cv2.destroyAllWindows()

