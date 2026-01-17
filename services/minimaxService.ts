
import { config } from "../config";

// Helper to convert Hex string to ArrayBuffer
const hexToArrayBuffer = (hex: string): ArrayBuffer => {
    const match = hex.match(/[\da-f]{2}/gi);
    if (!match) return new ArrayBuffer(0);
    
    const bytes = new Uint8Array(match.map(h => parseInt(h, 16)));
    return bytes.buffer;
};

export const generateSpeech = async (text: string, voiceId?: string): Promise<ArrayBuffer | null> => {
  const { apiKey, voiceId: defaultVoiceId, ttsModel, baseUrl } = config.minimax;

  if (!apiKey) {
    console.warn("MiniMax API Key missing. Falling back to native TTS.");
    return null;
  }

  // Use the passed voiceId if available, otherwise fall back to config default
  const effectiveVoiceId = voiceId || defaultVoiceId;

  // MiniMax T2A V2 Endpoint
  const url = `${baseUrl}/v1/t2a_v2`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: ttsModel,
        text: text,
        stream: false,
        voice_setting: {
          voice_id: effectiveVoiceId,
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
          emotion: "happy"
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: "mp3",
          channel: 1
        }
      })
    });

    if (!response.ok) {
       console.error("MiniMax TTS Failed", await response.text());
       return null;
    }

    const data = await response.json();
    
    if (data.base_resp?.status_code !== 0) {
        console.error("MiniMax API Error", data.base_resp?.status_msg);
        return null;
    }

    // MiniMax V2 returns audio as a hex string in 'data.audio'
    if (data.data?.audio) {
        return hexToArrayBuffer(data.data.audio);
    }

    return null;
  } catch (e) {
    console.error("MiniMax TTS Service Error", e);
    return null;
  }
};

export const designVoice = async (prompt: string, previewText: string): Promise<{ voiceId: string, audio: ArrayBuffer } | null> => {
    const { apiKey, baseUrl } = config.minimax;
    if (!apiKey) return null;

    const url = `${baseUrl}/v1/voice_design`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                preview_text: previewText
            })
        });

        if (!response.ok) {
            console.error("MiniMax Voice Design Failed", await response.text());
            return null;
        }

        const data = await response.json();

        // Check for specific error codes if necessary, though structure varies slightly by endpoint
        if (data.base_resp?.status_code !== 0) {
             console.error("MiniMax Voice Design API Error", data.base_resp?.status_msg);
             return null;
        }
        
        // Response typically contains 'voice_id' and 'audio_file' (hex string)
        if (data.voice_id && data.audio_file) {
            return {
                voiceId: data.voice_id,
                audio: hexToArrayBuffer(data.audio_file)
            };
        }
        
        return null;

    } catch (e) {
        console.error("Voice Design Service Error", e);
        return null;
    }
};
