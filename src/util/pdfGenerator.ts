import { generatePDF } from 'react-native-html-to-pdf';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { getFileUrl } from './fileUrl';

const PDF_MIME_TYPE = 'application/pdf';
const BANNER_URL = getFileUrl('banner/banner.png');

const openPdf = (path: string) => {
  ReactNativeBlobUtil.android
    .actionViewIntent(path, PDF_MIME_TYPE)
    .catch(error => {
      console.error('Failed to open generated PDF', error);
      Alert.alert('Unable to open', 'No app was found to view this PDF.');
    });
};

const showDownloadedPrompt = (fileName: string, openPath: string) => {
  Alert.alert('Downloaded', `${fileName} has been saved to Downloads.`, [
    { text: 'OK' },
    {
      text: 'Open',
      onPress: () => openPdf(openPath),
    },
  ]);
};

const showDownloadNotification = async (fileName: string, path: string) => {
  try {
    await ReactNativeBlobUtil.android.addCompleteDownload({
      title: fileName,
      description: 'PDF downloaded',
      mime: PDF_MIME_TYPE,
      path,
      showNotification: true,
    });
  } catch (error) {
    console.error('Failed to show generated PDF download notification', error);
  }
};

const createQuestionHTML = (question: string, index: number) => {
  const tokens = question.match(/\d+|[+\-*/]/g) || [];

  const lines: string[] = [];

  if (tokens.length > 0) {
    lines.push(`
      <div class="token">
        <span class="operator">&nbsp;</span>
        <span class="number">${tokens[0]}</span>
      </div>
    `);
  }

  for (let i = 1; i < tokens.length; i += 2) {
    const operator = tokens[i] || '&nbsp;';
    const number = tokens[i + 1] || '&nbsp;';

    lines.push(`
      <div class="token">
        <span class="operator">${operator}</span>
        <span class="number">${number}</span>
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

export const createPdf = async (
  questions: string[],
  questionName: string,
  questionsPerRow = 7,
) => {
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
            width: 30%;
            margin-bottom: 27px;
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
            display: inline-block;
            margin: 0 auto;
          }

          .token {
            font-size: 22px;
            line-height: 28px;
            display: grid;
            grid-template-columns: 16px max-content;
            column-gap: 2px;
            justify-content: start;
            font-variant-numeric: tabular-nums;
          }

          .operator {
            text-align: center;
          }

          .number {
            text-align: right;
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
          <img src="${BANNER_URL}" />
        </div>

        ${rows.join('')}

      </body>

    </html>
  `;

  const generated = await generatePDF({
    html,
    fileName: 'student-questions',
  });

  if (Platform.OS === 'android') {
    const pdfName = `student-questions-${questionName}.pdf`;
    const downloadPath = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${pdfName}`;
    if (Platform.Version >= 29) {
      // Android 10+: MediaStore puts it in the real Downloads folder,
      // visible in the Downloads app/file manager immediately, no permission prompt.
      const savedUri =
        await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
          {
            name: pdfName,
            parentFolder: '',
            mimeType: PDF_MIME_TYPE,
          },
          'Download',
          generated.filePath,
        );
      await showDownloadNotification(pdfName, generated.filePath);
      showDownloadedPrompt(questionName, savedUri);
    } else {
      // Android 9 and below: no MediaStore Downloads collection, so request
      // legacy storage permission and copy the file directly.
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        await ReactNativeBlobUtil.fs.cp(generated.filePath, downloadPath);
        await showDownloadNotification(pdfName, downloadPath);
        showDownloadedPrompt(pdfName, downloadPath);
      } else {
        Alert.alert(
          'Permission needed',
          'Storage permission is required to save to Downloads.',
        );
      }
    }
  }
};
