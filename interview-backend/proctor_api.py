from flask import Flask, request, jsonify
import cv2
import numpy as np
import base64
from flask_cors import CORS
import os
import sys
import time
import threading
import mediapipe as mp
import requests
# Ensure this path is correct for your project structure
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

app = Flask(__name__)
CORS(app)

# Enhanced session tracking with unique issue-based warnings
session_data = {}
MAX_WARNINGS = 4  # Changed to 4 warnings max

# Define warning types
WARNING_TYPES = {
    'NO_FACE': 'no_face',
    'MULTIPLE_FACES': 'multiple_faces', 
    'PROFILE_FACE': 'profile_face'
}

# 6-point indices for pose estimation
LANDMARK_IDXS = [1, 152, 263, 33, 61, 291]  # nose tip, chin, left eye left, right eye right, left mouth, right mouth
MODEL_POINTS = np.array([
    (0.0, 0.0, 0.0),        # Nose tip
    (0.0, -63.6, -12.5),    # Chin (approximate)
    (-43.3, 32.7, -26.0),   # Left eye left corner
    (43.3, 32.7, -26.0),    # Right eye right corner
    (-28.9, -28.9, -24.1),  # Left mouth corner
    (28.9, -28.9, -24.1)    # Right mouth corner
])

# Load MobileNet-SSD for person detection
PERSON_PROTO = os.path.join(os.path.dirname(__file__), 'MobileNetSSD_deploy.prototxt')
PERSON_MODEL = os.path.join(os.path.dirname(__file__), 'MobileNetSSD_deploy.caffemodel')
if os.path.exists(PERSON_PROTO) and os.path.exists(PERSON_MODEL):
    person_net = cv2.dnn.readNetFromCaffe(PERSON_PROTO, PERSON_MODEL)
else:
    person_net = None
    print('MobileNet-SSD model files not found. Person detection will be skipped.')

# Change correction window duration
CORRECTION_WINDOW_DURATION = 8  # seconds

# Load OpenCV DNN face detector (make sure these files exist in your backend directory)
FACE_PROTO = os.path.join(os.path.dirname(__file__), 'deploy.prototxt')
FACE_MODEL = os.path.join(os.path.dirname(__file__), 'res10_300x300_ssd_iter_140000.caffemodel')
if os.path.exists(FACE_PROTO) and os.path.exists(FACE_MODEL):
    net = cv2.dnn.readNetFromCaffe(FACE_PROTO, FACE_MODEL)
else:
    net = None
    print('Face detector model files not found. Face detection will be skipped.')

def initialize_session(session_id):
    """Initialize session data structure"""
    if session_id not in session_data:
        session_data[session_id] = {
            'warning_count': 0,
            'issued_warnings': set(),  # Track which warning types have been issued
            'last_frontal_face_time': time.time(),
            'profile_face_resolved': True,  # Track if profile face issue is resolved
            'terminated': False,
            'quit_reason': "",
            'last_infraction': None,
            'no_face_timer': None,
            'no_face_timer_start': None,
            'no_face_timer_active': False,
            'correction_timer_active': False,
            'correction_timer_start': None,
            'correction_window_history': [],
            'proctoring_event_log': [],
            'termination_reason': None
        }

def issue_warning(session_id, warning_type, warning_message):
    """Issue a warning only if this type hasn't been issued before"""
    session = session_data[session_id]
    
    if warning_type not in session['issued_warnings']:
        session['warning_count'] += 1
        session['issued_warnings'].add(warning_type)
        return warning_message
    return None

def resolve_warning(session_id, warning_type):
    """Mark a warning type as resolved (for profile face)"""
    session = session_data[session_id]
    if warning_type == WARNING_TYPES['PROFILE_FACE']:
        session['profile_face_resolved'] = True
        # Remove from issued warnings so it can be warned again if needed
        session['issued_warnings'].discard(warning_type)

def draw_debug_overlays(frame, frontal_faces, profile_faces):
    # Draw grid
    h, w = frame.shape[:2]
    grid_color = (100, 100, 100)
    thickness = 1
    # Draw vertical lines
    for i in range(1, 3):
        x = w * i // 3
        cv2.line(frame, (x, 0), (x, h), grid_color, thickness)
    # Draw horizontal lines
    for i in range(1, 3):
        y = h * i // 3
        cv2.line(frame, (0, y), (w, y), grid_color, thickness)
    # Draw frontal face boxes
    for (x, y, fw, fh) in frontal_faces:
        cv2.rectangle(frame, (x, y), (x+fw, y+fh), (0, 255, 0), 2)
        cv2.putText(frame, 'Frontal', (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    # Draw profile face boxes
    for (x, y, pw, ph) in profile_faces:
        cv2.rectangle(frame, (x, y), (x+pw, y+ph), (0, 165, 255), 2)
        cv2.putText(frame, 'Profile', (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)
    return frame

def nms_boxes(boxes, overlapThresh=0.3):
    if len(boxes) == 0:
        return []
    boxes = np.array(boxes)
    if boxes.dtype.kind == "i":
        boxes = boxes.astype("float")
    pick = []
    x1 = boxes[:,0]
    y1 = boxes[:,1]
    x2 = boxes[:,0] + boxes[:,2]
    y2 = boxes[:,1] + boxes[:,3]
    area = (x2 - x1 + 1) * (y2 - y1 + 1)
    idxs = np.argsort(y2)
    while len(idxs) > 0:
        last = idxs[-1]
        pick.append(last)
        xx1 = np.maximum(x1[last], x1[idxs[:-1]])
        yy1 = np.maximum(y1[last], y1[idxs[:-1]])
        xx2 = np.minimum(x2[last], x2[idxs[:-1]])
        yy2 = np.minimum(y2[last], y2[idxs[:-1]])
        w = np.maximum(0, xx2 - xx1 + 1)
        h = np.maximum(0, yy2 - yy1 + 1)
        overlap = (w * h) / area[idxs[:-1]]
        idxs = np.delete(idxs, np.concatenate(([len(idxs) - 1], np.where(overlap > overlapThresh)[0])))
    return boxes[pick].astype("int")

def start_no_face_timer(session_id):
    session = session_data[session_id]
    session['no_face_timer_start'] = time.time()
    session['no_face_timer_active'] = True

def reset_no_face_timer(session_id):
    session = session_data[session_id]
    session['no_face_timer_start'] = None
    session['no_face_timer_active'] = False

def estimate_yaw(frame, face_box):
    # This is a placeholder: in production, use a facial landmark detector (e.g., mediapipe or dlib)
    # Here, we just return 0 (frontal) for all faces for simplicity
    # You can integrate mediapipe or dlib for real yaw estimation
    return 0

def start_correction_window(session, infraction_type, reason):
    if session['correction_timer_active']:
        return  # Already active, don't start another
    session['correction_timer_active'] = True
    session['correction_timer_start'] = time.time()
    session['correction_infraction'] = infraction_type
    session['correction_reason'] = reason

def clear_correction_window(session):
    session['correction_timer_active'] = False
    session['correction_timer_start'] = None
    session['correction_infraction'] = None
    session['correction_reason'] = None

@app.route('/proctor', methods=['POST'])
def proctor():
    # --- Model Initialization Inside Endpoint ---
    # Use mp.solutions.face_mesh.FaceMesh and mp.solutions.holistic.Holistic directly
    face_mesh = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=5, refine_landmarks=True, min_detection_confidence=0.5)
    holistic = mp.solutions.holistic.Holistic(static_image_mode=True, model_complexity=1, enable_segmentation=False, refine_face_landmarks=True, min_detection_confidence=0.5)
    
    data = request.json
    if not data:
        return jsonify({'warning': 'No data received.', 'warning_count': 0, 'max_warnings': MAX_WARNINGS, 'terminated': False})
    session_id = data.get('session_id', 'default')
    initialize_session(session_id)
    session = session_data[session_id]
    if 'image' not in data or not data['image']:
        return jsonify({'warning': 'No image data received.', 'warning_count': 0, 'max_warnings': MAX_WARNINGS, 'terminated': False})
    try:
        img_data = data['image'].split(',')[1]
        img_bytes = base64.b64decode(img_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception as e:
        return jsonify({'warning': 'Invalid image data.', 'warning_count': 0, 'max_warnings': MAX_WARNINGS, 'terminated': False})
    current_time = time.time()
    (h, w) = frame.shape[:2]
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    # --- Person detection with MobileNet-SSD ---
    person_boxes = []
    if person_net is not None:
        blob = cv2.dnn.blobFromImage(cv2.resize(frame, (300, 300)), 0.007843, (300, 300), (127.5, 127.5, 127.5))
        person_net.setInput(blob)
        detections = person_net.forward()
        for i in range(detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            class_id = int(detections[0, 0, i, 1])
            if confidence > 0.5 and class_id == 15:
                box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                (startX, startY, endX, endY) = box.astype('int')
                person_boxes.append((startX, startY, endX, endY))
    holistic_results = holistic.process(rgb_frame)
    people_count = 0
    if holistic_results.pose_landmarks:
        people_count += 1
    results = face_mesh.process(rgb_frame)
    faces = []
    profile_detected = False
    frontal_detected = False
    profile_boxes = []
    frontal_boxes = []
    
    # Initialize debug info
    debug_info = {
        'faces_detected': 0,
        'frontal_detected': False,
        'profile_detected': False,
        'people_count': 0,
        'extra_person_detected': False,
        'frontal_boxes_count': 0,
        'profile_boxes_count': 0,
        'person_boxes_count': 0,
        'correction_window_active': session['correction_timer_active'],
        'current_infraction': session.get('correction_infraction'),
        'warning_count': session['warning_count']
    }
    
    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            image_points = []
            valid = True
            for idx in LANDMARK_IDXS:
                try:
                    lm = face_landmarks.landmark[idx]
                    x, y = int(lm.x * w), int(lm.y * h)
                    image_points.append((x, y))
                except Exception:
                    valid = False
                    break
            if not valid or len(image_points) != 6:
                continue
            image_points = np.array(image_points, dtype='double')
            focal_length = w
            center = (w / 2, h / 2)
            camera_matrix = np.array(
                [[focal_length, 0, center[0]],
                 [0, focal_length, center[1]],
                 [0, 0, 1]], dtype='double')
            dist_coeffs = np.zeros((4, 1))
            try:
                success, rotation_vector, translation_vector = cv2.solvePnP(
                    MODEL_POINTS, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE)
            except Exception:
                continue
            if not success:
                continue
            rmat, _ = cv2.Rodrigues(rotation_vector)
            sy = np.sqrt(rmat[0, 0] ** 2 + rmat[1, 0] ** 2)
            singular = sy < 1e-6
            if not singular:
                x_angle = np.arctan2(rmat[2, 1], rmat[2, 2])
                y_angle = np.arctan2(-rmat[2, 0], sy)
                z_angle = np.arctan2(rmat[1, 0], rmat[0, 0])
            else:
                x_angle = np.arctan2(-rmat[1, 2], rmat[1, 1])
                y_angle = np.arctan2(-rmat[2, 0], sy)
                z_angle = 0
            pitch = float(np.degrees(x_angle))
            yaw = float(np.degrees(y_angle))
            # Heuristics for frontal/profile
            try:
                left_eye_outer = face_landmarks.landmark[33]
                left_eye_inner = face_landmarks.landmark[133]
                right_eye_outer = face_landmarks.landmark[362]
                right_eye_inner = face_landmarks.landmark[263]
                nose_tip = face_landmarks.landmark[1]
                l_eye = np.array([(left_eye_outer.x + left_eye_inner.x) / 2 * w, (left_eye_outer.y + left_eye_inner.y) / 2 * h])
                r_eye = np.array([(right_eye_outer.x + right_eye_inner.x) / 2 * w, (right_eye_outer.y + right_eye_inner.y) / 2 * h])
                nose = np.array([nose_tip.x * w, nose_tip.y * h])
                eye_dist = float(np.linalg.norm(l_eye - r_eye))
                eye_y_diff = float(abs(l_eye[1] - r_eye[1]))
                nose_center_dist = float(abs(nose[0] - (l_eye[0] + r_eye[0]) / 2))
                
                # More lenient thresholds for frontal detection
                eyes_visible = bool(eye_dist > w * 0.07)
                eyes_aligned = bool(eye_y_diff < h * 0.03)
                nose_centered = bool(nose_center_dist < w * 0.05)
                is_frontal = bool(eyes_visible and eyes_aligned and nose_centered)
                
                # Add debug info for this face
                face_index = len(faces)
                debug_info[f'face_{face_index}_eye_dist'] = round(eye_dist, 2)
                debug_info[f'face_{face_index}_eye_y_diff'] = round(eye_y_diff, 2)
                debug_info[f'face_{face_index}_nose_center_dist'] = round(nose_center_dist, 2)
                debug_info[f'face_{face_index}_eyes_visible'] = eyes_visible
                debug_info[f'face_{face_index}_eyes_aligned'] = eyes_aligned
                debug_info[f'face_{face_index}_nose_centered'] = nose_centered
                debug_info[f'face_{face_index}_is_frontal'] = is_frontal
            except Exception as e:
                is_frontal = False
                face_index = len(faces)
                debug_info[f'face_{face_index}_error'] = str(e)
            if is_frontal:
                frontal_detected = True
                frontal_boxes.append(image_points)
            else:
                profile_detected = True
                profile_boxes.append(image_points)
    faces = profile_boxes + frontal_boxes
    main_face_box = None
    if frontal_boxes:
        # Convert to bounding box (x, y, w, h)
        xs = [pt[0] for pt in frontal_boxes[0]]
        ys = [pt[1] for pt in frontal_boxes[0]]
        minx, maxx = int(min(xs)), int(max(xs))
        miny, maxy = int(min(ys)), int(max(ys))
        main_face_box = (minx, miny, maxx - minx, maxy - miny)
    elif profile_boxes:
        xs = [pt[0] for pt in profile_boxes[0]]
        ys = [pt[1] for pt in profile_boxes[0]]
        minx, maxx = int(min(xs)), int(max(xs))
        miny, maxy = int(min(ys)), int(max(ys))
        main_face_box = (minx, miny, maxx - minx, maxy - miny)
    def boxes_overlap(boxA, boxB):
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[0]+boxA[2], boxB[2])
        yB = min(boxA[1]+boxA[3], boxB[3])
        return (xA < xB) and (yA < yB)
    extra_person_detected = False
    if main_face_box is not None and len(person_boxes) > 0:
        for (sx, sy, ex, ey) in person_boxes:
            person_box = (sx, sy, ex-sx, ey-sy)
            if not boxes_overlap(main_face_box, person_box):
                extra_person_detected = True
    
    # After face detection and before infraction logic
    detected_faces_count = len(frontal_boxes) + len(profile_boxes)
    people_count = detected_faces_count
    extra_person_detected = people_count > 1
    debug_info['faces_detected'] = detected_faces_count
    debug_info['people_count'] = people_count
    debug_info['extra_person_detected'] = extra_person_detected
    debug_info['frontal_boxes_count'] = len(frontal_boxes)
    debug_info['profile_boxes_count'] = len(profile_boxes)
    debug_info['person_boxes_count'] = len(person_boxes)
    debug_info['frontal_detected'] = frontal_detected
    debug_info['profile_detected'] = profile_detected
    
    # Helper to convert list of points to bounding box
    def points_to_bbox(points):
        xs = [pt[0] for pt in points]
        ys = [pt[1] for pt in points]
        minx, maxx = int(min(xs)), int(max(xs))
        miny, maxy = int(min(ys)), int(max(ys))
        return (minx, miny, maxx - minx, maxy - miny)

    # Convert frontal_boxes and profile_boxes to bounding boxes for debug overlay
    frontal_bboxes = [points_to_bbox(pts) for pts in frontal_boxes]
    profile_bboxes = [points_to_bbox(pts) for pts in profile_boxes]

    # Generate debug image with overlays
    debug_frame = frame.copy()
    debug_frame = draw_debug_overlays(debug_frame, frontal_bboxes, profile_bboxes)
    
    # Convert debug image to base64
    _, buffer = cv2.imencode('.jpg', debug_frame)
    debug_image = base64.b64encode(buffer.tobytes()).decode('utf-8')
    
    # --- Infraction logic (cleaned up, robust multi-person detection) ---
    warning = None
    infraction_type = None
    infraction_reason = None

    # Robust multi-person detection: use both MobileNet-SSD and face count
    multi_person_flag = False
    multi_person_reason = None
    # 1. MobileNet-SSD person detection
    if person_net is not None and len(person_boxes) > 0:
        # If more than one person box detected
        if len(person_boxes) > 1:
            multi_person_flag = True
            multi_person_reason = f"{len(person_boxes)} people detected by MobileNet-SSD."
        # If any person box does not overlap with main face
        elif main_face_box is not None:
            for (sx, sy, ex, ey) in person_boxes:
                person_box = (sx, sy, ex-sx, ey-sy)
                # If the person box does not overlap with the main face box
                if not boxes_overlap(main_face_box, person_box):
                    multi_person_flag = True
                    multi_person_reason = "Extra person detected by MobileNet-SSD (no overlap with main face)."
                    break
    # 2. Face count
    if detected_faces_count > 1:
        multi_person_flag = True
        multi_person_reason = f"{detected_faces_count} faces detected by FaceMesh."

    if multi_person_flag:
        infraction_type = 'multiple_faces'
        infraction_reason = 'Multiple people detected!'
        debug_info['multi_person_reason'] = multi_person_reason
    elif frontal_detected:
        infraction_type = None
        infraction_reason = None
    elif profile_detected and not frontal_detected:
        infraction_type = 'profile_face'
        infraction_reason = 'Please face the camera directly.'
    elif detected_faces_count == 0:
        infraction_type = 'no_face'
        infraction_reason = 'No face detected.'
    # If eyes are not aligned, set infraction to profile_face
    if 'face_0_eyes_aligned' in debug_info and not debug_info['face_0_eyes_aligned']:
        infraction_type = 'profile_face'
        infraction_reason = 'Please look directly at the camera.'

    debug_info['infraction_type'] = infraction_type
    debug_info['infraction_reason'] = infraction_reason
    debug_info['frontal_detected'] = frontal_detected
    debug_info['correction_window_active'] = session['correction_timer_active']

    # Correction window clearing logic debug
    if not infraction_type and session['correction_timer_active']:
        debug_info['correction_window_cleared'] = True
        # Properly clear all correction window state
        session['correction_timer_active'] = False
        session['correction_timer_start'] = None
        session['correction_infraction'] = None
        session['correction_reason'] = None
        session['correction_window_history'].append({
            'infraction': session.get('correction_infraction'),
            'reason': session.get('correction_reason'),
            'corrected': True,
            'time': current_time
        })
        session['proctoring_event_log'].append({
            'event': 'corrected_in_time',
            'infraction': session.get('correction_infraction'),
            'time': current_time,
            'warning_count': session['warning_count']
        })
    else:
        debug_info['correction_window_cleared'] = False

    # Strict proctoring logic
    # 1. If correction window is active, check if expired
    if session['correction_timer_active']:
        seconds_left = CORRECTION_WINDOW_DURATION - (current_time - session['correction_timer_start'])
        if seconds_left <= 0:
            # Correction window expired, terminate immediately
            session['terminated'] = True
            session['correction_timer_active'] = False
            session['correction_timer_start'] = None
            session['correction_window_history'].append({'infraction': session['correction_infraction'], 'reason': session['correction_reason'], 'corrected': False, 'time': current_time})
            session['proctoring_event_log'].append({'event': 'terminated', 'reason': f"Terminated: {session.get('correction_reason', 'Infraction')} (correction window expired)", 'time': current_time, 'warning_count': session['warning_count']})
            session['termination_reason'] = f"Terminated: {session.get('correction_reason', 'Infraction')} (correction window expired)"
            session['correction_infraction'] = None
            session['correction_reason'] = None
            return jsonify({'terminated': True, 'termination_reason': session['termination_reason'], 'warning_count': session['warning_count'], 'max_warnings': MAX_WARNINGS, 'correction_window': None, 'debug_info': debug_info, 'debug_image': debug_image})
        else:
            correction_window = {
                'infraction': session.get('correction_infraction'),
                'reason': session.get('correction_reason'),
                'start_time': session['correction_timer_start'],
                'duration': CORRECTION_WINDOW_DURATION,
                'seconds_left': max(0, seconds_left)
            }
            return jsonify({
                'warning': warning,
                'warning_count': session['warning_count'],
                'max_warnings': MAX_WARNINGS,
                'correction_window': correction_window,
                'terminated': False,
                'termination_reason': None,
                'debug_info': debug_info,
                'debug_image': debug_image
            })

    # 2. If already terminated, return immediately (do not start new correction window)
    if session['terminated']:
        return jsonify({'terminated': True, 'termination_reason': session['termination_reason'], 'warning_count': session['warning_count'], 'max_warnings': MAX_WARNINGS, 'correction_window': None, 'debug_info': debug_info, 'debug_image': debug_image})

    # 3. If infraction detected
    if infraction_type:
        # Only start/reset if new infraction or window not active
        if (not session['correction_timer_active'] or
            session.get('correction_infraction') != infraction_type or
            session.get('correction_reason') != infraction_reason):
            # If warning_count is already 4, terminate immediately
            if session['warning_count'] >= 4:
                session['terminated'] = True
                session['termination_reason'] = f'Terminated: {infraction_reason} (max warnings exceeded)'
                session['proctoring_event_log'].append({'event': 'terminated', 'reason': session['termination_reason'], 'time': current_time})
                return jsonify({'terminated': True, 'termination_reason': session['termination_reason'], 'warning_count': session['warning_count'], 'max_warnings': MAX_WARNINGS, 'correction_window': None, 'debug_info': debug_info, 'debug_image': debug_image})
            # Start/reset the correction window for this new infraction
            session['correction_timer_active'] = True
            session['correction_timer_start'] = current_time
            session['correction_infraction'] = infraction_type
            session['correction_reason'] = infraction_reason
            session['warning_count'] += 1
            session['proctoring_event_log'].append({'event': 'correction_window_started', 'infraction': infraction_type, 'reason': infraction_reason, 'time': current_time, 'warning_count': session['warning_count']})
            warning = infraction_reason
            # If warning_count is now 4 after increment, terminate immediately
            if session['warning_count'] >= 4:
                session['terminated'] = True
                session['correction_timer_active'] = False
                session['correction_timer_start'] = None
                session['termination_reason'] = f'Terminated: {infraction_reason} (max warnings exceeded)'
                session['proctoring_event_log'].append({'event': 'terminated', 'reason': session['termination_reason'], 'time': current_time})
                return jsonify({'terminated': True, 'termination_reason': session['termination_reason'], 'warning_count': session['warning_count'], 'max_warnings': MAX_WARNINGS, 'correction_window': None, 'debug_info': debug_info, 'debug_image': debug_image})
            # Return the new correction window
            correction_window = {
                'infraction': session.get('correction_infraction'),
                'reason': session.get('correction_reason'),
                'start_time': session['correction_timer_start'],
                'duration': CORRECTION_WINDOW_DURATION,
                'seconds_left': CORRECTION_WINDOW_DURATION
            }
            return jsonify({
                'warning': warning,
                'warning_count': session['warning_count'],
                'max_warnings': MAX_WARNINGS,
                'correction_window': correction_window,
                'terminated': False,
                'termination_reason': None,
                'debug_info': debug_info,
                'debug_image': debug_image
            })
        else:
            # If same infraction and window is already active, return current window
            correction_window = {
                'infraction': session.get('correction_infraction'),
                'reason': session.get('correction_reason'),
                'start_time': session['correction_timer_start'],
                'duration': CORRECTION_WINDOW_DURATION,
                'seconds_left': CORRECTION_WINDOW_DURATION - (current_time - session['correction_timer_start'])
            }
            return jsonify({
                'warning': warning,
                'warning_count': session['warning_count'],
                'max_warnings': MAX_WARNINGS,
                'correction_window': correction_window,
                'terminated': False,
                'termination_reason': None,
                'debug_info': debug_info,
                'debug_image': debug_image
            })

    # 4. If no infraction and correction window is active, user corrected in time
    if not infraction_type and session['correction_timer_active']:
        session['correction_timer_active'] = False
        session['correction_timer_start'] = None
        session['correction_window_history'].append({'infraction': session['correction_infraction'], 'reason': session['correction_reason'], 'corrected': True, 'time': current_time})
        session['proctoring_event_log'].append({'event': 'corrected_in_time', 'infraction': session['correction_infraction'], 'time': current_time, 'warning_count': session['warning_count']})
        session['correction_infraction'] = None
        session['correction_reason'] = None
        return jsonify({'warning': warning, 'warning_count': session['warning_count'], 'max_warnings': MAX_WARNINGS, 'correction_window': None, 'terminated': False, 'termination_reason': None, 'debug_info': debug_info, 'debug_image': debug_image})

    # 5. Default: no correction window, not terminated
    return jsonify({'warning': warning, 'warning_count': session['warning_count'], 'max_warnings': MAX_WARNINGS, 'correction_window': None, 'terminated': False, 'termination_reason': None, 'debug_info': debug_info, 'debug_image': debug_image})

@app.route('/session-status/<session_id>', methods=['GET'])
def get_session_status(session_id):
    """Get current session status"""
    if session_id not in session_data:
        return jsonify({'error': 'Session not found'}), 404
    
    session = session_data[session_id]
    current_time = time.time()

    return jsonify({
        'session_id': session_id,
        'warning_count': session['warning_count'],
        'max_warnings': MAX_WARNINGS,
        'terminated': session['terminated'],
        'quit_reason': session['quit_reason'],
        'time_since_last_face': round(current_time - session['last_frontal_face_time'], 2),
        'issued_warnings': list(session['issued_warnings'])
    })

@app.route('/reset-session/<session_id>', methods=['POST'])
def reset_session(session_id):
    """Reset session data"""
    if session_id in session_data:
        del session_data[session_id]
    return jsonify({'message': 'Session reset successfully'})

@app.route('/analyze_frame', methods=['POST'])
def analyze_frame():
    if net is None:
        return jsonify({'success': False, 'error': 'Face detector model not loaded.'}), 500
    if 'frame' not in request.files:
        return jsonify({'success': False, 'error': 'No frame provided.'}), 400

    file = request.files['frame']
    npimg = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    (h, w) = frame.shape[:2]
    blob = cv2.dnn.blobFromImage(cv2.resize(frame, (300, 300)), 1.0, (300, 300), (104.0, 177.0, 123.0))
    net.setInput(blob)
    detections = net.forward()

    # Find the most confident face detection
    best_detection_idx = -1
    highest_confidence = 0.0
    for i in range(0, detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        if confidence > highest_confidence:
            highest_confidence = confidence
            best_detection_idx = i

    if highest_confidence > 0.6: # Confidence threshold
        box = detections[0, 0, best_detection_idx, 3:7] * np.array([w, h, w, h])
        (startX, startY, endX, endY) = box.astype("int")
        
        # Simple estimation of landmarks based on the bounding box
        # This is a basic approximation. A real landmark detector model would be more accurate.
        landmarks = {
            "left_eye": {"x": int(startX + (endX - startX) * 0.25), "y": int(startY + (endY - startY) * 0.3)},
            "right_eye": {"x": int(startX + (endX - startX) * 0.75), "y": int(startY + (endY - startY) * 0.3)},
            "nose": {"x": int(startX + (endX - startX) * 0.5), "y": int(startY + (endY - startY) * 0.5)},
            "mouth": {"x": int(startX + (endX - startX) * 0.5), "y": int(startY + (endY - startY) * 0.8)},
        }
        return jsonify({'success': True, 'landmarks': landmarks})
    else:
        return jsonify({'success': False, 'error': 'No face detected.'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)