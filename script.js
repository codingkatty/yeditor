const markdownInput = document.getElementById('markdown');
const preview = document.getElementById('preview');
const saveAsPdfBtn = document.getElementById('saveAsPdf');
const generateAiBtn = document.getElementById('generateAi');
const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---'
});
let isUpdatingMarkdown = false;
let isUpdatingPreview = false;

const updatePreview = () => {
    if (isUpdatingPreview) return;
    isUpdatingMarkdown = true;
    preview.innerHTML = marked.parse(markdownInput.value);
    isUpdatingMarkdown = false;
};

const updateMarkdown = () => {
    if (isUpdatingMarkdown) return;
    isUpdatingPreview = true;
    const markdownText = turndownService.turndown(preview.innerHTML);
    markdownInput.value = markdownText;
    isUpdatingPreview = false;
};

markdownInput.addEventListener('input', updatePreview);
preview.addEventListener('input', updateMarkdown);

updatePreview();

saveAsPdfBtn.addEventListener('click', () => {
    const element = preview;
    const opt = {
        margin:       1,
        filename:     'document.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
});

generateAiBtn.addEventListener('click', async () => {
    const markdownContent = markdownInput.value;
    try {
        const response = await fetch('https://pirate-ai.onrender.com/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: markdownContent })
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.response) {
            markdownInput.value += `\n\n${data.response}`;
            updatePreview();
        } else {
            alert('AI response does not contain generated Markdown.');
            console.log(data.response)
        }
    } catch (error) {
        console.error('Error generating AI content:', error);
        alert('Failed to generate AI content.');
    }
});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', async (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    
    for (const file of files) {
        if (file.type.startsWith('image/')) {
            try {
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch('https://yeditor.onrender.com/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Server Error: ${response.statusText}`);
                }

                const data = await response.json();
                if (data.url) {
                    const encodedUrl = encodeURI(data.url);
                    const imageMarkdown = `![${file.name}](${encodedUrl})`;

                    const cursorPos = markdownInput.selectionStart;
                    const textBefore = markdownInput.value.substring(0, cursorPos);
                    const textAfter  = markdownInput.value.substring(cursorPos);
                    markdownInput.value = textBefore + imageMarkdown + textAfter;

                    updatePreview();
                } else {
                    alert('Server did not return image URL.');
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Failed to upload image.');
            }
        }
    }
});

window.addEventListener('beforeunload', (e) => {
    const confirmationMessage = 'You have unsaved changes. Are you sure you want to leave?';
    e.returnValue = confirmationMessage;
    return confirmationMessage;
});