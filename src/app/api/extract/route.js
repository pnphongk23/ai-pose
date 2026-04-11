export async function POST(request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!imageFile) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    const apiToken = process.env.REPLICATE_API_TOKEN;

    if (!apiToken) {
      return Response.json(
        { error: 'Replicate API token not configured', fallback: true },
        { status: 503 }
      );
    }

    // Convert file to base64 data URI
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mimeType = imageFile.type || 'image/jpeg';
    const dataURI = `data:${mimeType};base64,${base64}`;

    // Call Replicate API
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
      },
      body: JSON.stringify({
        version: 'fofr/controlnet-preprocessors:f6584ef76cf07a2014ffe1e9bdb1a5cfa714f031883ab43f8d4b05506625988e',
        input: {
          image: dataURI,
          lineart: true,
          hed: false,
          sam: false,
          mlsd: false,
          pidi: false,
          canny: false,
          leres: false,
          midas: false,
          content: false,
          open_pose: false,
          normal_bae: false,
          face_detector: false,
          lineart_anime: false,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Replicate API error:', errText);
      return Response.json(
        { error: 'AI processing failed', fallback: true },
        { status: 502 }
      );
    }

    const result = await response.json();

    // Get the lineart output URL
    let lineartUrl;
    if (result.output) {
      // Output can be an object with keys for each preprocessor
      lineartUrl = typeof result.output === 'string'
        ? result.output
        : result.output.lineart || Object.values(result.output)[0];
    }

    if (!lineartUrl) {
      return Response.json(
        { error: 'No lineart output', fallback: true },
        { status: 502 }
      );
    }

    // Fetch the lineart image
    const lineartResponse = await fetch(lineartUrl);
    const lineartBuffer = Buffer.from(await lineartResponse.arrayBuffer());

    // Post-process: invert colors and make background transparent
    // Using canvas-like approach with raw pixel manipulation
    const processedBase64 = await processLineart(lineartBuffer);

    return Response.json({ lineartBase64: processedBase64 });
  } catch (error) {
    console.error('Extract error:', error);
    return Response.json(
      { error: 'Internal server error', fallback: true },
      { status: 500 }
    );
  }
}

/**
 * Process lineart image: invert (black lines → white lines) 
 * and make background transparent.
 * 
 * Simple approach without Sharp dependency for easier deployment.
 */
async function processLineart(buffer) {
  // For now, return as-is base64. 
  // The client will handle inversion via CSS filter: invert(1)
  // This avoids needing Sharp on serverless.
  return buffer.toString('base64');
}
