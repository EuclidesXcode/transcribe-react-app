import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

const App = () => {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert('Captura de áudio da aba não suportada pelo navegador.');
      return;
    }
    fetchAccessToken();
  }, []);

  const fetchAccessToken = async () => {
    try {
      const response = await fetch('http://localhost:3002/get-token');
      const data = await response.json();
      setAccessToken(data.accessToken);
    } catch (error) {
      console.error('Error fetching access token:', error);
    }
  };

  const startCapturing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true
      });

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      let audioChunks = [];

      recorder.ondataavailable = async (event) => {
        audioChunks.push(event.data);
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        handleAudioStream(audioBlob);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        handleAudioStream(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Erro ao capturar áudio: ", error);
    }
  };

  const handleAudioStream = async (audioBlob) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');

    try {
      const response = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
        method: 'POST',
        body: JSON.stringify({
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode: 'pt-BR'
          },
          audio: {
            content: await blobToBase64(audioBlob)
          }
        }),
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (response.ok) {
        setTranscript(prev => prev + '\n' + result.results[0].alternatives[0].transcript);
      } else {
        console.error('Error transcribing audio:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const stopCapturing = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(transcript, 10, 10);
    doc.save('transcription.pdf');
  };

  return (
    <div style={styles.container}>
      <h1>Captura e Transcrição de Áudio da Aba</h1>
      <button
        onClick={isRecording ? stopCapturing : startCapturing}
        style={isRecording ? styles.buttonRecording : styles.button}
      >
        {isRecording ? 'Pausar Transcrição' : 'Iniciar Captura'}
      </button>
      <button onClick={downloadPDF} style={styles.button}>
        Baixar PDF
      </button>
      <p style={styles.transcript}>Transcrição: {transcript}</p>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '50px',
    fontFamily: 'Arial, sans-serif',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    marginBottom: '20px',
    marginRight: '10px'
  },
  buttonRecording: {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    backgroundColor: '#FF4D4D', // Vermelho para indicar gravação
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    marginBottom: '20px',
    marginRight: '10px'
  },
  transcript: {
    fontSize: '18px',
    color: '#333',
    whiteSpace: 'pre-wrap',
  },
};

export default App;