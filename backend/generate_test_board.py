import cv2


# -------------------------
# Generate ArUco
# -------------------------

dictionary = cv2.aruco.getPredefinedDictionary(
    cv2.aruco.DICT_4X4_50
)

aruco = cv2.aruco.generateImageMarker(
    dictionary,
    23,
    400
)


# -------------------------
# Generate QR Code
# -------------------------

qr = cv2.QRCodeEncoder_create()

qr_image = qr.encode(
    "Room A - Meeting Notes"
)


# Resize QR
qr_image = cv2.resize(
    qr_image,
    (400, 400)
)


# -------------------------
# Create white board
# -------------------------

board = 255 * \
    __import__("numpy").ones(
        (600, 1000, 3),
        dtype="uint8"
    )


# Put ArUco on board
board[100:500, 50:450] = cv2.cvtColor(
    aruco,
    cv2.COLOR_GRAY2BGR
)


# Put QR on board
board[100:500, 550:950] = cv2.cvtColor(
    qr_image,
    cv2.COLOR_GRAY2BGR
)


# Save
cv2.imwrite(
    "../sample/clue_board_test.png",
    board
)

print("Test clue board generated!")