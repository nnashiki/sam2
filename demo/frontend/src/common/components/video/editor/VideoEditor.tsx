/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {VideoData} from '@/demo/atoms';
import stylex, {StyleXStyles} from '@stylexjs/stylex';
import {useSetAtom} from 'jotai';
import {PropsWithChildren, RefObject, useEffect, useRef, useState} from 'react';
import Video, {VideoRef} from '../Video';
import {videoAtom} from './atoms';
import {Button} from 'react-daisyui';
import {Rotate} from '@carbon/icons-react';

const MAX_VIDEO_WIDTH = 1280;

const styles = stylex.create({
  leftControls: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    background: 'rgba(0, 0, 0, 0.5)',
    padding: '8px',
    borderRadius: '8px',
    zIndex: 10,
  },
  controlButton: {
    color: 'white',
  },
  editorContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    borderRadius: '0.375rem',
    overflow: {
      default: 'clip',
      '@media screen and (max-width: 768px)': 'visible',
    },
  },
  videoContainer: {
    position: 'relative',
    flexGrow: 1,
    overflow: 'hidden',
    width: '100%',
    maxWidth: MAX_VIDEO_WIDTH,
  },
  layers: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  },
  loadingMessage: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '6px 10px',
    backgroundColor: '#6441D2CC',
    color: '#FFF',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '8px',
    fontSize: '0.8rem',
  },
});

export type InteractionLayerProps = {
  style: StyleXStyles;
  videoRef: RefObject<VideoRef>;
};

export type ControlsProps = {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onPreviousFrame?: () => void;
  onNextFrame?: () => void;
};

type Props = PropsWithChildren<{
  video: VideoData;
  layers?: React.ReactNode;
  loading?: boolean;
}>;

function RotateButton({videoRef, videoUrl}: {videoRef: RefObject<VideoRef>, videoUrl: string}) {
  const [isRotating, setIsRotating] = useState(false);

  const handleRotate = async () => {
    if (isRotating || !videoRef.current) return;
    setIsRotating(true);
    
    try {
      // URLからファイル名を抽出
      const fileName = videoUrl.split('/').pop();
      if (!fileName) {
        throw new Error('Invalid video URL');
      }
      
      console.log('Rotating video:', fileName);
      
      const response = await fetch('http://localhost:7263/api/rotate_video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: fileName,
        }),
      });

      const result = await response.json();
      console.log('Rotate video response:', result);
      
      if (result.path) {
        const newSrc = result.path;
        window.location.href = `/?video=${encodeURIComponent(newSrc)}`;
      }
    } catch (error) {
      console.error('Failed to rotate video:', error);
      alert('動画の回転に失敗しました。詳細はコンソールを確認してください。');
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <Button
      color="ghost"
      size="md"
      disabled={isRotating}
      startIcon={
        <Rotate
          {...stylex.props(styles.controlButton)}
          size={24}
        />
      }
      onClick={handleRotate}
    />
  );
}

export default function VideoEditor({
  video: inputVideo,
  layers,
  loading,
  children,
}: Props) {
  const videoRef = useRef<VideoRef>(null);
  const setVideo = useSetAtom(videoAtom);

  // Initialize video atom
  useEffect(() => {
    setVideo(videoRef.current);
    return () => {
      setVideo(null);
    };
  }, [setVideo]);

  return (
    <div {...stylex.props(styles.editorContainer)}>
      <div {...stylex.props(styles.videoContainer)}>
        <div {...stylex.props(styles.leftControls)}>
          <RotateButton videoRef={videoRef} videoUrl={inputVideo.url} />
        </div>
        <Video
          ref={videoRef}
          src={inputVideo.url}
          width={inputVideo.width}
          height={inputVideo.height}
          loading={loading}
        />
        <div {...stylex.props(styles.layers)}>{layers}</div>
      </div>
      {children}
    </div>
  );
}
