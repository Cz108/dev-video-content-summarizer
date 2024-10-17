const voiceBtn = document.getElementById("voiceBtn");
const outputDiv = document.getElementById("output");

// Function to record audio and use Whisper API for transcription
async function recordAudio() {
  try {
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const mediaRecorder = new MediaRecorder(stream);
    let chunks = [];

    mediaRecorder.ondataavailable = event => chunks.push(event.data);

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer YOUR_OPENAI_API_KEY`
        },
        body: formData
      });

      const data = await response.json();
      const transcription = data.text;
      outputDiv.innerText = `You said: ${transcription}`;
    };

    mediaRecorder.start();

    // Stop recording after 5 seconds
    setTimeout(() => mediaRecorder.stop(), 5000);
  } catch (error) {
    console.error("Error accessing the microphone: ", error);
    outputDiv.innerText = "Error accessing the microphone. Please allow microphone access.";
  }
}

// Trigger voice input recording
voiceBtn.addEventListener("click", recordAudio);
