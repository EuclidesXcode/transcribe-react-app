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
  const [loadingPDF, setLoadingPDF] = useState(false); // Estado para controlar o loading do PDF
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = event => {
      audioChunks.current.push(event.data);
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioURL(audioUrl);
      
      // Adiciona um pequeno delay antes de transcrever
      setTimeout(() => {
        transcribeAudio(audioBlob);
      }, 500); // 500ms delay
     
      audioChunks.current = [];
    };
    setRecording(false);
  };

  const transcribeAudio = (audioBlob) => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcriptText = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');

      setTranscript(transcriptText);
    };

    recognition.onerror = (event) => {
      console.error('Erro na transcrição:', event.error);
      alert('Erro na transcrição: ' + event.error);
    };

    recognition.start();
  };

  const generatePDF = () => {
    setLoadingPDF(true); // Inicia o loading do PDF
    const doc = new jsPDF();
    doc.text(transcript, 10, 10);
    setTimeout(() => {
      doc.save('transcription.pdf');
      setLoadingPDF(false); // Termina o loading do PDF
    }, 1000); // Simula um tempo de processamento
  };

  useEffect(() => console.log("-> ", transcript), [transcript])

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
          disabled={!transcript || loadingPDF} // Desabilita o botão durante o loading
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