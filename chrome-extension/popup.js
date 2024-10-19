const summarizeBtn = document.getElementById("summarizeBtn");
const transcribeBtn = document.getElementById("transcribeBtn");

// Function to handle text summarization
summarizeBtn.addEventListener("click", async () => {
  const textInput = document.getElementById("textInput").value.trim();
  const summaryOutput = document.getElementById("summaryOutput");

  if (textInput) {
    summaryOutput.innerText = "Summarizing...";
    
    try {
      const response = await fetch('http://127.0.0.1:5000/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: textInput })
      });

      const result = await response.json();
      summaryOutput.innerText = result.error ? `Error: ${result.error}` : `Summary: ${result}`;
    } catch (error) {
      summaryOutput.innerText = "Error: Could not summarize the text.";
    }
  } else {
    summaryOutput.innerText = "Please enter some text.";
  }
});

// Function to handle audio transcription
transcribeBtn.addEventListener("click", async () => {
  const audioInput = document.getElementById("audioInput").files[0];
  const transcriptionOutput = document.getElementById("transcriptionOutput");

  if (audioInput) {
    const formData = new FormData();
    formData.append('audio', audioInput);

    transcriptionOutput.innerText = "Transcribing...";

    try {
      const response = await fetch('http://127.0.0.1:5000/transcribe', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      transcriptionOutput.innerText = result.error ? `Error: ${result.error}` : `Transcription: ${result}`;
    } catch (error) {
      transcriptionOutput.innerText = "Error: Could not transcribe the audio.";
    }
  } else {
    transcriptionOutput.innerText = "Please upload an audio file.";
  }
}); 

document.getElementById("youtubeTranscribeBtn").addEventListener("click", async () => {
  const youtubeLink = document.getElementById("youtubeLinkInput").value.trim();
  const youtubeSummaryOutput = document.getElementById("youtubeSummaryOutput");

  if (youtubeLink) {
    youtubeSummaryOutput.innerText = "Processing...";

    try {
      const response = await fetch('http://127.0.0.1:5000/transcribe_summarize_youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: youtubeLink })
      });

      // const result = await response.json();
      // summaryOutput.innerText = result.error ? `Error: ${result.error}` : `Summary: ${result}`;

      const result = await response.json();
      
      // Log the result to see the actual structure
      console.log(result);

      // Correctly display both transcription and summary by accessing the right properties
      // youtubeSummaryOutput.innerText = result.error 
      //   ? `Error: ${result.error}` 
      //   : `Transcription: ${result.transcription}\n\nSummary: ${result.summary}`;
      youtubeSummaryOutput.innerText = result.error ? `Error: ${result.error}` : `Summary: ${result}`;
        
    } catch (error) {
      youtubeSummaryOutput.innerText = "Error: Could not transcribe the Youtube video.";
    }
  } else {
    youtubeSummaryOutput.innerText = "Please enter a Youtube link.";
  }
});




document.addEventListener("DOMContentLoaded", function () {
  const openTabBtn = document.getElementById("openTabBtn");

  openTabBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: 'popup.html' });
  });
});

