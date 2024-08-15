import React, { useState, useRef, useEffect } from 'react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { Button, Container, Typography, CircularProgress } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';

const AudioRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioURL, setAudioURL] = useState('');
  const [loadingDOCX, setLoadingDOCX] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);

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

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    recognitionRef.current.stop();
    setRecording(false);
  };

  const generateDOCX = async () => {
    setLoadingDOCX(true);
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: 'Transcrição de Áudio',
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: transcript,
                  font: 'Arial',
                }),
              ],
            }),
          ],
        },
      ],
    });

    // Salvar o arquivo DOCX
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transcription.docx';
    link.click();
    URL.revokeObjectURL(url);

    setLoadingDOCX(false);
  };

  useEffect(() => console.log("Transcrição: ", transcript), [transcript]);

  return (
    <Container>
      <Typography variant="h4" align="center" gutterBottom>
        Transcritor de Áudio da Anna Luiza
      </Typography>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 20 }}>
        <Button
          variant="contained"
          color={recording ? 'error' : 'success'}
          startIcon={recording ? <StopIcon /> : <PlayArrowIcon />}
          onClick={recording ? stopRecording : startRecording}
          sx={{ fontSize: 18, padding: '8px 20px', marginBottom: '10px' }}
        >
          {recording ? 'Parar Gravação' : 'Iniciar Gravação'}
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={loadingDOCX ? <CircularProgress size={24} /> : <PictureAsPdfIcon />}
          onClick={generateDOCX}
          sx={{ fontSize: 18, padding: '8px 20px', marginBottom: '10px' }}
          disabled={!transcript || loadingDOCX}
        >
          {loadingDOCX ? 'Gerando DOCX...' : 'Gerar DOCX'}
        </Button>

        {audioURL && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AudiotrackIcon />}
            sx={{ fontSize: 18, padding: '8px 20px' }}
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