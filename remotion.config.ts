/**
 * 3WM SONIK — Remotion Configuration
 * Configures Remotion for social video rendering
 */

import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setCrf(23);
Config.setEnforceAudioInVideo(true);
Config.setLogLevel('info');
