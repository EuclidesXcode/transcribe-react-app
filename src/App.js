import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import { Button, Container, Typography, CircularProgress } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';

const AudioRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioURL, setAudioURL] = useState('');
  const [loadingPDF, setLoadingPDF] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);

  // Função para iniciar a gravação e a transcrição
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];

    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioURL(audioUrl);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();

    // Iniciar a transcrição com a Web Speech API
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = event => {
      const interimTranscript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');

      setTranscript(interimTranscript);
    };

    recognition.onerror = event => {
      console.error('Erro na transcrição:', event.error);
    };

    recognition.start();
    recognitionRef.current = recognition;

    setRecording(true);
  };

  // Função para parar a gravação e a transcrição
  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    recognitionRef.current.stop();
    setRecording(false);
  };

  // Função para gerar o PDF
  const generatePDF = () => {
    setLoadingPDF(true);
    const doc = new jsPDF();
    doc.text(transcript, 10, 10);
    setTimeout(() => {
      doc.save('transcription.pdf');
      setLoadingPDF(false);
    }, 1000);
  };

  useEffect(() => console.log("Transcrição: ", transcript), [transcript]);

  return (
    <Container>
      <Typography variant="h4" align="center" gutterBottom>
        Transcritor de Audio da Ana Luiza
      </Typography>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <Button
          variant="contained"
          color={recording ? 'error' : 'success'}
          startIcon={recording ? <StopIcon /> : <PlayArrowIcon />}
          onClick={recording ? stopRecording : startRecording}
          sx={{ fontSize: 20, padding: '10px 30px', marginRight: '20px' }}
        >
          {recording ? 'Parar Gravação' : 'Iniciar Gravação'}
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={loadingPDF ? <CircularProgress size={24} /> : <PictureAsPdfIcon />}
          onClick={generatePDF}
          sx={{ fontSize: 20, padding: '10px 30px', marginRight: '20px' }}
          disabled={!transcript || loadingPDF}
        >
          {loadingPDF ? 'Gerando PDF...' : 'Gerar PDF'}
        </Button>

        {audioURL && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AudiotrackIcon />}
            sx={{ fontSize: 20, padding: '10px 30px' }}
            href={audioURL}
            download="audio.wav"
          >
            Baixar Áudio
          </Button>
        )}
      </div>
    </Container>
  );
};

export default AudioRecorder;