const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const lessonsDir = path.join(root, 'lessons');
const dataDir = path.join(root, 'data');

if (!fs.existsSync(lessonsDir)) {
  console.log('Creating lessons/ directory...');
  fs.mkdirSync(lessonsDir, { recursive: true });
}

function parseLesson(file) {
  const raw = fs.readFileSync(path.join(lessonsDir, file), 'utf-8').replace(/\r\n/g, '\n');

  const frontMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontMatch) {
    console.log(`  Skip ${file}: missing front matter`);
    return null;
  }

  const meta = {};
  frontMatch[1].split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx > 0) {
      meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  });

  const body = frontMatch[2];

  const sectionRegex = /^##\s+(.+)$/gm;
  const headers = [];
  let m;
  while ((m = sectionRegex.exec(body)) !== null) {
    headers.push({ title: m[1].trim(), index: m.index, end: m.index + m[0].length });
  }

  let english = '', chinese = '', words = [];

  for (let i = 0; i < headers.length; i++) {
    const start = headers[i].end;
    const end = i < headers.length - 1 ? headers[i + 1].index : body.length;
    const content = body.slice(start, end).trim();
    const key = headers[i].title;

    if (/^english$/i.test(key)) {
      english = content;
    } else if (/^(中文|chinese)$/i.test(key)) {
      chinese = content;
    } else if (/^(单词|words|vocabulary)$/i.test(key)) {
      const lines = content.split('\n').filter(l => l.trim());
      for (const line of lines) {
        if (line.startsWith('|') && !line.includes('---')) {
          const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
          if (cells.length >= 2 && !/^英文|单词|vocabulary$/i.test(cells[0])) {
            words.push({ en: cells[0], cn: cells[1] });
          }
        }
      }
    }
  }

  return {
    id: path.basename(file, '.md'),
    title: meta.title || '',
    titleCn: meta.titleCn || '',
    english,
    chinese,
    words
  };
}

const books = ['1', '2', '3', '4'];
let built = 0;

for (const book of books) {
  const prefix = book + '-';
  const files = fs.readdirSync(lessonsDir)
    .filter(f => f.endsWith('.md') && f.startsWith(prefix))
    .sort();

  if (files.length === 0) {
    continue;
  }

  const lessons = [];
  for (const file of files) {
    const lesson = parseLesson(file);
    if (lesson) lessons.push(lesson);
  }

  const output = `window.__NCE${book} = ${JSON.stringify(lessons, null, 2)};`;
  fs.writeFileSync(path.join(dataDir, `nce${book}.js`), output, 'utf-8');
  console.log(`Book ${book}: ${lessons.length} lessons → data/nce${book}.js`);
  built++;
}

if (built === 0) {
  console.log('No .md files found in lessons/');
}
