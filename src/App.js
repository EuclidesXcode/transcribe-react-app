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

  const [recordingTab, setRecordingTab] = useState(false);
  const [transcriptTab, setTranscriptTab] = useState('');
  const [audioURLTab, setAudioURLTab] = useState('');
  const [loadingDOCXTab, setLoadingDOCXTab] = useState(false);

  const mediaRecorderRef = useRef(null);
  const mediaRecorderTabRef = useRef(null);
  const recognitionRef = useRef(null);
  const recognitionTabRef = useRef(null);

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

  const startRecordingTab = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    const mediaRecorderTab = new MediaRecorder(stream);
    const audioChunksTab = [];

    mediaRecorderTab.ondataavailable = event => {
      audioChunksTab.push(event.data);
    };

    mediaRecorderTab.onstop = () => {
      const audioBlobTab = new Blob(audioChunksTab, { type: 'audio/wav' });
      const audioUrlTab = URL.createObjectURL(audioBlobTab);
      setAudioURLTab(audioUrlTab);
    };

    mediaRecorderTabRef.current = mediaRecorderTab;
    mediaRecorderTab.start();

    const recognitionTab = new window.webkitSpeechRecognition();
    recognitionTab.lang = 'pt-BR';
    recognitionTab.continuous = true;
    recognitionTab.interimResults = true;

    recognitionTab.onresult = event => {
      const interimTranscriptTab = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');

      setTranscriptTab(interimTranscriptTab);
    };

    recognitionTab.onerror = event => {
      console.error('Erro na transcrição do áudio da aba:', event.error);
    };

    recognitionTab.start();
    recognitionTabRef.current = recognitionTab;

    setRecordingTab(true);
  };

  const stopRecordingTab = () => {
    mediaRecorderTabRef.current.stop();
    recognitionTabRef.current.stop();
    setRecordingTab(false);
  };

  const generateDOCX = async (text, filename) => {
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
                  text,
                  font: 'Arial',
                }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.docx`;
    link.click();
    URL.revokeObjectURL(url);

    setLoadingDOCX(false);
  };

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
          {recording ? 'Parar Gravação Microfone' : 'Iniciar Gravação Microfone'}
        </Button>

        <Button
          variant="contained"
          color={recordingTab ? 'error' : 'success'}
          startIcon={recordingTab ? <StopIcon /> : <PlayArrowIcon />}
          onClick={recordingTab ? stopRecordingTab : startRecordingTab}
          sx={{ fontSize: 18, padding: '8px 20px', marginBottom: '10px' }}
        >
          {recordingTab ? 'Parar Gravação da Aba' : 'Iniciar Gravação da Aula'}
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={loadingDOCX ? <CircularProgress size={24} /> : <PictureAsPdfIcon />}
          onClick={() => generateDOCX(transcript, 'transcription_microphone')}
          sx={{ fontSize: 18, padding: '8px 20px', marginBottom: '10px' }}
          disabled={!transcript || loadingDOCX}
        >
          {loadingDOCX ? 'Gerando DOCX do Microfone' : 'Gerar DOCX do Microfone'}
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={loadingDOCXTab ? <CircularProgress size={24} /> : <PictureAsPdfIcon />}
          onClick={() => generateDOCX(transcriptTab, 'transcription_tab')}
          sx={{ fontSize: 18, padding: '8px 20px', marginBottom: '10px' }}
          disabled={!transcriptTab || loadingDOCXTab}
        >
          {loadingDOCXTab ? 'Gerando DOCX da Aula' : 'Gerar DOCX da Aula'}
        </Button>

        {audioURL && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AudiotrackIcon />}
            sx={{ fontSize: 18, padding: '8px 20px', marginTop: '10px' }}
            href={audioURL}
            download="audio_microphone.wav"
          >
            Baixar Áudio do Microfone
          </Button>
        )}

        {audioURLTab && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AudiotrackIcon />}
            sx={{ fontSize: 18, padding: '8px 20px', marginTop: '10px' }}
            href={audioURLTab}
            download="audio_tab.wav"
          >
            Baixar Áudio da Aula
          </Button>
        )}
      </div>
    </Container>
  );
};

export default AudioRecorder;