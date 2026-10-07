import cv2


dictionary = cv2.aruco.getPredefinedDictionary(
    cv2.aruco.DICT_4X4_50
)

# Generate marker ID 23
marker = cv2.aruco.generateImageMarker(
    dictionary,
    23,
    600
)

# Add white border around marker
marker_with_border = cv2.copyMakeBorder(
    marker,
    100,
    100,
    100,
    100,
    cv2.BORDER_CONSTANT,
    value=255
)

cv2.imwrite("../sample/aruco_test.png", marker_with_border)

print("ArUco marker generated successfully!")