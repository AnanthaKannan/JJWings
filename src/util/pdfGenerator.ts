import { generatePDF } from 'react-native-html-to-pdf';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';

const createQuestionHTML = (question: string, index: number) => {
  const tokens = question.match(/\d+|[+\-*\/]/g) || [];

  const lines: string[] = [];

  for (let i = 0; i < tokens.length; i += 2) {
    const number = tokens[i];
    const operator = tokens[i + 1] || '';

    lines.push(`
      <div class="token">
        ${number} ${operator}
      </div>
    `);
  }

  return `
    <div class="question">

      <div class="question-number">
        Q${index + 1}
      </div>

      <div class="expression">
        ${lines.join('')}
      </div>

      <div class="answer-line"></div>
      <div class="answer-line mt-40"></div>

    </div>
  `;
};

const getBannerBase64 = async () => {
  const url =
    'https://raw.githubusercontent.com/AnanthaKannan/JJWings/6fc6906237d0681e76813acc58f56320794e2555/assets/images/banner.png';

  const localPath = `${RNFS.CachesDirectoryPath}/banner.png`;

  await RNFS.downloadFile({
    fromUrl: url,
    toFile: localPath,
  }).promise;

  return RNFS.readFile(localPath, 'base64');
};

export const createPdf = async (questions: string[], questionsPerRow = 4) => {
  // Read logo

  const logoBase64 = await getBannerBase64();

  // Create rows
  const rows: string[] = [];

  for (let i = 0; i < questions.length; i += questionsPerRow) {
    const rowQuestions = questions.slice(i, i + questionsPerRow);

    const columns = rowQuestions
      .map((question, columnIndex) =>
        createQuestionHTML(question, i + columnIndex),
      )
      .join('');

    rows.push(`
      <div class="row">
        ${columns}
      </div>
    `);
  }

  const html = `
    <html>

      <head>

        <style>

          body {
            margin: 0;
            padding: 25px;
            font-family: Arial, sans-serif;
          }

          .logo {
            text-align: center;
          }

          .logo img {
            width: 40%;
            margin-bottom: -60px;
            margin-top: -80px;
          }

          .row {
            display: flex;
            width: 100%;
            margin-bottom: 35px;
            page-break-inside: avoid;
          }

          .question {
            width: ${100 / questionsPerRow}%;
            text-align: center;
            box-sizing: border-box;
            padding: 0 12px;
          }

          .question-number {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 8px;
          }

          .expression {
            margin-left: 15px;
          }

          .token {
            font-size: 22px;
            line-height: 28px;
          }

          .answer-line {
            border-bottom: 2px solid #000;
            margin-top: 8px;
            width: 90%;
          }
          
          .mt-40 {
            margin-top: 40px;
          }

        </style>

      </head>

      <body>

        <div class="logo">
          <img src="data:image/png;base64,${logoBase64}" />
        </div>

        ${rows.join('')}

      </body>

    </html>
  `;

  const result = await generatePDF({
    html,
    fileName: 'student-questions',
    directory: 'Documents',
  });

  await FileViewer.open(result.filePath, {
    showOpenWithDialog: true,
  });

  return result;
};
