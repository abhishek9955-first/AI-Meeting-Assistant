const fileInput = document.getElementById("audio-file");
const processButton = document.getElementById("process-button");
const loading = document.getElementById("loading");
const selectedFile = document.getElementById("selected-file");


fileInput.addEventListener("change", function () {
    if (fileInput.files.length > 0) {
        selectedFile.textContent = fileInput.files[0].name;
    } else {
        selectedFile.textContent = "No file selected";
    }
});
const downloadTranscript =
    document.getElementById("download-transcript");

const downloadRecord =
    document.getElementById("download-record");

    let latestMeetingRecord = null;


processButton.addEventListener("click", async function () {

    const file = fileInput.files[0];

    if (!file) {
        alert("Please select an audio file first.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    loading.style.display = "block";

    try {

        const response = await fetch("http://127.0.0.1:8000/process", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result.error) {
    alert(result.error);

    loading.style.display = "none";

    return;
}


latestMeetingRecord = result.meeting_record;

        document.getElementById("raw-transcript").textContent =
            result.raw_transcript;

        document.getElementById("refined-transcript").textContent =
            result.refined_transcript;

        document.getElementById("summary").textContent =
    result.meeting_record.summary;


// Meeting Minutes
document.getElementById("minutes").textContent =
    result.meeting_record.minutes.length > 0
        ? result.meeting_record.minutes.join("\n")
        : "No important minutes identified.";


// Decisions
document.getElementById("decisions").textContent =
    result.meeting_record.decisions.length > 0
        ? result.meeting_record.decisions.join("\n")
        : "No confirmed decisions identified.";


// Action Items
document.getElementById("action-items").textContent =
    result.meeting_record.action_items.length > 0
        ? result.meeting_record.action_items
            .map(item =>
                `${item.task} | Owner: ${item.owner} | Deadline: ${item.deadline}`
            )
            .join("\n")
        : "No action items identified.";

        downloadTranscript.style.display = "block";
downloadRecord.style.display = "block";

    } catch (error) {

        console.error(error);
        alert("Something went wrong while processing the meeting.");

    } finally {

        loading.style.display = "none";
    }
});


downloadTranscript.addEventListener("click", function () {

    const transcript =
        "RAW TRANSCRIPT\n\n" +
        document.getElementById("raw-transcript").textContent +
        "\n\nREFINED TRANSCRIPT\n\n" +
        document.getElementById("refined-transcript").textContent;

    const blob = new Blob([transcript], {
        type: "text/plain"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "meeting_transcript.txt";

    link.click();

    URL.revokeObjectURL(url);
});


downloadRecord.addEventListener("click", function () {

    const record = latestMeetingRecord;

    const blob = new Blob(
        [JSON.stringify(record, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "meeting_record.json";

    link.click();

    URL.revokeObjectURL(url);
});














// Vision.py

// ===============================
// Clue Board Scanner
// ===============================

const clueImage = document.getElementById("clue-image");
const clueFileName = document.getElementById("clue-file-name");
const scanClueButton = document.getElementById("scan-clue-button");

const clueLoading = document.getElementById("clue-loading");

const arucoStatus = document.getElementById("aruco-status");
const arucoId = document.getElementById("aruco-id");

const qrStatus = document.getElementById("qr-status");
const qrData = document.getElementById("qr-data");


// Show selected file name
clueImage.addEventListener("change", function () {

    if (clueImage.files.length > 0) {
        clueFileName.textContent = clueImage.files[0].name;
    } else {
        clueFileName.textContent = "No image selected";
    }

});


// Scan clue board
scanClueButton.addEventListener("click", async function () {

    const file = clueImage.files[0];

    if (!file) {
        alert("Please select a clue board image first.");
        return;
    }

    const formData = new FormData();

    formData.append("file", file);

    clueLoading.style.display = "block";

    try {

        const response = await fetch("http://127.0.0.1:8000/scan-clue", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.detail || result.error || "Failed to scan clue board.");
            return;
        }


        // ArUco result
        if (result.aruco_detected) {

            arucoStatus.textContent = "Detected ✓";

            arucoId.textContent =
                result.aruco_ids.join(", ");

        } else {

            arucoStatus.textContent = "Not detected";

            arucoId.textContent = "-";
        }


        // QR result
        if (result.qr_detected) {

            qrStatus.textContent = "Detected ✓";

            qrData.textContent = result.qr_data;

        } else {

            qrStatus.textContent = "Not detected";

            qrData.textContent = "-";
        }

    }

    catch (error) {

        console.error(error);

        alert("Something went wrong while scanning the clue board.");

    }

    finally {

        clueLoading.style.display = "none";

    }

});