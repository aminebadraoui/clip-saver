import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const AudioRecorderNode = (props: NodeViewProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [duration, setDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' }); // Use webm for broader support or wav if needed
                handleTranscribe(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error(err);
            toast.error("Could not access microphone");
            props.deleteNode(); // Remove node if permission denied
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleTranscribe = async (audioBlob: Blob) => {
        setIsTranscribing(true);
        try {
            const formData = new FormData();
            // Append with filename ending in .webm so backend knows extension
            formData.append('audio', audioBlob, 'recording.webm');

            const token = localStorage.getItem('token');
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

            const response = await fetch(`${API_BASE_URL}/api/transcribe/`, {
                method: 'POST',
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: formData,
            });

            if (!response.ok) throw new Error('Transcription failed');

            const data = await response.json();
            const text = data.text;

            // Replace this node with the transcribed text
            props.editor.chain()
                .command(({ tr, dispatch }) => {
                    if (dispatch) {
                        const pos = props.getPos();
                        if (typeof pos === 'number') {
                            tr.replaceWith(pos, pos + 1, props.editor.schema.text(text + " "));
                            return true;
                        }
                    }
                    return false;
                })
                .run();

        } catch (err) {
            console.error(err);
            toast.error("Transcription failed");
            setIsTranscribing(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Auto-start recording when inserted
    useEffect(() => {
        startRecording();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    return (
        <NodeViewWrapper className="my-4">
            <div className="flex items-center gap-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg max-w-sm">
                {isTranscribing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                        <span className="text-sm text-gray-400">Transcribing audio...</span>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2 text-amber-500 animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="font-mono text-sm">{formatTime(duration)}</span>
                        </div>

                        <div className="flex-1 h-8 flex items-center gap-1 px-2">
                            {/* Fake waveform visual */}
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-amber-500/40 rounded-full transition-all duration-300"
                                    style={{
                                        height: isRecording ? `${Math.random() * 100}%` : '20%'
                                    }}
                                />
                            ))}
                        </div>

                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={stopRecording}
                        >
                            <Square className="w-3 h-3 fill-current" />
                        </Button>
                    </>
                )}
            </div>
        </NodeViewWrapper>
    );
};
