import React, { useRef, useState, useEffect } from 'react';
import './VideoPlayer.css';
import wavesurfer from 'wavesurfer.js';

const VideoPlayer = () => {
    const videoRef = useRef(null);
    const waveformRef = useRef(null);
    const [videoDuration, setVideoDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasAudio, setHasAudio] = useState(true);
    const [videoMetadata, setVideoMetadata] = useState(null);
    const [uploadEnabled, setUploadEnabled] = useState(true);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];

        if (file) {
            const videoElement = videoRef.current;
            const videoURL = URL.createObjectURL(file);

            videoElement.src = videoURL;
            setIsPlaying(false);

            try {
                const result = await checkVideoAudio(file);
                setHasAudio(result);
                setUploadEnabled(result);
            } catch (error) {
                console.error('Error checking video audio:', error);
                setHasAudio(false);
                setUploadEnabled(false);
            }

            try {
                const metadata = await getVideoMetadata(file);
                setVideoMetadata(metadata);
            } catch (error) {
                console.error('Error getting video metadata:', error);
                setVideoMetadata(null);
            }

            if (hasAudio) {
                initializeWaveform(file);
            }
        }
    };

    const initializeWaveform = (file) => {
        waveformRef.current && waveformRef.current.destroy();

        waveformRef.current = wavesurfer.create({
            container: '#waveform',
            waveColor: '#ddd',
            progressColor: '#333',
            cursorWidth: 1,
            cursorColor: '#aaa',
            barWidth: 2,
            barRadius: 3,
            height: 80,
            responsive: true,
        });

        waveformRef.current.load(URL.createObjectURL(file));
    };

    const checkVideoAudio = async (file) => {
        return new Promise((resolve, reject) => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const reader = new FileReader();

            reader.onload = (event) => {
                const buffer = event.target.result;

                audioContext.decodeAudioData(buffer, (decodedData) => {
                    resolve(decodedData.numberOfChannels > 0);
                }, () => {
                    reject(false);
                });
            };

            reader.readAsArrayBuffer(file);
        });
    };

    const getVideoMetadata = async (file) => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';

            video.onloadedmetadata = () => {
                resolve({
                    duration: video.duration,
                    videoWidth: video.videoWidth,
                    videoHeight: video.videoHeight,
                });
            };

            video.onerror = () => {
                reject(null);
            };

            video.src = URL.createObjectURL(file);
        });
    };

    const handlePlayPause = () => {
        const videoElement = videoRef.current;

        if (isPlaying) {
            videoElement.pause();
            waveformRef.current && waveformRef.current.pause();
        } else {
            videoElement.play();
            waveformRef.current && waveformRef.current.play();
        }

        setIsPlaying(!isPlaying);
    };

    useEffect(() => {
        if (videoRef.current) {
            const videoElement = videoRef.current;
            const waveformInstance = waveformRef.current;

            videoElement.addEventListener('loadedmetadata', () => {
                setVideoDuration(videoElement.duration);
            });

            videoElement.addEventListener('seeked', () => {
                waveformInstance && waveformInstance.seekTo(videoElement.currentTime / videoElement.duration);
            });

            waveformInstance && waveformInstance.on('seek', (progress) => {
                videoElement.currentTime = progress * videoElement.duration;
            });
        }
    }, [waveformRef]);


    return (
        <div className="video-player-container">
            <div className="video-input">
                <input type="file" accept="video/*" onChange={(e) => handleFileChange(e)} />
            </div>
            <br/>
            <div className="grid-container">
                <div>
                    <video ref={videoRef} className="video-player" >
                        Your browser does not support the video tag.
                    </video>
                    <div id="waveform" className="waveform-container"></div>
                </div>
                <div className="metadata-box">
                    {videoMetadata && (
                        <div>
                            <h3>Video Metadata</h3>
                            <p>Duration: {videoMetadata.duration.toFixed(2)} seconds</p>
                            <p>Width: {videoMetadata.videoWidth}</p>
                            <p>Height: {videoMetadata.videoHeight}</p>
                        </div>
                    )}
                </div>
            </div>
            <button
                className="play-pause-button"
                onClick={handlePlayPause}
                disabled={!hasAudio}
            >
                {isPlaying ? 'Pause' : 'Play'}
            </button>
            {!hasAudio && <p className="no-audio-message">The selected video has no audio.</p>}
            {!uploadEnabled && <p className="no-audio-message">Upload is disabled for videos without audio.</p>}
        </div>
    );
};

export default VideoPlayer;
