import { test, expect } from '@mobilewright/test';

test.use({
  bundleId: 'com.aipose.app',
  deviceId: '00008110-00164864216B601E',
});

test.beforeEach(async ({ device, bundleId }) => {
  await device.terminateApp(bundleId!).catch(() => {});
  await device.launchApp(bundleId!);
});

test('camera screen exposes zoom control and pose navigation', async ({ screen }, testInfo) => {
  const initialTree = await screen.viewTree();
  await testInfo.attach('initial-view-tree', {
    body: Buffer.from(JSON.stringify(initialTree, null, 2)),
    contentType: 'application/json',
  });

  const initialScreenshot = await screen.screenshot();
  await testInfo.attach('initial-camera-screen', {
    body: initialScreenshot,
    contentType: 'image/png',
  });

  const zoomButton = screen.getByTestId('zoomButton');
  await expect(zoomButton).toBeVisible();
  await zoomButton.tap();

  const slider = screen.getByTestId('zoomSlider');
  await expect(slider).toBeVisible();

  const sliderScreenshot = await screen.screenshot();
  await testInfo.attach('zoom-slider-visible', {
    body: sliderScreenshot,
    contentType: 'image/png',
  });

  await slider.tap();

  const poseButton = screen.getByTestId('poseButton');
  await expect(poseButton).toBeVisible();
  await poseButton.tap();

  await expect(screen.getByText('Poses')).toBeVisible({ timeout: 10000 });

  const posesScreenshot = await screen.screenshot();
  await testInfo.attach('poses-screen', {
    body: posesScreenshot,
    contentType: 'image/png',
  });

  const finalTree = await screen.viewTree();
  await testInfo.attach('poses-view-tree', {
    body: Buffer.from(JSON.stringify(finalTree, null, 2)),
    contentType: 'application/json',
  });
});
