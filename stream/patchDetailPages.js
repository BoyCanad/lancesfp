const fs = require('fs');

const files = fs.readdirSync('src/pages').filter(f => f.endsWith('Detail.tsx'));

for (const file of files) {
  const filePath = 'src/pages/' + file;
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('useVideoFade')) {
    content = content.replace(
      /^import \{ (.*) \} from 'react-router-dom';/m,
      "import { $1 } from 'react-router-dom';\nimport { useVideoFade } from '../hooks/useVideoFade';"
    );

    content = content.replace(
      /const videoRef = useRef<HTMLVideoElement>\(null\);/g,
      "const videoRef = useRef<HTMLVideoElement>(null);\n  useVideoFade(videoRef, isMuted, trailerActive);"
    );

    content = content.replace(
      /videoRef\.current\.play\(\)\.catch\(\(\) => \{ \}\);/g,
      "// videoRef.current.play().catch(() => { });"
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Patched ' + file);
  }
}
