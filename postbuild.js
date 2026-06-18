import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const file = path.join(process.cwd(), 'dist/index.html');
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace '<script type="module" crossorigin>' with '<script defer crossorigin>'
  content = content.replace(/<script\s+type="module"\s+crossorigin>/g, '<script defer crossorigin>');
  // Replace '<script type="module">' with '<script defer>'
  content = content.replace(/<script\s+type="module">/g, '<script defer>');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Post-process: Successfully removed type="module" from inlined script in index.html for file:// support!');

  // Copycompiled index.html to public/index-compiled.html so dev server can serve it to the Copy/Download buttons
  const publicHtmlPath = path.join(process.cwd(), 'public/index-compiled.html');
  fs.copyFileSync(file, publicHtmlPath);
  console.log('Post-process: Successfully copied compiled index.html to public/index-compiled.html!');
} else {
  console.error('Post-process error: dist/index.html not found!');
  process.exit(1);
}

// Clean up old zip files to avoid duplicate zipping/recursion
const publicZipPath = path.join(process.cwd(), 'public/vmix-app.zip');
const distZipPath = path.join(process.cwd(), 'dist/vmix-app.zip');

if (fs.existsSync(publicZipPath)) {
  try {
    fs.unlinkSync(publicZipPath);
  } catch (e) {}
}
if (fs.existsSync(distZipPath)) {
  try {
    fs.unlinkSync(distZipPath);
  } catch (e) {}
}

// Create a premium Windows .bat launcher inside dist/ so it gets inlined inside the ZIP!
const batContent = `@echo off
title vMix Web Controller Launcher
cls
echo Starting vMix Web Controller in desktop app mode...
echo.

:: Check if Google Chrome exists in standard locations to run in app mode (like a real desktop .exe app!)
set "CHROME_PATH="
if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    set "CHROME_PATH=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
) else if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" (
    set "CHROME_PATH=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
) else if exist "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe" (
    set "CHROME_PATH=%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"
)

:: If Chrome is found, run the app in elegant chromeless window mode (--app)
if defined CHROME_PATH (
    start "" "%CHROME_PATH%" --app="%~dp0index.html" --window-size=1280,820
) else (
    :: Fallback to default browser
    start "" "%~dp0index.html"
)
exit
`;

try {
  fs.writeFileSync(path.join(process.cwd(), 'dist/Запустить как Приложение.bat'), batContent, 'utf8');
  console.log('Post-process: Successfully created Windows launcher .bat file!');
} catch (e) {
  console.error('Error writing .bat launcher file:', e);
}

console.log('Creating ZIP archive of the build...');
try {
  // Use bestzip to package the dist contents
  // We run it inside dist/ to avoid root folder in zip
  execSync('npx bestzip vmix-app.zip *', { cwd: path.join(process.cwd(), 'dist'), stdio: 'inherit' });
  
  // Copy the created zip back to public/ so it can be served by the development server!
  fs.copyFileSync(distZipPath, publicZipPath);
  console.log('Successfully created and copied ZIP archive to /public for live download!');
} catch (error) {
  console.error('Error creating ZIP archive:', error);
  process.exit(1);
}
