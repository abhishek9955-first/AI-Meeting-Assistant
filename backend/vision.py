import cv2


def detect_aruco(image):

    aruco_dictionary = cv2.aruco.getPredefinedDictionary(
        cv2.aruco.DICT_4X4_50
    )

    detector = cv2.aruco.ArucoDetector(
        aruco_dictionary
    )

    corners, ids, rejected = detector.detectMarkers(image)

    if ids is None:
        marker_ids = []
    else:
        marker_ids = ids.flatten().tolist()

    return marker_ids


def detect_qr(image):

    qr_detector = cv2.QRCodeDetector()

    qr_data, points, _ = qr_detector.detectAndDecode(image)

    if qr_data:
        return qr_data

    return None


def scan_clue_board(image_path):

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError("Could not read the image.")

    # Detect ArUco
    marker_ids = detect_aruco(image)

    # Detect QR
    qr_data = detect_qr(image)

    return {
        "aruco_detected": len(marker_ids) > 0,
        "aruco_ids": marker_ids,
        "qr_detected": qr_data is not None,
        "qr_data": qr_data
    }